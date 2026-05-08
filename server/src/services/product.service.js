const mongoose = require('mongoose');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const { uploadMultiple, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinaryUpload');
const slugify = require('slugify');

const normalizeText = (value = '') =>
    String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Nếu sản phẩm có biến thể → tự động tính:
 *   price  = giá thấp nhất trong tất cả options
 *   stock  = tổng tồn kho trong tất cả options
 * Trả về { price, stock } cần ghi đè, hoặc null nếu không có variant.
 */
const syncPriceStockFromVariants = (variants) => {
    if (!Array.isArray(variants) || variants.length === 0) return null;
    const allOptions = variants.flatMap((v) => v.options || []);
    if (allOptions.length === 0) return null;
    const prices = allOptions.map((o) => Number(o.price) || 0).filter((p) => p > 0);
    const price = prices.length > 0 ? Math.min(...prices) : 0;
    const stock = allOptions.reduce((sum, o) => sum + (Number(o.stock) || 0), 0);
    return { price, stock };
};

const collectCategoryIds = async (categoryValue) => {
    if (!categoryValue) return [];

    const isObjectId = mongoose.Types.ObjectId.isValid(categoryValue);
    const query = [];
    if (isObjectId) query.push({ _id: categoryValue });
    query.push({ slug: categoryValue });
    query.push({ name: new RegExp(`^${String(categoryValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

    const category = await Category.findOne({ $or: query }).lean();
    if (!category) return [];

    const all = [category._id.toString()];
    const queue = [category._id.toString()];
    while (queue.length) {
        const parentId = queue.shift();
        const children = await Category.find({ parent: parentId, isActive: true }).select('_id').lean();
        for (const child of children) {
            const id = child._id.toString();
            if (!all.includes(id)) {
                all.push(id);
                queue.push(id);
            }
        }
    }
    return all;
};

class ProductService {
    // ─── Tạo sản phẩm ───
    static async createProduct(data, files) {
        const {
            name,
            description,
            shortDescription,
            brand,
            category,
            price,
            originalPrice,
            stock,
            isFeatured,
            isFlashSale,
            flashSalePrice,
            flashSaleEndTime,
            attributes,
            variants,
        } = data;

        if (!name || !category) {
            throw new BadRequestError('Vui lòng nhập đầy đủ tên và danh mục sản phẩm');
        }
        if (!price && price !== 0) {
            throw new BadRequestError('Vui lòng nhập giá sản phẩm');
        }

        const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });
        const brandSlug = slugify(brand || '', { lower: true, strict: true, locale: 'vi' });

        const isObjectId = mongoose.Types.ObjectId.isValid(category);
        const categoryDoc = await Category.findOne({
            $or: [
                ...(isObjectId ? [{ _id: category }] : []),
                { slug: category },
                { name: new RegExp(`^${String(category).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            ],
        })
            .populate('parent')
            .lean();
        if (!categoryDoc) {
            throw new BadRequestError('Danh mục không tồn tại');
        }

        const categoryPath = [];
        let currentCategory = categoryDoc;
        while (currentCategory) {
            categoryPath.unshift(currentCategory.slug);
            currentCategory = currentCategory.parent || null;
        }

        // Kiểm tra slug trùng
        const existProduct = await Product.findOne({ slug });
        if (existProduct) {
            throw new BadRequestError('Sản phẩm đã tồn tại');
        }

        // Upload ảnh lên Cloudinary
        let images = [];
        if (files && files.length > 0) {
            images = await uploadMultiple(files, 'products');
        }

        // Parse attributes nếu gửi dưới dạng JSON string
        let parsedAttributes = [];
        if (attributes) {
            try {
                parsedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
            } catch {
                parsedAttributes = [];
            }
        }

        // Parse variants nếu gửi dưới dạng JSON string
        let parsedVariants = [];
        if (variants) {
            try {
                parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
            } catch {
                parsedVariants = [];
            }
        }

        const searchKeywords = Array.from(
            new Set(
                [
                    name,
                    brand,
                    brandSlug,
                    categoryDoc.name,
                    categoryDoc.slug,
                    ...(categoryPath || []),
                    ...(parsedAttributes || []).flatMap((attr) => [attr?.name, attr?.value]).filter(Boolean),
                ]
                    .filter(Boolean)
                    .map(normalizeText)
                    .join(' ')
                    .split(' ')
                    .filter(Boolean),
            ),
        );

        // ── Auto-sync giá & kho từ biến thể ──
        const variantSync = syncPriceStockFromVariants(parsedVariants);
        const finalPrice = variantSync ? variantSync.price : Number(price);
        const finalStock = variantSync ? variantSync.stock : Number(stock) || 0;

        const product = await Product.create({
            name,
            slug,
            description: description || '',
            shortDescription: shortDescription || '',
            brand: brand || '',
            brandSlug,
            category,
            categoryPath,
            images,
            price: finalPrice,
            originalPrice: Number(originalPrice) || 0,
            stock: finalStock,
            weight: Number(data.weight) || 500,
            length: Number(data.length) || 15,
            width: Number(data.width) || 15,
            height: Number(data.height) || 10,
            isFeatured: isFeatured === 'true' || isFeatured === true,
            isFlashSale: isFlashSale === 'true' || isFlashSale === true,
            flashSalePrice: Number(flashSalePrice) || 0,
            flashSaleEndTime: flashSaleEndTime || null,
            attributes: parsedAttributes,
            variants: parsedVariants,
            searchKeywords,
        });

        return product;
    }

    // ─── Lấy danh sách sản phẩm (public) ───
    static async getAllProducts(query) {
        const {
            search,
            category,
            brand,
            minPrice,
            maxPrice,
            isFeatured,
            isFlashSale,
            sort,
            page = 1,
            limit = 12,
        } = query;

        const filter = { isActive: true };
        const andConditions = [];

        // Tìm kiếm thông minh theo tên, brand, keywords, mô tả
        if (search) {
            const normalized = normalizeText(search);
            const regex = new RegExp(search, 'i');
            andConditions.push({
                $or: [
                    { name: regex },
                    { brand: regex },
                    { description: regex },
                    { shortDescription: regex },
                    { slug: regex },
                    { brandSlug: normalizeText(search) },
                    { searchKeywords: { $in: normalized.split(' ') } },
                ],
            });
        }

        // Lọc theo danh mục + toàn bộ danh mục con
        if (category) {
            const categoryIds = await collectCategoryIds(category);
            if (categoryIds.length > 0) {
                filter.category = { $in: categoryIds };
            } else {
                filter.category = category;
            }
        }

        // Lọc theo thương hiệu
        if (brand) {
            const normalizedBrand = normalizeText(brand);
            andConditions.push({
                $or: [{ brand: { $regex: brand, $options: 'i' } }, { brandSlug: normalizedBrand }],
            });
        }

        // Lọc theo khoảng giá
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Lọc theo nổi bật
        if (isFeatured === 'true') {
            filter.isFeatured = true;
        }

        // Lọc theo flash sale
        if (isFlashSale === 'true') {
            filter.isFlashSale = true;
            filter.flashSaleEndTime = { $gte: new Date() };
        }

        if (andConditions.length) {
            filter.$and = andConditions;
        }

        // Sắp xếp
        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort === 'sold') sortOption = { sold: -1 };
        else if (sort === 'rating') sortOption = { ratingAverage: -1 };
        else if (sort === 'name_asc') sortOption = { name: 1 };
        else if (sort === 'name_desc') sortOption = { name: -1 };

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('category', 'name slug')
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .lean();

        return {
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }

    // ─── Lấy tất cả sản phẩm (admin, bao gồm inactive) ───
    static async getAllProductsAdmin(query) {
        const { search, category, page = 1, limit = 20 } = query;

        const filter = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { name: regex },
                { brand: regex },
                { slug: regex },
                { description: regex },
                { shortDescription: regex },
            ];
        }
        if (category) {
            const categoryIds = await collectCategoryIds(category);
            filter.category = categoryIds.length ? { $in: categoryIds } : category;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('category', 'name slug')
            .populate('store', 'name slug logo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        return {
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }

    // ─── Lấy sản phẩm theo ID ───
    static async getProductById(id) {
        const product = await Product.findById(id)
            .populate('category', 'name slug')
            .populate('store', 'name slug logo');
        if (!product) {
            throw new NotFoundError('Không tìm thấy sản phẩm');
        }
        return product;
    }

    // ─── Lấy sản phẩm theo slug ───
    static async getProductBySlug(slug) {
        const product = await Product.findOne({ slug, isActive: true })
            .populate('category', 'name slug')
            .populate('store', 'name slug logo');
        if (!product) {
            throw new NotFoundError('Không tìm thấy sản phẩm');
        }
        return product;
    }

    // ─── Cập nhật sản phẩm ───
    static async updateProduct(id, data, files) {
        const product = await Product.findById(id);
        if (!product) {
            throw new NotFoundError('Không tìm thấy sản phẩm');
        }

        // Nếu đổi tên → tạo slug mới
        if (data.name && data.name !== product.name) {
            data.slug = slugify(data.name, { lower: true, strict: true, locale: 'vi' });
            const existSlug = await Product.findOne({ slug: data.slug, _id: { $ne: id } });
            if (existSlug) {
                throw new BadRequestError('Tên sản phẩm đã tồn tại');
            }
        }

        // Upload ảnh mới (nếu có)
        if (files && files.length > 0) {
            const newImages = await uploadMultiple(files, 'products');
            // existingImages: danh sách URL ảnh cũ cần giữ lại (gửi từ admin frontend)
            if (data.existingImages) {
                let existingList = [];
                try {
                    existingList = typeof data.existingImages === 'string'
                        ? JSON.parse(data.existingImages)
                        : (Array.isArray(data.existingImages) ? data.existingImages : [data.existingImages]);
                } catch { existingList = []; }
                data.images = [...existingList, ...newImages];
            } else {
                data.images = [...(product.images || []), ...newImages];
            }
        } else if (data.existingImages) {
            // Không có ảnh mới nhưng có danh sách ảnh cũ cần giữ lại
            try {
                data.images = typeof data.existingImages === 'string'
                    ? JSON.parse(data.existingImages)
                    : (Array.isArray(data.existingImages) ? data.existingImages : [data.existingImages]);
            } catch { /* giữ nguyên */ }
        }
        if (data.existingImages) delete data.existingImages;

        // Xóa ảnh cũ (nếu client gửi danh sách ảnh cần xóa)
        if (data.removeImages) {
            let imagesToRemove = [];
            try {
                imagesToRemove =
                    typeof data.removeImages === 'string' ? JSON.parse(data.removeImages) : data.removeImages;
            } catch {
                imagesToRemove = [];
            }

            // Xóa trên Cloudinary
            for (const imgUrl of imagesToRemove) {
                const publicId = getPublicIdFromUrl(imgUrl);
                if (publicId) {
                    await deleteFromCloudinary(publicId);
                }
            }

            // Lọc ảnh còn lại
            const currentImages = data.images || product.images || [];
            data.images = currentImages.filter((img) => !imagesToRemove.includes(img));
            delete data.removeImages;
        }

        // Parse attributes
        if (data.attributes) {
            try {
                data.attributes = typeof data.attributes === 'string' ? JSON.parse(data.attributes) : data.attributes;
            } catch {
                delete data.attributes;
            }
        }

        // Parse variants
        if (data.variants) {
            try {
                data.variants = typeof data.variants === 'string' ? JSON.parse(data.variants) : data.variants;
            } catch {
                delete data.variants;
            }
        }

        // Convert boolean fields từ form-data
        if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;
        if (data.isFlashSale !== undefined) data.isFlashSale = data.isFlashSale === 'true' || data.isFlashSale === true;
        if (data.price) data.price = Number(data.price);
        if (data.originalPrice) data.originalPrice = Number(data.originalPrice);
        if (data.stock !== undefined) data.stock = Number(data.stock);

        // ── Auto-sync giá & kho từ biến thể (update) ──
        const variantsToSync = data.variants ?? product.variants;
        const variantSyncUpdate = syncPriceStockFromVariants(variantsToSync);
        if (variantSyncUpdate) {
            data.price = variantSyncUpdate.price;
            data.stock = variantSyncUpdate.stock;
        }
        if (data.weight !== undefined) data.weight = Number(data.weight);
        if (data.length !== undefined) data.length = Number(data.length);
        if (data.width !== undefined) data.width = Number(data.width);
        if (data.height !== undefined) data.height = Number(data.height);
        if (data.flashSalePrice) data.flashSalePrice = Number(data.flashSalePrice);

        const updated = await Product.findByIdAndUpdate(id, data, { new: true }).populate('category', 'name slug');
        return updated;
    }

    // ─── Xóa sản phẩm ───
    static async deleteProduct(id) {
        const product = await Product.findById(id);
        if (!product) {
            throw new NotFoundError('Không tìm thấy sản phẩm');
        }

        // Xóa ảnh trên Cloudinary
        if (product.images && product.images.length > 0) {
            for (const imgUrl of product.images) {
                const publicId = getPublicIdFromUrl(imgUrl);
                if (publicId) {
                    await deleteFromCloudinary(publicId);
                }
            }
        }

        await Product.findByIdAndDelete(id);
        return { message: 'Xóa sản phẩm thành công' };
    }

    // ─── Bật / tắt sản phẩm ───
    static async toggleProduct(id) {
        const product = await Product.findById(id);
        if (!product) {
            throw new NotFoundError('Không tìm thấy sản phẩm');
        }

        product.isActive = !product.isActive;
        await product.save();
        return product;
    }

    // ─── Lấy sản phẩm theo slug danh mục ───
    static async getProductsByCategory(slug, query) {
        const { search, brand, minPrice, maxPrice, sort, page = 1, limit = 12 } = query;

        // Tìm danh mục theo slug
        const category = await Category.findOne({ slug, isActive: true }).lean();
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }

        // Lấy cả danh mục con
        const subCategories = await Category.find({ parent: category._id, isActive: true }).lean();
        const categoryIds = [category._id, ...subCategories.map((c) => c._id)];

        // Build filter
        const filter = { isActive: true, category: { $in: categoryIds } };

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        if (brand) {
            const brands = Array.isArray(brand) ? brand : brand.split(',').filter(Boolean);
            if (brands.length > 0) {
                filter.brand = { $in: brands };
            }
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Sắp xếp
        let sortOption = { sold: -1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };
        else if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort === 'bestseller') sortOption = { sold: -1 };
        else if (sort === 'rating') sortOption = { ratingAverage: -1 };

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('category', 'name slug')
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Lấy danh sách brand có trong danh mục (không bị ảnh hưởng bởi filter brand)
        const brandFilter = { isActive: true, category: { $in: categoryIds } };
        const allBrands = await Product.distinct('brand', brandFilter);
        const brands = allBrands.filter(Boolean).sort();

        return {
            category: { ...category, children: subCategories },
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
            brands,
        };
    }
}

module.exports = ProductService;

const { BadRequestError, NotFoundError } = require('../core/error.response');
const Category = require('../models/category.model');
const slugify = require('slugify');

class CategoryService {
    // Tạo danh mục
    static async createCategory({ name, parent, icon, description, order }) {
        const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });

        const existCategory = await Category.findOne({ slug });
        if (existCategory) {
            throw new BadRequestError('Danh mục đã tồn tại');
        }

        if (parent) {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                throw new NotFoundError('Danh mục cha không tồn tại');
            }
        }

        const category = await Category.create({
            name,
            slug,
            parent: parent || null,
            icon: icon || 'folder',
            description,
            order: order || 0,
        });

        return category;
    }

    // Lấy tất cả danh mục (dạng cây)
    static async getAllCategories() {
        const categories = await Category.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();

        // Build tree
        const map = {};
        const roots = [];

        categories.forEach((cat) => {
            map[cat._id.toString()] = { ...cat, children: [] };
        });

        categories.forEach((cat) => {
            if (cat.parent) {
                const parentId = cat.parent.toString();
                if (map[parentId]) {
                    map[parentId].children.push(map[cat._id.toString()]);
                } else {
                    roots.push(map[cat._id.toString()]);
                }
            } else {
                roots.push(map[cat._id.toString()]);
            }
        });

        return roots;
    }

    // Lấy tất cả danh mục (flat - cho admin)
    static async getAllCategoriesFlat() {
        const categories = await Category.find()
            .populate('parent', 'name slug')
            .sort({ order: 1, createdAt: -1 })
            .lean();
        return categories;
    }

    // Lấy danh mục theo ID
    static async getCategoryById(id) {
        const category = await Category.findById(id).populate('parent', 'name slug');
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }
        return category;
    }

    // Lấy danh mục theo slug
    static async getCategoryBySlug(slug) {
        const category = await Category.findOne({ slug, isActive: true });
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }

        // Lấy danh mục con
        const children = await Category.find({ parent: category._id, isActive: true }).sort({ order: 1 }).lean();

        return { ...category.toObject(), children };
    }

    // Cập nhật danh mục
    static async updateCategory(id, data) {
        const category = await Category.findById(id);
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }

        if (data.name && data.name !== category.name) {
            data.slug = slugify(data.name, { lower: true, strict: true, locale: 'vi' });
            const existSlug = await Category.findOne({ slug: data.slug, _id: { $ne: id } });
            if (existSlug) {
                throw new BadRequestError('Tên danh mục đã tồn tại');
            }
        }

        if (data.parent) {
            if (data.parent === id) {
                throw new BadRequestError('Danh mục không thể là cha của chính nó');
            }
            const parentCategory = await Category.findById(data.parent);
            if (!parentCategory) {
                throw new NotFoundError('Danh mục cha không tồn tại');
            }
        }

        const updated = await Category.findByIdAndUpdate(id, data, { new: true });
        return updated;
    }

    // Xóa danh mục
    static async deleteCategory(id) {
        const category = await Category.findById(id);
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }

        // Kiểm tra có danh mục con không
        const hasChildren = await Category.findOne({ parent: id });
        if (hasChildren) {
            throw new BadRequestError('Danh mục còn danh mục con, vui lòng xóa danh mục con trước');
        }

        await Category.findByIdAndDelete(id);
        return { message: 'Xóa danh mục thành công' };
    }

    // Bật / tắt danh mục
    static async toggleCategory(id) {
        const category = await Category.findById(id);
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }

        category.isActive = !category.isActive;
        await category.save();
        return category;
    }
}

module.exports = CategoryService;

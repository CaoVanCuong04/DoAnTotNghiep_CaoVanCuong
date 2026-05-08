const Store = require('../models/store.model');
const User = require('../models/users.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { uploadSingle } = require('../config/cloudinaryUpload');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const slugify = require('slugify');

class StoreService {
    // ─── [USER] Đăng ký gian hàng ───
    static async registerStore(userId, { name, description, phone, address }, files = {}) {
        // Chỉ customer chưa có store mới được đăng ký
        const existed = await Store.findOne({ owner: userId });
        if (existed) throw new BadRequestError('Bạn đã có gian hàng rồi');

        let slug = slugify(name, { lower: true, strict: true, locale: 'vi' });
        // Ensure unique slug
        const slugExists = await Store.findOne({ slug });
        if (slugExists) slug = `${slug}-${Date.now()}`;

        let logo = '',
            banner = '';
        if (files.logo?.[0]) logo = await uploadSingle(files.logo[0], 'stores/logos');
        if (files.banner?.[0]) banner = await uploadSingle(files.banner[0], 'stores/banners');

        const store = await Store.create({ name, slug, description, phone, address, logo, banner, owner: userId });
        return store;
    }

    // ─── [SELLER] Lấy thông tin gian hàng của mình ───
    static async getMyStore(userId) {
        const store = await Store.findOne({ owner: userId }).populate('owner', 'fullName email avatar');
        if (!store) throw new NotFoundError('Bạn chưa có gian hàng');
        return store;
    }

    // ─── [SELLER] Cập nhật gian hàng ───
    static async updateMyStore(userId, data, files = {}) {
        const store = await Store.findOne({ owner: userId });
        if (!store) throw new NotFoundError('Gian hàng không tồn tại');

        if (files.logo?.[0]) data.logo = await uploadSingle(files.logo[0], 'stores/logos');
        if (files.banner?.[0]) data.banner = await uploadSingle(files.banner[0], 'stores/banners');

        Object.assign(store, data);
        await store.save();
        return store;
    }

    // ─── [PUBLIC] Lấy thông tin shop theo slug ───
    static async getStoreBySlug(slug) {
        const store = await Store.findOne({ slug, status: 'active' }).populate('owner', 'fullName avatar');
        if (!store) throw new NotFoundError('Gian hàng không tồn tại');
        return store;
    }

    // ─── [PUBLIC] Sản phẩm của shop ───
    static async getStoreProducts(slug, { page = 1, limit = 20, sort = 'newest', search } = {}) {
        const store = await Store.findOne({ slug, status: 'active' });
        if (!store) throw new NotFoundError('Gian hàng không tồn tại');

        const sortMap = {
            newest: { createdAt: -1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            best_seller: { sold: -1 },
        };

        const filter = { store: store._id, status: 'active', isActive: true };
        if (search) filter.name = { $regex: search, $options: 'i' };

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort(sortMap[sort] || { createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('category', 'name')
                .lean(),
            Product.countDocuments(filter),
        ]);
        return { store, products, total, page };
    }

    // ─── [ADMIN] Danh sách tất cả store ───
    static async getAllStores({ page = 1, limit = 20, status } = {}) {
        const filter = status ? { status } : {};
        const [stores, total] = await Promise.all([
            Store.find(filter)
                .populate('owner', 'fullName email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Store.countDocuments(filter),
        ]);
        return { stores, total, page };
    }

    // ─── [ADMIN] Duyệt / Khóa store ───
    static async updateStoreStatus(storeId, status) {
        const store = await Store.findById(storeId).populate('owner');
        if (!store) throw new NotFoundError('Gian hàng không tồn tại');

        store.status = status;
        await store.save();

        // Sync user role
        if (status === 'active') {
            await User.findByIdAndUpdate(store.owner._id, { role: 'seller' });
        } else if (status === 'banned') {
            await User.findByIdAndUpdate(store.owner._id, { role: 'customer' });
        }

        return store;
    }
}

module.exports = StoreService;

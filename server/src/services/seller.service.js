const Product = require('../models/product.model');
const Order = require('../models/order.model');
const Store = require('../models/store.model');
const Review = require('../models/review.model');
const User = require('../models/users.model');
const WalletTransaction = require('../models/walletTransaction.model');
const { uploadMultiple } = require('../config/cloudinaryUpload');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const slugify = require('slugify');
const mongoose = require('mongoose');
const NotificationService = require('./notification.service');

/**
 * Nếu sản phẩm có biến thể → tự động tính:
 *   price  = giá thấp nhất trong tất cả options
 *   stock  = tổng tồn kho trong tất cả options
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

class SellerService {
    // ─── Sản phẩm ───

    static async createProduct(storeId, data, files = []) {
        const store = await Store.findById(storeId);
        if (!store) throw new NotFoundError('Gian hàng không tồn tại');

        let images = [];
        if (files.length > 0) images = await uploadMultiple(files, 'products');

        // Parse JSON strings from FormData
        if (typeof data.attributes === 'string') {
            try { data.attributes = JSON.parse(data.attributes); } catch { data.attributes = []; }
        }
        if (typeof data.variants === 'string') {
            try { data.variants = JSON.parse(data.variants); } catch { data.variants = []; }
        }
        if (typeof data.keepImages === 'string') {
            try { data.keepImages = JSON.parse(data.keepImages); } catch { data.keepImages = []; }
        }

        // ── Convert kiểu dữ liệu từ FormData (tất cả đều là string) ──
        const price = Number(data.price) || 0;
        const originalPrice = Number(data.originalPrice) || 0;
        const stock = Number(data.stock) || 0;
        const weight = Number(data.weight) || 500;
        const length = Number(data.length) || 15;
        const width = Number(data.width) || 15;
        const height = Number(data.height) || 10;
        const flashSalePrice = Number(data.flashSalePrice) || 0;

        // ── Auto-sync giá & kho từ biến thể ──
        const variantSync = syncPriceStockFromVariants(data.variants);
        const finalPrice = variantSync ? variantSync.price : price;
        const finalStock = variantSync ? variantSync.stock : stock;

        let slug = slugify(data.name, { lower: true, strict: true, locale: 'vi' });
        const slugExists = await Product.findOne({ slug });
        if (slugExists) slug = `${slug}-${Date.now()}`;

        const product = await Product.create({
            name: data.name,
            brand: data.brand || '',
            category: data.category,
            shortDescription: data.shortDescription || '',
            description: data.description || '',
            attributes: data.attributes || [],
            variants: data.variants || [],
            slug,
            images,
            store: storeId,
            status: 'active',
            isActive: true,
            price: finalPrice,
            originalPrice,
            stock: finalStock,
            weight,
            length,
            width,
            height,
            flashSalePrice,
            flashSaleEndTime: data.flashSaleEndTime || null,
            isFlashSale: data.isFlashSale === 'true' || data.isFlashSale === true,
            isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
        });

        await Store.findByIdAndUpdate(storeId, { $inc: { totalProducts: 1 } });
        return product;
    }

    static async getMyProducts(storeId, { page = 1, limit = 20, status, search } = {}) {
        const filter = { store: storeId };
        if (status) filter.status = status;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Product.countDocuments(filter),
        ]);
        return { products, total, page };
    }

    static async updateProduct(storeId, productId, data, files = []) {
        const product = await Product.findOne({ _id: productId, store: storeId });
        if (!product) throw new NotFoundError('Sản phẩm không tồn tại hoặc không thuộc gian hàng của bạn');

        // Parse JSON strings from FormData
        if (typeof data.attributes === 'string') {
            try { data.attributes = JSON.parse(data.attributes); } catch { data.attributes = []; }
        }
        if (typeof data.variants === 'string') {
            try { data.variants = JSON.parse(data.variants); } catch { data.variants = []; }
        }
        if (typeof data.keepImages === 'string') {
            try { data.keepImages = JSON.parse(data.keepImages); } catch { data.keepImages = []; }
        }

        // ── Xử lý ảnh: giữ ảnh cũ + thêm ảnh mới ──
        if (files.length > 0) {
            const newImages = await uploadMultiple(files, 'products');
            data.images = [...(data.keepImages || []), ...newImages];
        } else if (data.keepImages) {
            // Không có file mới nhưng có danh sách ảnh cũ cần giữ → dùng danh sách đó
            data.images = data.keepImages;
        }
        delete data.keepImages;

        // ── Convert kiểu dữ liệu từ FormData ──
        if (data.price !== undefined) data.price = Number(data.price) || 0;
        if (data.originalPrice !== undefined) data.originalPrice = Number(data.originalPrice) || 0;
        if (data.stock !== undefined) data.stock = Number(data.stock) || 0;
        if (data.weight !== undefined) data.weight = Number(data.weight) || 500;
        if (data.length !== undefined) data.length = Number(data.length) || 15;
        if (data.width !== undefined) data.width = Number(data.width) || 15;
        if (data.height !== undefined) data.height = Number(data.height) || 10;
        if (data.flashSalePrice !== undefined) data.flashSalePrice = Number(data.flashSalePrice) || 0;
        if (data.isFlashSale !== undefined) data.isFlashSale = data.isFlashSale === 'true' || data.isFlashSale === true;
        if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;

        // ── Auto-sync giá & kho từ biến thể ──
        const variantsToSync = data.variants ?? product.variants;
        const variantSync = syncPriceStockFromVariants(variantsToSync);
        if (variantSync) {
            data.price = variantSync.price;
            data.stock = variantSync.stock;
        }

        Object.assign(product, data);
        await product.save();
        return product;
    }

    static async deleteProduct(storeId, productId) {
        const product = await Product.findOne({ _id: productId, store: storeId });
        if (!product) throw new NotFoundError('Sản phẩm không tồn tại hoặc không thuộc gian hàng của bạn');
        await product.deleteOne();
        await Store.findByIdAndUpdate(storeId, { $inc: { totalProducts: -1 } });
        return { message: 'Đã xóa sản phẩm' };
    }

    // ─── Đơn hàng ───

    static async getMyOrders(storeId, { page = 1, limit = 20, status, search } = {}) {
        const filter = { 'items.store': storeId };
        if (status) filter['items.itemStatus'] = status;
        if (search) {
            filter.$or = [
                { orderCode: { $regex: search, $options: 'i' } },
                { 'shippingInfo.fullName': { $regex: search, $options: 'i' } },
                { 'shippingInfo.phone': { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('user', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ]);

        // Filter items to only show this store's items
        const result = orders.map((o) => ({
            ...o,
            items: o.items.filter((i) => i.store?.toString() === storeId.toString()),
        }));

        return { orders: result, total, page };
    }

    static async updateItemStatus(storeId, orderId, itemId, newStatus) {
        const order = await Order.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');

        const item = order.items.id(itemId);
        if (!item) throw new NotFoundError('Mục đơn hàng không tìm thấy');
        if (item.store?.toString() !== storeId.toString()) throw new ForbiddenError('Không có quyền cập nhật');

        const statusFlow = ['pending', 'confirmed', 'shipping', 'delivered'];
        const currentIdx = statusFlow.indexOf(item.itemStatus);
        const newIdx = statusFlow.indexOf(newStatus);
        if (newIdx <= currentIdx && newStatus !== 'cancelled') {
            throw new BadRequestError('Không thể quay ngược trạng thái');
        }
        item.itemStatus = newStatus;

        // ── Cộng tiền vào ví người bán khi item delivered ──
        if (newStatus === 'delivered') {
            try {
                const store = await Store.findById(storeId);
                if (store && store.owner) {
                    const commissionRate = store.commissionRate || 5;
                    // Doanh thu thực = giá item × số lượng × (1 - hoa hồng)
                    const itemRevenue = (item.price || 0) * (item.quantity || 1);
                    const netAmount = Math.round(itemRevenue * (1 - commissionRate / 100));

                    if (netAmount > 0) {
                        const seller = await User.findByIdAndUpdate(
                            store.owner,
                            { $inc: { balance: netAmount } },
                            { new: true },
                        );

                        await WalletTransaction.create({
                            user: store.owner,
                            type: 'credit',
                            amount: netAmount,
                            balanceAfter: seller?.balance || 0,
                            description: `Doanh thu đơn hàng #${order.orderCode} - ${item.name} (sau ${commissionRate}% hoa hồng)`,
                            order: order._id,
                            orderCode: order.orderCode,
                            status: 'completed',
                        });

                        // Cập nhật totalSales của store
                        await Store.findByIdAndUpdate(storeId, {
                            $inc: { totalSales: item.quantity || 1 },
                        });
                    }
                }
            } catch (err) {
                console.error('[Wallet] Lỗi khi cộng tiền seller:', err);
            }
        }

        // ── Tự động cập nhật orderStatus dựa trên tổng hợp tất cả items ──
        const allStatuses = order.items.map((i) => i.itemStatus);

        let derivedOrderStatus = order.orderStatus;
        if (allStatuses.every((s) => s === 'delivered')) {
            derivedOrderStatus = 'delivered';
        } else if (allStatuses.every((s) => s === 'cancelled')) {
            derivedOrderStatus = 'cancelled';
        } else if (allStatuses.some((s) => s === 'shipping')) {
            derivedOrderStatus = 'shipping';
        } else if (allStatuses.some((s) => s === 'confirmed')) {
            derivedOrderStatus = 'confirmed';
        } else if (allStatuses.some((s) => s === 'pending')) {
            derivedOrderStatus = 'pending';
        }
        order.orderStatus = derivedOrderStatus;

        await order.save();

        // ── Thông báo cho buyer ──
        const io = global.io;
        const statusLabels = {
            confirmed: 'đã được xác nhận ✅',
            shipping: 'đang được vận chuyển 🚚',
            delivered: 'đã được giao thành công 🎉',
            cancelled: 'đã bị hủy ❌',
        };
        if (statusLabels[newStatus]) {
            await NotificationService.create(io, {
                recipient: order.user,
                type: 'order_status',
                title: 'Cập nhật đơn hàng',
                body: `Sản phẩm "${item.name}" ${statusLabels[newStatus]}`,
                link: `/orders/${order._id}`,
                meta: { orderId: order._id, itemId, status: newStatus },
            });
        }

        return order;
    }

    // ── Phản hồi đánh giá ──

    static async replyToReview(storeId, reviewId, content) {
        if (!content || !content.trim()) throw new BadRequestError('Nội dung phản hồi không được trống');

        const review = await Review.findById(reviewId).populate('product', 'store');
        if (!review) throw new NotFoundError('Đánh giá không tồn tại');

        // Kiểm tra review thuộc sản phẩm của shop này
        if (review.product?.store?.toString() !== storeId.toString()) {
            throw new ForbiddenError('Bạn không có quyền phản hồi đánh giá này');
        }

        review.reply = { content: content.trim(), repliedAt: new Date() };
        await review.save();
        return review;
    }

    // ─── Thống kê ───

    static async getAnalytics(storeId) {
        const sid = new mongoose.Types.ObjectId(storeId);
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [
            revenue,
            topProducts,
            totalOrders,
            orderStatusAgg,
            reviewStats,
            thisMonthAgg,
            lastMonthAgg,
            lowStockCount,
            couponsStats,
        ] = await Promise.all([
            Order.aggregate([
                { $match: { 'items.store': sid, 'items.itemStatus': 'delivered' } },
                { $unwind: '$items' },
                { $match: { 'items.store': sid, 'items.itemStatus': 'delivered' } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        revenue: {
                            $sum: {
                                $cond: [
                                    { $gt: ['$items.sellerRevenue', 0] },
                                    '$items.sellerRevenue',
                                    { $multiply: ['$items.price', '$items.quantity'] },
                                ],
                            },
                        },
                        orders: { $sum: 1 },
                    },
                },
                { $sort: { _id: -1 } },
                { $limit: 30 },
            ]),
            Product.find({ store: storeId }).sort({ sold: -1 }).limit(5).select('name sold price images stock'),
            Order.countDocuments({ 'items.store': sid }),
            // Đếm theo itemStatus của store
            Order.aggregate([
                { $match: { 'items.store': sid } },
                { $unwind: '$items' },
                { $match: { 'items.store': sid } },
                { $group: { _id: '$items.itemStatus', count: { $sum: 1 } } },
            ]),
            // Đánh giá: tổng, TB rating, chưa phản hồi
            (async () => {
                const products = await Product.find({ store: storeId }).select('_id');
                const pIds = products.map((p) => p._id);
                const [total, avgRating, unreplied] = await Promise.all([
                    Review.countDocuments({ product: { $in: pIds } }),
                    Review.aggregate([
                        { $match: { product: { $in: pIds } } },
                        { $group: { _id: null, avg: { $avg: '$rating' } } },
                    ]),
                    Review.countDocuments({
                        product: { $in: pIds },
                        $or: [{ 'reply.content': { $exists: false } }, { 'reply.content': '' }, { reply: null }],
                    }),
                ]);
                return { total, avgRating: avgRating[0]?.avg ? Math.round(avgRating[0].avg * 10) / 10 : 0, unreplied };
            })(),
            // Doanh thu tháng này
            Order.aggregate([
                {
                    $match: {
                        'items.store': sid,
                        'items.itemStatus': 'delivered',
                        createdAt: { $gte: startOfThisMonth },
                    },
                },
                { $unwind: '$items' },
                { $match: { 'items.store': sid, 'items.itemStatus': 'delivered' } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $cond: [
                                    { $gt: ['$items.sellerRevenue', 0] },
                                    '$items.sellerRevenue',
                                    { $multiply: ['$items.price', '$items.quantity'] },
                                ],
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            // Doanh thu tháng trước
            Order.aggregate([
                {
                    $match: {
                        'items.store': sid,
                        'items.itemStatus': 'delivered',
                        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                    },
                },
                { $unwind: '$items' },
                { $match: { 'items.store': sid, 'items.itemStatus': 'delivered' } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $cond: [
                                    { $gt: ['$items.sellerRevenue', 0] },
                                    '$items.sellerRevenue',
                                    { $multiply: ['$items.price', '$items.quantity'] },
                                ],
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            // Sản phẩm tồn kho thấp
            Product.countDocuments({ store: storeId, isActive: true, stock: { $lte: 5 } }),
            // Coupon đang hoạt động
            (async () => {
                const Coupon = require('../models/coupon.model');
                const [total, active] = await Promise.all([
                    Coupon.countDocuments({ store: storeId }),
                    Coupon.countDocuments({ store: storeId, isActive: true, expiresAt: { $gt: new Date() } }),
                ]);
                return { total, active };
            })(),
        ]);

        const totalRevenue = revenue.reduce((s, r) => s + (r.revenue || 0), 0);
        const thisMonthRev = thisMonthAgg[0]?.total || 0;
        const lastMonthRev = lastMonthAgg[0]?.total || 0;
        const revenueGrowth =
            lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : null;
        const thisMonthOrders = thisMonthAgg[0]?.count || 0;

        return {
            revenue,
            topProducts,
            totalOrders,
            totalRevenue,
            orderStatusBreakdown: orderStatusAgg,
            reviewStats,
            thisMonthRevenue: thisMonthRev,
            lastMonthRevenue: lastMonthRev,
            revenueGrowth,
            thisMonthOrders,
            lowStockCount,
            couponsStats,
        };
    }

    // ─── Mã giảm giá (Coupon) ───

    static async createCoupon(storeId, data) {
        const Coupon = require('../models/coupon.model');
        const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
        if (existing) throw new BadRequestError('Mã giảm giá đã tồn tại');

        const coupon = await Coupon.create({
            ...data,
            code: data.code.toUpperCase(),
            store: storeId,
        });
        return coupon;
    }

    static async getMyCoupons(storeId, { page = 1, limit = 20, search, isActive } = {}) {
        const Coupon = require('../models/coupon.model');
        const filter = { store: storeId };

        if (isActive !== undefined && isActive !== 'all') {
            filter.isActive = isActive === 'true' || isActive === true;
        }
        if (search) {
            filter.$or = [
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [coupons, total] = await Promise.all([
            Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Coupon.countDocuments(filter),
        ]);

        return { coupons, total, page, limit };
    }

    static async updateCoupon(storeId, couponId, data) {
        const Coupon = require('../models/coupon.model');
        const coupon = await Coupon.findOne({ _id: couponId, store: storeId });
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại hoặc không thuộc gian hàng của bạn');

        Object.assign(coupon, data);
        if (data.code) coupon.code = data.code.toUpperCase();
        await coupon.save();
        return coupon;
    }

    static async deleteCoupon(storeId, couponId) {
        const Coupon = require('../models/coupon.model');
        const coupon = await Coupon.findOneAndDelete({ _id: couponId, store: storeId });
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại hoặc không thuộc gian hàng của bạn');
        return { message: 'Đã xóa mã giảm giá' };
    }

    // ─── Đánh giá (Review) ───
    static async getMyStoreReviews(storeId, { page = 1, limit = 20, rating, replied } = {}) {
        const products = await Product.find({ store: storeId }).select('_id');
        const productIds = products.map((p) => p._id);

        const filter = { product: { $in: productIds } };
        if (rating) filter.rating = Number(rating);
        if (replied === 'yes') filter['reply.content'] = { $exists: true, $ne: '' };
        if (replied === 'no') {
            filter.$or = [{ 'reply.content': { $exists: false } }, { 'reply.content': '' }, { reply: null }];
        }

        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .populate('user', 'fullName avatar email')
                .populate('product', 'name images price slug')
                .populate({ path: 'order', select: 'orderCode orderStatus' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
        ]);

        // Đếm chưa phản hồi (để hiển thị badge)
        const unrepliedCount = await Review.countDocuments({
            product: { $in: productIds },
            $or: [{ 'reply.content': { $exists: false } }, { 'reply.content': '' }, { reply: null }],
        });

        return { reviews, total, page, limit, totalPages: Math.ceil(total / limit), unrepliedCount };
    }

    // ─── Ví (Wallet) ───
    static async getMyWallet(userId, { page = 1, limit = 20 } = {}) {
        const User = require('../models/users.model');
        const user = await User.findById(userId).select('balance fullName');
        if (!user) throw new NotFoundError('Không tìm thấy người dùng');

        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            WalletTransaction.countDocuments({ user: userId }),
        ]);

        let allTransactions = transactions;
        if (page === 1) {
            const Withdrawal = require('../models/withdrawal.model');
            const pendingWithdrawals = await Withdrawal.find({ user: userId, status: { $in: ['pending', 'rejected'] } })
                .sort({ createdAt: -1 })
                .lean();
            const pendingTxs = pendingWithdrawals.map((pw) => ({
                _id: pw._id,
                type: 'withdrawal',
                amount: pw.amount,
                balanceAfter: user.balance,
                description: `Yêu cầu rút tiền ${pw.status === 'pending' ? '(Chờ duyệt)' : '(Từ chối' + (pw.note ? ': ' + pw.note : '') + ')'} - ${pw.bankName} ${pw.accountNumber}`,
                status: pw.status,
                createdAt: pw.createdAt,
            }));
            allTransactions = [...pendingTxs, ...transactions].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            );
        }

        // Tổng đã nhận / đã rút
        const [creditAgg, debitAgg] = await Promise.all([
            WalletTransaction.aggregate([
                {
                    $match: {
                        user: require('mongoose').Types.ObjectId.createFromHexString(userId.toString()),
                        type: 'credit',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            WalletTransaction.aggregate([
                {
                    $match: {
                        user: require('mongoose').Types.ObjectId.createFromHexString(userId.toString()),
                        type: { $in: ['debit', 'withdrawal'] },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);

        return {
            balance: user.balance || 0,
            totalReceived: creditAgg[0]?.total || 0,
            totalWithdrawn: debitAgg[0]?.total || 0,
            transactions: allTransactions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    static async requestWithdrawal(userId, data) {
        const { amount, bankName, accountNumber, accountName } = data;
        const withdrawAmount = Number(amount);

        if (!withdrawAmount || withdrawAmount < 10000) throw new BadRequestError('Số tiền tối thiểu là 10.000đ');
        if (!bankName || !accountNumber || !accountName)
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin tài khoản');

        const User = require('../models/users.model');
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Không tìm thấy người dùng');
        if ((user.balance || 0) < withdrawAmount) throw new BadRequestError('Số dư không đủ');

        // Check if there's any pending withdrawal to prevent over-withdrawing
        const Withdrawal = require('../models/withdrawal.model');
        const pendingWd = await Withdrawal.aggregate([
            { $match: { user: user._id, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const pendingAmount = pendingWd[0]?.total || 0;

        if ((user.balance || 0) < withdrawAmount + pendingAmount) {
            throw new BadRequestError('Tổng số tiền rút và số tiền đang chờ duyệt vượt quá số dư hiện tại');
        }

        // Create a Withdrawal request for Admin to review
        const withdrawal = await Withdrawal.create({
            user: userId,
            amount: withdrawAmount,
            bankName,
            accountNumber,
            accountName,
            status: 'pending',
        });

        return { withdrawal, balance: user.balance };
    }
}

module.exports = SellerService;

const Coupon = require('../models/coupon.model');
const Cart = require('../models/cart.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class CouponService {
    // ─── [ADMIN] Tạo mã giảm giá ───
    static async createCoupon(data) {
        const {
            code,
            discountType,
            discountValue,
            maxDiscount,
            minOrderAmount,
            expiresAt,
            usageLimit,
            description,
            isActive,
        } = data;

        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) throw new BadRequestError('Mã giảm giá đã tồn tại');

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            maxDiscount: maxDiscount || null,
            minOrderAmount: minOrderAmount || 0,
            expiresAt: expiresAt || null,
            usageLimit: usageLimit || null,
            isActive: isActive !== undefined ? isActive : true,
            store: null, // Ensure system vouchers are not tied to any shop
        });

        return coupon;
    }

    // ─── [ADMIN] Cập nhật mã giảm giá ───
    static async updateCoupon(couponId, data) {
        const coupon = await Coupon.findById(couponId);
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại');

        Object.assign(coupon, data);
        if (data.code) coupon.code = data.code.toUpperCase();
        await coupon.save();
        return coupon;
    }

    // ─── [ADMIN] Xóa mã giảm giá ───
    static async deleteCoupon(couponId) {
        const coupon = await Coupon.findByIdAndDelete(couponId);
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại');
        return { message: 'Đã xóa mã giảm giá' };
    }

    // ─── [ADMIN] Lấy danh sách mã giảm giá ───
    static async getAllCoupons({ search, isActive, page = 1, limit = 20 }) {
        const filter = { store: null }; // Only fetch system vouchers for Admin
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

    // ─── [USER] Lấy mã giảm giá phù hợp với giỏ hàng ───
    static async getAvailableCoupons(userId) {
        const cart = await Cart.findOne({ user: userId }).populate('items.product', 'store');
        if (!cart || !cart.items || cart.items.length === 0) {
            return { coupons: [], cartTotal: 0, appliedCode: null };
        }

        // Tính tổng tiền theo từng store
        const storeTotals = {};
        for (const item of cart.items) {
            if (item.product && item.product.store) {
                const sId = item.product.store.toString();
                storeTotals[sId] = (storeTotals[sId] || 0) + item.price * item.quantity;
            }
        }

        // Tính tổng tiền toàn giỏ hàng
        const cartTotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const now = new Date();
        const storeIdsInCart = Object.keys(storeTotals);

        // Lấy tất cả mã còn hạn của các store có trong giỏ hàng
        let shopCoupons = [];
        if (storeIdsInCart.length > 0) {
            shopCoupons = await Coupon.find({
                isActive: true,
                store: { $in: storeIdsInCart },
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
                $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
            })
                .sort({ discountValue: -1 })
                .lean();
        }

        // Lọc các coupon đạt điều kiện minOrderAmount của store tương ứng
        shopCoupons = shopCoupons.filter((coupon) => {
            const cStoreId = coupon.store.toString();
            const totalOfStore = storeTotals[cStoreId] || 0;
            return totalOfStore >= coupon.minOrderAmount;
        });

        // Lấy các mã của Sàn (không thuộc store nào)
        let systemCoupons = await Coupon.find({
            isActive: true,
            store: null,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
            $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
        })
            .sort({ discountValue: -1 })
            .lean();

        // Lọc mã sàn đạt điều kiện đơn tối thiểu của toàn bộ giỏ
        systemCoupons = systemCoupons.filter((coupon) => cartTotal >= coupon.minOrderAmount);

        return {
            shopCoupons,
            systemCoupons,
            cartTotal: cart.totalPrice,
            appliedShopCode: cart.shopVoucherCode || null,
            appliedSystemCode: cart.systemVoucherCode || null,
        };
    }

    // ─── [USER] Lấy 1 mã theo code (kiểm tra hợp lệ) ───
    static async getCouponByCode(code) {
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại');
        return coupon;
    }

    // ─── [USER] Áp dụng mã giảm giá vào giỏ hàng ───
    static async applyCoupon(userId, code) {
        const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price stock store');
        if (!cart) throw new NotFoundError('Không tìm thấy giỏ hàng');
        if (!cart.items || cart.items.length === 0) throw new BadRequestError('Giỏ hàng trống');

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại');

        // Kiểm tra hợp lệ
        if (!coupon.isActive) {
            console.log('[applyCoupon] ERROR: Coupon inactive');
            throw new BadRequestError('Mã giảm giá đã bị vô hiệu hóa');
        }
        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            console.log('[applyCoupon] ERROR: Coupon expired', new Date(), coupon.expiresAt);
            throw new BadRequestError('Mã giảm giá đã hết hạn');
        }
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            console.log('[applyCoupon] ERROR: Coupon limit reached', coupon.usedCount, coupon.usageLimit);
            throw new BadRequestError('Mã giảm giá đã hết lượt sử dụng');
        }

        // Logic phân tách mã Shop và mã Sàn
        const isSystemVoucher = coupon.store == null;

        let discountBaseTotal = 0; // Số tiền dùng làm gốc để tính giảm giá

        if (!isSystemVoucher) {
            // Lọc các item thuộc store của coupon
            const storeItems = cart.items.filter(
                (item) =>
                    item.product && item.product.store && item.product.store.toString() === coupon.store.toString(),
            );

            if (storeItems.length === 0) {
                throw new BadRequestError('Mã giảm giá này chỉ áp dụng cho sản phẩm của shop tạo mã.');
            }

            // Tính tổng tiền các item của store đó
            const storeTotal = storeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

            if (storeTotal < coupon.minOrderAmount) {
                throw new BadRequestError(
                    `Đơn hàng từ shop này cần đạt tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để áp dụng mã`,
                );
            }
            discountBaseTotal = storeTotal;
        } else {
            // Áp dụng cho toán bộ giỏ (mã của sàn)
            const cartTotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
            if (cartTotal < coupon.minOrderAmount) {
                throw new BadRequestError(
                    `Đơn hàng của toàn bộ giỏ cần đạt tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để áp mã sàn này`,
                );
            }
            discountBaseTotal = cartTotal;
        }

        // Tính tiền giảm
        let discountAmount = 0;
        if (coupon.discountType === 'percent') {
            discountAmount = Math.floor((discountBaseTotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        } else {
            discountAmount = Math.min(coupon.discountValue, discountBaseTotal);
        }

        // Cập nhật tương ứng vào Cart object
        if (isSystemVoucher) {
            cart.systemVoucherCode = coupon.code;
            cart.systemDiscount = discountAmount;
        } else {
            cart.shopVoucherCode = coupon.code;
            cart.shopDiscount = discountAmount;
        }

        cart.finalPrice = Math.max(0, cart.totalPrice - (cart.shopDiscount || 0) - (cart.systemDiscount || 0));
        await cart.save();

        return { cart, coupon, discountAmount, type: isSystemVoucher ? 'system' : 'shop' };
    }

    // ─── [USER] Bỏ áp dụng mã giảm giá ───
    static async removeCoupon(userId, type) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new NotFoundError('Không tìm thấy giỏ hàng');

        if (type === 'system') {
            cart.systemVoucherCode = null;
            cart.systemDiscount = 0;
        } else if (type === 'shop') {
            cart.shopVoucherCode = null;
            cart.shopDiscount = 0;
        } else {
            throw new BadRequestError('Loại mã giảm giá không hợp lệ khi xóa');
        }

        cart.finalPrice = Math.max(0, cart.totalPrice - (cart.shopDiscount || 0) - (cart.systemDiscount || 0));
        await cart.save();
        return cart;
    }

    // ─── [PUBLIC] Lấy danh sách mã giảm chung cho trang chủ ───
    static async getPublicCoupons() {
        const now = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            store: null, // Only system coupons on homepage
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
            $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
        })
            .sort({ discountValue: -1 })
            .limit(4)
            .lean();
            
        return coupons;
    }
}

module.exports = CouponService;

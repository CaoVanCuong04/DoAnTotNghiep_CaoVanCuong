const { OK, Created } = require('../core/success.response');
const CouponService = require('../services/coupon.service');

class CouponController {
    // [ADMIN] POST /api/coupons
    createCoupon = async (req, res, next) => {
        try {
            const coupon = await CouponService.createCoupon(req.body);
            new Created({ message: 'Tạo mã giảm giá thành công', metadata: coupon }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] PUT /api/coupons/:id
    updateCoupon = async (req, res, next) => {
        try {
            const coupon = await CouponService.updateCoupon(req.params.id, req.body);
            new OK({ message: 'Cập nhật thành công', metadata: coupon }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] DELETE /api/coupons/:id
    deleteCoupon = async (req, res, next) => {
        try {
            const result = await CouponService.deleteCoupon(req.params.id);
            new OK({ message: result.message, metadata: null }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] GET /api/coupons
    getAllCoupons = async (req, res, next) => {
        try {
            const { search, isActive, page, limit } = req.query;
            const data = await CouponService.getAllCoupons({
                search,
                isActive,
                page: Number(page) || 1,
                limit: Number(limit) || 20,
            });
            new OK({ message: 'Danh sách mã giảm giá', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] GET /api/coupons/available
    getAvailableCoupons = async (req, res, next) => {
        try {
            const data = await CouponService.getAvailableCoupons(req.user.id);
            new OK({ message: 'Mã giảm giá phù hợp', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] GET /api/coupons/check/:code
    checkCoupon = async (req, res, next) => {
        try {
            const coupon = await CouponService.getCouponByCode(req.params.code);
            new OK({ message: 'Mã hợp lệ', metadata: coupon }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] POST /api/coupons/apply
    applyCoupon = async (req, res, next) => {
        try {
            const { code } = req.body;
            const result = await CouponService.applyCoupon(req.user.id, code);
            new OK({
                message: `Áp dụng mã thành công! Giảm ${result.discountAmount.toLocaleString('vi-VN')}đ`,
                metadata: { cart: result.cart, type: result.type, discountAmount: result.discountAmount },
            }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] DELETE /api/coupons/remove?type=shop|system
    removeCoupon = async (req, res, next) => {
        try {
            const { type } = req.query;
            const cart = await CouponService.removeCoupon(req.user.id, type);
            new OK({ message: 'Đã bỏ mã giảm giá', metadata: cart }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [PUBLIC] GET /api/coupons/public
    getPublicCoupons = async (req, res, next) => {
        try {
            const data = await CouponService.getPublicCoupons();
            new OK({ message: 'Khuyến mãi nổi bật', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new CouponController();

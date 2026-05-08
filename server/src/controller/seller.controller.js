const { OK, Created } = require('../core/success.response');
const SellerService = require('../services/seller.service');

class SellerController {
    // POST /api/seller/products
    createProduct = async (req, res, next) => {
        try {
            const product = await SellerService.createProduct(req.store._id, req.body, req.files || []);
            new Created({ message: 'Sản phẩm đã tạo, đang chờ duyệt', metadata: product }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/seller/products
    getMyProducts = async (req, res, next) => {
        try {
            const data = await SellerService.getMyProducts(req.store._id, req.query);
            new OK({ message: 'Sản phẩm của gian hàng', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // PUT /api/seller/products/:id
    updateProduct = async (req, res, next) => {
        try {
            const product = await SellerService.updateProduct(req.store._id, req.params.id, req.body, req.files || []);
            new OK({ message: 'Đã cập nhật sản phẩm', metadata: product }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // DELETE /api/seller/products/:id
    deleteProduct = async (req, res, next) => {
        try {
            const result = await SellerService.deleteProduct(req.store._id, req.params.id);
            new OK({ message: result.message, metadata: null }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/seller/orders
    getMyOrders = async (req, res, next) => {
        try {
            const data = await SellerService.getMyOrders(req.store._id, req.query);
            new OK({ message: 'Đơn hàng của gian hàng', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // PUT /api/seller/orders/:orderId/items/:itemId
    updateItemStatus = async (req, res, next) => {
        try {
            const { orderId, itemId } = req.params;
            const { status } = req.body;
            const order = await SellerService.updateItemStatus(req.store._id, orderId, itemId, status);
            new OK({ message: 'Đã cập nhật trạng thái', metadata: order }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/seller/analytics
    getAnalytics = async (req, res, next) => {
        try {
            const data = await SellerService.getAnalytics(req.store._id);
            new OK({ message: 'Thống kê gian hàng', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };
    // ─── Mã giảm giá (Coupon) ───

    // POST /api/seller/coupons
    createCoupon = async (req, res, next) => {
        try {
            const coupon = await SellerService.createCoupon(req.store._id, req.body);
            new Created({ message: 'Tạo mã giảm giá thành công', metadata: coupon }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/seller/coupons
    getMyCoupons = async (req, res, next) => {
        try {
            const data = await SellerService.getMyCoupons(req.store._id, req.query);
            new OK({ message: 'Danh sách mã giảm giá', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // PUT /api/seller/coupons/:id
    updateCoupon = async (req, res, next) => {
        try {
            const coupon = await SellerService.updateCoupon(req.store._id, req.params.id, req.body);
            new OK({ message: 'Cập nhật mã thành công', metadata: coupon }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // DELETE /api/seller/coupons/:id
    deleteCoupon = async (req, res, next) => {
        try {
            const result = await SellerService.deleteCoupon(req.store._id, req.params.id);
            new OK({ message: result.message, metadata: null }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // ─── Đánh giá (Review) ───

    // GET /api/seller/reviews
    getMyStoreReviews = async (req, res, next) => {
        try {
            const data = await SellerService.getMyStoreReviews(req.store._id, req.query);
            new OK({ message: 'Danh sách đánh giá', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/seller/reviews/:id/reply
    replyToReview = async (req, res, next) => {
        try {
            const review = await SellerService.replyToReview(req.store._id, req.params.id, req.body.content);
            new OK({ message: 'Phản hồi thành công', metadata: review }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // ─── Ví người bán (Wallet) ───

    // GET /api/seller/wallet
    getMyWallet = async (req, res, next) => {
        try {
            const data = await SellerService.getMyWallet(req.user.id, req.query);
            new OK({ message: 'Thông tin ví', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/seller/wallet/withdraw
    requestWithdrawal = async (req, res, next) => {
        try {
            const data = await SellerService.requestWithdrawal(req.user.id, req.body);
            new Created({ message: 'Đã tạo lệnh rút tiền thành công', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // PATCH /api/seller/products/:id/flash-sale
    updateFlashSale = async (req, res, next) => {
        try {
            const Product = require('../models/product.model');
            const { BadRequestError, NotFoundError } = require('../core/error.response');

            const { isFlashSale, flashSalePrice, flashSaleEndTime } = req.body;
            const productId = req.params.id;
            const storeId = req.store._id;

            const product = await Product.findOne({ _id: productId, store: storeId });
            if (!product) throw new NotFoundError('Sản phẩm không tồn tại hoặc không thuộc gian hàng của bạn');

            if (isFlashSale) {
                if (!flashSalePrice || flashSalePrice <= 0) throw new BadRequestError('Giá flash sale phải lớn hơn 0');
                if (flashSalePrice >= product.price) throw new BadRequestError('Giá flash sale phải thấp hơn giá gốc');
                if (!flashSaleEndTime) throw new BadRequestError('Vui lòng chọn thời gian kết thúc flash sale');
                if (new Date(flashSaleEndTime) <= new Date()) throw new BadRequestError('Thời gian kết thúc phải là tương lai');

                product.isFlashSale = true;
                product.flashSalePrice = flashSalePrice;
                product.flashSaleEndTime = new Date(flashSaleEndTime);
            } else {
                product.isFlashSale = false;
                product.flashSalePrice = 0;
                product.flashSaleEndTime = null;
            }

            await product.save();
            new OK({ message: isFlashSale ? 'Đã bật Flash Sale' : 'Đã tắt Flash Sale', metadata: product }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new SellerController();

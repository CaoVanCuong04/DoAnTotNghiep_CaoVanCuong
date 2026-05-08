const { OK, Created } = require('../core/success.response');
const ReviewService = require('../services/review.service');
const NotificationService = require('../services/notification.service');
const Product = require('../models/product.model');
const Store = require('../models/store.model');

class ReviewController {
    // [USER] POST /api/reviews  (multipart/form-data)
    createReview = async (req, res, next) => {
        try {
            const { productId, orderId, rating, content } = req.body;
            const review = await ReviewService.createReview(
                req.user.id,
                { productId, orderId, rating: Number(rating), content },
                req.files || [],
            );

            // ── Thông báo cho seller ──
            try {
                const product = await Product.findById(productId).select('store name').lean();
                if (product?.store) {
                    const store = await Store.findById(product.store).select('owner').lean();
                    if (store?.owner) {
                        await NotificationService.create(global.io, {
                            recipient: store.owner,
                            type: 'new_review',
                            title: 'Đánh giá mới ⭐',
                            body: `Sản phẩm "${product.name}" vừa nhận được đánh giá ${rating} sao`,
                            link: '/seller/reviews',
                            meta: { productId, reviewId: review._id },
                        });
                    }
                }
            } catch (_) {}

            new Created({ message: 'Đánh giá thành công!', metadata: review }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [PUBLIC] GET /api/reviews/product/:productId
    getProductReviews = async (req, res, next) => {
        try {
            const { page, limit } = req.query;
            const data = await ReviewService.getProductReviews(req.params.productId, {
                page: Number(page) || 1,
                limit: Number(limit) || 10,
            });
            new OK({ message: 'Danh sách đánh giá', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] GET /api/reviews/reviewable  — items user can review
    getReviewableItems = async (req, res, next) => {
        try {
            const items = await ReviewService.getReviewableItems(req.user.id);
            new OK({ message: 'Sản phẩm có thể đánh giá', metadata: items }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [PUBLIC] GET /api/reviews/public
    getPublicReviews = async (req, res, next) => {
        try {
            const data = await ReviewService.getPublicReviews();
            new OK({ message: 'Khách hàng nói gì về chúng tôi', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] PUT /api/reviews/:id  (multipart/form-data)
    updateReview = async (req, res, next) => {
        try {
            const { rating, content } = req.body;
            const review = await ReviewService.updateReview(
                req.user.id,
                req.params.id,
                { rating: rating !== undefined ? Number(rating) : undefined, content },
                req.files || [],
            );
            new OK({ message: 'Cập nhật đánh giá thành công!', metadata: review }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] DELETE /api/reviews/:id
    deleteReview = async (req, res, next) => {
        try {
            const result = await ReviewService.deleteReview(req.user.id, req.params.id);
            new OK({ message: result.message, metadata: null }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new ReviewController();

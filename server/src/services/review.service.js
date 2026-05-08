const Review = require('../models/review.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const { uploadMultiple } = require('../config/cloudinaryUpload');

class ReviewService {
    // ─── [USER] Tạo đánh giá ───
    static async createReview(userId, { productId, orderId, rating, content }, files = []) {
        // Kiểm tra đơn hàng tồn tại, thuộc user, đã giao
        const order = await Order.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
        if (order.user.toString() !== userId.toString()) throw new ForbiddenError('Không có quyền đánh giá');
        if (order.orderStatus !== 'received')
            throw new BadRequestError('Chỉ có thể đánh giá sau khi đã xác nhận nhận hàng');

        // Kiểm tra sản phẩm có trong đơn hàng
        const hasProduct = order.items.some((i) => i.product && i.product.toString() === productId);
        if (!hasProduct) throw new BadRequestError('Sản phẩm không có trong đơn hàng này');

        // Kiểm tra đã đánh giá chưa
        const existed = await Review.findOne({ product: productId, user: userId, order: orderId });
        if (existed) throw new BadRequestError('Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi');

        // Upload ảnh lên Cloudinary
        let images = [];
        if (files && files.length > 0) {
            images = await uploadMultiple(files, 'reviews');
        }

        const review = await Review.create({
            product: productId,
            user: userId,
            order: orderId,
            rating,
            content: content || '',
            images,
        });

        // Cập nhật averageRating của Product
        await ReviewService._updateProductRating(productId);

        return review;
    }

    // ─── [PUBLIC] Lấy reviews của sản phẩm ───
    static async getProductReviews(productId, { page = 1, limit = 10 } = {}) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            Review.find({ product: productId })
                .populate('user', 'fullName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments({ product: productId }),
        ]);

        // Tính phân bố sao
        const stats = await Review.aggregate([
            { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(productId) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
        ]);

        const starDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats.forEach((s) => {
            starDist[s._id] = s.count;
        });

        const product = await Product.findById(productId).select('averageRating totalReviews').lean();

        return {
            reviews,
            total,
            page,
            averageRating: product?.averageRating || 0,
            totalReviews: product?.totalReviews || 0,
            starDist,
        };
    }

    // ─── [USER] Lấy đơn hàng đã nhận chưa đánh giá (để hiển thị nút đánh giá) ───
    static async getReviewableItems(userId) {
        const orders = await Order.find({ user: userId, orderStatus: 'received' }).lean();
        if (!orders.length) return [];

        const myReviews = await Review.find({ user: userId }).select('product order').lean();
        const reviewedSet = new Set(myReviews.map((r) => `${r.product}-${r.order}`));

        const result = [];
        for (const order of orders) {
            for (const item of order.items) {
                const key = `${item.product}-${order._id}`;
                if (!reviewedSet.has(key)) {
                    result.push({
                        orderId: order._id,
                        orderCode: order.orderCode,
                        productId: item.product,
                        productName: item.name,
                        productImage: item.image,
                    });
                }
            }
        }
        return result;
    }

    // ─── [USER] Cập nhật đánh giá của chính mình ───
    static async updateReview(userId, reviewId, { rating, content }, files = []) {
        const review = await Review.findById(reviewId);
        if (!review) throw new NotFoundError('Đánh giá không tồn tại');
        if (review.user.toString() !== userId.toString()) throw new ForbiddenError('Không có quyền sửa đánh giá này');

        if (rating !== undefined) review.rating = Number(rating);
        if (content !== undefined) review.content = content;

        // Upload ảnh mới nếu có
        if (files && files.length > 0) {
            const newImages = await uploadMultiple(files, 'reviews');
            review.images = [...(review.images || []), ...newImages];
        }

        await review.save();
        await ReviewService._updateProductRating(review.product);
        return review;
    }

    // ─── [USER] Xóa đánh giá của chính mình ───
    static async deleteReview(userId, reviewId) {
        const review = await Review.findById(reviewId);
        if (!review) throw new NotFoundError('Đánh giá không tồn tại');
        if (review.user.toString() !== userId.toString()) throw new ForbiddenError('Không có quyền xóa');
        await review.deleteOne();
        await ReviewService._updateProductRating(review.product);
        return { message: 'Đã xóa đánh giá' };
    }

    // ─── [PUBLIC] Lấy những đánh giá 5 sao công khai cho trang chủ ───
    static async getPublicReviews() {
        const reviews = await Review.find({ rating: 5 })
            .populate('user', 'fullName avatar')
            .populate('product', 'name slug')
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        return reviews;
    }

    // ─── Cập nhật averageRating trên Product ───
    static async _updateProductRating(productId) {
        const stats = await Review.aggregate([
            { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(productId.toString()) } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        const avg = stats[0]?.avg || 0;
        const count = stats[0]?.count || 0;
        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: count,
        });
    }
}

module.exports = ReviewService;

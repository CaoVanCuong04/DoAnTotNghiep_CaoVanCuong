const Wishlist = require('../models/wishlist.model');
const { BadRequestError } = require('../core/error.response');

class WishlistService {
    // Toggle: thêm nếu chưa có, xóa nếu đã có
    async toggleWishlist(userId, productId) {
        const existing = await Wishlist.findOne({ user: userId, product: productId });

        if (existing) {
            await existing.deleteOne();
            return { wishlisted: false };
        } else {
            await Wishlist.create({ user: userId, product: productId });
            return { wishlisted: true };
        }
    }

    // Lấy danh sách sản phẩm yêu thích của user
    async getWishlist(userId) {
        const items = await Wishlist.find({ user: userId })
            .populate({
                path: 'product',
                select: 'name slug images price originalPrice ratingAverage ratingCount sold store isActive status',
                populate: {
                    path: 'store',
                    select: 'name logo',
                },
            })
            .sort({ createdAt: -1 });

        // Lọc bỏ các sản phẩm đã bị xóa
        const validItems = items.filter((item) => item.product !== null);
        return validItems;
    }

    // Kiểm tra trạng thái wishlist của 1 sản phẩm
    async checkWishlisted(userId, productId) {
        const existing = await Wishlist.findOne({ user: userId, product: productId });
        return { wishlisted: !!existing };
    }

    // Xóa nhiều sản phẩm khỏi wishlist
    async removeFromWishlist(userId, productId) {
        await Wishlist.deleteOne({ user: userId, product: productId });
        return { wishlisted: false };
    }

    // Đếm số sản phẩm yêu thích
    async countWishlist(userId) {
        const count = await Wishlist.countDocuments({ user: userId });
        return { count };
    }
}

module.exports = new WishlistService();

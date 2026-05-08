const { OK } = require('../core/success.response');
const WishlistService = require('../services/wishlist.service');

class WishlistController {
    // POST /api/wishlist/:productId — Toggle yêu thích
    async toggle(req, res) {
        const { id: userId } = req.user;
        const { productId } = req.params;
        const data = await WishlistService.toggleWishlist(userId, productId);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // GET /api/wishlist — Lấy danh sách yêu thích
    async getMyWishlist(req, res) {
        const { id: userId } = req.user;
        const data = await WishlistService.getWishlist(userId);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // GET /api/wishlist/check/:productId — Kiểm tra trạng thái
    async checkStatus(req, res) {
        const { id: userId } = req.user;
        const { productId } = req.params;
        const data = await WishlistService.checkWishlisted(userId, productId);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // DELETE /api/wishlist/:productId — Xóa khỏi wishlist
    async remove(req, res) {
        const { id: userId } = req.user;
        const { productId } = req.params;
        const data = await WishlistService.removeFromWishlist(userId, productId);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // GET /api/wishlist/count — Đếm số sản phẩm yêu thích
    async count(req, res) {
        const { id: userId } = req.user;
        const data = await WishlistService.countWishlist(userId);
        new OK({ message: 'success', metadata: data }).send(res);
    }
}

module.exports = new WishlistController();

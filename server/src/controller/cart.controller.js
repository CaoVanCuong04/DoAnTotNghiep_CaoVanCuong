const { OK } = require('../core/success.response');
const CartService = require('../services/cart.service');

class CartController {
    // Lấy giỏ hàng
    async getCart(req, res) {
        const data = await CartService.getCart(req.user.id);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Thêm sản phẩm vào giỏ
    async addItem(req, res) {
        const { productId, quantity, variantId } = req.body;
        const data = await CartService.addItem(req.user.id, { productId, quantity, variantId });
        new OK({ message: 'Đã thêm vào giỏ hàng', metadata: data }).send(res);
    }

    // Cập nhật số lượng sản phẩm
    async updateItem(req, res) {
        const { productId } = req.params;
        const { quantity, variantId } = req.body;
        const data = await CartService.updateItem(req.user.id, productId, Number(quantity), variantId || null);
        new OK({ message: 'Cập nhật giỏ hàng thành công', metadata: data }).send(res);
    }

    // Xóa 1 sản phẩm khỏi giỏ
    async removeItem(req, res) {
        const { productId } = req.params;
        const variantId = req.query.variantId || null;
        const data = await CartService.removeItem(req.user.id, productId, variantId);
        new OK({ message: 'Đã xóa sản phẩm khỏi giỏ hàng', metadata: data }).send(res);
    }

    // Xóa toàn bộ giỏ hàng
    async clearCart(req, res) {
        const data = await CartService.clearCart(req.user.id);
        new OK({ message: 'Đã xóa toàn bộ giỏ hàng', metadata: data }).send(res);
    }

    // Đồng bộ giỏ hàng (sau khi đăng nhập)
    async syncCart(req, res) {
        const { items } = req.body;
        const data = await CartService.syncCart(req.user.id, items);
        new OK({ message: 'Đồng bộ giỏ hàng thành công', metadata: data }).send(res);
    }

    // Lưu thông tin giao hàng vào giỏ
    async updateShipping(req, res) {
        const { fullName, phoneNumber, address, wardCode, districtId } = req.body;
        const data = await CartService.updateShipping(req.user.id, {
            fullName,
            phoneNumber,
            address,
            wardCode,
            districtId,
        });
        new OK({ message: 'Đã lưu thông tin giao hàng', metadata: data }).send(res);
    }
}

module.exports = new CartController();

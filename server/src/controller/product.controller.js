const { BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');
const ProductService = require('../services/product.service');

class ProductController {
    // Tạo sản phẩm
    async createProduct(req, res) {
        const data = await ProductService.createProduct(req.body, req.files);
        new Created({ message: 'Tạo sản phẩm thành công', metadata: data }).send(res);
    }

    // Lấy danh sách sản phẩm (public)
    async getAllProducts(req, res) {
        const data = await ProductService.getAllProducts(req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Lấy tất cả sản phẩm (admin)
    async getAllProductsAdmin(req, res) {
        const data = await ProductService.getAllProductsAdmin(req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Lấy sản phẩm theo ID
    async getProductById(req, res) {
        const { id } = req.params;
        const data = await ProductService.getProductById(id);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Lấy sản phẩm theo slug
    async getProductBySlug(req, res) {
        const { slug } = req.params;
        const data = await ProductService.getProductBySlug(slug);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Cập nhật sản phẩm
    async updateProduct(req, res) {
        const { id } = req.params;
        const data = await ProductService.updateProduct(id, req.body, req.files);
        new OK({ message: 'Cập nhật sản phẩm thành công', metadata: data }).send(res);
    }

    // Xóa sản phẩm
    async deleteProduct(req, res) {
        const { id } = req.params;
        const data = await ProductService.deleteProduct(id);
        new OK({ message: 'Xóa sản phẩm thành công', metadata: data }).send(res);
    }

    // Bật / tắt sản phẩm
    async toggleProduct(req, res) {
        const { id } = req.params;
        const data = await ProductService.toggleProduct(id);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Lấy sản phẩm theo slug danh mục
    async getProductsByCategory(req, res) {
        const { slug } = req.params;
        const data = await ProductService.getProductsByCategory(slug, req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }
}

module.exports = new ProductController();

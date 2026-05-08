const { BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');
const CategoryService = require('../services/category.service');

class CategoryController {
    // Tạo danh mục
    async createCategory(req, res) {
        const { name, parent, icon, description, order } = req.body;
        if (!name) {
            throw new BadRequestError('Vui lòng nhập tên danh mục');
        }
        const data = await CategoryService.createCategory({ name, parent, icon, description, order });
        new Created({ message: 'Tạo danh mục thành công', metadata: data }).send(res);
    }

    // Lấy tất cả danh mục (dạng cây)
    async getAllCategories(req, res) {
        const data = await CategoryService.getAllCategories();
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Lấy tất cả danh mục (flat - admin)
    async getAllCategoriesFlat(req, res) {
        const data = await CategoryService.getAllCategoriesFlat();
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Lấy danh mục theo ID
    async getCategoryById(req, res) {
        const { id } = req.params;
        const data = await CategoryService.getCategoryById(id);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Lấy danh mục theo slug
    async getCategoryBySlug(req, res) {
        const { slug } = req.params;
        const data = await CategoryService.getCategoryBySlug(slug);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    // Cập nhật danh mục
    async updateCategory(req, res) {
        const { id } = req.params;
        const data = await CategoryService.updateCategory(id, req.body);
        new OK({ message: 'Cập nhật danh mục thành công', metadata: data }).send(res);
    }

    // Xóa danh mục
    async deleteCategory(req, res) {
        const { id } = req.params;
        const data = await CategoryService.deleteCategory(id);
        new OK({ message: 'Xóa danh mục thành công', metadata: data }).send(res);
    }

    // Bật / tắt danh mục
    async toggleCategory(req, res) {
        const { id } = req.params;
        const data = await CategoryService.toggleCategory(id);
        new OK({ message: 'success', metadata: data }).send(res);
    }
}

module.exports = new CategoryController();

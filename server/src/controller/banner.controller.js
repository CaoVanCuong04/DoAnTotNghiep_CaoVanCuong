const BannerService = require('../services/banner.service');
const { OK, Created } = require('../core/success.response');
const { uploadSingle } = require('../config/cloudinaryUpload');

class BannerController {
    async createBanner(req, res) {
        // Nếu có ảnh upload thì lên cloudinary trước
        if (req.file) {
            req.body.imageUrl = await uploadSingle(req.file, 'banners');
        }
        const data = await BannerService.createBanner(req.body);
        new Created({ message: 'Tạo banner thành công', metadata: data }).send(res);
    }

    async getAllBanners(req, res) {
        const { page, limit, position, isActive } = req.query;
        const data = await BannerService.getAllBanners({ page, limit, position, isActive });
        new OK({ message: 'Lấy danh sách banner thành công', metadata: data }).send(res);
    }

    async getActiveBanners(req, res) {
        const { position } = req.query;
        const data = await BannerService.getActiveBanners(position);
        new OK({ message: 'Lấy banner hoạt động thành công', metadata: data }).send(res);
    }

    async updateBanner(req, res) {
        const { id } = req.params;
        // Nếu có ảnh mới thì upload lên cloudinary
        if (req.file) {
            req.body.imageUrl = await uploadSingle(req.file, 'banners');
        }
        const data = await BannerService.updateBanner(id, req.body);
        new OK({ message: 'Cập nhật banner thành công', metadata: data }).send(res);
    }

    async deleteBanner(req, res) {
        const { id } = req.params;
        const data = await BannerService.deleteBanner(id);
        new OK({ message: 'Xóa banner thành công', metadata: data }).send(res);
    }

    async toggleBanner(req, res) {
        const { id } = req.params;
        const data = await BannerService.toggleBanner(id);
        new OK({ message: 'Cập nhật trạng thái banner thành công', metadata: data }).send(res);
    }
}

module.exports = new BannerController();

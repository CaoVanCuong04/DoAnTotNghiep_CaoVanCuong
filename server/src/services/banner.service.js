const Banner = require('../models/banner.model');
const { NotFoundError } = require('../core/error.response');

class BannerService {
    static async createBanner(data) {
        const banner = await Banner.create(data);
        return banner;
    }

    static async getAllBanners({ page = 1, limit = 20, position, isActive } = {}) {
        const query = {};
        if (position) query.position = position;
        if (isActive !== undefined) query.isActive = isActive === 'true' || isActive === true;

        const skip = (page - 1) * limit;
        const banners = await Banner.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
        const total = await Banner.countDocuments(query);

        return {
            banners,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
        };
    }

    static async getActiveBanners(position = 'home_main') {
        const banners = await Banner.find({ isActive: true, position }).sort({ createdAt: -1 }).lean();
        return banners;
    }

    static async updateBanner(id, data) {
        const banner = await Banner.findByIdAndUpdate(id, data, { new: true });
        if (!banner) throw new NotFoundError('Banner không tồn tại!');
        return banner;
    }

    static async deleteBanner(id) {
        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) throw new NotFoundError('Banner không tồn tại!');
        return banner;
    }

    static async toggleBanner(id) {
        const banner = await Banner.findById(id);
        if (!banner) throw new NotFoundError('Banner không tồn tại!');
        banner.isActive = !banner.isActive;
        await banner.save();
        return banner;
    }
}

module.exports = BannerService;

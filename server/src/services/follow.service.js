const StoreFollow = require('../models/storeFollow.model');
const Store = require('../models/store.model');
const NotificationService = require('./notification.service');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class FollowService {
    // [USER] Toggle follow/unfollow a store
    static async toggleFollow(userId, storeId) {
        const store = await Store.findById(storeId);
        if (!store) throw new NotFoundError('Cửa hàng không tồn tại');

        const existing = await StoreFollow.findOne({ user: userId, store: storeId });

        if (existing) {
            // Unfollow
            await existing.deleteOne();
            await Store.findByIdAndUpdate(storeId, { $inc: { totalFollowers: -1 } });
            return { followed: false, totalFollowers: Math.max(0, store.totalFollowers - 1) };
        } else {
            // Follow
            await StoreFollow.create({ user: userId, store: storeId });
            const updated = await Store.findByIdAndUpdate(storeId, { $inc: { totalFollowers: 1 } }, { new: true });

            // Notify the store owner
            const io = global.io;
            await NotificationService.create(io, {
                recipient: store.owner,
                type: 'order_status',
                title: 'Có người theo dõi shop của bạn 💜',
                body: `Bạn có thêm 1 người theo dõi! Hiện có ${updated.totalFollowers} người theo dõi shop.`,
                link: '/seller/dashboard',
                meta: { storeId },
            });

            return { followed: true, totalFollowers: updated.totalFollowers };
        }
    }

    // [USER] Check if user follows a store
    static async checkFollow(userId, storeId) {
        const existing = await StoreFollow.findOne({ user: userId, store: storeId });
        return { followed: !!existing };
    }

    // [USER] Get list of stores the user follows
    static async getFollowedStores(userId) {
        const follows = await StoreFollow.find({ user: userId })
            .populate('store', 'name slug logo totalProducts totalFollowers rating')
            .sort({ createdAt: -1 })
            .lean();
        return follows.map((f) => f.store).filter(Boolean);
    }
}

module.exports = FollowService;

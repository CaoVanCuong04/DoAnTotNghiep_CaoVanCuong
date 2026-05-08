const { OK } = require('../core/success.response');
const FollowService = require('../services/follow.service');

class FollowController {
    // [USER] POST /api/stores/:storeId/follow — toggle
    toggle = async (req, res, next) => {
        try {
            const result = await FollowService.toggleFollow(req.user.id, req.params.storeId);
            new OK({
                message: result.followed ? 'Đã theo dõi cửa hàng' : 'Đã bỏ theo dõi cửa hàng',
                metadata: result,
            }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] GET /api/stores/:storeId/follow — check status
    check = async (req, res, next) => {
        try {
            const result = await FollowService.checkFollow(req.user.id, req.params.storeId);
            new OK({ message: 'Trạng thái theo dõi', metadata: result }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] GET /api/stores/following — list all followed stores
    list = async (req, res, next) => {
        try {
            const stores = await FollowService.getFollowedStores(req.user.id);
            new OK({ message: 'Danh sách cửa hàng đang theo dõi', metadata: stores }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new FollowController();

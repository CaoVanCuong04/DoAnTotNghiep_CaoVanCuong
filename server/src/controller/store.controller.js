const { OK, Created } = require('../core/success.response');
const StoreService = require('../services/store.service');
const Store = require('../models/store.model');
const multer = require('multer');
const NotificationService = require('../services/notification.service');

class StoreController {
    // [USER] POST /api/stores/register
    register = async (req, res, next) => {
        try {
            const store = await StoreService.registerStore(req.user.id, req.body, req.files || {});
            new Created({ message: 'Đăng ký gian hàng thành công! Đang chờ Admin duyệt.', metadata: store }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [USER] GET /api/stores/my-status
    getMyStoreStatus = async (req, res, next) => {
        try {
            const store = await Store.findOne({ owner: req.user.id }).select('status name').lean();
            new OK({
                message: 'Trạng thái gian hàng',
                metadata: store ? { status: store.status, name: store.name } : null,
            }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [SELLER] GET /api/stores/me
    getMyStore = async (req, res, next) => {
        try {
            const store = await StoreService.getMyStore(req.user.id);
            new OK({ message: 'Thông tin gian hàng', metadata: store }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [SELLER] PUT /api/stores/me
    updateMyStore = async (req, res, next) => {
        try {
            const store = await StoreService.updateMyStore(req.user.id, req.body, req.files || {});
            new OK({ message: 'Đã cập nhật gian hàng', metadata: store }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [PUBLIC] GET /api/stores/:slug
    getBySlug = async (req, res, next) => {
        try {
            const store = await StoreService.getStoreBySlug(req.params.slug);
            new OK({ message: 'Thông tin gian hàng', metadata: store }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [PUBLIC] GET /api/stores/:slug/products
    getStoreProducts = async (req, res, next) => {
        try {
            const data = await StoreService.getStoreProducts(req.params.slug, req.query);
            new OK({ message: 'Sản phẩm gian hàng', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] GET /api/admin/stores
    getAllStores = async (req, res, next) => {
        try {
            const data = await StoreService.getAllStores(req.query);
            new OK({ message: 'Danh sách gian hàng', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] PUT /api/admin/stores/:id/status
    updateStatus = async (req, res, next) => {
        try {
            const { status } = req.body;
            const store = await StoreService.updateStoreStatus(req.params.id, status);

            // ── Thông báo cho seller khi shop được duyệt hoặc bị từ chối ──
            const io = req.app.get('io') || global.io;
            const notificationPayload = status === 'active'
                ? {
                    recipient: store.owner,
                    type: 'store_approved',
                    title: 'Shop được duyệt 🎉',
                    body: `Gian hàng "${store.name}" đã được Admin duyệt! Bạn có thể bắt đầu bán hàng ngay.`,
                    link: '/seller/dashboard',
                    meta: { storeId: store._id, status },
                }
                : {
                    recipient: store.owner,
                    type: 'store_banned',
                    title: 'Shop bị khóa ❌',
                    body: `Gian hàng "${store.name}" đã bị Admin khóa. Vui lòng liên hệ hỗ trợ.`,
                    link: '/seller/dashboard',
                    meta: { storeId: store._id, status },
                };

            await NotificationService.create(io, notificationPayload);

            new OK({ message: `Đã cập nhật trạng thái gian hàng: ${status}`, metadata: store }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new StoreController();

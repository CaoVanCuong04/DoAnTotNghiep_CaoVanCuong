const { OK } = require('../core/success.response');
const NotificationService = require('../services/notification.service');

class NotificationController {
    // GET /api/notifications
    getNotifications = async (req, res, next) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const data = await NotificationService.getByUser(req.user.id, {
                page: Number(page),
                limit: Number(limit),
            });
            new OK({ message: 'Danh sách thông báo', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/notifications/unread-count
    getUnreadCount = async (req, res, next) => {
        try {
            const count = await NotificationService.getUnreadCount(req.user.id);
            new OK({ message: 'Số thông báo chưa đọc', metadata: { count } }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // PATCH /api/notifications/:id/read
    markAsRead = async (req, res, next) => {
        try {
            const notification = await NotificationService.markAsRead(req.user.id, req.params.id);
            new OK({ message: 'Đã đánh dấu thông báo đã đọc', metadata: notification }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // PATCH /api/notifications/read-all
    markAllAsRead = async (req, res, next) => {
        try {
            await NotificationService.markAllAsRead(req.user.id);
            new OK({ message: 'Đã đánh dấu tất cả thông báo đã đọc' }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new NotificationController();

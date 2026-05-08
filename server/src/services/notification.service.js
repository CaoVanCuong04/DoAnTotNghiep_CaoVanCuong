const Notification = require('../models/notification.model');

class NotificationService {
    /**
     * Tạo thông báo mới, lưu DB và emit socket realtime
     * @param {import('socket.io').Server} io
     * @param {{ recipient: string, type: string, title: string, body: string, link?: string, meta?: object }} payload
     */
    static async create(io, { recipient, type, title, body, link = '/', meta = {} }) {
        try {
            const notification = await Notification.create({ recipient, type, title, body, link, meta });

            // Emit realtime tới room cá nhân của người nhận
            if (io) {
                const recipientId = recipient._id ? recipient._id.toString() : recipient.toString();
                const roomName = `user:${String(recipientId).trim()}`;
                io.to(roomName).emit('new_notification', {
                    _id: notification._id,
                    type,
                    title,
                    body,
                    link,
                    meta,
                    isRead: false,
                    createdAt: notification.createdAt,
                });
            }

            return notification;
        } catch (err) {
            console.error('[NotificationService] create error:', err.message);
        }
    }

    /**
     * Lấy danh sách thông báo của user (phân trang)
     */
    static async getByUser(userId, { page = 1, limit = 20 } = {}) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            Notification.find({ recipient: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Notification.countDocuments({ recipient: userId }),
        ]);
        return { notifications, total, page, limit };
    }

    /**
     * Số thông báo chưa đọc
     */
    static async getUnreadCount(userId) {
        return Notification.countDocuments({ recipient: userId, isRead: false });
    }

    /**
     * Đánh dấu 1 thông báo đã đọc
     */
    static async markAsRead(userId, notificationId) {
        return Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true },
            { new: true },
        );
    }

    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    static async markAllAsRead(userId) {
        return Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    }
}

module.exports = NotificationService;

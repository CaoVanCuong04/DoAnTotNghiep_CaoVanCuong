const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: ['new_order', 'order_status', 'new_review', 'store_approved', 'store_banned', 'new_message'],
            required: true,
        },
        title: { type: String, required: true },
        body: { type: String, required: true },
        link: { type: String, default: '/' },
        isRead: { type: Boolean, default: false },
        // Optional: metadata để render thêm thông tin (ảnh, orderId...)
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true },
);

// TTL: tự xóa thông báo sau 60 ngày
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });

module.exports = mongoose.model('Notification', notificationSchema);

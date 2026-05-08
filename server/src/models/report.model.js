const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        // Người gửi báo cáo
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        reporterRole: {
            type: String,
            enum: ['customer', 'seller'],
            required: true,
        },

        // Loại báo cáo
        type: {
            type: String,
            enum: ['customer_report_shop', 'shop_report_customer', 'order_dispute'],
            required: true,
        },

        // Đối tượng bị báo cáo
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: null,
        },
        targetStore: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            default: null,
        },
        targetOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },

        // Nội dung báo cáo
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        evidence: [{ type: String }], // URLs ảnh bằng chứng

        // Trạng thái xử lý
        status: {
            type: String,
            enum: ['pending', 'reviewing', 'resolved', 'rejected'],
            default: 'pending',
        },

        // Kết quả xử lý của Admin
        resolution: {
            type: String,
            enum: ['favor_reporter', 'favor_target', 'no_action', null],
            default: null,
        },
        adminNote: {
            type: String,
            default: '',
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: null,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Report', reportSchema);

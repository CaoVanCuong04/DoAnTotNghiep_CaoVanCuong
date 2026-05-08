const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            default: null, // null = Voucher Của Sàn (Tất cả shop áp dụng được), có giá trị = Voucher của Shop
        },

        description: { type: String, default: '' },

        discountType: {
            type: String,
            enum: ['percent', 'fixed'],
            required: true,
        },

        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },

        // Giới hạn giảm tối đa (chỉ áp dụng với percent)
        maxDiscount: {
            type: Number,
            default: null,
        },

        // Giá trị đơn hàng tối thiểu để áp dụng
        minOrderAmount: {
            type: Number,
            default: 0,
        },

        // Hạn sử dụng
        expiresAt: {
            type: Date,
            default: null,
        },

        // Giới hạn số lần dùng (null = không giới hạn)
        usageLimit: {
            type: Number,
            default: null,
        },

        usedCount: {
            type: Number,
            default: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Coupon', couponSchema);

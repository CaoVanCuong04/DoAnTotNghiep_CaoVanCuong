const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        content: {
            type: String,
            default: '',
            maxlength: 1000,
        },

        images: [{ type: String }],

        // Phản hồi của người bán
        reply: {
            content: { type: String, default: null },
            repliedAt: { type: Date, default: null },
        },
    },
    { timestamps: true },
);

// 1 user chỉ review 1 sản phẩm 1 lần / 1 đơn hàng
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

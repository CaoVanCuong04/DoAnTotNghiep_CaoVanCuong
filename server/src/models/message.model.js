const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },

        // Loại tin nhắn
        type: {
            type: String,
            enum: ['text', 'product_link', 'image'],
            default: 'text',
        },

        content: {
            type: String,
            default: '',
        },

        // Khi type = product_link, lưu thêm thông tin sản phẩm
        product: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: String,
            image: String,
            price: Number,
            slug: String,
        },

        // Những ai đã đọc tin nhắn này
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
            },
        ],
    },
    { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

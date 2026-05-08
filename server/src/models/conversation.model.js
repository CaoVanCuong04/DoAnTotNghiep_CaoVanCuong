const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        // Hai người tham gia: buyer + seller (owner của store)
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
            },
        ],

        // Sản phẩm gắn kèm cuộc trò chuyện (optional)
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            default: null,
        },

        // Cache tin nhắn cuối cùng
        lastMessage: {
            type: String,
            default: '',
        },

        lastMessageAt: {
            type: Date,
            default: Date.now,
        },

        lastSender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: null,
        },

        // Đếm tin nhắn chưa đọc cho mỗi participant
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    { timestamps: true },
);

// Index để tìm conversation giữa 2 người nhanh hơn
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

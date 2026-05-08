const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const aiCopilotHistorySchema = new mongoose.Schema(
    {
        // Nếu user đã đăng nhập → lưu userId
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // Nếu chưa đăng nhập → lưu sessionId từ client (localStorage)
        sessionId: {
            type: String,
            default: null,
        },
        messages: {
            type: [messageSchema],
            default: [],
        },
        // Thống kê ngắn về sở thích người dùng (được AI tóm tắt định kỳ)
        userProfile: {
            interests: [String],       // VD: ["điện thoại", "laptop gaming"]
            budgetRange: String,       // VD: "5-15 triệu"
            preferredBrands: [String], // VD: ["Apple", "Samsung"]
            summary: String,           // Tóm tắt ngắn về người dùng
        },
    },
    { timestamps: true }
);

// Index để tìm nhanh
aiCopilotHistorySchema.index({ user: 1 });
aiCopilotHistorySchema.index({ sessionId: 1 });

module.exports = mongoose.model('AICopilotHistory', aiCopilotHistorySchema);

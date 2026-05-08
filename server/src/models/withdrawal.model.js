const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 10000,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'rejected'],
            default: 'pending',
        },
        note: {
            type: String,
            default: '',
        },
        // Thông tin tài khoản ngân hàng lúc rút
        bankName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        accountName: { type: String, required: true },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);

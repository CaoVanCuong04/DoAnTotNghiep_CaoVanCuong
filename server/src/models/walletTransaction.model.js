const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },

        type: {
            type: String,
            enum: ['credit', 'debit', 'withdrawal', 'deposit'],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        balanceAfter: {
            type: Number,
            default: 0,
        },

        description: {
            type: String,
            default: '',
        },

        // Reference context
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },

        orderCode: {
            type: String,
            default: '',
        },

        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'completed',
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user', // Buyer
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store', // Seller. Null indicates Admin-owned product
            default: null,
        },
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
        images: [{ type: String }], // Cloudinary URLs

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        sellerNote: {
            type: String,
            default: '',
        },

        refundAmount: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);

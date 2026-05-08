const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },

        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

        logo: { type: String, default: '' },
        banner: { type: String, default: '' },
        description: { type: String, default: '' },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            unique: true, // 1 seller = 1 store
        },

        status: {
            type: String,
            enum: ['pending', 'active', 'banned'],
            default: 'pending',
        },

        rating: { type: Number, default: 0 },
        totalProducts: { type: Number, default: 0 },
        totalFollowers: { type: Number, default: 0 },
        totalSales: { type: Number, default: 0 },

        commissionRate: { type: Number, default: 5 }, // percentage

        // Contact info visible on shop page
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Store', storeSchema);

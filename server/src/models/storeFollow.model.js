const mongoose = require('mongoose');

const storeFollowSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
    },
    { timestamps: true },
);

// Ensure one user can only follow a store once
storeFollowSchema.index({ user: 1, store: 1 }, { unique: true });

module.exports = mongoose.model('StoreFollow', storeFollowSchema);

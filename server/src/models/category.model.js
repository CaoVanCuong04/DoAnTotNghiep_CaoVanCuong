const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
        },

        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
            index: true,
        },

        icon: {
            type: String,
            default: 'folder',
        },

        description: {
            type: String,
            default: '',
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        order: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true },
);

categorySchema.index({ name: 'text', slug: 'text', description: 'text' });
categorySchema.virtual('hasChildren', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent',
    justOne: false,
});
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);

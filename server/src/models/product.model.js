const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
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

        description: {
            type: String,
            default: '',
        },

        shortDescription: {
            type: String,
            default: '',
        },

        brand: {
            type: String,
            default: '',
            index: true,
        },

        brandSlug: {
            type: String,
            default: '',
            index: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true,
        },

        categoryPath: {
            type: [String],
            default: [],
            index: true,
        },

        searchKeywords: {
            type: [String],
            default: [],
            index: true,
        },

        images: [
            {
                type: String,
            },
        ],

        price: {
            type: Number,
            required: true,
        },

        originalPrice: {
            type: Number,
            default: 0,
        },

        stock: {
            type: Number,
            default: 0,
        },

        sold: {
            type: Number,
            default: 0,
        },

        ratingAverage: {
            type: Number,
            default: 0,
        },

        ratingCount: {
            type: Number,
            default: 0,
        },

        isFeatured: {
            type: Boolean,
            default: false,
        },

        isFlashSale: {
            type: Boolean,
            default: false,
        },

        flashSalePrice: {
            type: Number,
            default: 0,
        },

        flashSaleEndTime: {
            type: Date,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        // Multi-vendor fields
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            default: null, // null = admin-owned (legacy)
        },

        status: {
            type: String,
            enum: ['active', 'pending', 'rejected'],
            default: 'active', // existing products stay active; seller products default to pending
        },

        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },

        // ── Biến thể sản phẩm (Product Variants) ──
        variants: [
            {
                name: { type: String, required: true }, // Tên nhóm: "Màu sắc", "Kích thước"
                options: [
                    {
                        label: { type: String, required: true }, // "Đỏ", "XL", "256GB"
                        price: { type: Number, required: true }, // Giá riêng
                        stock: { type: Number, default: 0 }, // Tồn kho riêng
                        image: { type: String, default: '' }, // Ảnh riêng (optional)
                        sku: { type: String, default: '' }, // Mã SKU (optional)
                    },
                ],
            },
        ],

        attributes: [
            {
                name: String,
                value: String,
            },
        ],

        // ── Kích thước / khối lượng (dùng để tính phí ship GHN) ──
        weight: { type: Number, default: 500 }, // gram
        length: { type: Number, default: 15 }, // cm
        width: { type: Number, default: 15 }, // cm
        height: { type: Number, default: 10 }, // cm
    },
    {
        timestamps: true,
    },
);

productSchema.index({ name: 'text', slug: 'text', brand: 'text', shortDescription: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1, isFlashSale: 1, isFeatured: 1 });

module.exports = mongoose.model('Product', productSchema);

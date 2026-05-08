const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
        name: String,
        image: String,
        price: Number,
        variantId: { type: String, default: null },
        variantLabel: { type: String, default: null },
        quantity: { type: Number, min: 1 },
        // Commission fields (set at order creation time)
        commissionRate: { type: Number, default: 0 },
        commissionAmount: { type: Number, default: 0 },
        sellerRevenue: { type: Number, default: 0 },
        // Seller manages this item's fulfillment status
        itemStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'shipping', 'delivered', 'received', 'return_requested', 'returned', 'cancelled'],
            default: 'pending',
        },
    },
    { _id: true },
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },

        orderCode: {
            type: String,
            unique: true,
        },

        ghnOrderCode: {
            type: String,
            default: null,
        },

        items: [orderItemSchema],

        shippingInfo: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            address: { type: String, required: true },
            wardCode: { type: String },
            districtId: { type: Number },
        },

        paymentMethod: {
            type: String,
            enum: ['cod', 'momo', 'vnpay'],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },

        orderStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'shipping', 'delivered', 'received', 'return_requested', 'returned', 'cancelled'],
            default: 'pending',
        },

        deliveredAt: {
            type: Date,
            default: null,
        },

        shippingFee: {
            type: Number,
            default: 0,
        },

        totalPrice: {
            type: Number,
            default: 0,
        },

        finalPrice: {
            type: Number,
            default: 0,
        },

        shopDiscountAmount: {
            type: Number,
            default: 0,
        },

        shopVoucherCode: {
            type: String,
            default: null,
        },

        systemDiscountAmount: {
            type: Number,
            default: 0,
        },

        systemVoucherCode: {
            type: String,
            default: null,
        },

        // Dùng cho MoMo / VNPay
        paymentRef: String,
        paymentUrl: String,

        note: String,
    },
    { timestamps: true },
);

// Tạo orderCode tự động trước khi save
orderSchema.pre('save', function (next) {
    if (!this.orderCode) {
        const ts = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderCode = `ORD-${ts}-${rand}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // 1 user chỉ có 1 cart
        },

        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },

                variantId: {
                    type: String,
                    default: null,
                },

                variantLabel: {
                    type: String, // VD: "Màu sắc: Đỏ", "Kích thước: XL"
                    default: null,
                },

                name: String, // snapshot tên lúc thêm vào

                image: String, // snapshot ảnh

                price: Number, // snapshot giá

                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },

                stock: Number, // snapshot tồn kho (optional)
            },
        ],

        fullName: String,

        phoneNumber: String,

        address: String,
        wardCode: String,
        districtId: Number,

        totalPrice: {
            type: Number,
            default: 0,
        },

        totalQuantity: {
            type: Number,
            default: 0,
        },

        // Mã giảm giá đang áp dụng
        shopVoucherCode: { type: String, default: null },
        shopDiscount: { type: Number, default: 0 },

        systemVoucherCode: { type: String, default: null },
        systemDiscount: { type: Number, default: 0 },

        finalPrice: { type: Number, default: 0 }, // totalPrice - shopDiscount - systemDiscount
    },
    { timestamps: true },
);

module.exports = mongoose.model('Cart', cartSchema);

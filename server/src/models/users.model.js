const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelUser = new Schema(
    {
        fullName: { type: String, require: true },
        email: { type: String, require: true },
        password: { type: String, require: true },
        role: { type: String, enum: ['admin', 'seller', 'customer'], default: 'customer' },
        isAdmin: { type: Boolean, default: false }, // kept for backward compat
        address: { type: String, require: false, default: '' },
        phone: { type: String, require: false, default: '' },
        birthDay: { type: Date, require: false, default: null },
        typeLogin: { type: String, enum: ['email', 'google'] },
        avatar: { type: String, require: false, default: '' },
        isActive: { type: Boolean, default: true },
        balance: { type: Number, default: 0 },
        addresses: [
            {
                fullName: String,
                phone: String,
                province: String, // tên tỉnh/thành
                district: String, // tên quận/huyện
                ward: String, // tên phường/xã
                detail: String, // số nhà, tên đường
                provinceId: { type: Number, default: null },
                districtId: { type: Number, default: null },
                wardCode: { type: String, default: null },
                isDefault: { type: Boolean, default: false },
            },
        ],
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('user', modelUser);

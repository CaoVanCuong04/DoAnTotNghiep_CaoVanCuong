const mongoose = require('mongoose');
const slugify = require('slugify');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Product = require('../models/product.model');
const Category = require('../models/category.model');
const User = require('../models/users.model');
const Store = require('../models/store.model');

const makeSlug = (name) => slugify(name, { lower: true, strict: true, locale: 'vi' });
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const roundPrice = (n) => Math.round(n / 1000) * 1000;

async function seed() {
    try {
        await mongoose.connect(process.env.CONNECT_DB || 'mongodb://localhost:27017/tmdt2');
        console.log('✅ MongoDB connected');

        const hashedPassword = await bcrypt.hash('123456', 12);
        
        // Lấy danh mục để gắn cho sản phẩm
        const categories = await Category.find({ isActive: true }).lean();
        if (!categories.length) {
            console.log('⚠️  Chưa có danh mục nào trong Database. Vui lòng tạo danh mục trước.');
            process.exit(1);
        }

        const STORES_TO_CREATE = 3;
        const PRODUCTS_PER_STORE = 5;

        for (let i = 1; i <= STORES_TO_CREATE; i++) {
            const storeName = `Shop Của Tôi ${i}`;
            const sellerEmail = `seller${i}@gmail.com`;

            // 1. Tạo User (Seller)
            let seller = await User.findOne({ email: sellerEmail });
            if (!seller) {
                seller = await User.create({
                    fullName: `Chủ Shop ${i}`,
                    email: sellerEmail,
                    password: hashedPassword,
                    role: 'seller',
                    typeLogin: 'email',
                    isActive: true,
                });
                console.log(`👤 Tạo Seller: ${sellerEmail} | Pass: 123456`);
            } else {
                await User.updateOne({ _id: seller._id }, { role: 'seller', password: hashedPassword });
                console.log(`👤 Đã có Seller: ${sellerEmail} (Reset pass: 123456)`);
            }

            // 2. Tạo Store
            let store = await Store.findOne({ owner: seller._id });
            if (!store) {
                store = await Store.create({
                    name: storeName,
                    slug: makeSlug(storeName) + `-${rand(100, 999)}`,
                    description: `Đây là cửa hàng số ${i} chuyên bán đa dạng các loại mặt hàng.`,
                    owner: seller._id,
                    status: 'active',
                    phone: `09${rand(10000000, 99999999)}`,
                    address: `12${i} Đường ABC, Quận XYZ`,
                    totalProducts: PRODUCTS_PER_STORE,
                });
                console.log(`🏪 Tạo Store: ${store.name}`);
            } else {
                console.log(`🏪 Đã có Store: ${store.name}`);
            }

            // 3. Tạo Products (KHÔNG ẢNH)
            const productDocs = [];
            for (let j = 1; j <= PRODUCTS_PER_STORE; j++) {
                const productName = `Sản phẩm mẫu ${i}.${j} (Không hình ảnh)`;
                const price = roundPrice(rand(50000, 500000));
                
                // Chọn random 1 category
                const cat = categories[rand(0, categories.length - 1)];

                productDocs.push({
                    name: productName,
                    slug: makeSlug(productName) + `-${rand(1000, 9999)}`,
                    description: `Mô tả chi tiết cho sản phẩm ${productName}...`,
                    shortDescription: `Mô tả ngắn ${productName}`,
                    brand: 'OEM',
                    category: cat._id,
                    store: store._id,
                    images: [], // Quan trọng: KHÔNG ẢNH theo yêu cầu
                    price: price,
                    originalPrice: price * 1.2,
                    stock: rand(10, 100),
                    sold: rand(0, 50),
                    isActive: true,
                    status: 'active',
                });
            }

            await Product.insertMany(productDocs);
            console.log(`📦 Đã thêm ${PRODUCTS_PER_STORE} sản phẩm cho ${store.name}`);
            console.log('-----------------------------------');
        }

        console.log('🎉 Tool đã chạy xong!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    }
}

seed();

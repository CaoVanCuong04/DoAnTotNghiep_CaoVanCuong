/**
 * Tool: Seed 40 sản phẩm cho 1 cửa hàng Seller
 * ────────────────────────────────────────────
 * 1. Xóa TẤT CẢ sản phẩm cũ (admin + seller)
 * 2. Tìm hoặc tạo 1 seller user + 1 store (status: active)
 * 3. Tạo 40 sản phẩm thuộc store đó, trải đều nhiều danh mục
 *
 * Chạy: node src/seeds/seedSellerProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const bcrypt = require('bcrypt');

const Product = require('../models/product.model');
const Category = require('../models/category.model');
const User = require('../models/users.model');
const Store = require('../models/store.model');

const makeSlug = (name) => slugify(name, { lower: true, strict: true, locale: 'vi' });
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const roundPrice = (n) => Math.round(n / 1000) * 1000;

// ─── Product Images (Cloudinary) ───────────────────────────────────────────
const IMAGES = [
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1772530569/13_x7zcba.jpg',
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1772530569/12_uxnych.jpg',
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1772530569/14_e8jwad.jpg',
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1742484488/products/iphone15pro.jpg',
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1742484488/products/samsung_s24.jpg',
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1742484488/products/laptop_dell.jpg',
];
const getImages = () => {
    const count = rand(1, 3);
    return [...IMAGES].sort(() => Math.random() - 0.5).slice(0, count);
};

// ─── 40 real-named products across multiple categories ─────────────────────
const PRODUCTS_DATA = [
    // Điện thoại
    { name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên', brand: 'Apple', priceMin: 28990000, priceMax: 33990000, catKeyword: 'iPhone' },
    { name: 'iPhone 15 Pro 128GB Titan Xanh', brand: 'Apple', priceMin: 24990000, priceMax: 29990000, catKeyword: 'iPhone' },
    { name: 'iPhone 14 128GB Đêm Khuya', brand: 'Apple', priceMin: 16990000, priceMax: 20990000, catKeyword: 'iPhone' },
    { name: 'Samsung Galaxy S24 Ultra 256GB Titanium Gray', brand: 'Samsung', priceMin: 25990000, priceMax: 31990000, catKeyword: 'Samsung' },
    { name: 'Samsung Galaxy S24+ 256GB Cobalt Violet', brand: 'Samsung', priceMin: 18990000, priceMax: 23990000, catKeyword: 'Samsung' },
    { name: 'Samsung Galaxy Z Fold5 256GB Kem', brand: 'Samsung', priceMin: 29990000, priceMax: 35990000, catKeyword: 'Samsung' },
    { name: 'Xiaomi 14 Ultra 512GB Đen', brand: 'Xiaomi', priceMin: 19990000, priceMax: 24990000, catKeyword: 'Xiaomi' },
    { name: 'OPPO Find X7 Ultra 256GB Biển Xanh', brand: 'OPPO', priceMin: 18990000, priceMax: 22990000, catKeyword: 'OPPO' },

    // Laptop
    { name: 'MacBook Pro 14 M3 Pro 18GB 512GB Bạc', brand: 'Apple', priceMin: 42990000, priceMax: 52990000, catKeyword: 'MacBook' },
    { name: 'MacBook Air 15 M2 8GB 256GB Xám', brand: 'Apple', priceMin: 28990000, priceMax: 34990000, catKeyword: 'MacBook' },
    { name: 'Dell XPS 15 i7 13th RTX 4060 32GB 1TB', brand: 'Dell', priceMin: 36990000, priceMax: 44990000, catKeyword: 'Laptop Dell' },
    { name: 'Asus ROG Strix G16 i9 RTX 4070 32GB 1TB', brand: 'Asus', priceMin: 39990000, priceMax: 48990000, catKeyword: 'Laptop gaming' },
    { name: 'Lenovo ThinkPad X1 Carbon i7 16GB 512GB', brand: 'Lenovo', priceMin: 29990000, priceMax: 36990000, catKeyword: 'Laptop Lenovo' },
    { name: 'HP Spectre x360 14 i7 16GB 1TB OLED', brand: 'HP', priceMin: 27990000, priceMax: 34990000, catKeyword: 'Laptop HP' },
    { name: 'Acer Nitro 16 R7-7745HX RTX 4060 16GB 512GB', brand: 'Acer', priceMin: 22990000, priceMax: 29990000, catKeyword: 'Laptop Acer' },

    // Máy tính bảng
    { name: 'iPad Pro 13 M4 Wi-Fi 256GB Silver', brand: 'Apple', priceMin: 26990000, priceMax: 32990000, catKeyword: 'iPad' },
    { name: 'iPad Air 11 M2 Wi-Fi 128GB Starlight', brand: 'Apple', priceMin: 16990000, priceMax: 20990000, catKeyword: 'iPad' },
    { name: 'Samsung Galaxy Tab S9 Ultra 256GB Graphite', brand: 'Samsung', priceMin: 19990000, priceMax: 25990000, catKeyword: 'Samsung Galaxy Tab' },

    // Âm thanh
    { name: 'AirPods Pro 2 USB-C MagSafe', brand: 'Apple', priceMin: 5490000, priceMax: 7490000, catKeyword: 'Tai nghe Bluetooth' },
    { name: 'Sony WH-1000XM5 Chống Ồn Premium', brand: 'Sony', priceMin: 6490000, priceMax: 8990000, catKeyword: 'Tai nghe chống ồn' },
    { name: 'Bose QuietComfort Ultra Headphones', brand: 'Bose', priceMin: 8990000, priceMax: 12990000, catKeyword: 'Tai nghe chống ồn' },
    { name: 'JBL Charge 5 Loa Bluetooth Chống Nước', brand: 'JBL', priceMin: 2490000, priceMax: 3490000, catKeyword: 'Loa Bluetooth' },
    { name: 'Marshall Emberton III Loa Bluetooth Retro', brand: 'Marshall', priceMin: 3490000, priceMax: 5990000, catKeyword: 'Loa Bluetooth' },
    { name: 'Sennheiser Momentum True Wireless 4', brand: 'Sennheiser', priceMin: 4990000, priceMax: 7490000, catKeyword: 'Tai nghe Bluetooth' },

    // Phụ kiện
    { name: 'Apple Watch Ultra 2 Titanium Ocean Band', brand: 'Apple', priceMin: 19990000, priceMax: 25990000, catKeyword: 'Apple Watch' },
    { name: 'Samsung Galaxy Watch 6 Classic 47mm', brand: 'Samsung', priceMin: 6990000, priceMax: 9490000, catKeyword: 'Samsung Galaxy Watch' },
    { name: 'Bàn phím cơ Keychron K2 Pro RGB Bluetooth', brand: 'Keychron', priceMin: 1890000, priceMax: 2890000, catKeyword: 'Bàn phím cơ' },
    { name: 'Chuột Logitech MX Master 3S Wireless', brand: 'Logitech', priceMin: 1690000, priceMax: 2490000, catKeyword: 'Chuột' },
    { name: 'Pin dự phòng Anker 24000mAh 200W USB-C', brand: 'Anker', priceMin: 990000, priceMax: 1690000, catKeyword: 'Pin dự phòng' },
    { name: 'Cáp sạc MagSafe Apple 2m chính hãng', brand: 'Apple', priceMin: 390000, priceMax: 590000, catKeyword: 'Sạc / Cáp' },

    // PC - Linh kiện
    { name: 'Màn hình LG 27GP850-B 27" QHD 165Hz IPS', brand: 'LG', priceMin: 8990000, priceMax: 12990000, catKeyword: 'Màn hình máy tính' },
    { name: 'Màn hình Samsung 32" 4K OLED 240Hz', brand: 'Samsung', priceMin: 15990000, priceMax: 21990000, catKeyword: 'Màn hình máy tính' },
    { name: 'CPU Intel Core i9-14900K Box', brand: 'Intel', priceMin: 9990000, priceMax: 13990000, catKeyword: 'CPU – Bộ vi xử lý' },
    { name: 'VGA NVIDIA RTX 4090 24GB GDDR6X', brand: 'NVIDIA', priceMin: 36990000, priceMax: 45990000, catKeyword: 'Card đồ họa (VGA)' },
    { name: 'RAM Kingston Fury Beast 32GB DDR5 6000MHz', brand: 'Kingston', priceMin: 2490000, priceMax: 3990000, catKeyword: 'RAM' },
    { name: 'SSD Samsung 990 Pro 2TB PCIe 4.0 NVMe', brand: 'Samsung', priceMin: 2890000, priceMax: 4490000, catKeyword: 'Ổ cứng SSD / HDD' },

    // Camera
    { name: 'Camera Reolink E1 Outdoor Pro 4K WiFi', brand: 'Reolink', priceMin: 990000, priceMax: 1690000, catKeyword: 'Camera IP / Wifi' },
    { name: 'GoPro Hero 12 Black Action Camera', brand: 'GoPro', priceMin: 8490000, priceMax: 11490000, catKeyword: 'Camera hành trình' },
    { name: 'Vành thể thao Garmin Instinct 2X Solar', brand: 'Garmin', priceMin: 8990000, priceMax: 12990000, catKeyword: 'Đồng hồ thể thao' },
    { name: 'Webcam Logitech C920s Full HD 1080p', brand: 'Logitech', priceMin: 1190000, priceMax: 1890000, catKeyword: 'Webcam' },
];

// ─── Main ─────────────────────────────────────────────────────────────────
async function seed() {
    try {
        await mongoose.connect(process.env.CONNECT_DB || 'mongodb://localhost:27017/tmdt2');
        console.log('✅ MongoDB connected\n');

        // ── 1. Xóa toàn bộ sản phẩm cũ ──────────────────────────────────
        const deleted = await Product.deleteMany({});
        console.log(`🗑  Đã xóa ${deleted.deletedCount} sản phẩm cũ\n`);

        // ── 2. Tìm hoặc tạo Seller account ───────────────────────────────
        const sellerEmail = 'seller@techstore.vn';
        let sellerUser = await User.findOne({ email: sellerEmail });

        if (!sellerUser) {
            const hashed = await bcrypt.hash('Seller@123', 12);
            sellerUser = await User.create({
                fullName: 'TechStore Official',
                email: sellerEmail,
                password: hashed,
                role: 'seller',
                typeLogin: 'email',
                isActive: true,
            });
            console.log(`👤 Đã tạo seller user: ${sellerEmail} (password: Seller@123)`);
        } else {
            // Đảm bảo user có role seller
            await User.updateOne({ _id: sellerUser._id }, { role: 'seller' });
            console.log(`👤 Dùng seller user có sẵn: ${sellerEmail}`);
        }

        // ── 3. Tìm hoặc tạo Store ─────────────────────────────────────────
        let store = await Store.findOne({ owner: sellerUser._id });

        if (!store) {
            store = await Store.create({
                name: 'TechStore Official',
                slug: 'techstore-official',
                logo: 'https://res.cloudinary.com/ddftkqhyk/image/upload/v1742484488/stores/techstore_logo.png',
                banner: 'https://res.cloudinary.com/ddftkqhyk/image/upload/v1742484488/stores/techstore_banner.jpg',
                description: 'Cửa hàng công nghệ chính hãng hàng đầu Việt Nam. Chuyên cung cấp điện thoại, laptop, phụ kiện và thiết bị điện tử cao cấp. Cam kết 100% sản phẩm chính hãng, bảo hành toàn quốc.',
                owner: sellerUser._id,
                status: 'active',
                phone: '1900 888 123',
                address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
                totalProducts: 0,
                totalFollowers: rand(120, 800),
                totalSales: rand(500, 5000),
                rating: +(Math.random() * 1 + 4).toFixed(1),
                commissionRate: 5,
            });
            console.log(`🏪 Đã tạo store: TechStore Official\n`);
        } else {
            await Store.updateOne({ _id: store._id }, { status: 'active' });
            console.log(`🏪 Dùng store có sẵn: ${store.name}\n`);
        }

        // ── 4. Lấy tất cả danh mục ──────────────────────────────────────
        const allCategories = await Category.find({ isActive: true }).lean();
        const catMap = {};
        allCategories.forEach((c) => {
            catMap[c.name] = c._id;
        });

        // ── 5. Seed 40 sản phẩm ──────────────────────────────────────────
        let createdCount = 0;
        const productDocs = [];

        for (const p of PRODUCTS_DATA) {
            // Tìm category phù hợp theo keyword
            const cat = allCategories.find((c) => c.name === p.catKeyword || c.name.includes(p.catKeyword))
                || allCategories.find((c) => c.parent !== null); // fallback to any child category

            if (!cat) {
                console.warn(`⚠️  Không tìm thấy danh mục "${p.catKeyword}", bỏ qua.`);
                continue;
            }

            const price = roundPrice(rand(p.priceMin, p.priceMax));
            const originalPrice = roundPrice(price * (1 + rand(10, 30) / 100));
            const isFlashSale = Math.random() < 0.15;
            const isFeatured = Math.random() < 0.25;

            const slug = makeSlug(p.name) + '-' + rand(1000, 9999);

            productDocs.push({
                name: p.name,
                slug,
                description: `<p><strong>${p.name}</strong> – Sản phẩm chính hãng từ ${p.brand}, được phân phối độc quyền bởi <em>TechStore Official</em>.</p><p>✅ Bảo hành 12 tháng toàn quốc | 🚀 Giao hàng nhanh 2h | 🔄 Đổi trả trong 15 ngày</p>`,
                shortDescription: `${p.name} – Chính hãng ${p.brand}, bảo hành 12 tháng, giao nhanh toàn quốc.`,
                brand: p.brand,
                category: cat._id,
                store: store._id,
                images: getImages(),
                price,
                originalPrice,
                stock: rand(10, 300),
                sold: rand(5, 2000),
                ratingAverage: +(Math.random() * 1.5 + 3.5).toFixed(1),
                ratingCount: rand(10, 500),
                isFeatured,
                isFlashSale,
                flashSalePrice: isFlashSale ? roundPrice(price * (1 - rand(10, 25) / 100)) : 0,
                flashSaleEndTime: isFlashSale ? new Date(Date.now() + rand(1, 5) * 86400000) : null,
                isActive: true,
                status: 'active',
                attributes: [
                    { name: 'Thương hiệu', value: p.brand },
                    { name: 'Xuất xứ', value: pick(['Mỹ', 'Hàn Quốc', 'Nhật Bản', 'Đài Loan', 'Việt Nam']) },
                    { name: 'Bảo hành', value: pick(['12 tháng chính hãng', '24 tháng', '6 tháng']) },
                    { name: 'Phân phối', value: 'TechStore Official' },
                ],
                weight: rand(100, 2000),
                length: rand(5, 40),
                width: rand(5, 30),
                height: rand(1, 20),
            });
        }

        await Product.insertMany(productDocs);
        createdCount = productDocs.length;

        // Cập nhật totalProducts cho store
        await Store.updateOne({ _id: store._id }, { totalProducts: createdCount });

        console.log(`✅ Đã tạo ${createdCount} sản phẩm cho cửa hàng "${store.name}"`);
        console.log(`\n📦 Store ID: ${store._id}`);
        console.log(`🏪 Store Slug: ${store.slug}`);
        console.log(`👤 Seller Email: ${sellerEmail}`);
        console.log(`🔑 Seller Password: Seller@123`);
        console.log(`\n🎉 Hoàn thành! Truy cập: /shop/${store.slug}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi seed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seed();

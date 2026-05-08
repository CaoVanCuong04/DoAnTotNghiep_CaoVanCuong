/**
 * Seed script: Thêm biến thể cho tất cả sản phẩm hiện có
 * Chạy: node src/seeds/seedVariants.js
 *
 * Script sẽ gán biến thể phù hợp cho từng loại sản phẩm dựa trên tên danh mục.
 * Nếu sản phẩm đã có variants thì bỏ qua (không ghi đè).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Category = require('../models/category.model');

// ── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const roundPrice = (n) => Math.round(n / 10000) * 10000;

// ── Variant Templates ────────────────────────────────────────────────────────
// Mỗi template trả về mảng variant groups phù hợp cho loại sản phẩm

const variantTemplates = {
    // ── Điện thoại → Màu sắc + Bộ nhớ ──
    phone: (basePrice) => [
        {
            name: 'Màu sắc',
            options: [
                { label: 'Đen Titan', price: basePrice, stock: rand(10, 100), sku: 'BLK' },
                { label: 'Trắng', price: basePrice, stock: rand(10, 80), sku: 'WHT' },
                { label: 'Xanh Dương', price: basePrice + roundPrice(rand(0, 200000)), stock: rand(5, 60), sku: 'BLU' },
                { label: 'Vàng', price: basePrice + roundPrice(rand(0, 300000)), stock: rand(5, 40), sku: 'GLD' },
            ],
        },
        {
            name: 'Bộ nhớ',
            options: [
                { label: '128GB', price: basePrice, stock: rand(20, 100), sku: '128' },
                { label: '256GB', price: basePrice + roundPrice(rand(1500000, 3000000)), stock: rand(15, 80), sku: '256' },
                { label: '512GB', price: basePrice + roundPrice(rand(4000000, 6000000)), stock: rand(5, 40), sku: '512' },
            ],
        },
    ],

    // ── Laptop → RAM + SSD ──
    laptop: (basePrice) => [
        {
            name: 'RAM',
            options: [
                { label: '8GB', price: basePrice, stock: rand(10, 50), sku: '8G' },
                { label: '16GB', price: basePrice + roundPrice(rand(1500000, 3000000)), stock: rand(10, 40), sku: '16G' },
                { label: '32GB', price: basePrice + roundPrice(rand(4000000, 7000000)), stock: rand(5, 20), sku: '32G' },
            ],
        },
        {
            name: 'Ổ cứng SSD',
            options: [
                { label: '256GB SSD', price: basePrice, stock: rand(10, 40), sku: 'S256' },
                { label: '512GB SSD', price: basePrice + roundPrice(rand(1000000, 2000000)), stock: rand(10, 50), sku: 'S512' },
                { label: '1TB SSD', price: basePrice + roundPrice(rand(3000000, 5000000)), stock: rand(5, 25), sku: 'S1T' },
            ],
        },
    ],

    // ── Máy tính bảng → Bộ nhớ + Kết nối ──
    tablet: (basePrice) => [
        {
            name: 'Bộ nhớ',
            options: [
                { label: '64GB', price: basePrice, stock: rand(10, 60), sku: '64' },
                { label: '128GB', price: basePrice + roundPrice(rand(1000000, 2500000)), stock: rand(10, 50), sku: '128' },
                { label: '256GB', price: basePrice + roundPrice(rand(3000000, 5000000)), stock: rand(5, 30), sku: '256' },
            ],
        },
        {
            name: 'Kết nối',
            options: [
                { label: 'WiFi', price: basePrice, stock: rand(15, 60), sku: 'WIFI' },
                { label: 'WiFi + 5G', price: basePrice + roundPrice(rand(2000000, 4000000)), stock: rand(5, 30), sku: '5G' },
            ],
        },
    ],

    // ── Tai nghe → Màu sắc ──
    earphone: (basePrice) => [
        {
            name: 'Màu sắc',
            options: [
                { label: 'Đen', price: basePrice, stock: rand(20, 100), sku: 'BLK' },
                { label: 'Trắng', price: basePrice, stock: rand(20, 80), sku: 'WHT' },
                { label: 'Xanh Navy', price: basePrice + roundPrice(rand(0, 100000)), stock: rand(10, 50), sku: 'NVY' },
            ],
        },
    ],

    // ── Loa → Màu sắc ──
    speaker: (basePrice) => [
        {
            name: 'Màu sắc',
            options: [
                { label: 'Đen', price: basePrice, stock: rand(15, 60), sku: 'BLK' },
                { label: 'Đỏ', price: basePrice, stock: rand(10, 40), sku: 'RED' },
                { label: 'Xanh Dương', price: basePrice, stock: rand(10, 40), sku: 'BLU' },
                { label: 'Xanh Lá', price: basePrice + roundPrice(rand(0, 100000)), stock: rand(5, 30), sku: 'GRN' },
            ],
        },
    ],

    // ── Đồng hồ → Kích thước + Màu dây ──
    watch: (basePrice) => [
        {
            name: 'Kích thước',
            options: [
                { label: '41mm', price: basePrice, stock: rand(10, 50), sku: '41' },
                { label: '45mm', price: basePrice + roundPrice(rand(500000, 1500000)), stock: rand(10, 40), sku: '45' },
            ],
        },
        {
            name: 'Màu dây',
            options: [
                { label: 'Đen', price: basePrice, stock: rand(15, 50), sku: 'BLK' },
                { label: 'Trắng Sao', price: basePrice, stock: rand(10, 40), sku: 'WHT' },
                { label: 'Xanh Bão', price: basePrice + roundPrice(rand(0, 200000)), stock: rand(5, 30), sku: 'BLU' },
            ],
        },
    ],

    // ── Tivi → Kích thước ──
    tv: (basePrice) => [
        {
            name: 'Kích thước màn hình',
            options: [
                { label: '43 inch', price: roundPrice(basePrice * 0.7), stock: rand(10, 30), sku: '43' },
                { label: '50 inch', price: roundPrice(basePrice * 0.85), stock: rand(10, 25), sku: '50' },
                { label: '55 inch', price: basePrice, stock: rand(10, 30), sku: '55' },
                { label: '65 inch', price: roundPrice(basePrice * 1.4), stock: rand(5, 20), sku: '65' },
                { label: '75 inch', price: roundPrice(basePrice * 1.9), stock: rand(3, 10), sku: '75' },
            ],
        },
    ],

    // ── Sạc / Pin → Màu sắc ──
    charger: (basePrice) => [
        {
            name: 'Màu sắc',
            options: [
                { label: 'Trắng', price: basePrice, stock: rand(30, 150), sku: 'WHT' },
                { label: 'Đen', price: basePrice, stock: rand(30, 120), sku: 'BLK' },
            ],
        },
    ],

    // ── Mặc định → Phiên bản ──
    default: (basePrice) => [
        {
            name: 'Phiên bản',
            options: [
                { label: 'Tiêu chuẩn', price: basePrice, stock: rand(20, 100), sku: 'STD' },
                { label: 'Cao cấp', price: basePrice + roundPrice(rand(500000, 2000000)), stock: rand(10, 50), sku: 'PRO' },
            ],
        },
    ],
};

// ── Phân loại sản phẩm theo danh mục ─────────────────────────────────────────
function getTemplateKey(categoryName, productName) {
    const catLower = (categoryName || '').toLowerCase();
    const prodLower = (productName || '').toLowerCase();

    // Điện thoại
    if (
        catLower.includes('iphone') || catLower.includes('samsung') && catLower.includes('điện thoại') ||
        catLower.includes('xiaomi') || catLower.includes('oppo') || catLower.includes('vivo') ||
        catLower.includes('realme') || catLower.includes('nokia') ||
        catLower.includes('điện thoại') || catLower.includes('phone') ||
        prodLower.includes('iphone') || prodLower.includes('galaxy s2') ||
        prodLower.includes('galaxy z')
    ) {
        return 'phone';
    }

    // Laptop
    if (
        catLower.includes('laptop') || catLower.includes('macbook') ||
        prodLower.includes('laptop') || prodLower.includes('macbook') ||
        prodLower.includes('thinkpad') || prodLower.includes('vivobook')
    ) {
        return 'laptop';
    }

    // Máy tính bảng
    if (
        catLower.includes('ipad') || catLower.includes('tablet') ||
        catLower.includes('máy tính bảng') || catLower.includes('galaxy tab') ||
        prodLower.includes('ipad') || prodLower.includes('tab ')
    ) {
        return 'tablet';
    }

    // Tai nghe
    if (
        catLower.includes('tai nghe') || catLower.includes('earphone') ||
        catLower.includes('headphone') || catLower.includes('airpods') ||
        prodLower.includes('airpods') || prodLower.includes('buds')
    ) {
        return 'earphone';
    }

    // Loa
    if (
        catLower.includes('loa') || catLower.includes('speaker') ||
        prodLower.includes('loa ')
    ) {
        return 'speaker';
    }

    // Đồng hồ
    if (
        catLower.includes('watch') || catLower.includes('đồng hồ') ||
        catLower.includes('smartwatch') ||
        prodLower.includes('watch') || prodLower.includes('garmin')
    ) {
        return 'watch';
    }

    // Tivi
    if (
        catLower.includes('tivi') || catLower.includes('tv') ||
        prodLower.includes('tivi') || prodLower.includes(' tv ')
    ) {
        return 'tv';
    }

    // Sạc / Pin dự phòng
    if (
        catLower.includes('sạc') || catLower.includes('pin dự phòng') ||
        catLower.includes('cáp') || catLower.includes('charger') ||
        prodLower.includes('sạc ') || prodLower.includes('cáp ')
    ) {
        return 'charger';
    }

    return 'default';
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function seedVariants() {
    try {
        const uri = process.env.CONNECT_DB || 'mongodb://localhost:27017/tmdt2';
        await mongoose.connect(uri);
        console.log('✅ MongoDB connected\n');

        // Lấy tất cả sản phẩm + populate category name
        const products = await Product.find({}).populate('category', 'name');
        console.log(`📦 Tìm thấy ${products.length} sản phẩm\n`);

        let updated = 0;
        let skipped = 0;
        const stats = {};

        for (const product of products) {
            // Bỏ qua nếu đã có variants
            if (product.variants && product.variants.length > 0) {
                skipped++;
                continue;
            }

            const catName = product.category?.name || '';
            const templateKey = getTemplateKey(catName, product.name);
            const generateVariants = variantTemplates[templateKey];

            // Tạo variants từ template
            const variants = generateVariants(product.price);

            // Cập nhật sản phẩm
            await Product.updateOne(
                { _id: product._id },
                { $set: { variants } }
            );

            updated++;

            // Thống kê
            if (!stats[templateKey]) stats[templateKey] = 0;
            stats[templateKey]++;
        }

        // In kết quả
        console.log('── Thống kê theo loại ──');
        for (const [key, count] of Object.entries(stats)) {
            const labels = {
                phone: '📱 Điện thoại',
                laptop: '💻 Laptop',
                tablet: '📟 Máy tính bảng',
                earphone: '🎧 Tai nghe',
                speaker: '🔊 Loa',
                watch: '⌚ Đồng hồ',
                tv: '📺 Tivi',
                charger: '🔌 Sạc/Pin',
                default: '📦 Khác',
            };
            console.log(`  ${labels[key] || key}: ${count} sản phẩm`);
        }

        console.log(`\n🎉 Hoàn thành!`);
        console.log(`  ✔ Đã thêm biến thể: ${updated} sản phẩm`);
        console.log(`  ⏭ Đã bỏ qua (đã có): ${skipped} sản phẩm\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

seedVariants();

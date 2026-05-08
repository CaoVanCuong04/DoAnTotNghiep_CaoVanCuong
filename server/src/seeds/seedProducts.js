/**
 * Seed script: Tạo ~15 sản phẩm cho mỗi danh mục con
 * Chạy: node src/seeds/seedProducts.js
 *
 * Lưu ý: Script sẽ xóa toàn bộ sản phẩm cũ trước khi tạo mới
 */

require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const Product = require('../models/product.model');
const Category = require('../models/category.model');

const makeSlug = (name) => slugify(name, { lower: true, strict: true, locale: 'vi' });

// Random helper
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const roundPrice = (n) => Math.round(n / 10000) * 10000;

// Cloudinary product images
const productImages = [
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1772530569/13_x7zcba.jpg',
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1772530569/12_uxnych.jpg',
    'https://res.cloudinary.com/ddftkqhyk/image/upload/v1772530569/14_e8jwad.jpg',
];

// Get random 1-3 images for a product
const getRandomImages = () => {
    const count = rand(1, 3);
    const shuffled = [...productImages].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// ─── Product templates by category keyword ─────────────────────────────────
const productTemplates = {
    // ── Điện thoại ──
    iPhone: {
        products: [
            'iPhone 15 Pro Max 256GB',
            'iPhone 15 Pro 128GB',
            'iPhone 15 Plus 256GB',
            'iPhone 15 128GB',
            'iPhone 14 Pro Max 256GB',
            'iPhone 14 128GB',
            'iPhone 13 128GB',
            'iPhone SE 2022 64GB',
            'iPhone 14 Plus 128GB',
            'iPhone 15 Pro Max 512GB',
            'iPhone 15 Pro Max 1TB',
            'iPhone 14 Pro 256GB',
            'iPhone 13 Pro Max 256GB',
            'iPhone 13 mini 128GB',
            'iPhone 12 64GB',
        ],
        brand: 'Apple',
        priceRange: [11990000, 46990000],
        attrs: () => [
            { name: 'Bộ nhớ', value: pick(['128GB', '256GB', '512GB', '1TB']) },
            { name: 'RAM', value: pick(['6GB', '8GB']) },
            { name: 'Màn hình', value: pick(['6.1 inch', '6.7 inch', '4.7 inch']) },
            { name: 'Chip', value: pick(['A15 Bionic', 'A16 Bionic', 'A17 Pro']) },
        ],
    },
    Samsung: {
        products: [
            'Samsung Galaxy S24 Ultra 256GB',
            'Samsung Galaxy S24+ 256GB',
            'Samsung Galaxy S24 128GB',
            'Samsung Galaxy S23 Ultra 256GB',
            'Samsung Galaxy S23 FE 128GB',
            'Samsung Galaxy Z Fold5 256GB',
            'Samsung Galaxy Z Flip5 256GB',
            'Samsung Galaxy A54 128GB',
            'Samsung Galaxy A34 128GB',
            'Samsung Galaxy A24 128GB',
            'Samsung Galaxy A14 64GB',
            'Samsung Galaxy A05s 64GB',
            'Samsung Galaxy M34 128GB',
            'Samsung Galaxy S23 128GB',
            'Samsung Galaxy Z Fold4 256GB',
        ],
        brand: 'Samsung',
        priceRange: [3290000, 41990000],
        attrs: () => [
            { name: 'Bộ nhớ', value: pick(['64GB', '128GB', '256GB', '512GB']) },
            { name: 'RAM', value: pick(['4GB', '6GB', '8GB', '12GB']) },
            { name: 'Màn hình', value: pick(['6.4 inch', '6.6 inch', '6.8 inch', '7.6 inch']) },
            { name: 'Chip', value: pick(['Snapdragon 8 Gen 3', 'Snapdragon 8 Gen 2', 'Exynos 1380']) },
        ],
    },
    Xiaomi: {
        products: [
            'Xiaomi 14 Ultra 512GB',
            'Xiaomi 14 256GB',
            'Xiaomi 13T Pro 256GB',
            'Xiaomi 13T 256GB',
            'Redmi Note 13 Pro+ 256GB',
            'Redmi Note 13 Pro 128GB',
            'Redmi Note 13 128GB',
            'Redmi 13C 128GB',
            'Redmi 12 128GB',
            'Poco X6 Pro 256GB',
            'Poco F5 256GB',
            'Poco M6 Pro 128GB',
            'Xiaomi 13 Lite 128GB',
            'Redmi Note 12 128GB',
            'Xiaomi 12T 256GB',
        ],
        brand: 'Xiaomi',
        priceRange: [2990000, 23990000],
        attrs: () => [
            { name: 'Bộ nhớ', value: pick(['128GB', '256GB', '512GB']) },
            { name: 'RAM', value: pick(['4GB', '6GB', '8GB', '12GB', '16GB']) },
            { name: 'Màn hình', value: pick(['6.5 inch', '6.67 inch', '6.73 inch']) },
        ],
    },
    OPPO: {
        products: [
            'OPPO Find X7 Ultra 256GB',
            'OPPO Find N3 Flip 256GB',
            'OPPO Reno11 Pro 256GB',
            'OPPO Reno11 128GB',
            'OPPO Reno10 Pro+ 256GB',
            'OPPO Reno10 128GB',
            'OPPO A98 128GB',
            'OPPO A78 128GB',
            'OPPO A58 128GB',
            'OPPO A38 128GB',
            'OPPO A18 128GB',
            'OPPO Find X6 Pro 256GB',
            'OPPO Reno8 T 128GB',
            'OPPO A77s 128GB',
            'OPPO A17 64GB',
        ],
        brand: 'OPPO',
        priceRange: [2990000, 29990000],
        attrs: () => [
            { name: 'Bộ nhớ', value: pick(['64GB', '128GB', '256GB']) },
            { name: 'RAM', value: pick(['4GB', '6GB', '8GB', '12GB']) },
            { name: 'Sạc nhanh', value: pick(['33W', '67W', '80W', '100W']) },
        ],
    },
    Vivo: {
        products: [
            'Vivo X100 Pro 256GB',
            'Vivo X100 256GB',
            'Vivo V29e 128GB',
            'Vivo V29 256GB',
            'Vivo Y36 128GB',
            'Vivo Y27 128GB',
            'Vivo Y17s 128GB',
            'Vivo Y02s 32GB',
            'Vivo V27 256GB',
            'Vivo T1 128GB',
            'Vivo Y55 128GB',
            'Vivo X90 Pro+ 256GB',
            'Vivo Y35 128GB',
            'Vivo Y21t 128GB',
            'Vivo X80 Pro 256GB',
        ],
        brand: 'Vivo',
        priceRange: [2490000, 24990000],
        attrs: () => [
            { name: 'Bộ nhớ', value: pick(['32GB', '128GB', '256GB']) },
            { name: 'RAM', value: pick(['4GB', '6GB', '8GB', '12GB']) },
        ],
    },
    Realme: {
        products: [
            'Realme GT5 Pro 256GB',
            'Realme 11 Pro+ 256GB',
            'Realme 11 Pro 128GB',
            'Realme 11 128GB',
            'Realme C55 128GB',
            'Realme C53 128GB',
            'Realme C51 64GB',
            'Realme Narzo 60 Pro 128GB',
            'Realme GT Neo 5 256GB',
            'Realme C67 128GB',
            'Realme 10 Pro+ 128GB',
            'Realme C35 128GB',
            'Realme 9 Pro+ 128GB',
            'Realme C33 64GB',
            'Realme Narzo 50A 64GB',
        ],
        brand: 'Realme',
        priceRange: [2290000, 15990000],
        attrs: () => [
            { name: 'Bộ nhớ', value: pick(['64GB', '128GB', '256GB']) },
            { name: 'RAM', value: pick(['4GB', '6GB', '8GB']) },
        ],
    },
    Nokia: {
        products: [
            'Nokia G42 128GB',
            'Nokia G22 64GB',
            'Nokia C32 64GB',
            'Nokia G60 128GB',
            'Nokia XR21 128GB',
            'Nokia C31 64GB',
            'Nokia C21 Plus 64GB',
            'Nokia G21 64GB',
            'Nokia 5710 XpressAudio',
            'Nokia 2660 Flip',
            'Nokia 8210 4G',
            'Nokia 110 4G',
            'Nokia 105 4G',
            'Nokia 215 4G',
            'Nokia T21 Tablet',
        ],
        brand: 'Nokia',
        priceRange: [590000, 7990000],
        attrs: () => [
            { name: 'Bộ nhớ', value: pick(['32GB', '64GB', '128GB']) },
            { name: 'Pin', value: pick(['3000mAh', '4000mAh', '5050mAh']) },
        ],
    },
    'Điện thoại phổ thông': {
        products: [
            'Nokia 105 4G',
            'Nokia 110 4G',
            'Samsung E1200',
            'Nokia 215 4G Dual SIM',
            'Masstel Fami 60',
            'Itel it2600',
            'Nokia 8210 4G',
            'Mobell M239',
            'Masstel IZI 120',
            'Nokia 2660 Flip 4G',
            'Masstel Fami 12',
            'Itel it2173',
            'Coolpad F116',
            'Viettel V6304',
            'Masstel Fami S1',
        ],
        brand: () => pick(['Nokia', 'Samsung', 'Masstel', 'Itel', 'Mobell']),
        priceRange: [290000, 1590000],
        attrs: () => [
            { name: 'Loại', value: 'Feature Phone' },
            { name: 'Pin', value: pick(['1000mAh', '1200mAh', '1800mAh']) },
        ],
    },

    // ── Laptop ──
    'Laptop văn phòng': {
        products: [
            'HP Pavilion 15 i5-1335U 8GB 512GB',
            'Dell Inspiron 15 3530 i5 8GB',
            'Lenovo IdeaPad Slim 3 i5 8GB',
            'Acer Aspire 3 A315 i5 8GB',
            'ASUS Vivobook 15 i5 8GB 512GB',
            'HP 15s-fq5 i5 16GB',
            'Dell Vostro 3520 i5 8GB',
            'Lenovo ThinkBook 14 G6 i5',
            'Acer Aspire 5 A515 i7 16GB',
            'HP Pavilion 14 i7 16GB 512GB',
            'ASUS Vivobook 14 i3 8GB',
            'Dell Latitude 3540 i5 8GB',
            'Lenovo V15 G4 i5 8GB',
            'HP 245 G9 R5 8GB',
            'Acer Extensa 15 i3 8GB',
        ],
        brand: () => pick(['HP', 'Dell', 'Lenovo', 'Acer', 'ASUS']),
        priceRange: [8990000, 22990000],
        attrs: () => [
            {
                name: 'CPU',
                value: pick(['Intel Core i3-1315U', 'Intel Core i5-1335U', 'Intel Core i5-1340P', 'AMD Ryzen 5 7530U']),
            },
            { name: 'RAM', value: pick(['8GB', '16GB']) },
            { name: 'SSD', value: pick(['256GB', '512GB']) },
            { name: 'Màn hình', value: pick(['14 inch FHD', '15.6 inch FHD']) },
        ],
    },
    'Laptop gaming': {
        products: [
            'ASUS ROG Strix G16 i9 RTX 4060',
            'MSI Katana 15 i7 RTX 4060',
            'Lenovo Legion 5 i7 RTX 4060',
            'Acer Nitro 5 AN515 i7 RTX 4050',
            'HP Victus 16 i7 RTX 4060',
            'Dell G15 5530 i7 RTX 4060',
            'ASUS TUF Gaming F15 i7 RTX 4050',
            'MSI GF63 Thin i5 RTX 4050',
            'Lenovo LOQ 15 i5 RTX 4050',
            'Acer Predator Helios Neo i7 RTX 4060',
            'ASUS ROG Flow X13 R9 RTX 4060',
            'MSI Stealth 16 i9 RTX 4070',
            'Lenovo Legion Pro 5i i9 RTX 4070',
            'ASUS ROG Zephyrus G14 R9 RTX 4060',
            'HP OMEN 17 i9 RTX 4080',
        ],
        brand: () => pick(['ASUS', 'MSI', 'Lenovo', 'Acer', 'HP', 'Dell']),
        priceRange: [17990000, 59990000],
        attrs: () => [
            { name: 'CPU', value: pick(['Intel Core i7-13700H', 'Intel Core i9-13900H', 'AMD Ryzen 9 7940HS']) },
            { name: 'GPU', value: pick(['RTX 4050', 'RTX 4060', 'RTX 4070', 'RTX 4080']) },
            { name: 'RAM', value: pick(['16GB', '32GB']) },
            { name: 'Màn hình', value: pick(['15.6 inch FHD 144Hz', '16 inch QHD 165Hz', '17.3 inch FHD 144Hz']) },
        ],
    },
    MacBook: {
        products: [
            'MacBook Air M3 13 inch 8GB 256GB',
            'MacBook Air M3 15 inch 8GB 512GB',
            'MacBook Air M2 13 inch 8GB 256GB',
            'MacBook Air M2 15 inch 16GB 512GB',
            'MacBook Pro M3 14 inch 8GB 512GB',
            'MacBook Pro M3 Pro 14 inch 18GB 512GB',
            'MacBook Pro M3 Max 16 inch 36GB 1TB',
            'MacBook Pro M3 Pro 16 inch 18GB 512GB',
            'MacBook Air M1 13 inch 8GB 256GB',
            'MacBook Pro M2 13 inch 8GB 256GB',
            'MacBook Pro M2 Pro 14 inch 16GB 512GB',
            'MacBook Pro M2 Max 16 inch 32GB 1TB',
            'MacBook Air M3 13 inch 16GB 512GB',
            'MacBook Pro M3 14 inch 16GB 1TB',
            'MacBook Air M2 13 inch 16GB 512GB',
        ],
        brand: 'Apple',
        priceRange: [18990000, 89990000],
        attrs: () => [
            {
                name: 'Chip',
                value: pick([
                    'Apple M1',
                    'Apple M2',
                    'Apple M2 Pro',
                    'Apple M2 Max',
                    'Apple M3',
                    'Apple M3 Pro',
                    'Apple M3 Max',
                ]),
            },
            { name: 'RAM', value: pick(['8GB', '16GB', '18GB', '32GB', '36GB']) },
            { name: 'SSD', value: pick(['256GB', '512GB', '1TB', '2TB']) },
            { name: 'Màn hình', value: pick(['13.3 inch', '13.6 inch', '14.2 inch', '15.3 inch', '16.2 inch']) },
        ],
    },

    // ── Máy tính bảng ──
    iPad: {
        products: [
            'iPad Pro M4 11 inch 256GB WiFi',
            'iPad Pro M4 13 inch 256GB WiFi',
            'iPad Air M2 11 inch 128GB WiFi',
            'iPad Air M2 13 inch 128GB WiFi',
            'iPad 10 64GB WiFi',
            'iPad mini 6 64GB WiFi',
            'iPad Pro M2 11 inch 128GB WiFi',
            'iPad Air M1 64GB WiFi',
            'iPad 9 64GB WiFi',
            'iPad Pro M4 11 inch 512GB 5G',
            'iPad Air M2 11 inch 256GB 5G',
            'iPad 10 256GB WiFi',
            'iPad mini 6 256GB WiFi',
            'iPad Pro M4 13 inch 1TB WiFi',
            'iPad Pro M2 12.9 inch 256GB WiFi',
        ],
        brand: 'Apple',
        priceRange: [7990000, 49990000],
        attrs: () => [
            { name: 'Chip', value: pick(['Apple M1', 'Apple M2', 'Apple M4', 'A15 Bionic']) },
            { name: 'Bộ nhớ', value: pick(['64GB', '128GB', '256GB', '512GB', '1TB']) },
            { name: 'Màn hình', value: pick(['8.3 inch', '10.9 inch', '11 inch', '12.9 inch', '13 inch']) },
        ],
    },
    'Samsung Galaxy Tab': {
        products: [
            'Samsung Galaxy Tab S9 Ultra 256GB',
            'Samsung Galaxy Tab S9+ 256GB',
            'Samsung Galaxy Tab S9 128GB',
            'Samsung Galaxy Tab S9 FE+ 128GB',
            'Samsung Galaxy Tab S9 FE 128GB',
            'Samsung Galaxy Tab A9+ 64GB',
            'Samsung Galaxy Tab A9 64GB',
            'Samsung Galaxy Tab S8 Ultra 128GB',
            'Samsung Galaxy Tab S8+ 128GB',
            'Samsung Galaxy Tab S8 128GB',
            'Samsung Galaxy Tab S7 FE 64GB',
            'Samsung Galaxy Tab A8 64GB',
            'Samsung Galaxy Tab S6 Lite 2024 64GB',
            'Samsung Galaxy Tab A7 Lite 32GB',
            'Samsung Galaxy Tab Active4 Pro 128GB',
        ],
        brand: 'Samsung',
        priceRange: [3990000, 32990000],
        attrs: () => [
            { name: 'Bộ nhớ', value: pick(['32GB', '64GB', '128GB', '256GB']) },
            { name: 'Màn hình', value: pick(['8.7 inch', '10.5 inch', '11 inch', '12.4 inch', '14.6 inch']) },
            { name: 'RAM', value: pick(['4GB', '6GB', '8GB', '12GB']) },
        ],
    },

    // ── Tai nghe ──
    'Tai nghe Bluetooth': {
        products: [
            'AirPods Pro 2 USB-C',
            'AirPods 3',
            'Sony WF-1000XM5',
            'Samsung Galaxy Buds2 Pro',
            'Jabra Elite 85t',
            'JBL Tune 230NC',
            'Anker Soundcore Liberty 4',
            'Nothing Ear 2',
            'Xiaomi Buds 4 Pro',
            'Beats Fit Pro',
            'Sennheiser Momentum True Wireless 4',
            'OPPO Enco X2',
            'Huawei FreeBuds Pro 3',
            'QCY T13',
            'Edifier W820NB Plus',
        ],
        brand: () => pick(['Apple', 'Sony', 'Samsung', 'JBL', 'Jabra', 'Anker', 'Xiaomi', 'Sennheiser']),
        priceRange: [290000, 7990000],
        attrs: () => [
            { name: 'Loại', value: 'True Wireless' },
            { name: 'Chống ồn', value: pick(['Có ANC', 'Không']) },
            { name: 'Pin', value: pick(['4-6 giờ', '6-8 giờ', '8-10 giờ']) },
        ],
    },
    'Tai nghe chống ồn': {
        products: [
            'Sony WH-1000XM5',
            'Apple AirPods Max',
            'Bose QuietComfort Ultra',
            'Sennheiser Momentum 4',
            'Sony WF-1000XM5',
            'Bose QuietComfort 45',
            'JBL Tour One M2',
            'Marshall Monitor II ANC',
            'AKG N700NC M2',
            'Jabra Elite 85h',
            'Shure AONIC 50',
            'Bang & Olufsen H95',
            'Audio-Technica ATH-M50xBT2',
            'Beyerdynamic Amiron',
            'Edifier W820NB Plus',
        ],
        brand: () => pick(['Sony', 'Apple', 'Bose', 'Sennheiser', 'JBL', 'Marshall']),
        priceRange: [1290000, 16990000],
        attrs: () => [
            { name: 'Loại', value: pick(['Over-ear', 'In-ear']) },
            { name: 'Chống ồn', value: 'ANC chủ động' },
            { name: 'Pin', value: pick(['20 giờ', '24 giờ', '30 giờ', '40 giờ']) },
        ],
    },

    // ── Loa ──
    'Loa Bluetooth': {
        products: [
            'JBL Flip 6',
            'JBL Charge 5',
            'JBL Go 3',
            'JBL Xtreme 3',
            'Sony SRS-XB100',
            'Sony SRS-XE200',
            'Marshall Emberton II',
            'Marshall Willen',
            'Bose SoundLink Flex',
            'Bose SoundLink Micro',
            'Harman Kardon Go + Play 3',
            'Ultimate Ears Boom 3',
            'Anker Soundcore Motion+',
            'Xiaomi Mi Portable Speaker',
            'Tronsmart T7 Lite',
        ],
        brand: () => pick(['JBL', 'Sony', 'Marshall', 'Bose', 'Harman Kardon', 'UE']),
        priceRange: [490000, 8990000],
        attrs: () => [
            { name: 'Công suất', value: pick(['5W', '10W', '20W', '30W', '50W']) },
            { name: 'Chống nước', value: pick(['IP67', 'IP54', 'IPX4']) },
            { name: 'Pin', value: pick(['8 giờ', '12 giờ', '15 giờ', '20 giờ']) },
        ],
    },

    // ── Phụ kiện ──
    'Sạc / Cáp': {
        products: [
            'Sạc Apple 20W USB-C',
            'Sạc Samsung 25W',
            'Sạc Anker Nano 30W',
            'Sạc Xiaomi 67W GaN',
            'Cáp Lightning 1m chính hãng Apple',
            'Cáp USB-C to USB-C Anker 1.8m',
            'Sạc không dây Apple MagSafe 15W',
            'Sạc không dây Samsung Duo Pad',
            'Sạc Baseus GaN 65W 3 cổng',
            'Cáp USB-C to Lightning Ugreen 1m',
            'Sạc OPPO 80W SuperVOOC',
            'Dock sạc không dây 3in1 Belkin',
            'Sạc Anker 735 65W GaN',
            'Cáp Thunderbolt 4 Anker 0.7m',
            'Sạc ô tô Baseus 65W USB-C',
        ],
        brand: () => pick(['Apple', 'Samsung', 'Anker', 'Baseus', 'Ugreen', 'Xiaomi']),
        priceRange: [89000, 2490000],
        attrs: () => [
            { name: 'Công suất', value: pick(['20W', '25W', '30W', '45W', '65W', '100W']) },
            { name: 'Cổng', value: pick(['USB-C', 'USB-A', 'Lightning', 'USB-C + USB-A']) },
        ],
    },
    'Pin dự phòng': {
        products: [
            'Anker PowerCore 10000mAh',
            'Anker PowerCore 20000mAh PD',
            'Xiaomi Power Bank 10000mAh 22.5W',
            'Xiaomi Power Bank 20000mAh 50W',
            'Samsung Battery Pack 10000mAh 25W',
            'Baseus Adaman 20000mAh 65W',
            'Anker 737 PowerCore 24000mAh 140W',
            'Magsafe Battery Pack Apple',
            'Ugreen 20000mAh PD 65W',
            'Energizer 10000mAh UE10058',
            'Romoss Sense 8+ 30000mAh',
            'RAVPower 20000mAh PD 60W',
            'Baseus Blade 20000mAh 100W',
            'Anker PowerCore Slim 10000',
            'Aukey PB-Y36 10000mAh MagSafe',
        ],
        brand: () => pick(['Anker', 'Xiaomi', 'Samsung', 'Baseus', 'Ugreen', 'Romoss']),
        priceRange: [199000, 2990000],
        attrs: () => [
            { name: 'Dung lượng', value: pick(['5000mAh', '10000mAh', '20000mAh', '30000mAh']) },
            { name: 'Sạc nhanh', value: pick(['18W', '22.5W', '45W', '65W', '100W']) },
        ],
    },

    // ── Đồng hồ ──
    'Apple Watch': {
        products: [
            'Apple Watch Series 9 41mm GPS',
            'Apple Watch Series 9 45mm GPS',
            'Apple Watch Ultra 2 49mm',
            'Apple Watch SE 2023 40mm',
            'Apple Watch SE 2023 44mm',
            'Apple Watch Series 8 41mm',
            'Apple Watch Series 9 41mm GPS+Cellular',
            'Apple Watch Ultra 49mm',
            'Apple Watch Series 9 45mm GPS+Cellular',
            'Apple Watch SE 40mm GPS',
            'Apple Watch Series 8 45mm GPS',
            'Apple Watch Series 7 41mm',
            'Apple Watch Series 9 41mm Nike',
            'Apple Watch Ultra 2 Hermès',
            'Apple Watch SE 44mm GPS+Cellular',
        ],
        brand: 'Apple',
        priceRange: [5990000, 27990000],
        attrs: () => [
            { name: 'Kích thước', value: pick(['40mm', '41mm', '44mm', '45mm', '49mm']) },
            { name: 'Kết nối', value: pick(['GPS', 'GPS + Cellular']) },
            { name: 'Chất liệu', value: pick(['Nhôm', 'Thép không gỉ', 'Titanium']) },
        ],
    },
    Smartwatch: {
        products: [
            'Garmin Venu 3',
            'Garmin Forerunner 265',
            'Amazfit GTR 4',
            'Amazfit GTS 4',
            'Huawei Watch GT 4 46mm',
            'Huawei Watch GT 4 41mm',
            'Xiaomi Watch S3',
            'Xiaomi Watch 2',
            'Garmin Fenix 7 Pro',
            'Amazfit T-Rex Ultra',
            'TicWatch Pro 5',
            'Fossil Gen 6',
            'Garmin Venu Sq 2',
            'Amazfit Bip 5',
            'Xiaomi Band 8 Pro',
        ],
        brand: () => pick(['Garmin', 'Amazfit', 'Huawei', 'Xiaomi', 'Fossil']),
        priceRange: [990000, 19990000],
        attrs: () => [
            { name: 'Màn hình', value: pick(['AMOLED', 'LCD', 'MIP']) },
            { name: 'Pin', value: pick(['5 ngày', '7 ngày', '14 ngày', '21 ngày']) },
            { name: 'Chống nước', value: pick(['5ATM', '10ATM', 'IP68']) },
        ],
    },

    // ── Tivi ──
    'Tivi Samsung': {
        products: [
            'Samsung QLED Q80D 55 inch',
            'Samsung QLED Q60D 50 inch',
            'Samsung Crystal UHD 55 inch',
            'Samsung Crystal UHD 43 inch',
            'Samsung Neo QLED 8K 65 inch',
            'Samsung Neo QLED 4K 55 inch',
            'Samsung OLED S95D 65 inch',
            'Samsung Frame 55 inch',
            'Samsung Serif 55 inch',
            'Samsung Crystal UHD 65 inch',
            'Samsung Smart TV 32 inch',
            'Samsung QLED Q70D 55 inch',
            'Samsung Crystal UHD 75 inch',
            'Samsung Neo QLED 4K 75 inch',
            'Samsung Smart TV 43 inch',
        ],
        brand: 'Samsung',
        priceRange: [4990000, 79990000],
        attrs: () => [
            { name: 'Kích thước', value: pick(['32 inch', '43 inch', '50 inch', '55 inch', '65 inch', '75 inch']) },
            { name: 'Độ phân giải', value: pick(['Full HD', '4K UHD', '8K']) },
            { name: 'Công nghệ', value: pick(['QLED', 'Neo QLED', 'Crystal UHD', 'OLED']) },
        ],
    },
};

// ─── Fallback generic template ────────────────────────────────────────────
function getGenericProducts(categoryName) {
    const adj = [
        'Cao cấp',
        'Chuyên nghiệp',
        'Mini',
        'Pro',
        'Plus',
        'Ultra',
        'Tiêu chuẩn',
        'Siêu bền',
        'Thông minh',
        'Đa năng',
        'Compact',
        'Premium',
        'Sport',
        'Classic',
        'Lite',
    ];
    const brands = [
        'Samsung',
        'Xiaomi',
        'Sony',
        'LG',
        'Panasonic',
        'Philips',
        'Bosch',
        'Sharp',
        'Electrolux',
        'Midea',
        'Daikin',
        'Toshiba',
        'TCL',
        'Hisense',
        'Anker',
    ];
    const products = [];
    for (let i = 0; i < 15; i++) {
        products.push(`${categoryName} ${adj[i]} ${pick(['2024', '2023', 'V2', 'Gen 3', 'Series ' + rand(1, 9)])}`);
    }
    return {
        products,
        brand: () => pick(brands),
        priceRange: [99000, 19990000],
        attrs: () => [
            { name: 'Xuất xứ', value: pick(['Việt Nam', 'Trung Quốc', 'Hàn Quốc', 'Nhật Bản', 'Mỹ']) },
            { name: 'Bảo hành', value: pick(['6 tháng', '12 tháng', '24 tháng']) },
        ],
    };
}

// ─── Create products for a category ───────────────────────────────────────
function generateProducts(category) {
    const template = productTemplates[category.name] || getGenericProducts(category.name);
    const items = [];

    for (const productName of template.products) {
        const [minP, maxP] = template.priceRange;
        const price = roundPrice(rand(minP, maxP));
        const originalPrice = roundPrice(price + rand(price * 0.05, price * 0.3));
        const isFeatured = Math.random() < 0.2;
        const isFlashSale = Math.random() < 0.1;
        const brand = typeof template.brand === 'function' ? template.brand() : template.brand;

        items.push({
            name: productName,
            slug: makeSlug(productName) + '-' + rand(1000, 9999),
            description: `<p><strong>${productName}</strong> - sản phẩm chính hãng ${brand}, bảo hành 12 tháng.</p><p>Sản phẩm thuộc danh mục <em>${category.name}</em>, đảm bảo chất lượng và giá tốt nhất thị trường.</p>`,
            shortDescription: `${productName} chính hãng ${brand}, giá tốt, bảo hành 12 tháng.`,
            brand,
            category: category._id,
            images: getRandomImages(),
            price,
            originalPrice,
            stock: rand(5, 500),
            sold: rand(0, 2000),
            ratingAverage: +(Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
            ratingCount: rand(0, 500),
            isFeatured,
            isFlashSale,
            flashSalePrice: isFlashSale ? roundPrice(price * 0.8) : 0,
            flashSaleEndTime: isFlashSale ? new Date(Date.now() + rand(1, 7) * 86400000) : null,
            isActive: true,
            attributes: template.attrs(),
        });
    }

    return items;
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function seed() {
    try {
        await mongoose.connect(process.env.CONNECT_DB || 'mongodb://localhost:27017/tmdt2');
        console.log('✅ MongoDB connected\n');

        // Lấy tất cả danh mục con (có parent)
        const childCategories = await Category.find({ parent: { $ne: null }, isActive: true });
        if (childCategories.length === 0) {
            console.log('❌ Không tìm thấy danh mục con nào. Hãy chạy seedCategories.js trước.');
            process.exit(1);
        }

        // Xóa toàn bộ sản phẩm cũ
        const deleted = await Product.deleteMany({});
        console.log(`🗑  Đã xóa ${deleted.deletedCount} sản phẩm cũ\n`);

        let totalCreated = 0;

        for (const cat of childCategories) {
            const products = generateProducts(cat);
            await Product.insertMany(products);
            totalCreated += products.length;
            console.log(`✔ ${cat.name}: ${products.length} sản phẩm`);
        }

        console.log(`\n🎉 Hoàn thành! Đã tạo ${totalCreated} sản phẩm cho ${childCategories.length} danh mục.\n`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi seed:', error.message);
        process.exit(1);
    }
}

seed();

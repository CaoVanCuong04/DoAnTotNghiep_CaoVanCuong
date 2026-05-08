/**
 * Seed script: Tạo tất cả danh mục thương mại điện tử
 * Chạy: node src/seeds/seedCategories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const Category = require('../models/category.model');

const makeSlug = (name) => slugify(name, { lower: true, strict: true, locale: 'vi' });

// Danh mục cha → danh mục con
const categoriesData = [
    {
        name: 'Điện thoại',
        icon: 'smartphone',
        children: [
            { name: 'iPhone', icon: 'smartphone' },
            { name: 'Samsung', icon: 'smartphone' },
            { name: 'Xiaomi', icon: 'smartphone' },
            { name: 'OPPO', icon: 'smartphone' },
            { name: 'Vivo', icon: 'smartphone' },
            { name: 'Realme', icon: 'smartphone' },
            { name: 'Nokia', icon: 'smartphone' },
            { name: 'Điện thoại phổ thông', icon: 'phone' },
        ],
    },
    {
        name: 'Laptop',
        icon: 'laptop',
        children: [
            { name: 'Laptop văn phòng', icon: 'laptop' },
            { name: 'Laptop gaming', icon: 'gamepad-2' },
            { name: 'Laptop đồ họa', icon: 'palette' },
            { name: 'Laptop mỏng nhẹ', icon: 'feather' },
            { name: 'MacBook', icon: 'laptop' },
            { name: 'Laptop Asus', icon: 'laptop' },
            { name: 'Laptop Dell', icon: 'laptop' },
            { name: 'Laptop HP', icon: 'laptop' },
            { name: 'Laptop Lenovo', icon: 'laptop' },
            { name: 'Laptop Acer', icon: 'laptop' },
            { name: 'Laptop MSI', icon: 'laptop' },
        ],
    },
    {
        name: 'Máy tính bảng',
        icon: 'tablet-smartphone',
        children: [
            { name: 'iPad', icon: 'tablet-smartphone' },
            { name: 'Samsung Galaxy Tab', icon: 'tablet-smartphone' },
            { name: 'Xiaomi Pad', icon: 'tablet-smartphone' },
            { name: 'Máy tính bảng Android', icon: 'tablet-smartphone' },
            { name: 'Máy đọc sách', icon: 'book-open' },
        ],
    },
    {
        name: 'PC – Linh kiện',
        icon: 'cpu',
        children: [
            { name: 'PC để bàn', icon: 'monitor' },
            { name: 'PC gaming', icon: 'gamepad-2' },
            { name: 'Màn hình máy tính', icon: 'monitor' },
            { name: 'CPU – Bộ vi xử lý', icon: 'cpu' },
            { name: 'Card đồ họa (VGA)', icon: 'circuit-board' },
            { name: 'RAM', icon: 'memory-stick' },
            { name: 'Ổ cứng SSD / HDD', icon: 'hard-drive' },
            { name: 'Mainboard', icon: 'circuit-board' },
            { name: 'Nguồn máy tính (PSU)', icon: 'zap' },
            { name: 'Vỏ case', icon: 'box' },
            { name: 'Tản nhiệt', icon: 'fan' },
        ],
    },
    {
        name: 'Âm thanh',
        icon: 'headphones',
        children: [
            { name: 'Tai nghe có dây', icon: 'headphones' },
            { name: 'Tai nghe Bluetooth', icon: 'bluetooth' },
            { name: 'Tai nghe chống ồn', icon: 'ear-off' },
            { name: 'Tai nghe gaming', icon: 'gamepad-2' },
            { name: 'Loa Bluetooth', icon: 'speaker' },
            { name: 'Loa kéo / Loa karaoke', icon: 'mic' },
            { name: 'Soundbar', icon: 'speaker' },
            { name: 'Micro / Thu âm', icon: 'mic' },
        ],
    },
    {
        name: 'Phụ kiện',
        icon: 'plug-zap',
        children: [
            { name: 'Sạc / Cáp', icon: 'cable' },
            { name: 'Pin dự phòng', icon: 'battery-charging' },
            { name: 'Ốp lưng / Bao da', icon: 'shield' },
            { name: 'Miếng dán màn hình', icon: 'smartphone' },
            { name: 'Bàn phím', icon: 'keyboard' },
            { name: 'Chuột', icon: 'mouse' },
            { name: 'Bàn phím cơ', icon: 'keyboard' },
            { name: 'Webcam', icon: 'camera' },
            { name: 'USB / Thẻ nhớ', icon: 'usb' },
            { name: 'Hub / Dock', icon: 'network' },
            { name: 'Balo / Túi chống sốc', icon: 'briefcase' },
            { name: 'Giá đỡ điện thoại / Laptop', icon: 'monitor-smartphone' },
        ],
    },
    {
        name: 'Đồng hồ',
        icon: 'watch',
        children: [
            { name: 'Apple Watch', icon: 'watch' },
            { name: 'Samsung Galaxy Watch', icon: 'watch' },
            { name: 'Smartwatch', icon: 'watch' },
            { name: 'Vòng tay thông minh', icon: 'activity' },
            { name: 'Đồng hồ thể thao', icon: 'timer' },
        ],
    },
    {
        name: 'Tivi',
        icon: 'tv',
        children: [
            { name: 'Tivi Samsung', icon: 'tv' },
            { name: 'Tivi LG', icon: 'tv' },
            { name: 'Tivi Sony', icon: 'tv' },
            { name: 'Tivi TCL', icon: 'tv' },
            { name: 'Tivi Xiaomi', icon: 'tv' },
            { name: 'Android TV Box', icon: 'tv' },
        ],
    },
    {
        name: 'Gia dụng',
        icon: 'home',
        children: [
            { name: 'Tủ lạnh', icon: 'refrigerator' },
            { name: 'Máy giặt', icon: 'washing-machine' },
            { name: 'Điều hòa', icon: 'wind' },
            { name: 'Máy lọc không khí', icon: 'wind' },
            { name: 'Máy hút bụi', icon: 'home' },
            { name: 'Robot hút bụi', icon: 'bot' },
            { name: 'Bàn ủi', icon: 'shirt' },
            { name: 'Nồi chiên không dầu', icon: 'flame' },
            { name: 'Nồi cơm điện', icon: 'cooking-pot' },
            { name: 'Máy xay sinh tố', icon: 'cup-soda' },
            { name: 'Bình nước nóng', icon: 'droplets' },
            { name: 'Quạt / Quạt điều hòa', icon: 'fan' },
        ],
    },
    {
        name: 'Camera – An ninh',
        icon: 'camera',
        children: [
            { name: 'Camera IP / Wifi', icon: 'camera' },
            { name: 'Camera hành trình', icon: 'video' },
            { name: 'Camera an ninh', icon: 'shield' },
            { name: 'Bộ kit camera', icon: 'cctv' },
            { name: 'Khóa thông minh', icon: 'lock' },
            { name: 'Chuông cửa thông minh', icon: 'bell-ring' },
        ],
    },
    {
        name: 'Thời trang',
        icon: 'shirt',
        children: [
            { name: 'Áo nam', icon: 'shirt' },
            { name: 'Áo nữ', icon: 'shirt' },
            { name: 'Quần nam', icon: 'shirt' },
            { name: 'Quần nữ', icon: 'shirt' },
            { name: 'Giày dép nam', icon: 'footprints' },
            { name: 'Giày dép nữ', icon: 'footprints' },
            { name: 'Túi xách', icon: 'shopping-bag' },
            { name: 'Kính mắt', icon: 'glasses' },
            { name: 'Nón / Mũ', icon: 'hard-hat' },
            { name: 'Phụ kiện thời trang', icon: 'gem' },
        ],
    },
    {
        name: 'Sức khỏe – Làm đẹp',
        icon: 'heart-pulse',
        children: [
            { name: 'Chăm sóc da mặt', icon: 'sparkles' },
            { name: 'Trang điểm', icon: 'palette' },
            { name: 'Chăm sóc tóc', icon: 'scissors' },
            { name: 'Nước hoa', icon: 'spray-can' },
            { name: 'Máy massage', icon: 'heart-pulse' },
            { name: 'Cân sức khỏe', icon: 'scale' },
            { name: 'Máy đo huyết áp', icon: 'activity' },
        ],
    },
    {
        name: 'Thể thao – Dã ngoại',
        icon: 'dumbbell',
        children: [
            { name: 'Dụng cụ tập gym', icon: 'dumbbell' },
            { name: 'Xe đạp', icon: 'bike' },
            { name: 'Giày thể thao', icon: 'footprints' },
            { name: 'Đồ bơi', icon: 'waves' },
            { name: 'Cắm trại / Dã ngoại', icon: 'tent' },
            { name: 'Bình giữ nhiệt', icon: 'cup-soda' },
        ],
    },
    {
        name: 'Mẹ và Bé',
        icon: 'baby',
        children: [
            { name: 'Sữa bột / Bỉm tã', icon: 'baby' },
            { name: 'Đồ chơi trẻ em', icon: 'puzzle' },
            { name: 'Xe đẩy / Ghế ô tô', icon: 'car' },
            { name: 'Đồ dùng cho bé', icon: 'baby' },
        ],
    },
    {
        name: 'Nhà cửa – Đời sống',
        icon: 'lamp',
        children: [
            { name: 'Nội thất', icon: 'sofa' },
            { name: 'Đèn trang trí', icon: 'lamp' },
            { name: 'Dụng cụ nhà bếp', icon: 'utensils' },
            { name: 'Chăn ga gối', icon: 'bed' },
            { name: 'Trang trí nhà', icon: 'picture-in-picture' },
            { name: 'Dụng cụ sửa chữa', icon: 'wrench' },
        ],
    },
    {
        name: 'Ô tô – Xe máy',
        icon: 'car',
        children: [
            { name: 'Phụ kiện ô tô', icon: 'car' },
            { name: 'Phụ kiện xe máy', icon: 'bike' },
            { name: 'Dầu nhớt', icon: 'droplets' },
            { name: 'Camera hành trình xe', icon: 'video' },
            { name: 'Nước hoa xe hơi', icon: 'spray-can' },
        ],
    },
    {
        name: 'Sách – VPP',
        icon: 'book-open',
        children: [
            { name: 'Sách kinh doanh', icon: 'book-open' },
            { name: 'Sách kỹ năng', icon: 'book-open' },
            { name: 'Sách thiếu nhi', icon: 'book-open' },
            { name: 'Văn phòng phẩm', icon: 'pen-tool' },
            { name: 'Bút viết', icon: 'pencil' },
        ],
    },
    {
        name: 'Gaming',
        icon: 'gamepad-2',
        children: [
            { name: 'Tay cầm chơi game', icon: 'gamepad-2' },
            { name: 'Ghế gaming', icon: 'armchair' },
            { name: 'Bàn gaming', icon: 'table' },
            { name: 'Phụ kiện gaming', icon: 'joystick' },
            { name: 'Máy chơi game', icon: 'gamepad-2' },
        ],
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.CONNECT_DB || 'mongodb://localhost:27017/tmdt2');
        console.log('MongoDB connected');

        // Xóa toàn bộ danh mục cũ
        await Category.deleteMany({});
        console.log('Đã xóa toàn bộ danh mục cũ');

        let totalCreated = 0;

        for (let i = 0; i < categoriesData.length; i++) {
            const cat = categoriesData[i];

            // Tạo danh mục cha
            const parent = await Category.create({
                name: cat.name,
                slug: makeSlug(cat.name),
                icon: cat.icon,
                parent: null,
                order: i,
                isActive: true,
            });
            totalCreated++;
            console.log(`✔ Danh mục cha: ${cat.name}`);

            // Tạo danh mục con
            if (cat.children && cat.children.length > 0) {
                for (let j = 0; j < cat.children.length; j++) {
                    const child = cat.children[j];
                    await Category.create({
                        name: child.name,
                        slug: makeSlug(child.name),
                        icon: child.icon,
                        parent: parent._id,
                        order: j,
                        isActive: true,
                    });
                    totalCreated++;
                }
                console.log(`   └── ${cat.children.length} danh mục con`);
            }
        }

        console.log(`\n🎉 Hoàn thành! Đã tạo ${totalCreated} danh mục.`);
        process.exit(0);
    } catch (error) {
        console.error('Lỗi seed:', error.message);
        process.exit(1);
    }
}

seed();

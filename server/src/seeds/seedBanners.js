/**
 * seedBanners.js
 * Tạo data mẫu cho Banners
 *
 * Cách chạy:
 *   node src/seeds/seedBanners.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Banner = require('../models/banner.model');

const banners = [
    {
        title: 'Siêu Sale Mùa Hè',
        subtitle: 'Giảm đến 50% hàng ngàn sản phẩm công nghệ',
        highlight: 'Up to 50%',
        date: '15/04 - 30/04',
        cta: 'Mua ngay',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop',
        link: '/search?search=sale',
        lightGradient: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
        darkGradient: 'linear-gradient(135deg, #451a03, #78350f)',
        position: 'home_main',
        isActive: true,
    },
    {
        title: 'Tuần Lễ Apple',
        subtitle: 'Giảm tối đa 5 củ cho iPhone 15 Series',
        highlight: 'Apple Week',
        date: 'Chỉ trong tuần này',
        cta: 'Xem ngay',
        imageUrl: 'https://images.unsplash.com/photo-1694851216599-2e65d8db7fc6?q=80&w=2070&auto=format&fit=crop',
        link: '/search?search=iphone 15',
        lightGradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        darkGradient: 'linear-gradient(135deg, #14532d, #064e3b)',
        position: 'home_main',
        isActive: true,
    },
    {
        title: 'Mới Ra Mắt',
        subtitle: 'Khám phá bộ sưu tập tai nghe Sony 2025',
        highlight: 'New Arrival',
        date: '',
        cta: 'Khám phá',
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=2188&auto=format&fit=crop',
        link: '/search?search=sony',
        position: 'home_main',
        isActive: true,
    },
    {
        title: 'Cửa hàng mới',
        subtitle: 'Freeship cho đơn từ 200k',
        highlight: 'Freeship',
        date: '',
        cta: 'Chi tiết',
        imageUrl: 'https://images.unsplash.com/photo-1549497538-303791108f95?q=80&w=2122&auto=format&fit=crop',
        position: 'home_sub',
        isActive: true,
    },
    {
        title: 'Khách hàng VIP',
        subtitle: 'Tích điểm đổi quà hấp dẫn',
        highlight: 'Member',
        date: '',
        cta: 'Đăng ký ngay',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop',
        position: 'home_sub',
        isActive: true,
    }
];

async function seedBanners() {
    try {
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✅ MongoDB connected');

        await Banner.deleteMany({});
        console.log('🗑️  Đã xóa banners cũ');

        await Banner.insertMany(banners);
        console.log('🎉 Hoàn thành! Đã tạo 5 banners (3 main, 2 sub).');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

seedBanners();

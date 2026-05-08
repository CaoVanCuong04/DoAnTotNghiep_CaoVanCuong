/**
 * seedReviews.js
 * Tạo ~10 đánh giá thực tế cho mỗi sản phẩm.
 *
 * Cách chạy:
 *   node src/seeds/seedReviews.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Types } = mongoose;

const User = require('../models/users.model');
const Product = require('../models/product.model');
const Review = require('../models/review.model');

// ─── Dữ liệu mẫu đánh giá ──────────────────────────────────────────────────
const reviewsByRating = {
    5: [
        'Sản phẩm tuyệt vời, đóng gói cẩn thận, giao hàng nhanh. Rất hài lòng!',
        'Chất lượng vượt kỳ vọng, dùng thử 1 tuần vẫn hoạt động ổn định. 5 sao xứng đáng!',
        'Mua lần đầu ở đây, sẽ quay lại mua tiếp. Sản phẩm y hình, shopee uy tín.',
        'Giao hàng siêu nhanh, sản phẩm nguyên seal, chính hãng 100%. Cảm ơn shop!',
        'Dùng được 2 tuần rồi, không có gì phàn nàn. Pin trâu, màn hình đẹp. Mua ngay đi!',
        'Cực kỳ ưng ý, camera chụp đẹp hơn mong đợi, giá tốt so với thị trường.',
        'Đặt buổi sáng, chiều đã có hàng. Sản phẩm đúng mô tả, hoàn toàn hài lòng!',
        'Chất lượng 10/10. Mình mua tặng người thân, ai cũng khen. Shop giao hàng rất cẩn thận.',
    ],
    4: [
        'Sản phẩm tốt, giao hàng đúng hẹn. Chỉ tiếc hộp bị móp một chút do vận chuyển.',
        'Chất lượng khá ổn, xứng đáng với giá. Giao hàng hơi chậm nhưng chấp nhận được.',
        'Dùng ổn, không có vấn đề gì. Mình thấy pin hơi yếu hơn quảng cáo nhưng vẫn đủ dùng.',
        'Nhìn chung hài lòng, sản phẩm đúng mô tả. Shop tư vấn nhiệt tình.',
        'Máy chạy mượt, thiết kế đẹp. Trừ 1 sao vì thời gian xử lý đơn hơi chậm.',
        'Sản phẩm tốt trong tầm giá này. Cần cải thiện thêm về dịch vụ sau bán hàng.',
        'Mua về dùng thấy ổn, không phát sinh lỗi sau 1 tuần. Đáng mua!',
    ],
    3: [
        'Sản phẩm tạm được, không có gì đặc biệt. Phù hợp với nhu cầu cơ bản.',
        'Chất lượng trung bình, tương xứng với mức giá. Không quá tệ cũng không quá tốt.',
        'Dùng được nhưng cảm giác không hoàn toàn như mô tả. Vẫn chấp nhận được.',
        'Sản phẩm bình thường, giao hàng chậm hơn dự kiến. Mong shop cải thiện.',
        'Ổn nhưng mình kỳ vọng cao hơn. Sẽ cân nhắc trước khi mua tiếp.',
    ],
    2: [
        'Sản phẩm kém hơn quảng cáo khá nhiều. Hơi thất vọng về chất lượng.',
        'Giao hàng chậm, sản phẩm không hoàn toàn đúng mô tả. Cần cải thiện nhiều.',
        'Dùng được 3 ngày đã phát sinh lỗi nhỏ. Shop hỗ trợ khá lâu.',
    ],
    1: [
        'Chất lượng không như mong đợi, rất thất vọng. Mong shop kiểm tra lại sản phẩm.',
        'Sản phẩm bị lỗi ngay khi mở hộp, liên hệ shop mãi chưa được giải quyết.',
    ],
};

function pickRating() {
    // Phân phối: 5⭐ nhiều nhất để realistic hơn
    const rand = Math.random();
    if (rand < 0.40) return 5;
    if (rand < 0.65) return 4;
    if (rand < 0.80) return 3;
    if (rand < 0.92) return 2;
    return 1;
}

function pickComment(rating) {
    const pool = reviewsByRating[rating] || reviewsByRating[3];
    return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Seed function ─────────────────────────────────────────────────────────
async function seedReviews() {
    await mongoose.connect(process.env.CONNECT_DB);
    console.log('✅ MongoDB connected');

    // Lấy tất cả users (dùng làm reviewers)
    const users = await User.find({}).select('_id').limit(30).lean();
    if (users.length === 0) {
        console.error('❌ Không có user nào trong DB. Hãy seed users trước.');
        process.exit(1);
    }
    console.log(`👤 Tìm thấy ${users.length} users`);

    // Lấy tất cả sản phẩm active
    const products = await Product.find({ isActive: true }).select('_id name sold').lean();
    if (products.length === 0) {
        console.error('❌ Không có sản phẩm nào. Hãy seed products trước.');
        process.exit(1);
    }
    console.log(`📦 Tìm thấy ${products.length} sản phẩm`);

    // Xóa reviews cũ để tránh lỗi unique index
    await Review.deleteMany({});
    console.log('🗑️  Đã xóa reviews cũ');

    let totalCreated = 0;

    for (const product of products) {
        const reviews = [];
        const usedUserIndices = new Set();

        const count = 8 + Math.floor(Math.random() * 5); // 8-12 reviews mỗi sản phẩm

        for (let i = 0; i < count; i++) {
            // Chọn user không trùng lặp
            let userIdx;
            let attempts = 0;
            do {
                userIdx = Math.floor(Math.random() * users.length);
                attempts++;
            } while (usedUserIndices.has(userIdx) && attempts < 50);

            if (usedUserIndices.has(userIdx)) continue; // Bỏ qua nếu hết user khác
            usedUserIndices.add(userIdx);

            const rating = pickRating();
            const fakeOrderId = new Types.ObjectId(); // fake order ID để bypass required
            const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // random trong 90 ngày qua

            reviews.push({
                product: product._id,
                user: users[userIdx]._id,
                order: fakeOrderId,
                rating,
                content: pickComment(rating),
                images: [],
                reply: { content: null, repliedAt: null },
                createdAt,
                updatedAt: createdAt,
            });
        }

        if (reviews.length > 0) {
            await Review.insertMany(reviews, { ordered: false }).catch(() => {}); // ignore duplicate errors
            totalCreated += reviews.length;

            // Cập nhật sold count cho sản phẩm dựa trên số lượng reviews (fake tương quan)
            const soldBoost = reviews.length * (5 + Math.floor(Math.random() * 15));
            await Product.findByIdAndUpdate(product._id, {
                $inc: { sold: soldBoost },
            });

            console.log(`  ✅ ${product.name.substring(0, 50)} → ${reviews.length} reviews, sold +${soldBoost}`);
        }
    }

    console.log(`\n🎉 Hoàn thành! Đã tạo ${totalCreated} đánh giá cho ${products.length} sản phẩm.`);
    await mongoose.disconnect();
    process.exit(0);
}

seedReviews().catch((err) => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
});

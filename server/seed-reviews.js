const mongoose = require('mongoose');
const mongooseTypes = require('mongoose').Types;
const Review = require('./src/models/review.model');

const MONGO_URI = "mongodb://localhost:27017/tmdt3";
const PRODUCT_ID = "69dc65c12216c15e789b0158";

const reviewData = [
    {
        rating: 5,
        content: "Sản phẩm thực sự rất ấn tượng, vượt xa mong đợi. Vỏ ngoài làm bằng vật liệu cao cấp, cầm rất chắc tay. Công năng sử dụng phù hợp với giá tiền. Tuy nhiên nếu hãng cải thiện thêm phần phụ kiện thì sẽ tốt hơn rất nhiều. Sẽ tiếp tục mua ủng hộ!",
        pros: ["Thiết kế đẹp", "Hoàn thiện tốt", "Chất liệu cao cấp"],
        cons: ["Phụ kiện đi kèm ít"],
    },
    {
        rating: 4,
        content: "Hàng giao nhanh, đóng gói cẩn thận. Mọi thứ hoạt động trơn tru. Có một điểm trừ nhỏ là màu sắc ở ngoài trông hơi nhạt hơn so với ảnh chụp trên web. Nhìn chung vẫn là một sản phẩm chất lượng đáng mua trong phân khúc này.",
        pros: ["Giao hàng nhanh", "Đóng gói cẩn thận", "Hiệu năng ổn"],
        cons: ["Màu sắc chưa giống ảnh 100%"],
    },
    {
        rating: 5,
        content: "Shop tư vấn vô cùng nhiệt tình, giải đáp mọi thắc mắc của mình trước khi mua. Sản phẩm khi nhận được nguyên đai nguyên kiện, check mã vạch chuẩn chính hãng. Cảm giác sử dụng rất đã, tính năng hoạt động mượt mà không có điểm gì để chê.",
        pros: ["Nhân viên tư vấn tốt", "Hàng chính hãng", "Trải nghiệm mượt mà"],
        cons: [],
    },
    {
        rating: 3,
        content: "Giao hàng hơi chậm do bên vận chuyển bị lỗi kho, mình mất gần 1 tuần mới nhận được. Sản phẩm xài tạm ổn, không quá xuất sắc nhưng cũng không quá tệ. So với mức giá này thì mình thấy ở mức chấp nhận được chứ chưa đáng gọi là món hời.",
        pros: ["Giá hợp lý"],
        cons: ["Giao hàng chậm", "Chất lượng tầm trung"],
    },
    {
        rating: 2,
        content: "Nhận hàng mở ra thấy hộp bị móp nhẹ ở một góc, dù sản phẩm bên trong không sao nhưng vẫn trừ điểm đóng gói. Máy dùng hơi nóng khi sử dụng liên tục khoảng hơn 1 tiếng. Mình phải mua thêm tản nhiệt để giải quyết.",
        pros: [],
        cons: ["Đóng gói kém", "Dễ bị nóng"],
        images: ["https://placehold.co/600x400?text=Hop+bị+mop"]
    },
    {
        rating: 5,
        content: "Chất lượng cực kỳ hoàn hảo! Mình đã dùng liên tục mấy ngày qua và thấy pin trâu, kết nối ổn định. Một điểm cộng lớn là thiết kế vô cùng nhỏ gọn, có thể dễ dàng mang theo trong balo để làm việc ở bất cứ đâu. Rất recommend mọi người nên mua nhé.",
        pros: ["Pin trâu", "Nhỏ gọn dễ mang", "Kết nối ổn định"],
        cons: [],
    },
    {
        rating: 4,
        content: "Máy móc chạy ngon lành, âm thanh to rõ, tính năng dễ sử dụng kể cả với người không rành công nghệ. Dù ban đầu mình hơi băn khoăn về thương hiệu nhưng sau khi trải nghiệm thử thì thấy rất ưng ý. Chỉ ước là có thêm nhiều lựa chọn màu sắc hơn 😅",
        pros: ["Âm thanh tốt", "Dễ sử dụng"],
        cons: ["Ít tùy chọn màu sắc"],
    },
    {
        rating: 5,
        content: "Đây là lần thứ 3 mình quay lại mua hàng của shop này và chưa bao giờ phải thất vọng cả. Sản phẩm đúng như mô tả, thậm chí cầm trên tay còn đẹp hơn mong đợi. Mình có gọi điện lúc 10h tối hỏi về cách lắp đặt mà anh chủ vẫn hỗ trợ rất nhiệt tình.",
        pros: ["Thiết kế đẹp hơn ảnh", "Hỗ trợ khách hàng tuyệt vời", "Uy tín"],
        cons: [],
    },
    {
        rating: 1,
        content: "Quá thất vọng! Sản phẩm bị lỗi ngay từ khi vừa đập hộp, bật nguồn không lên. Gọi cho shop lúc đầu không ai nhấc máy, phải nhắn tin rất nhiều mới phản hồi và hướng dẫn thủ tục đổi trả cực kỳ lằng nhằng. Trải nghiệm mua sắm tệ nhất từ trước tới nay của mình.",
        pros: [],
        cons: ["Hàng bị lỗi ngay khi mở", "Dịch vụ sau bán hàng kém", "Quy trình đổi trả phức tạp"],
    },
    {
        rating: 4,
        content: "Nhìn chung, với số tiền bỏ ra, đây là một lựa chọn kinh tế. Mặc dù các tính năng không bằng hàng cao cấp đắt tiền, nhưng nó đáp ứng đầy đủ nhu cầu cơ bản hằng ngày của mình. Một lựa chọn an toàn cho những ai muốn tiết kiệm ngân sách.",
        pros: ["Giá mềm", "Đáp ứng tốt nhu cầu cơ bản", "Kinh tế"],
        cons: ["Thiếu tính năng cao cấp"],
    }
];

async function seed() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        console.log('Clearing old reviews for this product...');
        await Review.deleteMany({ product: PRODUCT_ID });

        console.log('Inserting 10 fake reviews...');
        const newReviews = [];
        for (let i = 0; i < reviewData.length; i++) {
            const data = reviewData[i];
            
            // Create fake ObjectId for user and order
            const fakeUser = new mongooseTypes.ObjectId();
            const fakeOrder = new mongooseTypes.ObjectId();

            const review = {
                product: PRODUCT_ID,
                user: fakeUser,
                order: fakeOrder,
                rating: data.rating,
                content: data.content,
                images: data.images || []
            };

            // Tùy chọn add phản hồi của người bán cho 1-2 bình luận
            if (i === 1) {
                review.reply = {
                    content: "Dạ shop cảm ơn bạn đã góp ý ạ! Shop sẽ cố gắng cải thiện chất lượng hình ảnh trên Web để sát với thực tế nhất có thể. Chúc bạn sử dụng sản phẩm vui vẻ nha!",
                    repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 ngày trước
                }
            } else if (i === 8) {
                review.reply = {
                    content: "Dạ shop thành thật xin lỗi vì sự cố với sản phẩm và trải nghiệm không tốt của bạn. Bên mình đã liên hệ trực tiếp để hỗ trợ gửi xe đổi máy mới hỏa tốc trong ngày. Mong bạn thông cảm cho sai sót lần này ạ.",
                    repliedAt: new Date(),
                }
            }

            newReviews.push(review);
        }

        await Review.insertMany(newReviews);
        console.log('Insert complete! Fake reviews added.');
    } catch (err) {
        console.error('Error seeding DB:', err);
    } finally {
        // Disconnect
        mongoose.disconnect();
    }
}

seed();

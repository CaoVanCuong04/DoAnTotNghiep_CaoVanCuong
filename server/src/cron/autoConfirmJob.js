const cron = require('node-cron');
const Order = require('../models/order.model');
const OrderService = require('../services/order.service');

// Khởi chạy lúc 02:00 sáng mỗi ngày
// Sẽ quét các đơn hàng trạng thái 'delivered' quá 3 ngày và tự động chuyển sang 'received'
const startAutoConfirmReceivedJob = () => {
    // cron string: '0 2 * * *' (Mỗi 2h sáng)
    cron.schedule('0 2 * * *', async () => {
        console.log('🔄 [CRON] Đang chạy cron job auto-confirm-received...');
        try {
            // Lấy thời điểm cách đây 3 ngày (tương đối)
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            // Tìm đơn 'delivered' có deliveredAt <= 3 ngày trước (hoặc deliveredAt = null do dữ liệu cũ)
            const pendingOrders = await Order.find({
                orderStatus: 'delivered',
                $or: [
                    { deliveredAt: { $lte: threeDaysAgo } },
                    { deliveredAt: null } // Dùng cho những đơn cũ không có timestamp
                ]
            }).select('_id user').lean();

            if (pendingOrders.length === 0) {
                console.log('✅ [CRON] Không có đơn hàng nào cần tự động nhận.');
                return;
            }

            let successCount = 0;
            for (const order of pendingOrders) {
                try {
                    // Gọi service bằng user._id của chính order đó để qua hàm kiểm tra
                    await OrderService.confirmOrderReceived(order.user, order._id);
                    successCount++;
                } catch (err) {
                    console.error(`❌ [CRON] Lỗi khi auto-confirm đơn ${order._id}:`, err.message);
                }
            }

            console.log(`✅ [CRON] Hoàn tất auto-confirm ${successCount}/${pendingOrders.length} đơn hàng.`);
        } catch (error) {
            console.error('❌ [CRON] Lỗi tổng thể trong job auto-confirm-received:', error);
        }
    }, {
        timezone: "Asia/Ho_Chi_Minh"
    });
    
    console.log('🕒 Cron job auto-confirm-received đã được đăng ký (chạy lúc 02:00 sáng hằng ngày).');
};

module.exports = startAutoConfirmReceivedJob;

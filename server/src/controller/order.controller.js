const { OK, Created } = require('../core/success.response');
const OrderService = require('../services/order.service');

class OrderController {
    // POST /api/orders
    createOrder = async (req, res, next) => {
        try {
            const order = await OrderService.createOrder(req.user.id, req.body);
            new Created({ message: 'Đặt hàng thành công', metadata: order }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/orders/:id/tracking
    getTracking = async (req, res, next) => {
        try {
            const data = await OrderService.getGhnTracking(req.user.id, req.params.id);
            new OK({ message: 'Lấy thông tin vận chuyển thành công', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/orders
    getOrders = async (req, res, next) => {
        try {
            const orders = await OrderService.getOrders(req.user.id);
            new OK({ message: 'Danh sách đơn hàng', metadata: orders }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/orders/:id
    getOrderById = async (req, res, next) => {
        try {
            const order = await OrderService.getOrderById(req.user.id, req.params.id);
            new OK({ message: 'Chi tiết đơn hàng', metadata: order }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // PUT /api/orders/:id/cancel
    cancelOrder = async (req, res, next) => {
        try {
            const { order, refundAmount } = await OrderService.cancelOrder(req.user.id, req.params.id);
            const msg =
                refundAmount > 0
                    ? `Hủy đơn thành công. ${refundAmount.toLocaleString('vi-VN')}đ đã được hoàn vào ví của bạn.`
                    : 'Hủy đơn hàng thành công';
            new OK({ message: msg, metadata: order }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // PUT /api/orders/:id/confirm-received
    confirmReceived = async (req, res, next) => {
        try {
            const order = await OrderService.confirmOrderReceived(req.user.id, req.params.id);
            new OK({ message: 'Đã xác nhận nhận hàng thành công', metadata: order }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/orders/momo/ipn  (callback từ MoMo)
    momoIPN = async (req, res, next) => {
        try {
            const { orderInfo } = req.query;
            const id = orderInfo.split(' ')[4];
            const order = await OrderService.handleMoMoIPN(id);
            res.redirect(`http://localhost:5173/checkout/success/${order._id}?status=momo`);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/orders/vnpay/return  (redirect sau khi thanh toán VNPay)
    vnpayReturn = async (req, res, next) => {
        try {
            const { vnp_OrderInfo, vnp_ResponseCode } = req.query;
            console.log(req.query);

            if (vnp_ResponseCode === '00') {
                const idCart = vnp_OrderInfo.split(' ')[4];
                const order = await OrderService.handleVNPayReturn(idCart);
                res.redirect(`http://localhost:5173/checkout/success/${order._id}?status=vnpay`);
            } else {
                return;
            }
        } catch (error) {
            next(error);
        }
    };
    // [ADMIN] GET /api/orders/admin/all
    adminGetAllOrders = async (req, res, next) => {
        try {
            const { status, paymentMethod, search, page, limit } = req.query;
            const data = await OrderService.adminGetAllOrders({
                status,
                paymentMethod,
                search,
                page: Number(page) || 1,
                limit: Number(limit) || 15,
            });
            new OK({ message: 'Danh sách tất cả đơn hàng', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] PATCH /api/orders/admin/:id/status
    adminUpdateStatus = async (req, res, next) => {
        try {
            const order = await OrderService.adminUpdateOrderStatus(req.params.id, req.body);
            new OK({ message: 'Cập nhật trạng thái thành công', metadata: order }).send(res);
        } catch (err) {
            next(err);
        }
    };
    // [ADMIN] GET /api/orders/admin/:id/detail
    adminGetOrderById = async (req, res, next) => {
        try {
            const order = await OrderService.adminGetOrderById(req.params.id);
            new OK({ message: 'Chi tiết đơn hàng', metadata: order }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] POST /api/orders/admin/:id/refund
    adminRefundOrder = async (req, res, next) => {
        try {
            const { refundAmount, reason } = req.body;
            const data = await OrderService.adminRefundOrder(req.params.id, refundAmount, reason);
            new OK({
                message: `Hoàn tiền ${data.refundAmount.toLocaleString('vi-VN')}đ thành công`,
                metadata: data.order,
            }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] POST /api/orders/admin/:id/dispute
    adminResolveDispute = async (req, res, next) => {
        try {
            const { resolution, adminNote } = req.body;
            const order = await OrderService.adminResolveDispute(req.params.id, resolution, adminNote);
            new OK({ message: 'Xử lý tranh chấp thành công', metadata: order }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] GET /api/orders/admin/dashboard-stats
    adminGetDashboardStats = async (req, res, next) => {
        try {
            const data = await OrderService.adminGetDashboardStats();
            new OK({ message: 'Thống kê dashboard', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new OrderController();

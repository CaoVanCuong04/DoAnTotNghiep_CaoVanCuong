const express = require('express');
const router = express.Router();
const orderController = require('../controller/order.controller');
const { authUser, authAdmin } = require('../auth/checkAuth');

// Callback routes (không cần auth)
router.get('/momo/ipn', orderController.momoIPN);
router.get('/vnpay/return', orderController.vnpayReturn);

// ─── Admin routes (yêu cầu quyền admin) ───
router.get('/admin/dashboard-stats', authAdmin, orderController.adminGetDashboardStats);
router.get('/admin/all', authAdmin, orderController.adminGetAllOrders);
router.get('/admin/:id/detail', authAdmin, orderController.adminGetOrderById);
router.patch('/admin/:id/status', authAdmin, orderController.adminUpdateStatus);
router.post('/admin/:id/refund', authAdmin, orderController.adminRefundOrder);
router.post('/admin/:id/dispute', authAdmin, orderController.adminResolveDispute);

// ─── User routes (yêu cầu đăng nhập) ───
router.use(authUser);
router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/tracking', orderController.getTracking);
router.put('/:id/confirm-received', orderController.confirmReceived);
router.put('/:id/cancel', orderController.cancelOrder);

module.exports = router;

const express = require('express');
const router = express.Router();
const returnController = require('../controller/return.controller');
const { authUser } = require('../auth/checkAuth');
const { authSeller, authAdmin } = require('../auth/checkAuth');
const { uploadWebsite } = require('../config/cloudinaryUpload');

// --- TẤT CẢ CÁC ROUTES DƯỚI ĐÂY YÊU CẦU ĐĂNG NHẬP ---
router.use(authUser);

// --- BUYER ROUTES ---
// Lấy danh sách yêu cầu hoàn trả của bản thân
router.get('/my', returnController.getUserRequests);
// Tạo yêu cầu hoàn trả (payload: orderId, reason, description, images)
router.post('/create', uploadWebsite.array('images', 5), returnController.createRequest);

// --- SELLER ROUTES ---
router.use(authSeller);

// Seller lấy danh sách các yêu cầu hoàn trả gửi đến shop của mình
router.get('/seller', returnController.getSellerRequests);
// Seller phản hồi yêu cầu hoàn trả (approve / reject)
router.post('/seller/:id/respond', returnController.sellerRespond);

module.exports = router;

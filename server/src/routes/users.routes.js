const express = require('express');
const router = express.Router();

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const userController = require('../controller/user.controller');

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

router.post('/register', asyncHandler(userController.createUser));
router.get('/auth', authUser, asyncHandler(userController.auth));
router.post('/login', asyncHandler(userController.login));
router.post('/logout', authUser, asyncHandler(userController.logout));
router.get('/refresh-token', asyncHandler(userController.refreshToken));
router.post('/login-google', asyncHandler(userController.loginGoogle));
router.post('/forgot-password', asyncHandler(userController.forgotPassword));
router.post('/reset-password', asyncHandler(userController.resetPassword));
router.put('/change-password', authUser, asyncHandler(userController.changePassword));
router.put('/update', authUser, asyncHandler(userController.updateUser));
router.post('/upload-avatar', authUser, upload.single('avatar'), asyncHandler(userController.uploadAvatar));
router.post('/chatbot', authUser, asyncHandler(userController.chatbot));
router.get('/message-chatbot', authUser, asyncHandler(userController.getMessageChatbot));

// ─── Legacy admin routes (kept for compat) ───
router.get('/admin/users', authAdmin, asyncHandler(userController.getAllUser));
router.put('/admin/users/:id', authAdmin, asyncHandler(userController.updateUserAdmin));
router.delete('/admin/users/:id', authAdmin, asyncHandler(userController.deleteUser));

// ─── [ADMIN] Quản lý người dùng ───
router.get('/admin/manage/list', authAdmin, asyncHandler(userController.adminGetUsers));
router.get('/admin/manage/stats', authAdmin, asyncHandler(userController.adminGetUserStats));
router.patch('/admin/manage/:id/status', authAdmin, asyncHandler(userController.adminToggleUserStatus));
router.patch('/admin/manage/:id/reset-password', authAdmin, asyncHandler(userController.adminResetPassword));
router.get('/admin/manage/:id/orders', authAdmin, asyncHandler(userController.adminGetUserOrders));

// ─── Địa chỉ giao hàng ────────────────────────────────────────────────────
router.get('/addresses', authUser, asyncHandler(userController.getAddresses));
router.post('/addresses', authUser, asyncHandler(userController.addAddress));
router.put('/addresses/:addressId', authUser, asyncHandler(userController.updateAddress));
router.delete('/addresses/:addressId', authUser, asyncHandler(userController.deleteAddress));
router.put('/addresses/:addressId/default', authUser, asyncHandler(userController.setDefaultAddress));

module.exports = router;

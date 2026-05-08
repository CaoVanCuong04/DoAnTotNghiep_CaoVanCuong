const express = require('express');
const router = express.Router();
const walletController = require('../controller/wallet.controller');
const { asyncHandler, authAdmin, authUser } = require('../auth/checkAuth');

// All admin-only
router.get('/admin/stats', authAdmin, asyncHandler(walletController.adminGetStats));
router.get('/admin/sellers', authAdmin, asyncHandler(walletController.adminGetSellerWallets));
router.get('/admin/transactions', authAdmin, asyncHandler(walletController.adminGetTransactions));
router.get('/admin/withdrawals', authAdmin, asyncHandler(walletController.adminGetWithdrawals));
router.post('/admin/withdrawals/:id/approve', authAdmin, asyncHandler(walletController.adminApproveWithdrawal));
router.post('/admin/withdrawals/:id/reject', authAdmin, asyncHandler(walletController.adminRejectWithdrawal));
router.post('/admin/adjust', authAdmin, asyncHandler(walletController.adminAdjustBalance));
// User routes
router.get('/me', authUser, asyncHandler(walletController.getUserWallet));
router.post('/withdraw', authUser, asyncHandler(walletController.requestWithdrawal));

module.exports = router;

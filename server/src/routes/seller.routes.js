const express = require('express');
const router = express.Router();
const multer = require('multer');
const sellerController = require('../controller/seller.controller');
const { authSeller } = require('../auth/checkAuth');

const upload = multer({ storage: multer.memoryStorage() });

// All routes require seller auth (checks role=seller + active store)
router.use(authSeller);

// Products
router.post('/products', upload.array('images', 10), sellerController.createProduct);
router.get('/products', sellerController.getMyProducts);
router.put('/products/:id', upload.array('images', 10), sellerController.updateProduct);
router.delete('/products/:id', sellerController.deleteProduct);
router.patch('/products/:id/flash-sale', sellerController.updateFlashSale);

// Orders
router.get('/orders', sellerController.getMyOrders);
router.put('/orders/:orderId/items/:itemId', sellerController.updateItemStatus);

// Analytics
router.get('/analytics', sellerController.getAnalytics);

// Coupons
router.post('/coupons', sellerController.createCoupon);
router.get('/coupons', sellerController.getMyCoupons);
router.put('/coupons/:id', sellerController.updateCoupon);
router.delete('/coupons/:id', sellerController.deleteCoupon);

// Reviews
router.get('/reviews', sellerController.getMyStoreReviews);
router.post('/reviews/:id/reply', sellerController.replyToReview);

// Wallet
router.get('/wallet', sellerController.getMyWallet);
router.post('/wallet/withdraw', sellerController.requestWithdrawal);

module.exports = router;

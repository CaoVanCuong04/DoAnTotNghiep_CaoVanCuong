const express = require('express');
const router = express.Router();

const cartController = require('../controller/cart.controller');
const { asyncHandler, authUser } = require('../auth/checkAuth');

// Tất cả routes đều yêu cầu đăng nhập
router.get('/', authUser, asyncHandler(cartController.getCart));
router.post('/add', authUser, asyncHandler(cartController.addItem));
router.put('/item/:productId', authUser, asyncHandler(cartController.updateItem));
router.delete('/item/:productId', authUser, asyncHandler(cartController.removeItem));
router.delete('/clear', authUser, asyncHandler(cartController.clearCart));
router.post('/sync', authUser, asyncHandler(cartController.syncCart));
router.patch('/shipping', authUser, asyncHandler(cartController.updateShipping));

module.exports = router;

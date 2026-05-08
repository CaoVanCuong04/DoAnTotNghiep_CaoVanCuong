const express = require('express');
const router = express.Router();

const wishlistController = require('../controller/wishlist.controller');
const { asyncHandler, authUser } = require('../auth/checkAuth');

// Tất cả routes yêu cầu đăng nhập
router.use(authUser);

router.get('/', asyncHandler(wishlistController.getMyWishlist));
router.get('/count', asyncHandler(wishlistController.count));
router.get('/check/:productId', asyncHandler(wishlistController.checkStatus));
router.post('/:productId', asyncHandler(wishlistController.toggle));
router.delete('/:productId', asyncHandler(wishlistController.remove));

module.exports = router;

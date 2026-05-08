const express = require('express');
const router = express.Router();
const couponController = require('../controller/coupon.controller');
const { authUser, authAdmin } = require('../auth/checkAuth');

// ─── Public routes ───
router.get('/public', couponController.getPublicCoupons);

// ─── User routes (specific paths FIRST, before /:id params) ───
router.get('/available', authUser, couponController.getAvailableCoupons);
router.get('/check/:code', authUser, couponController.checkCoupon);
router.post('/apply', authUser, couponController.applyCoupon);
router.delete('/remove', authUser, couponController.removeCoupon);

// ─── Admin routes ───
router.get('/', authAdmin, couponController.getAllCoupons);
router.post('/', authAdmin, couponController.createCoupon);
router.put('/:id', authAdmin, couponController.updateCoupon);
router.delete('/:id', authAdmin, couponController.deleteCoupon);

module.exports = router;

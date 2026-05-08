const express = require('express');
const router = express.Router();
const { asyncHandler, authUser } = require('../auth/checkAuth');
const GhnService = require('../utils/GHN/ghn.service');

// Public — master data
router.get('/provinces', GhnService.getProvinces.bind(GhnService));
router.get('/districts', GhnService.getDistricts.bind(GhnService));
router.get('/wards', GhnService.getWards.bind(GhnService));

// Protected — requires login (reads user's cart)
router.post('/calculate-fee', authUser, asyncHandler(GhnService.calculateFee.bind(GhnService)));

module.exports = router;

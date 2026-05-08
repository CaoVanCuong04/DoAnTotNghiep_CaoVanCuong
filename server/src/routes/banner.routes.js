const express = require('express');
const router = express.Router();
const bannerController = require('../controller/banner.controller');
const { asyncHandler, authAdmin } = require('../auth/checkAuth');
const { uploadBanner } = require('../config/cloudinaryUpload');

// ─── [PUBLIC] ────────────────────────────────────────────────────────────
// Get active banners for frontend display
router.get('/active', asyncHandler(bannerController.getActiveBanners));

// ─── [ADMIN] Quản lý Banner ──────────────────────────────────────────────
router.get('/admin/manage', authAdmin, asyncHandler(bannerController.getAllBanners));
router.post(
    '/admin/manage',
    authAdmin,
    uploadBanner.single('image'),
    asyncHandler(bannerController.createBanner),
);
router.put(
    '/admin/manage/:id',
    authAdmin,
    uploadBanner.single('image'),
    asyncHandler(bannerController.updateBanner),
);
router.delete('/admin/manage/:id', authAdmin, asyncHandler(bannerController.deleteBanner));
router.patch('/admin/manage/:id/toggle', authAdmin, asyncHandler(bannerController.toggleBanner));

module.exports = router;

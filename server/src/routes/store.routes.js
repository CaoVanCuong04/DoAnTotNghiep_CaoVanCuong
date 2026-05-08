const express = require('express');
const router = express.Router();
const multer = require('multer');
const storeController = require('../controller/store.controller');
const followController = require('../controller/follow.controller');
const { authUser, authAdmin, authSeller } = require('../auth/checkAuth');

const upload = multer({ storage: multer.memoryStorage() });
const storeUpload = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
]);

// ── User (register) — must be before /:slug ──
router.post('/register', authUser, storeUpload, storeController.register);

// ── User (check own store status — no seller role needed) ──
router.get('/my-status', authUser, storeController.getMyStoreStatus);

// ── Seller (manage own store) — must be before /:slug ──
router.get('/me', authSeller, storeController.getMyStore);
router.put('/me', authSeller, storeUpload, storeController.updateMyStore);

// ── Admin ──────────────────────────────
router.get('/admin', authAdmin, storeController.getAllStores);
router.put('/:id/status', authAdmin, storeController.updateStatus);

// ── Follow — must be before /:slug ──
router.get('/following/list', authUser, followController.list);

// ── Public ──────────────────────────
router.get('/:slug/products', storeController.getStoreProducts);
router.get('/:slug', storeController.getBySlug);

// ── Follow routes with storeId param ──
router.get('/:storeId/follow', authUser, followController.check);
router.post('/:storeId/follow', authUser, followController.toggle);

module.exports = router;


const express = require('express');
const router = express.Router();

const productController = require('../controller/product.controller');
const { asyncHandler, authAdmin } = require('../auth/checkAuth');
const { uploadProduct } = require('../config/cloudinaryUpload');

// ─── Public routes ───
router.get('/', asyncHandler(productController.getAllProducts));
router.get('/category/:slug', asyncHandler(productController.getProductsByCategory));
router.get('/slug/:slug', asyncHandler(productController.getProductBySlug));
router.get('/:id', asyncHandler(productController.getProductById));

// ─── Admin routes ───
router.get('/admin/all', authAdmin, asyncHandler(productController.getAllProductsAdmin));
router.post(
    '/admin/create',
    authAdmin,
    uploadProduct.array('images', 10),
    asyncHandler(productController.createProduct),
);
router.put('/admin/:id', authAdmin, uploadProduct.array('images', 10), asyncHandler(productController.updateProduct));
router.delete('/admin/:id', authAdmin, asyncHandler(productController.deleteProduct));
router.patch('/admin/:id/toggle', authAdmin, asyncHandler(productController.toggleProduct));

module.exports = router;

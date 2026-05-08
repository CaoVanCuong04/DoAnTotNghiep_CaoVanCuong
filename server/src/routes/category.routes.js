const express = require('express');
const router = express.Router();

const categoryController = require('../controller/category.controller');
const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

// Public routes
router.get('/', asyncHandler(categoryController.getAllCategories));
router.get('/slug/:slug', asyncHandler(categoryController.getCategoryBySlug));
router.get('/:id', asyncHandler(categoryController.getCategoryById));

// Admin routes
router.get('/admin/all', authAdmin, asyncHandler(categoryController.getAllCategoriesFlat));
router.post('/admin/create', authAdmin, asyncHandler(categoryController.createCategory));
router.put('/admin/:id', authAdmin, asyncHandler(categoryController.updateCategory));
router.delete('/admin/:id', authAdmin, asyncHandler(categoryController.deleteCategory));
router.patch('/admin/:id/toggle', authAdmin, asyncHandler(categoryController.toggleCategory));

module.exports = router;

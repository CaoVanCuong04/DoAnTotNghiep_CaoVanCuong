const express = require('express');
const router = express.Router();
const reportController = require('../controller/report.controller');
const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

// ─── Admin routes ───
router.get('/admin/all', authAdmin, asyncHandler(reportController.adminGetAllReports));
router.get('/admin/:id', authAdmin, asyncHandler(reportController.adminGetReport));
router.patch('/admin/:id', authAdmin, asyncHandler(reportController.adminUpdateReport));
router.delete('/admin/:id', authAdmin, asyncHandler(reportController.adminDeleteReport));

// ─── User / Seller routes ───
router.post('/', authUser, asyncHandler(reportController.createReport));
router.get('/my', authUser, asyncHandler(reportController.getMyReports));

module.exports = router;

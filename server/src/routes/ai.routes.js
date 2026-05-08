const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../auth/checkAuth');
const aiController = require('../controller/ai.controller');

// Chat (public — auth optional, tự detect trong controller)
router.post('/chat', asyncHandler(aiController.chat));

// Lịch sử chat (public — auth optional)
router.get('/history', asyncHandler(aiController.getHistory));
router.delete('/history', asyncHandler(aiController.clearHistory));

// Các route AI khác
router.post('/recommendations', asyncHandler(aiController.recommendations));
router.post('/search', asyncHandler(aiController.naturalLanguageSearch));
router.get('/sentiment/:productId', asyncHandler(aiController.sentiment));

module.exports = router;

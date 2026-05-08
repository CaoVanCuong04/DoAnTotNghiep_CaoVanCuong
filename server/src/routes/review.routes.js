const express = require('express');
const router = express.Router();
const multer = require('multer');
const reviewController = require('../controller/review.controller');
const { authUser } = require('../auth/checkAuth');

const upload = multer({ storage: multer.memoryStorage() });

// Specific paths BEFORE :id params
router.get('/public', reviewController.getPublicReviews); // public
router.get('/product/:productId', reviewController.getProductReviews); // public
router.get('/reviewable', authUser, reviewController.getReviewableItems); // user
router.post('/', authUser, upload.array('images', 5), reviewController.createReview); // user
router.put('/:id', authUser, upload.array('images', 5), reviewController.updateReview); // user
router.delete('/:id', authUser, reviewController.deleteReview); // user

module.exports = router;

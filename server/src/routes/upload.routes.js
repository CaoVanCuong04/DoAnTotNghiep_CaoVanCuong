const express = require('express');
const router = express.Router();
const uploadController = require('../controller/upload.controller');
const { asyncHandler } = require('../auth/checkAuth');
const { uploadWebsite } = require('../config/cloudinaryUpload');

router.post('/', uploadWebsite.single('file'), asyncHandler(uploadController.uploadImage));

module.exports = router;

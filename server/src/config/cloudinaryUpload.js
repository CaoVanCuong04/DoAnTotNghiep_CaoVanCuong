const multer = require('multer');
const cloudinary = require('./cloudDinary');
const { Readable } = require('stream');

// Sử dụng memory storage để lưu file tạm trong buffer
const storage = multer.memoryStorage();

// File filter cho ảnh
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh!'), false);
    }
};

// Hàm upload buffer lên Cloudinary
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            },
        );

        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

// Upload single file lên Cloudinary
const uploadSingle = async (file, folder) => {
    if (!file) return null;
    const result = await uploadToCloudinary(file.buffer, folder);
    return result.secure_url;
};

// Upload multiple files lên Cloudinary
const uploadMultiple = async (files, folder) => {
    if (!files || files.length === 0) return [];
    const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, folder));
    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.secure_url);
};

// Xóa ảnh từ Cloudinary bằng public_id
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
};

// Extract public_id từ Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{filename}
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    // Get folder/filename without extension
    const pathParts = parts.slice(uploadIndex + 1);
    const fullPath = pathParts.join('/');
    // Remove file extension
    return fullPath.replace(/\.[^/.]+$/, '');
};

// Multer instances cho các modules khác nhau
const uploadAvatar = multer({ storage, fileFilter: imageFilter });
const uploadCategory = multer({ storage, fileFilter: imageFilter });
const uploadProduct = multer({ storage, fileFilter: imageFilter });
const uploadWebsite = multer({ storage, fileFilter: imageFilter });
const uploadBanner = multer({ storage, fileFilter: imageFilter });

module.exports = {
    uploadAvatar,
    uploadCategory,
    uploadProduct,
    uploadWebsite,
    uploadBanner,
    uploadSingle,
    uploadMultiple,
    deleteFromCloudinary,
    getPublicIdFromUrl,
};

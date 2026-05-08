const { uploadSingle } = require('../config/cloudinaryUpload');
const { OK } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class UploadController {
    uploadImage = async (req, res) => {
        if (!req.file) {
            throw new BadRequestError('Vui lòng chọn file');
        }

        const url = await uploadSingle(req.file, 'TMDT/general');

        if (!url) {
            throw new BadRequestError('Upload ảnh thất bại');
        }

        new OK({
            message: 'Upload thành công',
            metadata: url,
        }).send(res);
    };
}

module.exports = new UploadController();

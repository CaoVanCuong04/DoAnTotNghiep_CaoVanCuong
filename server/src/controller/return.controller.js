const { OK, Created } = require('../core/success.response');
const ReturnService = require('../services/return.service');
const { uploadMultiple } = require('../config/cloudinaryUpload');

class ReturnController {
    // [USER] Create a return request
    createRequest = async (req, res, next) => {
        try {
            const bodyData = { ...req.body };
            if (req.files && req.files.length > 0) {
                bodyData.images = await uploadMultiple(req.files, 'returns');
            }
            const data = await ReturnService.createRequest(req.user.id, bodyData);
            new Created({ message: 'Yêu cầu hoàn trả đã được gửi thành công', metadata: data }).send(res);
        } catch (error) {
            next(error);
        }
    };

    // [SELLER] Respond to return request
    sellerRespond = async (req, res, next) => {
        try {
            // payload: { action: 'approve' | 'reject', sellerNote: '...' }
            const data = await ReturnService.sellerRespond(req.user.id, req.params.id, req.body);
            new OK({ message: 'Đã phản hồi yêu cầu hoàn trả', metadata: data }).send(res);
        } catch (error) {
            next(error);
        }
    };

    // [USER] Get user's return requests
    getUserRequests = async (req, res, next) => {
        try {
            const data = await ReturnService.getRequestsByUser(req.user.id);
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (error) {
            next(error);
        }
    };

    // [SELLER] Get seller's return requests
    getSellerRequests = async (req, res, next) => {
        try {
            const data = await ReturnService.getRequestsBySeller(req.user.id);
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new ReturnController();

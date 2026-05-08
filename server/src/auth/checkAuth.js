const { AuthFailureError } = require('../core/error.response');
const { verifyToken } = require('../utils/jwt');
const modelUser = require('../models/users.model');

const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) throw new AuthFailureError('Vui lòng đăng nhập');
        const decoded = await verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

const authAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) throw new AuthFailureError('Bạn không có quyền truy cập');
        const decoded = await verifyToken(token);
        const findUser = await modelUser.findById(decoded.id);
        // Support both new role field and legacy isAdmin flag
        const isAdmin = findUser?.role === 'admin' || findUser?.isAdmin === true;
        if (!findUser || !isAdmin) throw new AuthFailureError('Bạn không có quyền truy cập');
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

const authSeller = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) throw new AuthFailureError('Vui lòng đăng nhập');
        const decoded = await verifyToken(token);
        const findUser = await modelUser.findById(decoded.id);
        if (!findUser || findUser.role !== 'seller') {
            throw new AuthFailureError('Bạn không phải người bán hàng');
        }
        // Attach store to request
        const Store = require('../models/store.model');
        const store = await Store.findOne({ owner: decoded.id, status: 'active' });
        if (!store) throw new AuthFailureError('Gian hàng của bạn chưa được duyệt hoặc bị khóa');
        req.user = decoded;
        req.store = store;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    asyncHandler,
    authUser,
    authAdmin,
    authSeller,
};

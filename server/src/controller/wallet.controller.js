const { OK } = require('../core/success.response');
const WalletService = require('../services/wallet.service');

class WalletController {
    // GET /api/wallet/me
    getUserWallet = async (req, res, next) => {
        try {
            const data = await WalletService.getUserWallet(req.user.id);
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/wallet/withdraw
    requestWithdrawal = async (req, res, next) => {
        try {
            const data = await WalletService.requestWithdrawal(req.user.id, req.body);
            new OK({ message: 'Đã gửi yêu cầu rút tiền', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // ─── [ADMIN] Thống kê tổng quan ví ───
    adminGetStats = async (req, res, next) => {
        try {
            const data = await WalletService.adminGetWalletStats();
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/wallet/admin/sellers
    adminGetSellerWallets = async (req, res, next) => {
        try {
            const { search, page, limit } = req.query;
            const data = await WalletService.adminGetSellerWallets({
                search,
                page: Number(page) || 1,
                limit: Number(limit) || 15,
            });
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/wallet/admin/transactions
    adminGetTransactions = async (req, res, next) => {
        try {
            const { type, status, search, page, limit } = req.query;
            const data = await WalletService.adminGetAllTransactions({
                type,
                status,
                search,
                page: Number(page) || 1,
                limit: Number(limit) || 20,
            });
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/wallet/admin/withdrawals
    adminGetWithdrawals = async (req, res, next) => {
        try {
            const { status, search, page, limit } = req.query;
            const data = await WalletService.adminGetWithdrawals({
                status,
                search,
                page: Number(page) || 1,
                limit: Number(limit) || 15,
            });
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/wallet/admin/withdrawals/:id/approve
    adminApproveWithdrawal = async (req, res, next) => {
        try {
            const data = await WalletService.adminApproveWithdrawal(req.params.id, req.body.adminNote);
            new OK({ message: 'Đã duyệt và thanh toán thành công', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/wallet/admin/withdrawals/:id/reject
    adminRejectWithdrawal = async (req, res, next) => {
        try {
            const data = await WalletService.adminRejectWithdrawal(req.params.id, req.body.adminNote);
            new OK({ message: 'Đã từ chối yêu cầu rút tiền', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/wallet/admin/adjust
    adminAdjustBalance = async (req, res, next) => {
        try {
            const { userId, amount, description } = req.body;
            const data = await WalletService.adminAdjustBalance(userId, Number(amount), description);
            new OK({ message: 'Điều chỉnh số dư thành công', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new WalletController();

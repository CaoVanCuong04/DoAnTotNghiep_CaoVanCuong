const { BadRequestError, NotFoundError } = require('../core/error.response');
const WalletTransaction = require('../models/walletTransaction.model');
const Withdrawal = require('../models/withdrawal.model');
const User = require('../models/users.model');
const NotificationService = require('./notification.service');

class WalletService {
    // ─── [USER] Lấy thông tin ví và lịch sử giao dịch ───
    static async getUserWallet(userId) {
        const user = await User.findById(userId).select('balance');
        if (!user) throw new NotFoundError('Người dùng không tồn tại');

        const transactions = await WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).lean();

        // Include pending withdrawals for the user to see their locked funds
        const pendingWithdrawals = await Withdrawal.find({ user: userId, status: 'pending' })
            .sort({ createdAt: -1 })
            .lean();

        return {
            balance: user.balance,
            transactions,
            pendingWithdrawals,
        };
    }

    // ─── [USER] Tạo yêu cầu rút tiền ───
    static async requestWithdrawal(userId, data) {
        const { amount, bankName, accountNumber, accountName } = data;

        if (!amount || amount < 10000) {
            throw new BadRequestError('Số tiền rút tối thiểu là 10.000đ');
        }

        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Người dùng không tồn tại');

        // Check if pending withdrawals + request amount > balance
        const pendingWithdrawals = await Withdrawal.aggregate([
            { $match: { user: user._id, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const lockedAmount = pendingWithdrawals[0]?.total || 0;
        const availableBalance = user.balance - lockedAmount;

        if (amount > availableBalance) {
            throw new BadRequestError(
                `Số dư khả dụng không đủ (Đang khóa ${lockedAmount.toLocaleString('vi-VN')}đ chờ duyệt)`,
            );
        }

        const withdrawal = await Withdrawal.create({
            user: userId,
            amount,
            bankName,
            accountNumber,
            accountName,
            status: 'pending',
        });

        // Notify admins
        const io = global.io;
        if (io) {
            await NotificationService.create(io, {
                recipient: 'admin', // send to all admins
                type: 'system',
                title: 'Yêu cầu rút tiền mới',
                body: `${user.fullName} vừa yêu cầu rút ${amount.toLocaleString('vi-VN')}đ.`,
                link: '/admin/wallet/withdrawals',
                meta: { withdrawalId: withdrawal._id },
            });
        }

        return withdrawal;
    }

    // ─── [ADMIN] Thống kê tổng quan ví ───
    static async adminGetWalletStats() {
        const [totalWallet, pendingWithdrawals, todayTransactions, sellerWallets] = await Promise.all([
            // Tổng số dư tất cả user
            User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
            // Số yêu cầu rút tiền chờ xử lý
            Withdrawal.countDocuments({ status: 'pending' }),
            // Giao dịch hôm nay
            WalletTransaction.countDocuments({
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            }),
            // Ví seller: tổng số dư sellers
            User.aggregate([
                { $match: { role: 'seller' } },
                { $group: { _id: null, total: { $sum: '$balance' }, count: { $sum: 1 } } },
            ]),
        ]);

        // Tổng đã thanh toán (withdrawal completed)
        const totalPaid = await Withdrawal.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        return {
            totalWalletBalance: totalWallet[0]?.total || 0,
            pendingWithdrawals,
            todayTransactions,
            sellerTotalBalance: sellerWallets[0]?.total || 0,
            sellerCount: sellerWallets[0]?.count || 0,
            totalPaidOut: totalPaid[0]?.total || 0,
        };
    }

    // ─── [ADMIN] Danh sách ví người bán ───
    static async adminGetSellerWallets({ search, page = 1, limit = 15 }) {
        const filter = { role: 'seller' };
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [sellers, total] = await Promise.all([
            User.find(filter)
                .select('fullName email avatar balance phone createdAt isActive')
                .sort({ balance: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        // Gắn thêm thông tin rút tiền gần nhất
        const sellerIds = sellers.map((s) => s._id);
        const latestWithdrawals = await Withdrawal.aggregate([
            { $match: { user: { $in: sellerIds } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$user',
                    lastWithdrawal: { $first: '$$ROOT' },
                },
            },
        ]);
        const wdMap = {};
        latestWithdrawals.forEach((w) => {
            wdMap[w._id.toString()] = w.lastWithdrawal;
        });

        const enriched = sellers.map((s) => ({
            ...s,
            lastWithdrawal: wdMap[s._id.toString()] || null,
        }));

        return { sellers: enriched, total, page, limit };
    }

    // ─── [ADMIN] Tất cả giao dịch ví ───
    static async adminGetAllTransactions({ type, status, search, page = 1, limit = 20 }) {
        const filter = {};
        if (type && type !== 'all') filter.type = type;
        if (status && status !== 'all') filter.status = status;

        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            WalletTransaction.find(filter)
                .populate('user', 'fullName email avatar role')
                .populate('order', 'orderCode')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            WalletTransaction.countDocuments(filter),
        ]);

        // Thống kê
        const typeStats = await WalletTransaction.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } },
        ]);

        return { transactions, total, page, limit, typeStats };
    }

    // ─── [ADMIN] Danh sách yêu cầu rút tiền ───
    static async adminGetWithdrawals({ status, search, page = 1, limit = 15 }) {
        const filter = {};
        if (status && status !== 'all') filter.status = status;

        const skip = (page - 1) * limit;
        const [withdrawals, total] = await Promise.all([
            Withdrawal.find(filter)
                .populate('user', 'fullName email avatar balance')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Withdrawal.countDocuments(filter),
        ]);

        const stats = await Withdrawal.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
        ]);

        return { withdrawals, total, page, limit, stats };
    }

    // ─── [ADMIN] Duyệt yêu cầu rút tiền ───
    static async adminApproveWithdrawal(withdrawalId, adminNote) {
        const wd = await Withdrawal.findById(withdrawalId).populate('user', 'fullName balance');
        if (!wd) throw new NotFoundError('Yêu cầu rút tiền không tồn tại');
        if (wd.status !== 'pending') throw new BadRequestError('Yêu cầu này đã được xử lý rồi');

        // Trừ số dư người dùng
        const user = await User.findById(wd.user._id);
        if (!user) throw new NotFoundError('Người dùng không tồn tại');
        if (user.balance < wd.amount) {
            throw new BadRequestError('Số dư ví không đủ để thực hiện rút tiền');
        }
        user.balance -= wd.amount;
        await user.save();

        // Ghi giao dịch
        await WalletTransaction.create({
            user: user._id,
            type: 'withdrawal',
            amount: -wd.amount,
            balanceAfter: user.balance,
            description: `Rút tiền thành công — ${wd.bankName} ${wd.accountNumber}`,
            status: 'completed',
        });

        wd.status = 'completed';
        if (adminNote) wd.note = adminNote;
        await wd.save();

        // Thông báo cho seller
        const io = global.io;
        await NotificationService.create(io, {
            recipient: user._id,
            type: 'order_status',
            title: 'Rút tiền thành công',
            body: `${wd.amount.toLocaleString('vi-VN')}đ đã được chuyển vào tài khoản ngân hàng của bạn.`,
            link: '/seller/wallet',
            meta: { withdrawalId: wd._id },
        });

        return wd;
    }

    // ─── [ADMIN] Từ chối yêu cầu rút tiền ───
    static async adminRejectWithdrawal(withdrawalId, adminNote) {
        const wd = await Withdrawal.findById(withdrawalId).populate('user', 'fullName');
        if (!wd) throw new NotFoundError('Yêu cầu rút tiền không tồn tại');
        if (wd.status !== 'pending') throw new BadRequestError('Yêu cầu này đã được xử lý rồi');

        wd.status = 'rejected';
        wd.note = adminNote || 'Yêu cầu bị từ chối bởi Admin';
        await wd.save();

        // Thông báo
        const io = global.io;
        await NotificationService.create(io, {
            recipient: wd.user._id || wd.user,
            type: 'order_status',
            title: 'Yêu cầu rút tiền bị từ chối',
            body: adminNote || 'Admin đã từ chối yêu cầu rút tiền của bạn.',
            link: '/seller/wallet',
            meta: { withdrawalId: wd._id },
        });

        return wd;
    }

    // ─── [ADMIN] Điều chỉnh số dư ví thủ công ───
    static async adminAdjustBalance(userId, amount, description) {
        if (!amount || amount === 0) throw new BadRequestError('Số tiền phải khác 0');
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Người dùng không tồn tại');

        user.balance += amount;
        if (user.balance < 0) throw new BadRequestError('Số dư ví không được âm');
        await user.save();

        await WalletTransaction.create({
            user: user._id,
            type: amount > 0 ? 'credit' : 'debit',
            amount,
            balanceAfter: user.balance,
            description:
                description || `Admin điều chỉnh số dư: ${amount > 0 ? '+' : ''}${amount.toLocaleString('vi-VN')}đ`,
            status: 'completed',
        });

        return { user: { _id: user._id, fullName: user.fullName, balance: user.balance } };
    }
}

module.exports = WalletService;

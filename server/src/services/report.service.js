const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const Report = require('../models/report.model');
const NotificationService = require('./notification.service');

class ReportService {
    // ─── Người dùng / Seller tạo báo cáo ───
    static async createReport(reporterId, reporterRole, data) {
        const { type, targetUser, targetStore, targetOrder, reason, description, evidence } = data;

        const validTypes = ['customer_report_shop', 'shop_report_customer', 'order_dispute'];
        if (!validTypes.includes(type)) throw new BadRequestError('Loại báo cáo không hợp lệ');
        if (!reason || reason.trim().length < 5) throw new BadRequestError('Lý do báo cáo quá ngắn');

        // Kiểm tra quyền theo type
        if (type === 'customer_report_shop' && reporterRole !== 'customer') {
            throw new ForbiddenError('Chỉ khách hàng mới có thể báo cáo shop');
        }
        if (type === 'shop_report_customer' && reporterRole !== 'seller') {
            throw new ForbiddenError('Chỉ người bán mới có thể báo cáo khách hàng');
        }

        const report = await Report.create({
            reporter: reporterId,
            reporterRole,
            type,
            targetUser: targetUser || null,
            targetStore: targetStore || null,
            targetOrder: targetOrder || null,
            reason: reason.trim(),
            description: (description || '').trim(),
            evidence: evidence || [],
        });

        return report;
    }

    // ─── [ADMIN] Lấy tất cả báo cáo (có filter, phân trang) ───
    static async adminGetAllReports({ type, status, search, page = 1, limit = 15 }) {
        const filter = {};
        if (type && type !== 'all') filter.type = type;
        if (status && status !== 'all') filter.status = status;
        if (search) {
            filter.$or = [
                { reason: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('reporter', 'fullName email avatar')
                .populate('targetUser', 'fullName email')
                .populate('targetStore', 'name')
                .populate('targetOrder', 'orderCode finalPrice orderStatus')
                .populate('resolvedBy', 'fullName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Report.countDocuments(filter),
        ]);

        // Thống kê
        const stats = await Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const typeStats = await Report.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);

        return { reports, total, page, limit, stats, typeStats };
    }

    // ─── [ADMIN] Xem chi tiết 1 báo cáo ───
    static async adminGetReportById(reportId) {
        const report = await Report.findById(reportId)
            .populate('reporter', 'fullName email avatar phone')
            .populate('targetUser', 'fullName email phone avatar')
            .populate('targetStore', 'name logo')
            .populate('targetOrder', 'orderCode finalPrice orderStatus paymentStatus')
            .populate('resolvedBy', 'fullName email')
            .lean();
        if (!report) throw new NotFoundError('Báo cáo không tồn tại');
        return report;
    }

    // ─── [ADMIN] Cập nhật trạng thái báo cáo ───
    static async adminUpdateReportStatus(reportId, adminId, { status, resolution, adminNote }) {
        const report = await Report.findById(reportId).populate('reporter', 'fullName');
        if (!report) throw new NotFoundError('Báo cáo không tồn tại');

        if (report.status === 'resolved' || report.status === 'rejected') {
            throw new BadRequestError('Báo cáo này đã được xử lý xong');
        }

        const validStatuses = ['pending', 'reviewing', 'resolved', 'rejected'];
        if (!validStatuses.includes(status)) throw new BadRequestError('Trạng thái không hợp lệ');

        report.status = status;
        if (adminNote !== undefined) report.adminNote = adminNote;
        if (resolution !== undefined && resolution !== null) report.resolution = resolution;

        if (status === 'resolved' || status === 'rejected') {
            report.resolvedBy = adminId;
            report.resolvedAt = new Date();
        }

        await report.save();

        // Thông báo cho người gửi báo cáo
        const io = global.io;
        const statusMessages = {
            reviewing: 'Báo cáo của bạn đang được Admin xem xét 🔍',
            resolved: `Báo cáo của bạn đã được giải quyết ✅${adminNote ? '. Ghi chú: ' + adminNote : ''}`,
            rejected: `Báo cáo của bạn đã bị từ chối ❌${adminNote ? '. Lý do: ' + adminNote : ''}`,
        };

        if (statusMessages[status]) {
            await NotificationService.create(io, {
                recipient: report.reporter._id || report.reporter,
                type: 'order_status',
                title: 'Cập nhật báo cáo',
                body: statusMessages[status],
                link: '/profile',
                meta: { reportId: report._id },
            });
        }

        return report;
    }

    // ─── [ADMIN] Xoá báo cáo ───
    static async adminDeleteReport(reportId) {
        const report = await Report.findByIdAndDelete(reportId);
        if (!report) throw new NotFoundError('Báo cáo không tồn tại');
        return report;
    }

    // ─── User lấy báo cáo của mình ───
    static async getUserReports(userId, { page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const [reports, total] = await Promise.all([
            Report.find({ reporter: userId })
                .populate('targetStore', 'name')
                .populate('targetUser', 'fullName')
                .populate('targetOrder', 'orderCode')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Report.countDocuments({ reporter: userId }),
        ]);
        return { reports, total, page, limit };
    }
}

module.exports = ReportService;

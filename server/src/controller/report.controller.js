const { OK, Created } = require('../core/success.response');
const ReportService = require('../services/report.service');

class ReportController {
    // POST /api/reports — User/Seller tạo báo cáo
    createReport = async (req, res, next) => {
        try {
            const { id } = req.user;
            // Lấy role từ DB
            const User = require('../models/users.model');
            const user = await User.findById(id).select('role');
            const reporterRole = user.role === 'seller' ? 'seller' : 'customer';
            const report = await ReportService.createReport(id, reporterRole, req.body);
            new Created({ message: 'Gửi báo cáo thành công', metadata: report }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/reports/my — User xem báo cáo của mình
    getMyReports = async (req, res, next) => {
        try {
            const { page, limit } = req.query;
            const data = await ReportService.getUserReports(req.user.id, {
                page: Number(page) || 1,
                limit: Number(limit) || 10,
            });
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] GET /api/reports/admin/all
    adminGetAllReports = async (req, res, next) => {
        try {
            const { type, status, search, page, limit } = req.query;
            const data = await ReportService.adminGetAllReports({
                type,
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

    // [ADMIN] GET /api/reports/admin/:id
    adminGetReport = async (req, res, next) => {
        try {
            const data = await ReportService.adminGetReportById(req.params.id);
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] PATCH /api/reports/admin/:id
    adminUpdateReport = async (req, res, next) => {
        try {
            const data = await ReportService.adminUpdateReportStatus(req.params.id, req.user.id, req.body);
            new OK({ message: 'Cập nhật báo cáo thành công', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // [ADMIN] DELETE /api/reports/admin/:id
    adminDeleteReport = async (req, res, next) => {
        try {
            const data = await ReportService.adminDeleteReport(req.params.id);
            new OK({ message: 'Đã xóa báo cáo', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new ReportController();

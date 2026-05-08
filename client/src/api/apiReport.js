import axiosInstance from './axiosInstance'

// ─── Báo cáo vi phạm (User/Seller - yêu cầu đăng nhập) ──────────────────────
export const createReport = (data) =>
  // data: { targetId, targetType: 'product'|'store'|'review', reason, description }
  axiosInstance.post('/reports', data)

export const getMyReports = () =>
  axiosInstance.get('/reports/my')

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetAllReports = (params) =>
  // params: { page, limit, status, targetType }
  axiosInstance.get('/reports/admin/all', { params })

export const adminGetReport = (id) =>
  axiosInstance.get(`/reports/admin/${id}`)

export const adminUpdateReport = (id, data) =>
  // data: { status: 'resolved'|'dismissed', note? }
  axiosInstance.patch(`/reports/admin/${id}`, data)

export const adminDeleteReport = (id) =>
  axiosInstance.delete(`/reports/admin/${id}`)

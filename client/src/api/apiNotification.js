import axiosInstance from './axiosInstance'

// ─── Thông báo (yêu cầu đăng nhập) ──────────────────────────────────────────
export const getNotifications = (params) =>
  // params: { page, limit }
  axiosInstance.get('/notifications', { params })

export const getUnreadCount = () =>
  axiosInstance.get('/notifications/unread-count')

export const markAsRead = (id) =>
  axiosInstance.patch(`/notifications/${id}/read`)

export const markAllAsRead = () =>
  axiosInstance.patch('/notifications/read-all')

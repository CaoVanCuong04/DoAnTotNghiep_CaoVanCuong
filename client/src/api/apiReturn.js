import axiosInstance from './axiosInstance'

// ─── Hoàn trả (Buyer - yêu cầu đăng nhập) ───────────────────────────────────
export const getMyReturnRequests = () =>
  axiosInstance.get('/returns/my')

export const createReturnRequest = (formData) =>
  // formData: orderId, reason, description, images (files)
  axiosInstance.post('/returns/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ─── Hoàn trả (Seller - yêu cầu role seller) ─────────────────────────────────
export const getSellerReturnRequests = () =>
  axiosInstance.get('/returns/seller')

export const respondToReturnRequest = (id, data) =>
  // data: { action: 'approve' | 'reject', note? }
  axiosInstance.post(`/returns/seller/${id}/respond`, data)

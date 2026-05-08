import axiosInstance from './axiosInstance'

// ─── Tất cả routes yêu cầu role Seller ───────────────────────────────────────

// ─── Sản phẩm của shop ────────────────────────────────────────────────────────
export const sellerGetMyProducts = (params) =>
  axiosInstance.get('/seller/products', { params })

export const sellerCreateProduct = (formData) =>
  axiosInstance.post('/seller/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const sellerUpdateProduct = (id, formData) =>
  axiosInstance.put(`/seller/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const sellerDeleteProduct = (id) =>
  axiosInstance.delete(`/seller/products/${id}`)

export const sellerUpdateFlashSale = (id, data) =>
  // data: { isFlashSale, flashSalePrice, flashSaleEnd }
  axiosInstance.patch(`/seller/products/${id}/flash-sale`, data)

// ─── Đơn hàng của shop ────────────────────────────────────────────────────────
export const sellerGetMyOrders = (params) =>
  axiosInstance.get('/seller/orders', { params })

export const sellerUpdateItemStatus = (orderId, itemId, data) =>
  // data: { status }
  axiosInstance.put(`/seller/orders/${orderId}/items/${itemId}`, data)

// ─── Thống kê doanh thu ───────────────────────────────────────────────────────
export const sellerGetAnalytics = (params) =>
  // params: { from, to, period: 'day'|'week'|'month' }
  axiosInstance.get('/seller/analytics', { params })

// ─── Mã giảm giá của shop ────────────────────────────────────────────────────
export const sellerGetMyCoupons = () =>
  axiosInstance.get('/seller/coupons')

export const sellerCreateCoupon = (data) =>
  axiosInstance.post('/seller/coupons', data)

export const sellerUpdateCoupon = (id, data) =>
  axiosInstance.put(`/seller/coupons/${id}`, data)

export const sellerDeleteCoupon = (id) =>
  axiosInstance.delete(`/seller/coupons/${id}`)

// ─── Đánh giá của shop ────────────────────────────────────────────────────────
export const sellerGetMyReviews = (params) =>
  axiosInstance.get('/seller/reviews', { params })

export const sellerReplyToReview = (id, data) =>
  // data: { reply }
  axiosInstance.post(`/seller/reviews/${id}/reply`, data)

// ─── Ví của seller ────────────────────────────────────────────────────────────
export const sellerGetMyWallet = () =>
  axiosInstance.get('/seller/wallet')

export const sellerRequestWithdrawal = (data) =>
  // data: { amount, bankAccount, bankName, accountHolder }
  axiosInstance.post('/seller/wallet/withdraw', data)

import axiosInstance from './axiosInstance'

// ─── Public ───────────────────────────────────────────────────────────────────
export const getPublicCoupons = () => axiosInstance.get('/coupons/public')

// ─── Coupon (User) ────────────────────────────────────────────────────────────
export const getAvailableCoupons = () =>
  axiosInstance.get('/coupons/available')

export const checkCoupon = (code) =>
  axiosInstance.get(`/coupons/check/${code}`)

export const applyCoupon = (data) =>
  axiosInstance.post('/coupons/apply', data)

export const removeCoupon = (type) =>
  axiosInstance.delete('/coupons/remove', { params: { type } })

// ─── Coupon (Admin) ───────────────────────────────────────────────────────────
export const adminGetAllCoupons = (params) =>
  axiosInstance.get('/coupons', { params })

export const adminCreateCoupon = (data) =>
  axiosInstance.post('/coupons', data)

export const adminUpdateCoupon = (id, data) =>
  axiosInstance.put(`/coupons/${id}`, data)

export const adminDeleteCoupon = (id) =>
  axiosInstance.delete(`/coupons/${id}`)

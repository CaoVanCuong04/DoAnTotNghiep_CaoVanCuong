import axiosInstance from './axiosInstance'

// ─── Wishlist (yêu cầu đăng nhập) ────────────────────────────────────────────
export const getMyWishlist = (params) =>
  // params: { page, limit }
  axiosInstance.get('/wishlist', { params })

export const getWishlistCount = () =>
  axiosInstance.get('/wishlist/count')

export const checkWishlistStatus = (productId) =>
  axiosInstance.get(`/wishlist/check/${productId}`)

export const toggleWishlist = (productId) =>
  // Toggle: nếu chưa có → thêm, nếu có rồi → xóa
  axiosInstance.post(`/wishlist/${productId}`)

export const removeFromWishlist = (productId) =>
  axiosInstance.delete(`/wishlist/${productId}`)

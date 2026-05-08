import axiosInstance from './axiosInstance'

// ─── Public ───────────────────────────────────────────────────────────────────
export const getStoreBySlug = (slug) =>
  axiosInstance.get(`/stores/${slug}`)

export const getStoreProducts = (slug, params) =>
  // params: { page, limit, sort, category }
  axiosInstance.get(`/stores/${slug}/products`, { params })

// ─── User (yêu cầu đăng nhập) ────────────────────────────────────────────────
export const registerStore = (formData) =>
  // formData: { name, description, logo, banner, ... }
  axiosInstance.post('/stores/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getMyStoreStatus = () =>
  axiosInstance.get('/stores/my-status')

// ─── Seller (yêu cầu role seller) ────────────────────────────────────────────
export const getMyStore = () =>
  axiosInstance.get('/stores/me')

export const updateMyStore = (formData) =>
  axiosInstance.put('/stores/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ─── Follow cửa hàng ──────────────────────────────────────────────────────────
export const getFollowingStores = () =>
  axiosInstance.get('/stores/following/list')

export const checkFollowStore = (storeId) =>
  axiosInstance.get(`/stores/${storeId}/follow`)

export const toggleFollowStore = (storeId) =>
  axiosInstance.post(`/stores/${storeId}/follow`)

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetAllStores = (params) =>
  axiosInstance.get('/stores/admin', { params })

export const adminUpdateStoreStatus = (id, data) =>
  // data: { status: 'active' | 'suspended' | 'pending' }
  axiosInstance.put(`/stores/${id}/status`, data)

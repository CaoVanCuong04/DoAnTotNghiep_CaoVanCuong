import axiosInstance from './axiosInstance'

// ─── Public ───────────────────────────────────────────────────────────────────
export const getActiveBanners = (params) =>
  axiosInstance.get('/banners/active', { params })

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetAllBanners = (params) =>
  axiosInstance.get('/banners/admin/manage', { params })

export const adminCreateBanner = (formData) =>
  axiosInstance.post('/banners/admin/manage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const adminUpdateBanner = (id, formData) =>
  axiosInstance.put(`/banners/admin/manage/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const adminDeleteBanner = (id) =>
  axiosInstance.delete(`/banners/admin/manage/${id}`)

export const adminToggleBanner = (id) =>
  axiosInstance.patch(`/banners/admin/manage/${id}/toggle`)

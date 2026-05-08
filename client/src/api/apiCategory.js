import axiosInstance from './axiosInstance'

// ─── Public ───────────────────────────────────────────────────────────────────
export const getAllCategories = () =>
  axiosInstance.get('/categories')

export const getCategoryBySlug = (slug) =>
  axiosInstance.get(`/categories/slug/${slug}`)

export const getCategoryById = (id) =>
  axiosInstance.get(`/categories/${id}`)

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetAllCategories = () =>
  axiosInstance.get('/categories/admin/all')

export const adminCreateCategory = (data) =>
  axiosInstance.post('/categories/admin/create', data)

export const adminUpdateCategory = (id, data) =>
  axiosInstance.put(`/categories/admin/${id}`, data)

export const adminDeleteCategory = (id) =>
  axiosInstance.delete(`/categories/admin/${id}`)

export const adminToggleCategory = (id) =>
  axiosInstance.patch(`/categories/admin/${id}/toggle`)

import axiosInstance from './axiosInstance'

// ─── Public ───────────────────────────────────────────────────────────────────
// params: { page, limit, category, minPrice, maxPrice, sort, keyword, ... }
export const getAllProducts = (params) =>
  axiosInstance.get('/products', { params })

export const getProductsByCategory = (slug, params) =>
  axiosInstance.get(`/products/category/${slug}`, { params })

export const getProductBySlug = (slug) =>
  axiosInstance.get(`/products/slug/${slug}`)

export const getProductById = (id) =>
  axiosInstance.get(`/products/${id}`)

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetAllProducts = (params) =>
  axiosInstance.get('/products/admin/all', { params })

export const adminCreateProduct = (formData) =>
  axiosInstance.post('/products/admin/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const adminUpdateProduct = (id, formData) =>
  axiosInstance.put(`/products/admin/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const adminDeleteProduct = (id) =>
  axiosInstance.delete(`/products/admin/${id}`)

export const adminToggleProduct = (id) =>
  axiosInstance.patch(`/products/admin/${id}/toggle`)

import axiosInstance from './axiosInstance'

// ─── Giỏ hàng (yêu cầu đăng nhập) ───────────────────────────────────────────
export const getCart = () =>
  axiosInstance.get('/cart')

export const addToCart = (data) =>
  // data: { productId, quantity, variantId? }
  axiosInstance.post('/cart/add', data)

export const updateCartItem = (productId, data) =>
  // data: { quantity }
  axiosInstance.put(`/cart/item/${productId}`, data)

export const removeCartItem = (productId, variantId = null) =>
  axiosInstance.delete(`/cart/item/${productId}`, {
    params: variantId ? { variantId } : {},
  })

export const clearCart = () =>
  axiosInstance.delete('/cart/clear')

export const syncCart = (data) =>
  // Đồng bộ giỏ hàng local lên server sau khi đăng nhập
  axiosInstance.post('/cart/sync', data)

export const updateShipping = (data) =>
  // data: { shippingAddress, shippingService }
  axiosInstance.patch('/cart/shipping', data)

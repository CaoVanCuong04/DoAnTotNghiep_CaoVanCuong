import axiosInstance from './axiosInstance'

// ─── Xác thực ────────────────────────────────────────────────────────────────
export const register = (data) =>
  axiosInstance.post('/users/register', data)

export const login = (data) =>
  axiosInstance.post('/users/login', data)

export const loginGoogle = (data) =>
  axiosInstance.post('/users/login-google', data)

export const logout = () =>
  axiosInstance.post('/users/logout')

export const getProfile = () =>
  axiosInstance.get('/users/auth')

export const refreshToken = () =>
  axiosInstance.get('/users/refresh-token')

// ─── Quản lý mật khẩu ────────────────────────────────────────────────────────
export const forgotPassword = (data) =>
  axiosInstance.post('/users/forgot-password', data)

export const resetPassword = (data) =>
  axiosInstance.post('/users/reset-password', data)

export const changePassword = (data) =>
  axiosInstance.put('/users/change-password', data)

// ─── Cập nhật thông tin cá nhân ──────────────────────────────────────────────
export const updateProfile = (data) =>
  axiosInstance.put('/users/update', data)

export const uploadAvatar = (formData) =>
  axiosInstance.post('/users/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ─── Địa chỉ giao hàng ───────────────────────────────────────────────────────
export const getAddresses = () =>
  axiosInstance.get('/users/addresses')

export const addAddress = (data) =>
  axiosInstance.post('/users/addresses', data)

export const updateAddress = (addressId, data) =>
  axiosInstance.put(`/users/addresses/${addressId}`, data)

export const deleteAddress = (addressId) =>
  axiosInstance.delete(`/users/addresses/${addressId}`)

export const setDefaultAddress = (addressId) =>
  axiosInstance.put(`/users/addresses/${addressId}/default`)

// ─── Chatbot ─────────────────────────────────────────────────────────────────
export const sendChatbotMessage = (data) =>
  axiosInstance.post('/users/chatbot', data)

export const getChatbotMessages = () =>
  axiosInstance.get('/users/message-chatbot')

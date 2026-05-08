import axiosInstance from './axiosInstance'

// ─── User ─────────────────────────────────────────────────────────────────────
export const getUserWallet = () =>
  axiosInstance.get('/wallet/me')

export const requestWithdrawal = (data) =>
  // data: { amount, bankAccount, bankName, accountHolder }
  axiosInstance.post('/wallet/withdraw', data)

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetWalletStats = () =>
  axiosInstance.get('/wallet/admin/stats')

export const adminGetSellerWallets = (params) =>
  axiosInstance.get('/wallet/admin/sellers', { params })

export const adminGetTransactions = (params) =>
  axiosInstance.get('/wallet/admin/transactions', { params })

export const adminGetWithdrawals = (params) =>
  axiosInstance.get('/wallet/admin/withdrawals', { params })

export const adminApproveWithdrawal = (id, data) =>
  axiosInstance.post(`/wallet/admin/withdrawals/${id}/approve`, data)

export const adminRejectWithdrawal = (id, data) =>
  // data: { reason }
  axiosInstance.post(`/wallet/admin/withdrawals/${id}/reject`, data)

export const adminAdjustBalance = (data) =>
  // data: { sellerId, amount, note }
  axiosInstance.post('/wallet/admin/adjust', data)

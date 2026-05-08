import axiosInstance from './axiosInstance';

// ─── Đơn hàng (User) ──────────────────────────────────────────────────────────
export const createOrder = (data) =>
    // data: { items, shippingAddress, paymentMethod, couponCode?, shippingFee }
    axiosInstance.post('/orders', data);

export const getOrders = (params) =>
    // params: { page, limit, status }
    axiosInstance.get('/orders', { params });

export const getOrderById = (id) => axiosInstance.get(`/orders/${id}`);

export const getOrderTracking = (id) => axiosInstance.get(`/orders/${id}/tracking`);

export const confirmReceived = (id) => axiosInstance.put(`/orders/${id}/confirm-received`);

export const cancelOrder = (id, data) =>
    // data: { reason }
    axiosInstance.put(`/orders/${id}/cancel`, data);

// ─── Payment callbacks (public, không cần auth) ───────────────────────────────
export const momoCallback = (params) => axiosInstance.get('/orders/momo/ipn', { params });

export const vnpayCallback = (params) => axiosInstance.get('/orders/vnpay/return', { params });

// ─── Đơn hàng (Admin) ─────────────────────────────────────────────────────────
export const adminGetAllOrders = (params) => axiosInstance.get('/orders/admin/all', { params });

export const adminGetDashboardStats = () => axiosInstance.get('/orders/admin/dashboard-stats');

export const adminGetOrderById = (id) => axiosInstance.get(`/orders/admin/${id}/detail`);

export const adminUpdateOrderStatus = (id, data) =>
    // data: { status }
    axiosInstance.patch(`/orders/admin/${id}/status`, data);

export const adminRefundOrder = (id, data) => axiosInstance.post(`/orders/admin/${id}/refund`, data);

export const adminResolveDispute = (id, data) => axiosInstance.post(`/orders/admin/${id}/dispute`, data);

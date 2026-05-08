import axios from 'axios';
import Cookies from 'js-cookie';

// ─────────────────────────────────────────────────────────────────────────────
// Server dùng httpOnly cookie để lưu token + refreshToken
// → Client KHÔNG cần đọc/ghi token thủ công
// → Chỉ cần withCredentials: true để trình duyệt tự gửi cookie kèm request
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    withCredentials: true, // Bắt buộc để gửi/nhận cookie httpOnly
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Cookie được gửi tự động bởi trình duyệt, không cần gắn token thủ công
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error),
);

// ─── Response Interceptor: tự động gọi refresh-token khi nhận 401 ────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Bỏ qua nếu chính request refresh-token bị lỗi (tránh vòng lặp vô tận)
        const isRefreshEndpoint = originalRequest.url?.includes('/users/refresh-token');

        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
            if (isRefreshing) {
                // Các request khác đang chờ → đưa vào hàng chờ
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => axiosInstance(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi endpoint refresh-token
                // Server sẽ đọc cookie 'refreshToken' và set cookie 'token' mới
                await axios.get(`${BASE_URL}/users/refresh-token`, {
                    withCredentials: true,
                });

                processQueue(null);
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);

                // Refresh thất bại → cookie đã hết hạn hoàn toàn → redirect về login
                // Kiểm tra cookie 'logged' (không httpOnly) để tránh redirect không cần thiết
                const isLoggedIn = document.cookie.includes('logged=1');
                if (isLoggedIn) {
                    Cookies.remove('logged');
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;

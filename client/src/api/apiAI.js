import axiosInstance from './axiosInstance';

/** Gửi tin nhắn đến AI Copilot, trả về reply text */
export const aiChat = (message, history = [], sessionId = null) =>
    axiosInstance.post('/ai/chat', { message, history, sessionId });

/** Lấy lịch sử trò chuyện (dùng sessionId cho guest, cookie tự động cho user đăng nhập) */
export const aiGetHistory = (sessionId = null) =>
    axiosInstance.get('/ai/history', { params: sessionId ? { sessionId } : {} });

/** Xóa toàn bộ lịch sử trò chuyện */
export const aiClearHistory = (sessionId = null) =>
    axiosInstance.delete('/ai/history', { data: { sessionId } });

/** Tìm kiếm sản phẩm bằng ngôn ngữ tự nhiên */
export const aiSearch = (query) =>
    axiosInstance.post('/ai/search', { query });

/** Gợi ý sản phẩm dựa theo lịch sử xem */
export const aiRecommendations = (viewedProductIds = [], limit = 8) =>
    axiosInstance.post('/ai/recommendations', { viewedProductIds, limit });

/** Phân tích cảm xúc review của sản phẩm */
export const aiSentiment = (productId) =>
    axiosInstance.get(`/ai/sentiment/${productId}`);

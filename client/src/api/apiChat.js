import axiosInstance from './axiosInstance';

/**
 * Khởi tạo hoặc lấy ra cuộc trò chuyện
 * Dùng sellerId HOẶC storeId. Nếu có product thì đính kèm.
 * data: { sellerId?: string, storeId?: string, product?: { id, name, image, price, slug } }
 */
export const createConversation = (data) =>
  axiosInstance.post('/chat/conversations', data);

/**
 * Láy danh sách các cuộc hội thoại của user hiện tại (Customer / Seller)
 */
export const getMyConversations = () =>
  axiosInstance.get('/chat/conversations');

/**
 * Lấy lịch sử tin nhắn của 1 hội thoại
 * params: { page, limit }
 */
export const getConversationMessages = (conversationId, params) =>
  axiosInstance.get(`/chat/conversations/${conversationId}/messages`, { params });

/**
 * Fallback: Gửi tin nhắn qua HTTP (nếu Socket gặp lỗi)
 * data: { content, type, product }
 */
export const sendMessageHttp = (conversationId, data) =>
  axiosInstance.post(`/chat/conversations/${conversationId}/messages`, data);

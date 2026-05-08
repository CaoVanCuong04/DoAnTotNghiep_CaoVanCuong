import axiosInstance from './axiosInstance';

// ─── Public ───────────────────────────────────────────────────────────────────
export const getPublicReviews = () => axiosInstance.get('/reviews/public');

export const getProductReviews = (productId, params) =>
    // params: { page, limit, sort }
    axiosInstance.get(`/reviews/product/${productId}`, { params });

// ─── User (yêu cầu đăng nhập) ────────────────────────────────────────────────
export const getReviewableItems = () =>
    // Lấy danh sách sản phẩm có thể đánh giá (đã mua, chưa review)
    axiosInstance.get('/reviews/reviewable');

export const createReview = (formData) =>
    // formData: { productId, orderId, rating, comment, images[] }
    axiosInstance.post('/reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const updateReview = (id, formData) =>
    axiosInstance.put(`/reviews/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const deleteReview = (id) => axiosInstance.delete(`/reviews/${id}`);

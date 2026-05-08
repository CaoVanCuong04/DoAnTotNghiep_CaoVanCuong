const { OK } = require('../core/success.response');
const AIService = require('../services/ai.service');
const { verifyToken } = require('../utils/jwt');

// Helper: lấy userId từ cookie nếu có (không throw error nếu không đăng nhập)
async function tryGetUserId(req) {
    try {
        const token = req.cookies?.token;
        if (!token) return null;
        const decoded = await verifyToken(token);
        return decoded?.id || null;
    } catch {
        return null;
    }
}

class AIController {
    // POST /api/ai/chat
    chat = async (req, res, next) => {
        try {
            const { message, history = [], sessionId } = req.body;
            if (!message?.trim()) {
                return res.status(400).json({ status: 'error', message: 'Message is required' });
            }

            const userId = await tryGetUserId(req);

            // Lấy profile người dùng để cá nhân hóa tư vấn
            let userProfile = null;
            if (userId || sessionId) {
                const hist = await AIService.getHistory({ userId, sessionId });
                userProfile = hist.userProfile;
            }

            const reply = await AIService.chatWithAssistant(message, history, userProfile);

            // Lưu lịch sử (async, không block response)
            if (userId || sessionId) {
                AIService.saveToHistory({ userId, sessionId, userMessage: message, aiReply: reply })
                    .catch(() => {}); // silent

                // Cứ mỗi 5 lượt chat, cập nhật profile người dùng
                AIService.getHistory({ userId, sessionId }).then(hist => {
                    const totalMsgs = hist.messages?.length || 0;
                    if (totalMsgs > 0 && totalMsgs % 10 === 0) {
                        AIService.updateUserProfile({ userId, sessionId }).catch(() => {});
                    }
                }).catch(() => {});
            }

            new OK({ message: 'success', metadata: { reply } }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/ai/history — Lấy lịch sử chat
    getHistory = async (req, res, next) => {
        try {
            const { sessionId } = req.query;
            const userId = await tryGetUserId(req);

            const data = await AIService.getHistory({ userId, sessionId });
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // DELETE /api/ai/history — Xóa lịch sử chat
    clearHistory = async (req, res, next) => {
        try {
            const { sessionId } = req.body;
            const userId = await tryGetUserId(req);
            if (!userId && !sessionId) {
                return res.status(400).json({ status: 'error', message: 'Cần userId hoặc sessionId' });
            }

            const AICopilotHistory = require('../models/aiCopilotHistory.model');
            const query = userId ? { user: userId } : { sessionId };
            await AICopilotHistory.findOneAndUpdate(query, { $set: { messages: [] } });
            new OK({ message: 'Đã xóa lịch sử trò chuyện' }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/ai/recommendations
    recommendations = async (req, res, next) => {
        try {
            const { viewedProductIds = [], limit = 8 } = req.body;
            const products = await AIService.getAIRecommendations(viewedProductIds, limit);
            new OK({ message: 'success', metadata: { products } }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/ai/search
    naturalLanguageSearch = async (req, res, next) => {
        try {
            const { query } = req.body;
            if (!query?.trim()) {
                return res.status(400).json({ status: 'error', message: 'Query is required' });
            }
            const result = await AIService.naturalLanguageSearch(query);
            new OK({ message: 'success', metadata: result }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/ai/sentiment/:productId
    sentiment = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const analysis = await AIService.analyzeProductReviews(productId);
            new OK({ message: 'success', metadata: analysis }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new AIController();

const { OK, Created } = require('../core/success.response');
const ChatService = require('../services/chat.service');

class ChatController {
    // POST /api/chat/conversations
    // Body: { sellerId?, storeId?, product: { id, name, image, price, slug } }
    createConversation = async (req, res, next) => {
        try {
            const { sellerId, storeId, product } = req.body;
            let targetUserId = sellerId;

            // Nếu truyền storeId thay vì sellerId, lấy owner
            if (!targetUserId && storeId) {
                const store = await ChatService.getSellerByStore(storeId);
                targetUserId = store.owner;
            }

            const conversation = await ChatService.getOrCreateConversation(req.user.id, targetUserId, product || null);
            new Created({ message: 'Cuộc trò chuyện đã sẵn sàng', metadata: conversation }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/chat/conversations
    getConversations = async (req, res, next) => {
        try {
            const conversations = await ChatService.getMyConversations(req.user.id);
            new OK({ message: 'success', metadata: conversations }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // GET /api/chat/conversations/:id/messages
    getMessages = async (req, res, next) => {
        try {
            const data = await ChatService.getMessages(req.params.id, req.user.id, req.query);
            new OK({ message: 'success', metadata: data }).send(res);
        } catch (err) {
            next(err);
        }
    };

    // POST /api/chat/conversations/:id/messages (HTTP fallback)
    sendMessage = async (req, res, next) => {
        try {
            const { content, type, product } = req.body;
            const conversationId = req.params.id;
            const userId = req.user.id;

            const message = await ChatService.sendMessage(conversationId, userId, { content, type, product });

            // Emit socket events giống như socket handler — đảm bảo real-time kể cả khi dùng HTTP
            const io = req.app.get('io') || global.io;
            if (io) {
                // Emit cho tất cả người trong conversation room
                io.to(`conv:${conversationId}`).emit('new_message', message);

                // Emit đến personal room của từng participant còn lại
                const Conversation = require('../models/conversation.model');
                const conv = await Conversation.findById(conversationId)
                    .populate('participants', 'fullName').lean();
                if (conv) {
                    conv.participants.forEach((participant) => {
                        const participantId = participant._id.toString();
                        if (participantId !== userId.toString()) {
                            io.to(`user:${participantId}`).emit('new_message', message);
                            io.to(`user:${participantId}`).emit('conversation_updated', {
                                conversationId,
                                lastMessage: message.content || `[${message.type}]`,
                                lastMessageAt: message.createdAt,
                                lastSender: { _id: userId },
                            });
                        }
                    });
                }
            }

            new Created({ message: 'Đã gửi', metadata: message }).send(res);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new ChatController();

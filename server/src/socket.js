const ChatService = require('./services/chat.service');
const { verifyToken } = require('./utils/jwt');
const NotificationService = require('./services/notification.service');

/**
 * Khởi tạo Socket.io event handlers
 * @param {import('socket.io').Server} io
 */
function initSocket(io) {
    // Middleware xác thực cho Socket dùng cookie
    io.use(async (socket, next) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie || '';
            const tokenMatch = cookieHeader.match(/token=([^;]+)/);
            if (!tokenMatch) return next(new Error('Unauthorized'));

            const decoded = await verifyToken(tokenMatch[1]);
            socket.userId = decoded.id;
            socket.user = decoded;
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`[Socket] User connected: ${userId} (${socket.id})`);

        // Tham gia room cá nhân để nhận thông báo
        const roomName = `user:${String(userId).trim()}`;
        socket.join(roomName);

        // ─── JOIN CONVERSATION ROOM ───
        socket.on('join_conversation', (conversationId) => {
            socket.join(`conv:${conversationId}`);
            console.log(`[Socket] ${userId} joined conv:${conversationId}`);
        });

        // ─── LEAVE CONVERSATION ROOM ───
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conv:${conversationId}`);
        });

        // ─── GỬI TIN NHẮN ───
        socket.on('send_message', async (data, ack) => {
            try {
                const { conversationId, content, type = 'text', product = null } = data;
                if (!conversationId || (!content?.trim() && type === 'text')) {
                    if (ack) ack({ error: 'Dữ liệu không hợp lệ' });
                    return;
                }

                const message = await ChatService.sendMessage(conversationId, userId, {
                    content,
                    type,
                    product,
                });

                // Emit cho tất cả người trong room
                const sockets1 = await io.in(`conv:${conversationId}`).allSockets();
                console.log(`[Socket] Emit new_message -> conv:${conversationId} (${sockets1.size} clients)`);
                io.to(`conv:${conversationId}`).emit('new_message', message);

                // Emit thông báo unread cho các participant không ở trong conversation
                const Conversation = require('./models/conversation.model');
                const User = require('./models/users.model');
                const conv = await Conversation.findById(conversationId).populate('participants', 'fullName').lean();
                if (conv) {
                    const sender = conv.participants.find((p) => p._id.toString() === userId.toString());
                    const senderName = sender?.fullName || 'Ai đó';

                    conv.participants.forEach(async (participant) => {
                        const participantId = participant._id.toString();
                        if (participantId !== userId.toString()) {
                            // Emit new_message đến room cá nhân của người nhận
                            // (đảm bảo real-time kể cả khi họ chưa join conv room)
                            io.to(`user:${participantId}`).emit('new_message', message);

                            // Cập nhật conversation_updated cho sidebar
                            io.to(`user:${participantId}`).emit('conversation_updated', {
                                conversationId,
                                lastMessage: message.content || `[${message.type}]`,
                                lastMessageAt: message.createdAt,
                                lastSender: { _id: userId },
                            });

                            // Gửi notification realtime
                            await NotificationService.create(io, {
                                recipient: participantId,
                                type: 'new_message',
                                title: `Tin nhắn mới từ ${senderName}`,
                                body: message.content || `[Đã gửi một file]`,
                                link: '/chat',
                                meta: { conversationId, senderId: userId },
                            });
                        }
                    });
                }

                if (ack) ack({ success: true, message });
            } catch (err) {
                console.error('[Socket] send_message error:', err.message);
                if (ack) ack({ error: err.message });
            }
        });

        // ─── TYPING INDICATOR ───
        socket.on('typing', ({ conversationId, isTyping }) => {
            socket.to(`conv:${conversationId}`).emit('user_typing', {
                userId,
                conversationId,
                isTyping,
            });
        });

        // ─── MARK READ ───
        socket.on('mark_read', async ({ conversationId }) => {
            try {
                const Message = require('./models/message.model');
                const Conversation = require('./models/conversation.model');
                await Message.updateMany(
                    { conversation: conversationId, readBy: { $ne: userId } },
                    { $addToSet: { readBy: userId } },
                );
                await Conversation.findByIdAndUpdate(conversationId, {
                    [`unreadCount.${userId.toString()}`]: 0,
                });
                socket.to(`conv:${conversationId}`).emit('messages_read', {
                    conversationId,
                    userId,
                });
            } catch (err) {
                console.error('[Socket] mark_read error:', err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${userId}`);
        });
    });
}

module.exports = { initSocket };

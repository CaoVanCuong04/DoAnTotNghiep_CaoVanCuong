const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const Store = require('../models/store.model');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../core/error.response');

class ChatService {
    // ─── Lấy hoặc tạo conversation giữa buyer và seller owner ───
    static async getOrCreateConversation(buyerId, sellerId, productData = null) {
        if (buyerId.toString() === sellerId.toString()) {
            throw new BadRequestError('Không thể chat với chính mình');
        }

        // Tìm conversation đã tồn tại
        let conversation = await Conversation.findOne({
            participants: { $all: [buyerId, sellerId], $size: 2 },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [buyerId, sellerId],
                product: productData?.id || null,
                unreadCount: { [sellerId.toString()]: 0, [buyerId.toString()]: 0 },
            });
        }

        // Nếu có product mới gắn vào
        if (productData?.id && !conversation.product) {
            conversation.product = productData.id;
            await conversation.save();
        }

        await conversation.populate('participants', 'fullName avatar role');
        await conversation.populate('product', 'name images price slug');

        return conversation;
    }

    // ─── Lấy danh sách conversations của user ───
    static async getMyConversations(userId) {
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate('participants', 'fullName avatar role email')
            .populate('product', 'name images price slug')
            .populate('lastSender', 'fullName')
            .sort({ lastMessageAt: -1 })
            .lean();

        return conversations;
    }

    // ─── Lấy tin nhắn của conversation ───
    static async getMessages(conversationId, userId, { page = 1, limit = 50 } = {}) {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) throw new NotFoundError('Cuộc trò chuyện không tồn tại');

        const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
        if (!isParticipant) throw new ForbiddenError('Bạn không có quyền xem cuộc trò chuyện này');

        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            Message.find({ conversation: conversationId })
                .populate('sender', 'fullName avatar role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Message.countDocuments({ conversation: conversationId }),
        ]);

        // Đánh dấu đã đọc (mark read)
        await Message.updateMany(
            { conversation: conversationId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } },
        );

        // Reset unread count cho user này
        await Conversation.findByIdAndUpdate(conversationId, {
            [`unreadCount.${userId.toString()}`]: 0,
        });

        return {
            messages: messages.reverse(), // Trả về theo thứ tự cũ → mới
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ─── Gửi tin nhắn ───
    static async sendMessage(conversationId, senderId, { content, type = 'text', product = null }) {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) throw new NotFoundError('Cuộc trò chuyện không tồn tại');

        const isParticipant = conversation.participants.some((p) => p.toString() === senderId.toString());
        if (!isParticipant) throw new ForbiddenError('Bạn không có quyền gửi tin nhắn');

        if (!content?.trim() && type === 'text') throw new BadRequestError('Nội dung không được trống');

        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            type,
            content: content?.trim() || '',
            product: type === 'product_link' ? product : null,
            readBy: [senderId],
        });

        // Cập nhật lastMessage trên conversation
        const preview = type === 'product_link' ? `[Sản phẩm] ${product?.name || ''}` : content?.substring(0, 100);

        // Tăng unread cho những người còn lại
        const others = conversation.participants.filter((p) => p.toString() !== senderId.toString());
        const unreadUpdate = {};
        others.forEach((uid) => {
            const key = `unreadCount.${uid.toString()}`;
            unreadUpdate[key] = (conversation.unreadCount?.get?.(uid.toString()) || 0) + 1;
        });

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: preview,
            lastMessageAt: new Date(),
            lastSender: senderId,
            ...unreadUpdate,
        });

        await message.populate('sender', 'fullName avatar role');

        return message;
    }

    // ─── Lấy thông tin store owner từ storeId hoặc slug ───
    static async getSellerByStore(storeSlugOrId) {
        const Types = require('mongoose').Types;
        const isValidId = Types.ObjectId.isValid(storeSlugOrId);

        const store = await Store.findOne({
            $or: [
                { slug: storeSlugOrId },
                ...(isValidId ? [{ _id: storeSlugOrId }] : [])
            ]
        }).select('owner name slug logo');

        if (!store) throw new NotFoundError('Không tìm thấy gian hàng');
        return store;
    }
}

module.exports = ChatService;

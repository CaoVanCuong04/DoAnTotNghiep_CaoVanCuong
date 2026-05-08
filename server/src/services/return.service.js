const ReturnRequest = require('../models/returnRequest.model');
const Order = require('../models/order.model');
const User = require('../models/users.model');
const NotificationService = require('./notification.service');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');

class ReturnService {
    // ─── [USER] Create a return request ───
    static async createRequest(userId, payload) {
        const { orderId, reason, description, images } = payload;

        const order = await Order.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
        if (order.user.toString() !== userId.toString()) {
            throw new ForbiddenError('Bạn không có quyền yêu cầu hoàn trả đơn hàng này');
        }

        // Check if order is in a returning state or can be returned
        if (order.orderStatus !== 'delivered') {
            throw new BadRequestError('Chỉ có thể yêu cầu hoàn trả cho đơn hàng đã giao');
        }

        // Check time limit (e.g., 3 days limit)
        if (order.deliveredAt) {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            if (order.deliveredAt < threeDaysAgo) {
                throw new BadRequestError('Đã quá thời hạn quá 3 ngày để yêu cầu hoàn trả');
            }
        }

        // Prevent duplicate return requests for the same order
        const existingRequest = await ReturnRequest.findOne({ order: orderId });
        if (existingRequest) {
            throw new BadRequestError('Đơn hàng này đã có yêu cầu hoàn trả đang được xử lý');
        }

        // Assume returning the entire order, get the store from the first item
        let storeId = order.items.length > 0 ? order.items[0].store : null;

        // Fallback for older orders that might not have 'store' populated
        if (!storeId && order.items.length > 0 && order.items[0].product) {
            const Product = require('../models/product.model');
            const product = await Product.findById(order.items[0].product).select('store').lean();
            if (product && product.store) {
                storeId = product.store;
            }
        }

        const newRequest = new ReturnRequest({
            order: orderId,
            user: userId,
            store: storeId,
            reason,
            description: description || '',
            images: images || [],
            refundAmount: order.finalPrice,
            status: 'pending',
        });

        await newRequest.save();

        // Update Order status
        order.orderStatus = 'return_requested';
        order.items.forEach((item) => {
            item.itemStatus = 'return_requested';
        });
        await order.save();

        // Notify the seller (only if it's not an admin product)
        if (storeId) {
            const io = global.io;
            const Store = require('../models/store.model');
            const store = await Store.findById(storeId).select('owner').lean();
            if (store) {
                await NotificationService.create(io, {
                    recipient: store.owner,
                    type: 'order_status',
                    title: 'Yêu cầu hoàn trả mới ⚠️',
                    body: `Khách hàng đã yêu cầu hoàn trả đơn hàng ${order.orderCode} (Lý do: ${reason}).`,
                    link: '/seller/returns',
                    meta: { requestId: newRequest._id, orderId },
                });
            }
        }

        return newRequest;
    }

    // ─── [SELLER] Respond to return request ───
    static async sellerRespond(sellerId, requestId, payload) {
        const { action, sellerNote } = payload; // action: 'approve' or 'reject'

        const request = await ReturnRequest.findById(requestId).populate('order');
        if (!request) throw new NotFoundError('Yêu cầu hoàn trả không tồn tại');

        // Verify seller owns this store
        const Store = require('../models/store.model');
        const store = await Store.findById(request.store).select('owner').lean();
        if (!store || store.owner.toString() !== sellerId.toString()) {
            throw new ForbiddenError('Bạn không có quyền thao tác trên yêu cầu này');
        }

        if (request.status !== 'pending') {
            throw new BadRequestError('Yêu cầu này đã được xử lý trước đó');
        }

        const io = global.io;
        const order = request.order; // Populated

        if (action === 'approve') {
            request.status = 'approved';
            request.sellerNote = sellerNote || '';
            await request.save();

            // Auto refund
            if (order.paymentStatus === 'paid') {
                await User.updateOne({ _id: order.user }, { $inc: { balance: request.refundAmount } });
                order.paymentStatus = 'refunded';
            }

            order.orderStatus = 'returned';
            order.items.forEach(item => { item.itemStatus = 'returned'; });
            await order.save();

            // Notify buyer
            await NotificationService.create(io, {
                recipient: request.user,
                type: 'order_status',
                title: 'Yêu cầu hoàn trả được chấp nhận ✅',
                body: `Yêu cầu trả hàng cho đơn ${order.orderCode} đã được người bán chấp nhận. ${order.paymentStatus === 'refunded' ? 'Tiền đã được hoàn vào ví của bạn.' : ''}`,
                link: `/orders/${order._id}`,
                meta: { orderId: order._id },
            });

        } else if (action === 'reject') {
            request.status = 'rejected';
            request.sellerNote = sellerNote || '';
            await request.save();

            // Buyer can now complain to Admin if they want, order status could stay return_rejected or delivered
            // In our system we haven't mapped 'return_rejected' yet, let's keep it 'delivered' or change to 'delivered' so they can see the 'Khiếu nại' button if we defined it
            // Or just revert it back to 'delivered'
            order.orderStatus = 'delivered';
            order.items.forEach(item => { item.itemStatus = 'delivered'; });
            order.note = (order.note ? order.note + ' | ' : '') + '[Yêu cầu trả hàng bị từ chối]';
            await order.save();

            // Notify buyer
            await NotificationService.create(io, {
                recipient: request.user,
                type: 'order_status',
                title: 'Yêu cầu hoàn trả bị từ chối ❌',
                body: `Người bán đã từ chối yêu cầu trả hàng cho đơn ${order.orderCode}. Bạn có thể gửi khiếu nại lên Admin nếu không đồng ý.`,
                link: `/orders/${order._id}`,
                meta: { orderId: order._id },
            });

        } else {
            throw new BadRequestError('Hành động không hợp lệ');
        }

        return request;
    }

    // ─── [USER] Get requests ───
    static async getRequestsByUser(userId) {
        return ReturnRequest.find({ user: userId })
            .populate('order', 'orderCode finalPrice totalPrice items')
            .populate('store', 'name logo')
            .sort({ createdAt: -1 })
            .lean();
    }

    // ─── [SELLER] Get requests ───
    static async getRequestsBySeller(sellerId) {
        const Store = require('../models/store.model');
        const store = await Store.findOne({ owner: sellerId }).lean();
        if (!store) return [];

        return ReturnRequest.find({ store: store._id })
            .populate('order', 'orderCode items')
            .populate({ path: 'user', select: 'fullName avatar' })
            .sort({ createdAt: -1 })
            .lean();
    }
}

module.exports = ReturnService;

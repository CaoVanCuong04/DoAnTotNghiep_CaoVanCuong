const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const User = require('../models/users.model');
const Product = require('../models/product.model');
const crypto = require('crypto');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const NotificationService = require('./notification.service');
const GhnService = require('../utils/GHN/ghn.service');

const https = require('https');

function generatePayID() {
    // Tạo ID thanh toán bao gồm cả giây để tránh trùng lặp
    const now = new Date();
    const timestamp = now.getTime();
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `PAY${timestamp}${seconds}${milliseconds}`;
}

class OrderService {
    // ─── Tạo đơn hàng ───
    static async createOrder(userId, body) {
        const { paymentMethod, itemIds, note } = body;

        if (!['cod', 'momo', 'vnpay'].includes(paymentMethod)) {
            throw new BadRequestError('Phương thức thanh toán không hợp lệ');
        }

        // Lấy giỏ hàng (bao gồm thông tin giao hàng đã lưu)
        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            throw new BadRequestError('Giỏ hàng trống');
        }

        // Đọc thông tin giao hàng TỪ giỏ hàng
        if (!cart.fullName || !cart.phoneNumber || !cart.address) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin giao hàng trước khi đặt hàng');
        }

        const shippingInfo = {
            fullName: cart.fullName,
            phone: cart.phoneNumber,
            address: cart.address,
            wardCode: cart.wardCode,
            districtId: cart.districtId,
        };

        // Lọc item được chọn (nếu có truyền itemIds), nếu không → lấy tất cả
        let selectedItems = cart.items;
        if (Array.isArray(itemIds) && itemIds.length > 0) {
            selectedItems = cart.items.filter((i) => itemIds.includes(i._id.toString()));
        }
        if (selectedItems.length === 0) {
            throw new BadRequestError('Không có sản phẩm nào được chọn');
        }

        // Lấy thông tin store cho mỗi item từ Product
        const productIds = selectedItems.map((i) => i.product);
        const products = await Product.find({ _id: { $in: productIds } })
            .select('_id store')
            .lean();
        const productStoreMap = {};
        products.forEach((p) => {
            productStoreMap[p._id.toString()] = p.store;
        });

        // Load commission rate của từng store
        const Store = require('../models/store.model');
        const storeIdList = [...new Set(products.map((p) => p.store?.toString()).filter(Boolean))];
        const storeList = await Store.find({ _id: { $in: storeIdList } }).select('_id commissionRate').lean();
        const storeCommissionMap = {};
        storeList.forEach((s) => {
            storeCommissionMap[s._id.toString()] = s.commissionRate || 5;
        });

        // Tính tiền
        const totalPrice = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        // Ưu tiên phí ship do frontend tính từ GHN, fallback về quy tắc cũ
        const defaultFee = totalPrice >= 500000 ? 0 : 30000;
        const shippingFee =
            body.shippingFee !== undefined && body.shippingFee !== null ? Number(body.shippingFee) : defaultFee;

        const shopDiscountAmount = cart.shopDiscount || 0;
        const shopVoucherCode = cart.shopVoucherCode || null;
        const systemDiscountAmount = cart.systemDiscount || 0;
        const systemVoucherCode = cart.systemVoucherCode || null;

        const finalPrice = Math.max(0, totalPrice - shopDiscountAmount - systemDiscountAmount) + shippingFee;

        // Tạo order
        const order = new Order({
            user: userId,
            items: selectedItems.map((i) => {
                const storeId = productStoreMap[i.product.toString()];
                const commissionRate = storeId ? (storeCommissionMap[storeId.toString()] ?? 5) : 5;
                const itemTotal = i.price * i.quantity;
                const commissionAmount = Math.round(itemTotal * commissionRate / 100);
                const sellerRevenue = itemTotal - commissionAmount;
                return {
                    product: i.product,
                    store: storeId || null,
                    name: i.name,
                    image: i.image,
                    price: i.price,
                    quantity: i.quantity,
                    variantId: i.variantId || null,
                    variantLabel: i.variantLabel || null,
                    commissionRate,
                    commissionAmount,
                    sellerRevenue,
                };
            }),
            shippingInfo,
            paymentMethod,
            totalPrice,
            shippingFee,
            shopDiscountAmount,
            shopVoucherCode,
            systemDiscountAmount,
            systemVoucherCode,
            finalPrice,
            note: note || '',
            paymentStatus: 'pending',
            orderStatus: 'pending',
        });

        // Tự pre-gen orderCode để gửi cho GHN
        if (!order.orderCode) {
            const ts = Date.now().toString(36).toUpperCase();
            const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
            order.orderCode = `ORD-${ts}-${rand}`;
        }

        // Nếu là COD, gọi tạo đơn GHN trước khi lưu DB
        if (paymentMethod === 'cod') {
            const ghnRes = await GhnService.createOrderSystem(order, cart.items, true); // throwErrorOnFail = true
            if (ghnRes && ghnRes.data && ghnRes.data.order_code) {
                order.ghnOrderCode = ghnRes.data.order_code;
            }
        }

        // Với MoMo: tạo URL trước khi save
        if (paymentMethod === 'momo') {
            const payUrl = await OrderService._generateMoMoUrl(order);
            console.log(payUrl);
            order.paymentUrl = payUrl.payUrl;
        }

        // Save order lần đầu
        await order.save();

        // Với VNPay: tạo URL sau khi có order._id
        if (paymentMethod === 'vnpay') {
            order.paymentUrl = await OrderService._generateVNPayUrl(order);
            await order.save();
        }

        // Tăng usedCount coupon nếu có dùng
        const Coupon = require('../models/coupon.model');
        if (shopVoucherCode) {
            await Coupon.updateOne({ code: shopVoucherCode }, { $inc: { usedCount: 1 } });
        }
        if (systemVoucherCode) {
            await Coupon.updateOne({ code: systemVoucherCode }, { $inc: { usedCount: 1 } });
        }

        // Xóa giỏ hàng: chỉ với COD
        if (paymentMethod === 'cod') {
            await OrderService._clearCartItems(cart, selectedItems);
            cart.shopVoucherCode = null;
            cart.shopDiscount = 0;
            cart.systemVoucherCode = null;
            cart.systemDiscount = 0;
            cart.finalPrice = 0;
            await cart.save();

            // Trừ tồn kho ngay khi đặt COD
            await OrderService._deductStock(order.items);
        }

        // ── Thông báo cho sellers ──
        const io = global.io;
        // Lấy danh sách store từ items, tìm seller tương ứng
        const storeIds = [...new Set(order.items.map((i) => i.store?.toString()).filter(Boolean))];
        if (storeIds.length > 0) {
            const stores = await Store.find({ _id: { $in: storeIds } })
                .select('owner')
                .lean();
            for (const store of stores) {
                await NotificationService.create(io, {
                    recipient: store.owner,
                    type: 'new_order',
                    title: 'Đơn hàng mới 🛍️',
                    body: `Bạn có đơn hàng mới trị giá ${order.finalPrice.toLocaleString('vi-VN')}đ`,
                    link: '/seller/orders',
                    meta: { orderId: order._id },
                });
            }
        }

        return order;
    }

    // ─── Lấy danh sách đơn của user ───
    static async getOrders(userId) {
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
        return orders;
    }

    // ─── [ADMIN] Lấy tất cả đơn hàng ───
    static async adminGetAllOrders({ status, paymentMethod, search, page = 1, limit = 15 }) {
        const filter = {};
        if (status && status !== 'all') filter.orderStatus = status;
        if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;
        if (search) {
            filter.$or = [
                { orderCode: { $regex: search, $options: 'i' } },
                { 'shippingInfo.fullName': { $regex: search, $options: 'i' } },
                { 'shippingInfo.phone': { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('user', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ]);

        // Thống kê nhanh
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 },
                    revenue: { $sum: '$finalPrice' },
                },
            },
        ]);

        return { orders, total, page, limit, stats };
    }

    // ─── [ADMIN] Cập nhật trạng thái đơn hàng ───
    static async adminUpdateOrderStatus(orderId, { orderStatus, paymentStatus }) {
        const order = await Order.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');

        // Kiểm tra luồng 1 chiều cho orderStatus
        if (orderStatus && orderStatus !== order.orderStatus) {
            const flow = ['pending', 'confirmed', 'shipping', 'delivered', 'received', 'return_requested', 'returned'];
            const currentIdx = flow.indexOf(order.orderStatus);
            const nextIdx = flow.indexOf(orderStatus);

            const isCancelAllowed =
                orderStatus === 'cancelled' && ['pending', 'confirmed', 'shipping'].includes(order.orderStatus);
            const isForwardMove = nextIdx === currentIdx + 1;
            // Admin có quyền chuyển sang returned trực tiếp nếu cần thiết, nên nới lỏng kiểm tra ở đây
            const isAlreadyFinal =
                order.orderStatus === 'received' ||
                order.orderStatus === 'cancelled' ||
                order.orderStatus === 'returned';

            if (isAlreadyFinal && orderStatus !== 'returned') {
                // Cho phép admin fix lỗi nếu cần
                throw new BadRequestError(`Đơn hàng đã ở trạng thái "${order.orderStatus}", không thể thay đổi`);
            }
        }

        const validPayStatus = ['pending', 'paid', 'failed'];
        if (paymentStatus && !validPayStatus.includes(paymentStatus)) {
            throw new BadRequestError('Trạng thái thanh toán không hợp lệ');
        }

        if (orderStatus) {
            order.orderStatus = orderStatus;
            // Nếu đổi sang delivered, lưu lại thời điểm giao hàng
            if (orderStatus === 'delivered') order.deliveredAt = new Date();
            // Nếu đổi sang received, cập nhật status của từng item
            if (['received', 'returned', 'return_requested'].includes(orderStatus)) {
                order.items.forEach((item) => {
                    item.itemStatus = orderStatus;
                });
            }
        }
        if (paymentStatus) order.paymentStatus = paymentStatus;
        await order.save();

        // ── Hủy đơn GHN nếu chuyển sang cancelled ──
        if (orderStatus === 'cancelled' && order.ghnOrderCode) {
            await GhnService.cancelOrderSystem([order.ghnOrderCode]);
        }

        // ── Hoàn tồn kho nếu admin hủy đơn ──
        if (orderStatus === 'cancelled') {
            await OrderService._restoreStock(order.items);
        }

        // ── Thông báo cho buyer ──
        const io = global.io;
        const statusLabels = {
            confirmed: 'đã được xác nhận ✅',
            shipping: 'đang được vận chuyển 🚚',
            delivered: 'đã được giao thành công 🎉',
            cancelled: 'đã bị hủy ❌',
        };
        if (orderStatus && statusLabels[orderStatus]) {
            await NotificationService.create(io, {
                recipient: order.user,
                type: 'order_status',
                title: 'Cập nhật đơn hàng',
                body: `Đơn hàng của bạn ${statusLabels[orderStatus]}`,
                link: `/orders/${order._id}`,
                meta: { orderId: order._id, status: orderStatus },
            });
        }

        return order;
    }

    // ─── [USER] Khách hàng bấm Đã nhận hàng ───
    static async confirmOrderReceived(userId, orderId) {
        const order = await Order.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
        if (order.user.toString() !== userId.toString()) {
            throw new ForbiddenError('Không có quyền xác nhận đơn hàng này');
        }
        if (order.orderStatus !== 'delivered') {
            throw new BadRequestError('Chỉ có thể xác nhận đơn hàng đã giao (delivered)');
        }

        order.orderStatus = 'received';
        order.items.forEach((item) => {
            item.itemStatus = 'received';
        });

        // COD: Nếu chưa thanh toán thì tự đánh dấu đã thanh toán (vì khách đã nhận)
        if (order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
            order.paymentStatus = 'paid';
        }

        await order.save();

        // Gửi thông báo cho seller
        const io = global.io;
        const Store = require('../models/store.model');
        const storeIds = [...new Set(order.items.map((i) => i.store?.toString()).filter(Boolean))];
        if (storeIds.length > 0) {
            const stores = await Store.find({ _id: { $in: storeIds } })
                .select('owner')
                .lean();
            for (const store of stores) {
                await NotificationService.create(io, {
                    recipient: store.owner,
                    type: 'order_status',
                    title: 'Khách hàng đã nhận hàng 🎉',
                    body: `Đơn hàng ${order.orderCode} đã được xác nhận (Đã nhận hàng). Tiền đã được cập nhật.`,
                    link: '/seller/orders',
                    meta: { orderId: order._id },
                });
            }
        }

        return order;
    }

    // ─── Chi tiết 1 đơn ───
    static async getOrderById(userId, orderId) {
        const order = await Order.findById(orderId).lean();
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
        if (order.user.toString() !== userId.toString()) {
            throw new ForbiddenError('Không có quyền xem đơn hàng này');
        }

        // Kèm theo trạng thái isReviewed và reviewId cho từng sản phẩm
        const Review = require('../models/review.model');
        const reviews = await Review.find({ order: orderId, user: userId })
            .select('product rating content images')
            .lean();
        const reviewMap = {};
        reviews.forEach((r) => {
            reviewMap[r.product.toString()] = r;
        });

        // Lấy slug của từng sản phẩm để điều hướng trên frontend
        const productIds = order.items.map((i) => i.product);
        const productsData = await Product.find({ _id: { $in: productIds } })
            .select('slug')
            .lean();
        const slugMap = {};
        productsData.forEach((p) => {
            slugMap[p._id.toString()] = p.slug;
        });

        order.items = order.items.map((item) => {
            const rev = reviewMap[item.product.toString()];
            return {
                ...item,
                slug: slugMap[item.product.toString()] || null,
                isReviewed: !!rev,
                reviewId: rev ? rev._id.toString() : null,
                reviewRating: rev ? rev.rating : null,
                reviewContent: rev ? rev.content : null,
                reviewImages: rev ? rev.images : [],
            };
        });

        return order;
    }

    // ─── [NEW] Xem lịch sử vận chuyển GHN ───
    static async getGhnTracking(userId, orderId) {
        const order = await Order.findById(orderId).lean();
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
        if (order.user.toString() !== userId.toString()) {
            throw new ForbiddenError('Không có quyền xem đơn hàng này');
        }
        if (!order.ghnOrderCode) {
            throw new BadRequestError('Đơn hàng này không có mã vận đơn GHN');
        }

        const trackingData = await GhnService.getOrderDetail(order.ghnOrderCode);
        if (!trackingData) {
            throw new BadRequestError('Không thể lấy thông tin vận chuyển từ GHN lúc này');
        }
        return trackingData;
    }

    // ─── Hủy đơn ───
    static async cancelOrder(userId, orderId) {
        const order = await Order.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
        if (order.user.toString() !== userId.toString()) {
            throw new ForbiddenError('Không có quyền hủy đơn hàng này');
        }
        if (!['pending', 'confirmed'].includes(order.orderStatus)) {
            throw new BadRequestError('Không thể hủy đơn ở trạng thái này');
        }

        order.orderStatus = 'cancelled';

        // Hoàn tiền vào ví nếu đã thanh toán online (MoMo / VNPay)
        let refundAmount = 0;
        if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cod') {
            refundAmount = order.finalPrice;
            const User = require('../models/users.model');
            await User.updateOne({ _id: order.user }, { $inc: { balance: refundAmount } });
            order.paymentStatus = 'refunded';
        }

        // Hoàn lượt coupon nếu có dùng
        if (order.couponCode) {
            const Coupon = require('../models/coupon.model');
            await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: -1 } });
        }

        // Hoàn lại tồn kho
        await OrderService._restoreStock(order.items);

        await order.save();

        // ── Hủy đơn GHN ──
        if (order.ghnOrderCode) {
            await GhnService.cancelOrderSystem([order.ghnOrderCode]);
        }

        // ── Thông báo buyer đã hủy đơn ──
        const io = global.io;
        const Store = require('../models/store.model');
        const storeIds = [...new Set(order.items.map((i) => i.store?.toString()).filter(Boolean))];
        if (storeIds.length > 0) {
            const stores = await Store.find({ _id: { $in: storeIds } })
                .select('owner')
                .lean();
            for (const store of stores) {
                await NotificationService.create(io, {
                    recipient: store.owner,
                    type: 'order_status',
                    title: 'Đơn hàng bị hủy ❌',
                    body: `Khách hàng đã hủy đơn hàng trị giá ${order.finalPrice.toLocaleString('vi-VN')}đ`,
                    link: '/seller/orders',
                    meta: { orderId: order._id },
                });
            }
        }

        return { order, refundAmount };
    }

    // ─── MoMo payment URL generator (sandbox mock) ───
    static _generateMoMoUrl(order) {
        return new Promise(async (resolve, reject) => {
            const accessKey = 'F8BBA842ECF85';
            const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            const partnerCode = 'MOMO';
            const orderId = partnerCode + new Date().getTime();
            const requestId = orderId;
            const orderInfo = `Thanh toan don hang ${order._id}`;
            const redirectUrl = 'http://localhost:3001/api/orders/momo/ipn';
            const ipnUrl = 'http://localhost:3001/api/orders/momo/ipn';
            const requestType = 'payWithMethod';
            const amount = order.finalPrice;
            const extraData = '';

            const rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;

            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = JSON.stringify({
                partnerCode,
                partnerName: 'Test',
                storeId: 'MomoTestStore',
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang: 'vi',
                requestType,
                autoCapture: true,
                extraData,
                orderGroupId: '',
                signature,
            });

            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(requestBody);
            req.end();
        });
    }

    // ─── VNPay payment URL generator (sandbox) ───
    static async _generateVNPayUrl(order) {
        const vnpay = new VNPay({
            tmnCode: '95EUBM49',
            secureSecret: 'S2A1QN4CB84NKD7139T6XK3YCI0JZCB6',
            vnpayHost: 'https://sandbox.vnpayment.vn',
            testMode: true, // tùy chọn
            hashAlgorithm: 'SHA512', // tùy chọn
            loggerFn: ignoreLogger, // tùy chọn
        });
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const vnpayResponse = await vnpay.buildPaymentUrl({
            vnp_Amount: order.finalPrice, //
            vnp_IpAddr: '127.0.0.1', //
            vnp_TxnRef: `${order._id} + ${generatePayID()}`, // Sử dụng paymentId thay vì singlePaymentId
            vnp_OrderInfo: `Thanh toan don hang ${order._id}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: `http://localhost:3001/api/orders/vnpay/return`, //
            vnp_Locale: VnpLocale.VN, // 'vn' hoặc 'en'
            vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là hiện tại
            vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
        });

        console.log(vnpayResponse);

        return vnpayResponse;
    }

    // ─── MoMo IPN callback ───
    static async handleMoMoIPN(id) {
        const order = await Order.findById(id);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');

        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save();

        // Trừ tồn kho sau khi thanh toán MoMo thành công
        await OrderService._deductStock(order.items);

        // Xóa giỏ hàng sau khi thanh toán thành công
        const cart = await Cart.findOne({ user: order.user });
        const itemsCopy = [...order.items];
        if (cart) {
            await OrderService._clearCartItems(cart, order.items);
            await cart.save();
        }

        // Tạo đơn GHN
        const ghnRes = await GhnService.createOrderSystem(order, cart ? cart.items : itemsCopy);
        if (ghnRes && ghnRes.data && ghnRes.data.order_code) {
            order.ghnOrderCode = ghnRes.data.order_code;
            await order.save();
        }

        return order;
    }

    // ─── VNPay return callback ───
    static async handleVNPayReturn(idCart) {
        const order = await Order.findById(idCart);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');

        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save();

        // Trừ tồn kho sau khi thanh toán VNPay thành công
        await OrderService._deductStock(order.items);

        // Xóa giỏ hàng sau khi thanh toán thành công
        const cart = await Cart.findOne({ user: order.user });
        const itemsCopy = [...order.items];
        if (cart) {
            await OrderService._clearCartItems(cart, order.items);
            await cart.save();
        }

        // Tạo đơn GHN
        const ghnRes = await GhnService.createOrderSystem(order, cart ? cart.items : itemsCopy);
        if (ghnRes && ghnRes.data && ghnRes.data.order_code) {
            order.ghnOrderCode = ghnRes.data.order_code;
            await order.save();
        }

        return order;
    }

    // ─── Helper: xóa items đã đặt khỏi giỏ (so khớp productId + variantId) ───
    static async _clearCartItems(cart, orderedItems) {
        const orderedKeys = orderedItems.map((i) => `${i.product.toString()}|${i.variantId || ''}`);
        cart.items = cart.items.filter((i) => !orderedKeys.includes(`${i.product.toString()}|${i.variantId || ''}`));
        cart.totalPrice = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        cart.totalQuantity = cart.items.reduce((sum, i) => sum + i.quantity, 0);
        await cart.save();
    }

    // ─── Trừ tồn kho khi đặt hàng thành công ───
    static async _deductStock(orderItems) {
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            if (item.variantId) {
                // Trừ stock của variant option
                for (const variant of product.variants) {
                    const option = variant.options.id(item.variantId);
                    if (option) {
                        option.stock = Math.max(0, (option.stock || 0) - item.quantity);
                        break;
                    }
                }
                // Đồng bộ product.stock = tổng stock của tất cả variant options
                product.stock = product.variants.reduce(
                    (sum, v) => sum + v.options.reduce((s, o) => s + (o.stock || 0), 0),
                    0,
                );
            } else {
                // Trừ stock chung
                product.stock = Math.max(0, (product.stock || 0) - item.quantity);
            }

            // Tăng số lượng đã bán
            product.sold = (product.sold || 0) + item.quantity;
            await product.save();
        }
    }

    // ─── Hoàn lại tồn kho khi hủy đơn ───
    static async _restoreStock(orderItems) {
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            if (item.variantId) {
                // Hoàn stock của variant option
                for (const variant of product.variants) {
                    const option = variant.options.id(item.variantId);
                    if (option) {
                        option.stock = (option.stock || 0) + item.quantity;
                        break;
                    }
                }
                // Đồng bộ product.stock = tổng stock của tất cả variant options
                product.stock = product.variants.reduce(
                    (sum, v) => sum + v.options.reduce((s, o) => s + (o.stock || 0), 0),
                    0,
                );
            } else {
                // Hoàn stock chung
                product.stock = (product.stock || 0) + item.quantity;
            }

            // Giảm số lượng đã bán
            product.sold = Math.max(0, (product.sold || 0) - item.quantity);
            await product.save();
        }
    }

    // ─── [ADMIN] Xem chi tiết 1 đơn (không kiểm tra quyền owner) ───
    static async adminGetOrderById(orderId) {
        const order = await Order.findById(orderId).populate('user', 'fullName email phone avatar').lean();
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
        return order;
    }

    // ─── [ADMIN] Hoàn tiền vào ví người dùng ───
    static async adminRefundOrder(orderId, refundAmount, reason) {
        const order = await Order.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
        if (order.paymentStatus === 'refunded') {
            throw new BadRequestError('Đơn hàng này đã được hoàn tiền trước đó');
        }

        const amount = refundAmount || order.finalPrice;
        if (amount <= 0) throw new BadRequestError('Số tiền hoàn không hợp lệ');

        // Cộng tiền vào ví user
        await User.updateOne({ _id: order.user }, { $inc: { balance: amount } });

        // Cập nhật trạng thái
        order.paymentStatus = 'refunded';
        order.orderStatus = 'cancelled';
        if (reason) order.note = (order.note ? order.note + ' | ' : '') + `[Hoàn tiền Admin: ${reason}]`;
        await order.save();

        // Thông báo cho user
        const io = global.io;
        await NotificationService.create(io, {
            recipient: order.user,
            type: 'order_status',
            title: 'Hoàn tiền thành công 💰',
            body: `${amount.toLocaleString('vi-VN')}đ đã được hoàn vào ví của bạn.${reason ? ' Lý do: ' + reason : ''}`,
            link: `/orders/${order._id}`,
            meta: { orderId: order._id },
        });

        return { order, refundAmount: amount };
    }

    // ─── [ADMIN] Xử lý tranh chấp (resolve dispute) ───
    static async adminResolveDispute(orderId, resolution, adminNote) {
        const order = await Order.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');

        // resolution: 'favor_buyer' | 'favor_seller' | 'split'
        const validResolutions = ['favor_buyer', 'favor_seller', 'split'];
        if (!validResolutions.includes(resolution)) {
            throw new BadRequestError('Kết quả xử lý tranh chấp không hợp lệ');
        }

        const noteStr = `[Tranh chấp - ${new Date().toLocaleDateString('vi-VN')}: ${adminNote || 'Admin đã xử lý'}]`;
        order.note = (order.note ? order.note + ' | ' : '') + noteStr;

        if (resolution === 'favor_buyer') {
            // Hoàn tiền cho buyer
            if (order.paymentStatus !== 'refunded') {
                await User.updateOne({ _id: order.user }, { $inc: { balance: order.finalPrice } });
                order.paymentStatus = 'refunded';
            }
            order.orderStatus = 'returned'; // Coi như đã hoàn trả thành công
            order.items.forEach((item) => {
                item.itemStatus = 'returned';
            });
        } else if (resolution === 'favor_seller') {
            // Kết thúc đơn thuận lợi cho seller
            order.orderStatus = 'delivered';
            order.items.forEach((item) => {
                item.itemStatus = 'delivered';
            });
            order.paymentStatus = 'paid';
        }
        // 'split': chỉ ghi chú, admin tự xử lý bên ngoài

        await order.save();

        // Thông báo cho buyer
        const io = global.io;
        const resolutionMessages = {
            favor_buyer: 'Tranh chấp được giải quyết: Tiền đã được hoàn vào ví 💰',
            favor_seller: 'Tranh chấp được giải quyết: Đơn hàng được xác nhận ✅',
            split: 'Tranh chấp đang được xử lý. Admin sẽ liên hệ và hỗ trợ bạn.',
        };
        await NotificationService.create(io, {
            recipient: order.user,
            type: 'order_status',
            title: 'Cập nhật tranh chấp ⚖️',
            body: resolutionMessages[resolution],
            link: `/orders/${order._id}`,
            meta: { orderId: order._id },
        });

        return order;
    }

    // ─── [ADMIN] Dashboard Stats (tổng hợp toàn hệ thống) ───
    static async adminGetDashboardStats() {
        const User = require('../models/users.model');
        const Product = require('../models/product.model');
        const Store = require('../models/store.model');
        const currentYear = new Date().getFullYear();
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [
            revenueByMonth,
            userByMonth,
            orderStatusCounts,
            paymentMethodCounts,
            topProducts,
            recentOrders,
            userStats,
            storeStats,
            totalProducts,
            totalRevenue,
            thisMonthData,
            lastMonthData,
            lowStockProducts,
            cancelledCount,
            pendingOrders,
        ] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) },
                        orderStatus: { $nin: ['cancelled'] },
                    },
                },
                { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$finalPrice' }, orders: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) },
                    },
                },
                { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
            Order.aggregate([
                { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$finalPrice' } } },
            ]),
            Product.find({ isActive: true })
                .sort({ sold: -1 })
                .limit(5)
                .select('name sold price images store stock')
                .populate('store', 'name')
                .lean(),
            Order.find().populate('user', 'fullName email avatar').sort({ createdAt: -1 }).limit(5).lean(),
            Promise.all([
                User.countDocuments(),
                User.countDocuments({ isActive: true }),
                User.countDocuments({ role: 'seller' }),
                User.countDocuments({ role: 'customer' }),
                User.countDocuments({ createdAt: { $gte: startOfToday } }),
            ]),
            Promise.all([
                Store.countDocuments(),
                Store.countDocuments({ status: 'active' }),
                Store.countDocuments({ status: 'pending' }),
                Store.countDocuments({ status: 'banned' }),
            ]),
            Product.countDocuments({ isActive: true }),
            Order.aggregate([
                { $match: { orderStatus: { $nin: ['cancelled'] } } },
                { $group: { _id: null, total: { $sum: '$finalPrice' }, count: { $sum: 1 } } },
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startOfThisMonth }, orderStatus: { $nin: ['cancelled'] } } },
                { $group: { _id: null, total: { $sum: '$finalPrice' }, count: { $sum: 1 } } },
            ]),
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                        orderStatus: { $nin: ['cancelled'] },
                    },
                },
                { $group: { _id: null, total: { $sum: '$finalPrice' }, count: { $sum: 1 } } },
            ]),
            Product.find({ isActive: true, stock: { $lte: 5 } })
                .sort({ stock: 1 })
                .limit(6)
                .select('name stock images store')
                .populate('store', 'name')
                .lean(),
            Order.countDocuments({ orderStatus: 'cancelled' }),
            Order.countDocuments({ orderStatus: 'pending' }),
        ]);

        const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const revenueChartData = monthLabels.map((name, i) => {
            const r = revenueByMonth.find((x) => x._id === i + 1);
            const u = userByMonth.find((x) => x._id === i + 1);
            return { name, revenue: r?.revenue || 0, orders: r?.orders || 0, newUsers: u?.count || 0 };
        });

        const totalOrderCount = totalRevenue[0]?.count || 0;
        const totalRev = totalRevenue[0]?.total || 0;
        const avgOrderValue = totalOrderCount > 0 ? Math.round(totalRev / totalOrderCount) : 0;
        const thisMonthRev = thisMonthData[0]?.total || 0;
        const lastMonthRev = lastMonthData[0]?.total || 0;
        const revenueGrowth =
            lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : null;
        const thisMonthOrders = thisMonthData[0]?.count || 0;
        const lastMonthOrders = lastMonthData[0]?.count || 0;
        const ordersGrowth =
            lastMonthOrders > 0 ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : null;
        const completionRate =
            totalOrderCount > 0 ? Math.round(((totalOrderCount - cancelledCount) / totalOrderCount) * 100) : 0;

        return {
            revenueByMonth: revenueChartData,
            orderStatusCounts,
            paymentMethodCounts,
            topProducts,
            recentOrders,
            lowStockProducts,
            userStats: {
                total: userStats[0],
                active: userStats[1],
                sellers: userStats[2],
                customers: userStats[3],
                newToday: userStats[4],
            },
            storeStats: { total: storeStats[0], active: storeStats[1], pending: storeStats[2], banned: storeStats[3] },
            totalProducts,
            totalOrders: totalOrderCount,
            totalRevenue: totalRev,
            cancelledCount,
            pendingOrders,
            avgOrderValue,
            thisMonthRevenue: thisMonthRev,
            lastMonthRevenue: lastMonthRev,
            revenueGrowth,
            thisMonthOrders,
            lastMonthOrders,
            ordersGrowth,
            completionRate,
            year: currentYear,
        };
    }
}

module.exports = OrderService;

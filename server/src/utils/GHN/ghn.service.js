require('dotenv').config();

const axios = require('axios');

const { BadRequestError } = require('../../core/error.response');
const Cart = require('../../models/cart.model');
const Product = require('../../models/product.model');

const ghnClient = axios.create({
    baseURL: 'https://dev-online-gateway.ghn.vn/shiip/public-api',
    headers: {
        Token: process.env.GHN_TOKEN,
        'Content-Type': 'application/json',
    },
});

class GhnService {
    async getProvinces(req, res) {
        try {
            const response = await ghnClient.get('/master-data/province');
            return res.status(200).json(response.data.data);
        } catch (error) {
            return res.status(500).json({ message: error?.response?.data?.message || 'GHN Error' });
        }
    }

    async getDistricts(req, res) {
        try {
            const province_id = Number(req.query.province_id);
            if (!province_id) return res.status(400).json({ message: 'province_id is required' });
            const response = await ghnClient.get('/master-data/district', {
                params: { province_id },
            });
            return res.status(200).json(response.data.data);
        } catch (error) {
            return res.status(500).json({ message: error?.response?.data?.message || 'GHN Error' });
        }
    }

    async getWards(req, res) {
        try {
            const district_id = Number(req.query.district_id);
            if (!district_id) return res.status(400).json({ message: 'district_id is required' });
            const response = await ghnClient.get('/master-data/ward', {
                params: { district_id },
            });
            return res.status(200).json(response.data.data);
        } catch (error) {
            return res.status(500).json({ message: error?.response?.data?.message || 'GHN Error' });
        }
    }

    // ── Tính phí vận chuyển dựa trên giỏ hàng của user ──
    async calculateFee(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
            }

            const { to_district_id, to_ward_code, from_district_id } = req.body;

            if (!to_district_id || !to_ward_code) {
                return res.status(400).json({ message: 'to_district_id và to_ward_code là bắt buộc' });
            }

            // 1. Lấy giỏ hàng + populate product dimensions
            const cart = await Cart.findOne({ user: userId }).populate('items.product', 'weight length width height');

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ message: 'Giỏ hàng trống' });
            }

            // 2. Tổng hợp kích thước (giả định xếp chồng theo chiều cao)
            let totalWeight = 0;
            let maxLength = 0;
            let maxWidth = 0;
            let totalHeight = 0;

            for (const item of cart.items) {
                const p = item.product || {};
                const qty = item.quantity || 1;

                totalWeight += (p.weight || 500) * qty; // gram
                maxLength = Math.max(maxLength, p.length || 15); // cm
                maxWidth = Math.max(maxWidth, p.width || 15); // cm
                totalHeight += (p.height || 10) * qty; // cm (xếp chồng)
            }

            // GHN giới hạn tối đa: 50 kg, dài <= 150 cm
            totalWeight = Math.min(Math.max(totalWeight, 10), 50000);
            maxLength = Math.min(maxLength, 150);
            maxWidth = Math.min(maxWidth, 150);
            totalHeight = Math.min(totalHeight, 150);

            // 3. Gọi GHN API
            const payload = {
                service_type_id: 2, // Giao hàng tiêu chuẩn
                from_district_id: from_district_id
                    ? Number(from_district_id)
                    : Number(process.env.GHN_FROM_DISTRICT_ID) || 1482,
                to_district_id: Number(to_district_id),
                to_ward_code: String(to_ward_code),
                weight: totalWeight,
                length: maxLength,
                width: maxWidth,
                height: totalHeight,
            };

            const response = await ghnClient.post('/v2/shipping-order/fee', payload, {
                headers: { ShopId: process.env.GHN_SHOP_ID },
            });

            return res.status(200).json({
                ...response.data.data,
                // Trả thêm thông tin kiện hàng đã tính để frontend hiển thị
                pkg: { weight: totalWeight, length: maxLength, width: maxWidth, height: totalHeight },
            });
        } catch (error) {
            return res.status(500).json({ message: error?.response?.data?.message || 'GHN Error' });
        }
    }

    async createOrder(orderData) {
        try {
            const response = await ghnClient.post('/v2/shipping-order/create', orderData);
            return response.data;
        } catch (error) {
            throw new BadRequestError(error?.response?.data?.message || 'GHN Error');
        }
    }

    async createOrderSystem(order, cartItems, throwErrorOnFail = false) {
        try {
            // Tổng hợp kích thước từ order items thay vì cart
            // Vì lúc call có thể đã xóa cart (COD)
            let totalWeight = 0;
            let maxLength = 0;
            let maxWidth = 0;
            let totalHeight = 0;

            const ghnItems = [];

            for (const item of order.items) {
                // Chúng ta cần lấy dimensions, lúc order tạo thì mongoose document item.product có thể đã được populate
                // Hoặc nếu pass cartItems vào thì lấy từ cartItems
                let p = item.product || {};
                if (typeof p === 'string' && cartItems) {
                    const cItem = cartItems.find((c) => c.product?._id?.toString() === p.toString());
                    if (cItem && cItem.product) p = cItem.product;
                }

                const qty = item.quantity || 1;
                const weight = p.weight || 500;
                const length = p.length || 15;
                const width = p.width || 15;
                const height = p.height || 10;

                totalWeight += weight * qty;
                maxLength = Math.max(maxLength, length);
                maxWidth = Math.max(maxWidth, width);
                totalHeight += height * qty;

                ghnItems.push({
                    name: item.name,
                    code: item.product.toString(),
                    quantity: qty,
                    price: item.price,
                    length,
                    width,
                    weight,
                    height,
                    category: { level1: 'Sản phẩm' },
                });
            }

            totalWeight = Math.min(Math.max(totalWeight, 10), 50000);
            maxLength = Math.min(maxLength, 150);
            maxWidth = Math.min(maxWidth, 150);
            totalHeight = Math.min(totalHeight, 150);

            const payload = {
                payment_type_id: 1, // 1: Sender pays (Tiki model)
                note: order.note || '',
                required_note: 'CHOTHUHANG',
                client_order_code: order.orderCode,

                // Người nhận
                to_name: order.shippingInfo.fullName,
                to_phone: order.shippingInfo.phone,
                to_address: order.shippingInfo.address,
                to_ward_code: order.shippingInfo.wardCode || '',
                to_district_id: Number(order.shippingInfo.districtId),

                // COD (Thu hộ)
                cod_amount: order.paymentMethod === 'cod' ? order.finalPrice : 0,

                // Kích thước
                weight: totalWeight,
                length: maxLength,
                width: maxWidth,
                height: totalHeight,

                service_type_id: 2,
                items: ghnItems,
            };

            const response = await ghnClient.post('/v2/shipping-order/create', payload, {
                headers: { ShopId: process.env.GHN_SHOP_ID },
            });

            return response.data;
        } catch (error) {
            console.error('GHN Create Order Error:', error?.response?.data || error);
            if (throwErrorOnFail) {
                const GHNmsg = error?.response?.data?.message || error?.response?.data?.code_message_value;
                throw new BadRequestError(GHNmsg ? `GHN: ${GHNmsg}` : 'Lỗi tạo đơn GHN. Vui lòng thử lại.');
            }
            // Không throw để tránh ảnh hưởng đơn online đã thanh toán
            return null;
        }
    }

    // ── Hủy đơn hàng trên GHN ──
    async cancelOrderSystem(ghnOrderCodes) {
        try {
            if (!ghnOrderCodes || ghnOrderCodes.length === 0) return null;
            const payload = {
                order_codes: Array.isArray(ghnOrderCodes) ? ghnOrderCodes : [ghnOrderCodes],
            };
            const response = await ghnClient.post('/v2/switch-status/cancel', payload, {
                headers: { ShopId: process.env.GHN_SHOP_ID },
            });
            return response.data;
        } catch (error) {
            console.error('GHN Cancel Order Error:', error?.response?.data || error);
            return null;
        }
    }

    // ── Lấy chi tiết/lịch trình đơn hàng (Tracking) ──
    async getOrderDetail(orderCode) {
        try {
            if (!orderCode) return null;
            const payload = { order_code: orderCode };
            const response = await ghnClient.post('/v2/shipping-order/detail', payload);
            console.log(response.data);

            if (response.data?.data) {
                return response.data.data; // Trả về phần tử đầu tiên (chi tiết đơn)
            }
            return null;
        } catch (error) {
            console.error('GHN Get Order Detail Error:', error?.response?.data || error);
            return null;
        }
    }
}

module.exports = new GhnService();

const { BadRequestError, NotFoundError } = require('../core/error.response');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Coupon = require('../models/coupon.model');

class CartService {
    // ─── Helper: tìm variant option trong product ───
    static _findVariantOption(product, variantId) {
        if (!variantId) return null;
        for (const variant of product.variants || []) {
            const option = variant.options.find((o) => o._id.toString() === variantId);
            if (option) return { variantName: variant.name, option };
        }
        return null;
    }

    // ─── Helper: lấy giá và tồn kho (ưu tiên variant nếu có) ───
    static _getPriceAndStock(product, variantId) {
        const normalizedVariantId = CartService._normalizeVariantId(variantId);
        const variantData = CartService._findVariantOption(product, normalizedVariantId);
        if (variantData) {
            return {
                price: variantData.option.price,
                stock: variantData.option.stock,
                image: variantData.option.image || product.images?.[0] || '',
                variantLabel: `${variantData.variantName}: ${variantData.option.label}`,
            };
        }
        return {
            price: product.price,
            stock: product.stock,
            image: product.images?.[0] || '',
            variantLabel: null,
        };
    }

    // ─── Helper: so khớp item bằng productId + variantId ───
    static _normalizeVariantId(variantId) {
        if (variantId === undefined || variantId === null || variantId === '') return null;
        return String(variantId);
    }

    static _findItemIndex(items, productId, variantId) {
        const normalizedVariantId = CartService._normalizeVariantId(variantId);
        return items.findIndex(
            (i) =>
                i.product.toString() === String(productId) &&
                CartService._normalizeVariantId(i.variantId) === normalizedVariantId,
        );
    }

    // ─── Re-validate and Recalculate Vouchers ───
    static async _recalculate(cart) {
        cart.totalQuantity = cart.items.reduce((sum, i) => sum + i.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // 1. Validate Shop Voucher
        if (cart.shopVoucherCode) {
            const shopCoupon = await Coupon.findOne({ code: cart.shopVoucherCode, isActive: true });
            if (!shopCoupon) {
                cart.shopVoucherCode = null;
                cart.shopDiscount = 0;
            } else {
                // Tính tổng tiền của store ứng với coupon này
                const storeItems = cart.items.filter(
                    (item) => item.product && item.product.store && item.product.store.toString() === shopCoupon.store.toString()
                );
                const storeTotal = storeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

                if (storeTotal < shopCoupon.minOrderAmount || storeItems.length === 0) {
                    cart.shopVoucherCode = null;
                    cart.shopDiscount = 0;
                } else {
                    let discountAmount = 0;
                    if (shopCoupon.discountType === 'percent') {
                        discountAmount = Math.floor((storeTotal * shopCoupon.discountValue) / 100);
                        if (shopCoupon.maxDiscount) discountAmount = Math.min(discountAmount, shopCoupon.maxDiscount);
                    } else {
                        discountAmount = Math.min(shopCoupon.discountValue, storeTotal);
                    }
                    cart.shopDiscount = discountAmount;
                }
            }
        } else {
            cart.shopDiscount = 0;
        }

        // 2. Validate System Voucher
        if (cart.systemVoucherCode) {
            const systemCoupon = await Coupon.findOne({ code: cart.systemVoucherCode, isActive: true });
            if (!systemCoupon || cart.totalPrice < systemCoupon.minOrderAmount) {
                cart.systemVoucherCode = null;
                cart.systemDiscount = 0;
            } else {
                let discountAmount = 0;
                if (systemCoupon.discountType === 'percent') {
                    discountAmount = Math.floor((cart.totalPrice * systemCoupon.discountValue) / 100);
                    if (systemCoupon.maxDiscount) discountAmount = Math.min(discountAmount, systemCoupon.maxDiscount);
                } else {
                    discountAmount = Math.min(systemCoupon.discountValue, cart.totalPrice);
                }
                cart.systemDiscount = discountAmount;
            }
        } else {
            cart.systemDiscount = 0;
        }

        cart.finalPrice = Math.max(0, cart.totalPrice - (cart.shopDiscount || 0) - (cart.systemDiscount || 0));
        return cart;
    }

    // ─── Lấy giỏ hàng của user ───
    static async getCart(userId) {
        let cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name images price originalPrice stock isActive slug variants')
            .lean();

        if (!cart) {
            return { user: userId, items: [], totalPrice: 0, totalQuantity: 0 };
        }

        return cart;
    }

    // ─── Thêm sản phẩm vào giỏ ───
    static async addItem(userId, { productId, quantity = 1, variantId = null }) {
        if (!productId) throw new BadRequestError('Vui lòng chọn sản phẩm');
        if (quantity < 1) throw new BadRequestError('Số lượng phải lớn hơn 0');

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            throw new NotFoundError('Sản phẩm không tồn tại hoặc đã ngừng bán');
        }

        // Nếu sản phẩm có variants, bắt buộc chọn variant
        const normalizedVariantId = CartService._normalizeVariantId(variantId);
        if (product.variants?.length > 0 && !normalizedVariantId) {
            throw new BadRequestError('Vui lòng chọn phân loại sản phẩm');
        }

        // Lấy giá, tồn kho, ảnh từ variant hoặc product gốc
        const { price, stock, image, variantLabel } = CartService._getPriceAndStock(product, normalizedVariantId);

        if (normalizedVariantId && !variantLabel) {
            throw new BadRequestError('Phân loại sản phẩm không hợp lệ');
        }

        if (stock < quantity) {
            throw new BadRequestError(`Chỉ còn ${stock} sản phẩm trong kho`);
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [
                    {
                        product: product._id,
                        variantId: normalizedVariantId,
                        variantLabel: variantLabel || null,
                        name: product.name,
                        image,
                        price,
                        quantity: Number(quantity),
                        stock,
                    },
                ],
            });
        } else {
            // So khớp bằng productId + variantId
            const existIdx = CartService._findItemIndex(cart.items, productId, normalizedVariantId);

            if (existIdx >= 0) {
                const newQty = cart.items[existIdx].quantity + Number(quantity);
                if (newQty > stock) {
                    throw new BadRequestError(`Chỉ còn ${stock} sản phẩm trong kho`);
                }
                cart.items[existIdx].quantity = newQty;
                cart.items[existIdx].price = price;
                cart.items[existIdx].stock = stock;
                cart.items[existIdx].image = image;
                cart.items[existIdx].variantLabel = variantLabel || null;
            } else {
                cart.items.push({
                    product: product._id,
                    variantId: normalizedVariantId,
                    variantLabel: variantLabel || null,
                    name: product.name,
                    image,
                    price,
                    quantity: Number(quantity),
                    stock,
                });
            }
        }

        await CartService._recalculate(cart);
        await cart.save();

        return cart.populate('items.product', 'name images price originalPrice stock isActive slug variants');
    }

    // ─── Cập nhật số lượng 1 item ───
    static async updateItem(userId, productId, quantity, variantId = null) {
        if (quantity < 0) throw new BadRequestError('Số lượng không hợp lệ');

        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new NotFoundError('Giỏ hàng không tồn tại');

        const normalizedVariantId = CartService._normalizeVariantId(variantId);
        const idx = CartService._findItemIndex(cart.items, productId, normalizedVariantId);
        if (idx === -1) throw new NotFoundError('Sản phẩm không có trong giỏ hàng');

        if (quantity === 0) {
            cart.items.splice(idx, 1);
        } else {
            const product = await Product.findById(productId);
            const { price, stock } = CartService._getPriceAndStock(product, normalizedVariantId);

            if (quantity > stock) {
                throw new BadRequestError(`Chỉ còn ${stock} sản phẩm trong kho`);
            }
            cart.items[idx].quantity = Number(quantity);
            cart.items[idx].price = price;
            cart.items[idx].stock = stock;
        }

        await CartService._recalculate(cart);
        await cart.save();

        return cart.populate('items.product', 'name images price originalPrice stock isActive slug variants');
    }

    // ─── Xóa 1 item khỏi giỏ ───
    static async removeItem(userId, productId, variantId = null) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new NotFoundError('Giỏ hàng không tồn tại');

        const normalizedVariantId = CartService._normalizeVariantId(variantId);
        const before = cart.items.length;
        cart.items = cart.items.filter(
            (i) =>
                !(
                    i.product.toString() === String(productId) &&
                    CartService._normalizeVariantId(i.variantId) === normalizedVariantId
                ),
        );

        if (cart.items.length === before) {
            throw new NotFoundError('Sản phẩm không có trong giỏ hàng');
        }

        await CartService._recalculate(cart);
        await cart.save();

        return cart.populate('items.product', 'name images price originalPrice stock isActive slug variants');
    }

    // ─── Xóa toàn bộ giỏ hàng ───
    static async clearCart(userId) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new NotFoundError('Giỏ hàng không tồn tại');

        cart.items = [];
        cart.totalPrice = 0;
        cart.totalQuantity = 0;
        cart.shopVoucherCode = null;
        cart.shopDiscount = 0;
        cart.systemVoucherCode = null;
        cart.systemDiscount = 0;
        cart.finalPrice = 0;

        await cart.save();

        return cart;
    }

    // ─── Lưu thông tin giao hàng vào giỏ hàng ───
    static async updateShipping(userId, { fullName, phoneNumber, address, wardCode, districtId }) {
        if (!fullName || !phoneNumber || !address) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin giao hàng');
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        cart.fullName = fullName;
        cart.phoneNumber = phoneNumber;
        cart.address = address;
        cart.wardCode = wardCode;
        cart.districtId = districtId ? Number(districtId) : null;
        await cart.save();

        return cart;
    }

    // ─── Đồng bộ giỏ hàng (sau khi đăng nhập) ───
    static async syncCart(userId, clientItems) {
        if (!Array.isArray(clientItems)) throw new BadRequestError('Dữ liệu không hợp lệ');

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        for (const ci of clientItems) {
            const product = await Product.findById(ci.productId);
            if (!product || !product.isActive) continue;

            const ciVariantId = ci.variantId || null;
            const { price, stock, image, variantLabel } = CartService._getPriceAndStock(product, ciVariantId);

            const qty = Math.min(Number(ci.quantity) || 1, stock);
            if (qty < 1) continue;

            const idx = CartService._findItemIndex(cart.items, ci.productId, ciVariantId);
            if (idx >= 0) {
                const merged = cart.items[idx].quantity + qty;
                cart.items[idx].quantity = Math.min(merged, stock);
                cart.items[idx].price = price;
                cart.items[idx].image = image;
                cart.items[idx].variantLabel = variantLabel;
            } else {
                cart.items.push({
                    product: product._id,
                    variantId: ciVariantId,
                    variantLabel: variantLabel,
                    name: product.name,
                    image,
                    price,
                    quantity: qty,
                    stock,
                });
            }
        }

        await CartService._recalculate(cart);
        await cart.save();

        return cart.populate('items.product', 'name images price originalPrice stock isActive slug variants');
    }
}

module.exports = CartService;

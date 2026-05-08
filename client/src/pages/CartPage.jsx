import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Button, Checkbox, Tag, Modal, message, Skeleton, Row, Col, Divider } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusOutlined,
    MinusOutlined,
    DeleteOutlined,
    ShoppingCartOutlined,
    ShopOutlined,
    CarOutlined,
    SafetyCertificateOutlined,
    TagOutlined,
    ArrowRightOutlined,
    DeleteColumnOutlined,
} from '@ant-design/icons';
import { cartApi } from '../api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function CartPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, item: null });

    const fetchCart = useCallback(async () => {
        try {
            const res = await cartApi.getCart();
            const data = res.data.metadata || res.data;
            setCart(data);
            if (data?.items?.length > 0) {
                setSelectedItems(data.items.map((item) => item.product?._id || item.productId));
            }
        } catch (err) {
            console.error('Lỗi khi tải giỏ hàng:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/login');
            return;
        }
        fetchCart();
    }, [user, authLoading, navigate, fetchCart]);

    const handleUpdateQuantity = async (productId, variantId, newQuantity) => {
        if (newQuantity < 1) return;
        setUpdatingId(productId);
        try {
            await cartApi.updateCartItem(productId, { quantity: newQuantity, variantId: variantId || null });
            setCart((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    const itemProductId = String(item.product?._id || item.productId);
                    const itemVariantId = String(item.variantId || '');
                    if (itemProductId === String(productId) && itemVariantId === String(variantId || '')) {
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                }),
            }));
            window.dispatchEvent(new Event('cart_updated'));
        } catch (err) {
            message.error(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRemoveItem = async (productId, variantId = null) => {
        try {
            await cartApi.removeCartItem(productId, variantId);
            setCart((prev) => ({
                ...prev,
                items: prev.items.filter((item) => {
                    const itemProductId = item.product?._id || item.productId;
                    const itemVariantId = item.variantId || null;
                    return !(
                        String(itemProductId) === String(productId) &&
                        String(itemVariantId || '') === String(variantId || '')
                    );
                }),
            }));
            setSelectedItems((prev) => prev.filter((id) => id !== productId));
            window.dispatchEvent(new Event('cart_updated'));
            message.success('Đã xóa sản phẩm khỏi giỏ hàng');
        } catch (err) {
            message.error(err.response?.data?.message || 'Xóa thất bại');
        }
        setDeleteModal({ open: false, item: null });
    };

    const handleClearCart = async () => {
        Modal.confirm({
            title: 'Xóa toàn bộ giỏ hàng?',
            content: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await cartApi.clearCart();
                    setCart({ items: [] });
                    setSelectedItems([]);
                    window.dispatchEvent(new Event('cart_updated'));
                    message.success('Đã xóa toàn bộ giỏ hàng');
                } catch (err) {
                    message.error('Xóa thất bại');
                }
            },
        });
    };

    const toggleSelectItem = (productId) => {
        setSelectedItems((prev) =>
            prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
        );
    };

    const toggleSelectAll = () => {
        if (!cart?.items) return;
        const allIds = cart.items.map((item) => item.product?._id || item.productId);
        setSelectedItems((prev) => (prev.length === allIds.length ? [] : allIds));
    };

    const getItemPrices = (item) => {
        const product = item.product || {};
        let price = product.price || item.price || 0;
        let originalPrice = product.originalPrice || item.originalPrice || price;

        if (item.variantId && product.variants?.length > 0) {
            for (const variantGroup of product.variants) {
                const opt = variantGroup.options?.find((o) => String(o._id) === String(item.variantId));
                if (opt && opt.price > 0) {
                    price = opt.price;
                    break;
                }
            }
        }

        // Nếu sản phẩm flash sale, có thể price đã được lưu là flashSalePrice hoặc update
        if (product.isFlashSale && product.flashSalePrice) {
            // Tùy logic bạn muốn ưu tiên flash sale price không nếu có biến thể.
            // Thường giá biến thể là giá cuối, tạm thời chỉ override nếu không chọn biến thể (vì form admin ko cho nhập flash sale riêng theo biến thể).
            if (!item.variantId) price = product.flashSalePrice;
        }

        return { price, originalPrice };
    };

    const items = cart?.items || [];
    const selectedCartItems = items.filter((item) => selectedItems.includes(item.product?._id || item.productId));
    const totalItems = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = selectedCartItems.reduce((sum, item) => {
        return sum + getItemPrices(item).price * item.quantity;
    }, 0);
    const totalOriginal = selectedCartItems.reduce((sum, item) => {
        return sum + getItemPrices(item).originalPrice * item.quantity;
    }, 0);
    const totalSaved = Math.max(0, totalOriginal - totalPrice);

    if (loading) {
        return (
            <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px 0' }}>
                <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto' }}>
                    <Skeleton.Button active style={{ width: 250, height: 40, marginBottom: 16 }} />
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            {[...Array(3)].map((_, i) => (
                                <Skeleton.Button
                                    key={i}
                                    active
                                    style={{
                                        width: '100%',
                                        height: 130,
                                        marginBottom: 12,
                                        borderRadius: 8,
                                        display: 'block',
                                    }}
                                />
                            ))}
                        </Col>
                        <Col xs={24} lg={8}>
                            <Skeleton.Button
                                active
                                style={{ width: '100%', height: 300, borderRadius: 8, display: 'block' }}
                            />
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }

    if (!items.length) {
        return (
            <div
                style={{
                    background: '#f0f2f5',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '64px 48px',
                            borderRadius: 16,
                            border: '1px solid #e8ecf3',
                            background: '#fff',
                            maxWidth: 460,
                        }}
                    >
                        <div
                            style={{
                                width: 110,
                                height: 110,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #EEF2FF 0%, #e0e7ff 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                            }}
                        >
                            <DeleteColumnOutlined style={{ fontSize: 52, color: '#93a3d1' }} />
                        </div>
                        <Title level={4} style={{ marginBottom: 8, color: '#1a1a2e' }}>
                            Giỏ hàng trống
                        </Title>
                        <Text
                            type="secondary"
                            style={{ display: 'block', marginBottom: 32, maxWidth: 300, margin: '0 auto 32px' }}
                        >
                            Bạn chưa có sản phẩm nào trong giỏ. Hãy khám phá ngay!
                        </Text>
                        <Link to="/">
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShopOutlined />}
                                style={{
                                    padding: '0 40px',
                                    height: 48,
                                    borderRadius: 8,
                                    background: 'linear-gradient(135deg, #ff6b00, #ff8c33)',
                                    border: 'none',
                                    boxShadow: '0 4px 20px rgba(255,107,0,0.3)',
                                }}
                            >
                                Khám phá sản phẩm
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ background: '#fff', borderBottom: '1px solid #e8ecf3', padding: '16px 0' }}>
                <div
                    style={{
                        width: '90%',
                        maxWidth: 1200,
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ShoppingCartOutlined style={{ fontSize: 26, color: '#1a3c8f' }} />
                        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>
                            Giỏ hàng
                        </Title>
                        <Tag color="geekblue" style={{ fontWeight: 600 }}>
                            {items.length} sản phẩm
                        </Tag>
                    </div>
                    {items.length > 0 && (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleClearCart}
                            style={{ fontWeight: 600 }}
                        >
                            Xóa tất cả
                        </Button>
                    )}
                </div>
            </div>

            <div style={{ padding: '24px 0' }}>
                <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto' }}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px 20px',
                                    marginBottom: 12,
                                    borderRadius: 8,
                                    border: '1px solid #e8ecf3',
                                    background: '#fff',
                                }}
                            >
                                <Checkbox
                                    checked={selectedItems.length === items.length && items.length > 0}
                                    onChange={toggleSelectAll}
                                />
                                <Text strong style={{ color: '#5a6478' }}>
                                    Chọn tất cả ({items.length} sản phẩm)
                                </Text>
                            </div>

                            <AnimatePresence>
                                {items.map((item, index) => {
                                    const product = item.product || {};
                                    const productId = product._id || item.productId;
                                    const name = product.name || item.name || 'Sản phẩm';
                                    const image =
                                        product.images?.[0] ||
                                        item.image ||
                                        'https://placehold.co/120x120?text=No+Image';

                                    const { price, originalPrice } = getItemPrices(item);
                                    const discount =
                                        originalPrice > 0 && originalPrice !== price
                                            ? Math.max(0, Math.round((1 - price / originalPrice) * 100))
                                            : 0;

                                    const stock = product.stock ?? item.stock ?? 99;
                                    const storeName = product.store?.name || item.store?.name || '';
                                    const slug = product.slug || item.slug;
                                    const isSelected = selectedItems.includes(productId);

                                    return (
                                        <motion.div
                                            key={productId}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -60, height: 0 }}
                                            transition={{ duration: 0.25, delay: index * 0.04 }}
                                            style={{ marginBottom: 10 }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 20,
                                                    padding: 20,
                                                    borderRadius: 12,
                                                    border: `1.5px solid ${isSelected ? '#c7d2f0' : '#e8ecf3'}`,
                                                    background: isSelected ? '#fbfcff' : '#fff',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectItem(productId)}
                                                />

                                                <Link
                                                    to={slug ? `/product/${slug}` : '#'}
                                                    style={{
                                                        width: 100,
                                                        height: 100,
                                                        borderRadius: 8,
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                        border: '1px solid #f0f2f5',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: '#fafbfd',
                                                    }}
                                                >
                                                    <img
                                                        src={image}
                                                        alt={name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                </Link>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {storeName && (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 4,
                                                                marginBottom: 4,
                                                            }}
                                                        >
                                                            <ShopOutlined style={{ fontSize: 13, color: '#1a3c8f' }} />
                                                            <Text
                                                                strong
                                                                style={{ color: '#1a3c8f', fontSize: '0.75rem' }}
                                                            >
                                                                {storeName}
                                                            </Text>
                                                        </div>
                                                    )}

                                                    <Link to={slug ? `/product/${slug}` : '#'}>
                                                        <Text
                                                            strong
                                                            style={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                fontSize: '0.95rem',
                                                                color: '#1a1a2e',
                                                                marginBottom: 8,
                                                            }}
                                                        >
                                                            {name}
                                                        </Text>
                                                    </Link>

                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            marginBottom: 12,
                                                        }}
                                                    >
                                                        <Text strong style={{ color: '#ff4500', fontSize: '1.05rem' }}>
                                                            {price.toLocaleString('vi-VN')}₫
                                                        </Text>
                                                        {discount > 0 && (
                                                            <>
                                                                <Text
                                                                    delete
                                                                    type="secondary"
                                                                    style={{ fontSize: '0.8rem' }}
                                                                >
                                                                    {originalPrice.toLocaleString('vi-VN')}₫
                                                                </Text>
                                                                <Tag color="volcano" style={{ margin: 0 }}>
                                                                    -{discount}%
                                                                </Tag>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                border: '1.5px solid #e5e7eb',
                                                                borderRadius: 8,
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<MinusOutlined />}
                                                                onClick={() =>
                                                                    handleUpdateQuantity(
                                                                        productId,
                                                                        item.variantId,
                                                                        item.quantity - 1,
                                                                    )
                                                                }
                                                                disabled={
                                                                    item.quantity <= 1 || updatingId === productId
                                                                }
                                                                style={{ borderRadius: 0 }}
                                                            />
                                                            <div
                                                                style={{
                                                                    padding: '0 16px',
                                                                    fontWeight: 700,
                                                                    minWidth: 40,
                                                                    textAlign: 'center',
                                                                    color:
                                                                        updatingId === productId
                                                                            ? '#b0b8c9'
                                                                            : '#1a1a2e',
                                                                }}
                                                            >
                                                                {item.quantity}
                                                            </div>
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<PlusOutlined />}
                                                                onClick={() =>
                                                                    handleUpdateQuantity(
                                                                        productId,
                                                                        item.variantId,
                                                                        item.quantity + 1,
                                                                    )
                                                                }
                                                                disabled={
                                                                    item.quantity >= stock || updatingId === productId
                                                                }
                                                                style={{ borderRadius: 0 }}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() =>
                                                                setDeleteModal({
                                                                    open: true,
                                                                    item: {
                                                                        productId,
                                                                        variantId: item.variantId || null,
                                                                        name,
                                                                    },
                                                                })
                                                            }
                                                        />
                                                        {stock <= 5 && stock > 0 && (
                                                            <Text type="warning" strong style={{ fontSize: '0.8rem' }}>
                                                                Còn {stock} sp
                                                            </Text>
                                                        )}
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        textAlign: 'right',
                                                        flexShrink: 0,
                                                        minWidth: 110,
                                                        display: window.innerWidth < 576 ? 'none' : 'block',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            color: '#ff4500',
                                                            fontWeight: 800,
                                                            fontSize: '1.05rem',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        {(price * item.quantity).toLocaleString('vi-VN')}₫
                                                    </div>
                                                    {discount > 0 && (
                                                        <Text delete type="secondary" style={{ fontSize: '0.8rem' }}>
                                                            {(originalPrice * item.quantity).toLocaleString('vi-VN')}₫
                                                        </Text>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </Col>

                        <Col xs={24} lg={8}>
                            <div style={{ position: 'sticky', top: 80 }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div
                                        style={{
                                            borderRadius: 12,
                                            border: '1px solid #e8ecf3',
                                            background: '#fff',
                                            overflow: 'hidden',
                                            marginBottom: 16,
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: '16px 24px',
                                                background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f2f8 100%)',
                                                borderBottom: '1px solid #eaedf3',
                                            }}
                                        >
                                            <Title level={5} style={{ margin: 0, color: '#1a1a2e' }}>
                                                Tóm tắt đơn hàng
                                            </Title>
                                        </div>
                                        <div style={{ padding: 24 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 16,
                                                }}
                                            >
                                                <Text style={{ color: '#6b7280' }}>
                                                    Tạm tính ({totalItems} sản phẩm)
                                                </Text>
                                                <Text strong style={{ color: '#1a1a2e' }}>
                                                    {totalOriginal.toLocaleString('vi-VN')}₫
                                                </Text>
                                            </div>

                                            {totalSaved > 0 && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        marginBottom: 16,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            color: '#16a34a',
                                                        }}
                                                    >
                                                        <TagOutlined />{' '}
                                                        <Text style={{ color: 'inherit' }}>Giảm giá</Text>
                                                    </div>
                                                    <Text strong style={{ color: '#16a34a' }}>
                                                        -{totalSaved.toLocaleString('vi-VN')}₫
                                                    </Text>
                                                </div>
                                            )}

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 16,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        color: '#6b7280',
                                                    }}
                                                >
                                                    <CarOutlined />{' '}
                                                    <Text style={{ color: 'inherit' }}>Phí vận chuyển</Text>
                                                </div>
                                                <Text type="secondary" italic>
                                                    Tính khi đặt hàng
                                                </Text>
                                            </div>

                                            <Divider style={{ margin: '16px 0' }} />

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'baseline',
                                                    marginBottom: 24,
                                                }}
                                            >
                                                <Text strong style={{ fontSize: '1.05rem', color: '#1a1a2e' }}>
                                                    Tổng cộng
                                                </Text>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div
                                                        style={{
                                                            color: '#ff4500',
                                                            fontWeight: 800,
                                                            fontSize: '1.6rem',
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        {totalPrice.toLocaleString('vi-VN')}₫
                                                    </div>
                                                    {totalSaved > 0 && (
                                                        <div
                                                            style={{
                                                                color: '#16a34a',
                                                                fontWeight: 600,
                                                                fontSize: '0.85rem',
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            Tiết kiệm {totalSaved.toLocaleString('vi-VN')}₫
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                type="primary"
                                                block
                                                size="large"
                                                disabled={selectedItems.length === 0}
                                                onClick={() =>
                                                    navigate('/checkout', {
                                                        state: { selectedItems: selectedCartItems },
                                                    })
                                                }
                                                style={{
                                                    height: 50,
                                                    fontWeight: 700,
                                                    borderRadius: 8,
                                                    background:
                                                        selectedItems.length === 0
                                                            ? undefined
                                                            : 'linear-gradient(135deg, #ff6b00 0%, #ff8c33 100%)',
                                                    border: 'none',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                Tiến hành thanh toán <ArrowRightOutlined />
                                            </Button>

                                            {selectedItems.length === 0 && (
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        marginTop: 16,
                                                        color: '#9ca3af',
                                                        fontSize: '0.85rem',
                                                    }}
                                                >
                                                    Vui lòng chọn sản phẩm để thanh toán
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            borderRadius: 12,
                                            border: '1px solid #e8ecf3',
                                            padding: 20,
                                            background: '#fff',
                                        }}
                                    >
                                        {[
                                            {
                                                icon: <CarOutlined style={{ fontSize: 20, color: '#1a3c8f' }} />,
                                                text: 'Miễn phí vận chuyển đơn từ 500K',
                                            },
                                            {
                                                icon: (
                                                    <SafetyCertificateOutlined
                                                        style={{ fontSize: 20, color: '#16a34a' }}
                                                    />
                                                ),
                                                text: 'Cam kết hàng chính hãng 100%',
                                            },
                                            {
                                                icon: <TagOutlined style={{ fontSize: 20, color: '#f59e0b' }} />,
                                                text: 'Đổi trả miễn phí trong 30 ngày',
                                            },
                                        ].map((b, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '8px 0',
                                                }}
                                            >
                                                {b.icon}
                                                <Text strong style={{ color: '#5a6478', fontSize: '0.85rem' }}>
                                                    {b.text}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>

                                    <Link to="/">
                                        <Button
                                            block
                                            size="large"
                                            icon={<ShopOutlined />}
                                            style={{
                                                marginTop: 12,
                                                fontWeight: 600,
                                                color: '#1a3c8f',
                                                borderColor: '#e8ecf3',
                                            }}
                                        >
                                            Tiếp tục mua sắm
                                        </Button>
                                    </Link>
                                </motion.div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            <Modal
                title="Xóa sản phẩm?"
                open={deleteModal.open}
                onOk={() => handleRemoveItem(deleteModal.item?.productId, deleteModal.item?.variantId)}
                onCancel={() => setDeleteModal({ open: false, item: null })}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                Bạn có muốn xóa <strong>{deleteModal.item?.name}</strong> khỏi giỏ hàng?
            </Modal>
        </div>
    );
}

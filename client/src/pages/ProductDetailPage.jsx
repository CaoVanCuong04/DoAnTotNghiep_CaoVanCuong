import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Typography,
    Button,
    Row,
    Col,
    Tag,
    Rate,
    Divider,
    Breadcrumb,
    Skeleton,
    Tabs,
    Avatar,
    message,
    Popconfirm,
    Modal,
    Input,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCartOutlined,
    HeartOutlined,
    HeartFilled,
    ShareAltOutlined,
    PlusOutlined,
    MinusOutlined,
    CarOutlined,
    SafetyCertificateOutlined,
    ReloadOutlined,
    ShopOutlined,
    RightOutlined,
    StarFilled,
    MessageOutlined,
    FlagOutlined,
    RobotOutlined,
    DeleteOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { productApi, cartApi, reviewApi, aiApi } from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import ReportModal from '../components/ReportModal';
import { checkWishlistStatus, toggleWishlist } from '../api/apiWishlist';

const { Title, Text } = Typography;

export default function ProductDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [wished, setWished] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState({});
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [addingToCart, setAddingToCart] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [aiSummary, setAiSummary] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [deletingReview, setDeletingReview] = useState(null);

    // Edit review states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [editRating, setEditRating] = useState(5);
    const [editContent, setEditContent] = useState('');
    const [submittingEdit, setSubmittingEdit] = useState(false);

    const refreshReviews = async () => {
        if (product?._id) {
            const revRes = await reviewApi.getProductReviews(product._id);
            const reviewData = revRes.data.metadata || revRes.data || {};
            setReviews(reviewData.reviews || []);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        setDeletingReview(reviewId);
        try {
            await reviewApi.deleteReview(reviewId);
            message.success('Đã xóa đánh giá thành công');
            await refreshReviews();
        } catch (err) {
            message.error(err.response?.data?.message || 'Không thể xóa đánh giá');
        } finally {
            setDeletingReview(null);
        }
    };

    const openEditModal = (rev) => {
        setEditingReview(rev);
        setEditRating(rev.rating || 5);
        setEditContent(rev.content || rev.comment || '');
        setEditModalOpen(true);
    };

    const handleSubmitEdit = async () => {
        if (!editRating) {
            message.error('Vui lòng chọn số sao');
            return;
        }
        setSubmittingEdit(true);
        try {
            const formData = new FormData();
            formData.append('rating', editRating);
            formData.append('content', editContent);
            await reviewApi.updateReview(editingReview._id, formData);
            message.success('Cập nhật đánh giá thành công!');
            setEditModalOpen(false);
            await refreshReviews();
        } catch (err) {
            message.error(err.response?.data?.message || 'Không thể cập nhật đánh giá');
        } finally {
            setSubmittingEdit(false);
        }
    };

    const fetchAiSummary = async () => {
        if (!product?._id) return;
        setLoadingAi(true);
        try {
            const res = await aiApi.aiSentiment(product._id);
            setAiSummary(res.data.metadata || res.data);
        } catch (error) {
            message.error('Không thể phân tích đánh giá lúc này.');
        } finally {
            setLoadingAi(false);
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const res = await productApi.getProductBySlug(slug);
                const data = res.data.metadata || res.data;
                setProduct(data);
                setSelectedImage(0);
                setQuantity(1);
                setSelectedVariants({});

                if (data._id) {
                    try {
                        const revRes = await reviewApi.getProductReviews(data._id);
                        const reviewData = revRes.data.metadata || revRes.data || {};
                        setReviews(reviewData.reviews || []);
                    } catch {
                        /* ignore */
                    }
                    // Check wishlist status
                    if (user) {
                        try {
                            const wRes = await checkWishlistStatus(data._id);
                            setWished(wRes.data?.metadata?.wishlisted || false);
                        } catch {
                            /* ignore */
                        }
                    }
                }

                if (data.category?._id || data.category) {
                    try {
                        const catId = data.category?._id || data.category;
                        const relRes = await productApi.getAllProducts({ category: catId, limit: 4 });
                        const relData = relRes.data.metadata?.products || relRes.data.metadata || [];
                        const filtered = Array.isArray(relData)
                            ? relData.filter((p) => p._id !== data._id).slice(0, 4)
                            : [];
                        setRelatedProducts(
                            filtered.map((p) => ({
                                id: p._id,
                                name: p.name,
                                price: p.price,
                                originalPrice: p.originalPrice || 0,
                                discount: p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0,
                                rating: p.ratingAverage || p.averageRating || 0,
                                reviews: p.ratingCount || p.totalReviews || 0,
                                image: p.images?.[0] || 'https://placehold.co/300x300?text=No+Image',
                                slug: p.slug,
                            })),
                        );
                    } catch {
                        /* ignore */
                    }
                }
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        window.scrollTo(0, 0);
    }, [slug]);

    const handleAddToCart = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        let variantId = null;
        if (product?.variants?.length > 0) {
            const variantGroup = product.variants[0];
            const selectedOptIndex = selectedVariants[variantGroup.name];
            if (selectedOptIndex === undefined) {
                message.warning('Vui lòng chọn phân loại sản phẩm');
                return;
            }
            variantId = variantGroup.options[selectedOptIndex]._id;
        }

        setAddingToCart(true);
        try {
            await cartApi.addToCart({ productId: product._id, quantity, variantId });
            window.dispatchEvent(new Event('cart_updated'));
            message.success('Đã thêm vào giỏ hàng!');
        } catch (err) {
            message.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        let variantId = null;
        if (product?.variants?.length > 0) {
            const variantGroup = product.variants[0];
            const selectedOptIndex = selectedVariants[variantGroup.name];
            if (selectedOptIndex === undefined) {
                message.warning('Vui lòng chọn phân loại sản phẩm');
                return;
            }
            variantId = variantGroup.options[selectedOptIndex]._id;
        }

        try {
            await cartApi.addToCart({ productId: product._id, quantity, variantId });
            window.dispatchEvent(new Event('cart_updated'));
            navigate('/cart');
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    let displayPrice = product?.price || 0;
    if (product?.variants?.length > 0) {
        const variantGroup = product.variants[0];
        const selectedOptIndex = selectedVariants[variantGroup.name];
        if (selectedOptIndex !== undefined && variantGroup.options[selectedOptIndex]?.price > 0) {
            displayPrice = variantGroup.options[selectedOptIndex].price;
        }
    }

    const currentPrice = product?.isFlashSale && product?.flashSalePrice ? product.flashSalePrice : displayPrice;
    const discount = product?.originalPrice
        ? Math.max(0, Math.round((1 - currentPrice / product.originalPrice) * 100))
        : 0;

    if (loading) {
        return (
            <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px 16px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <Skeleton.Button active style={{ width: 300, marginBottom: 16 }} />
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={10}>
                            <Skeleton.Button active style={{ width: '100%', height: 450, borderRadius: 12 }} />
                        </Col>
                        <Col xs={24} md={14}>
                            <Skeleton active paragraph={{ rows: 6 }} />
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }

    if (!product) {
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
                <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12 }}>
                    <Title level={4}>Không tìm thấy sản phẩm</Title>
                    <Link to="/">
                        <Button type="primary" style={{ background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)' }}>
                            Quay về trang chủ
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const images = product.images?.length > 0 ? product.images : ['https://placehold.co/500x500?text=No+Image'];

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
                <Breadcrumb separator={<RightOutlined style={{ fontSize: 10 }} />} style={{ marginBottom: 16 }}>
                    <Breadcrumb.Item>
                        <Link to="/" style={{ color: '#5a6478' }}>
                            Trang chủ
                        </Link>
                    </Breadcrumb.Item>
                    {product.category?.name && <Breadcrumb.Item>{product.category.name}</Breadcrumb.Item>}
                    <Breadcrumb.Item>
                        <Text strong>{product.name}</Text>
                    </Breadcrumb.Item>
                </Breadcrumb>

                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf3', overflow: 'hidden' }}>
                    <Row>
                        <Col xs={24} md={10} style={{ padding: 24 }}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div
                                    style={{
                                        position: 'relative',
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        background: '#f5f7fa',
                                        marginBottom: 16,
                                    }}
                                >
                                    {discount > 0 && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                zIndex: 2,
                                                background: 'linear-gradient(135deg, #ff6b00, #ff8c33)',
                                                color: '#fff',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            -{discount}%
                                        </div>
                                    )}
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={selectedImage}
                                            src={images[selectedImage]}
                                            alt={product.name}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            style={{
                                                width: '100%',
                                                height: 420,
                                                objectFit: 'contain',
                                                display: 'block',
                                            }}
                                        />
                                    </AnimatePresence>
                                </div>
                                {images.length > 1 && (
                                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                        {images.map((img, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setSelectedImage(i)}
                                                style={{
                                                    width: 68,
                                                    height: 68,
                                                    flexShrink: 0,
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    border: `2px solid ${i === selectedImage ? '#1a3c8f' : '#e8ecf3'}`,
                                                    transition: 'border-color 0.2s',
                                                }}
                                            >
                                                <img
                                                    src={img}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </Col>

                        <Col xs={24} md={14} style={{ padding: 24 }}>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                            >
                                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                    {product.brand && (
                                        <Tag
                                            color="blue"
                                            style={{
                                                background: '#EEF2FF',
                                                color: '#1a3c8f',
                                                border: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {product.brand}
                                        </Tag>
                                    )}
                                    {product.isFlashSale && (
                                        <Tag
                                            color="volcano"
                                            style={{
                                                background: '#FFF1F0',
                                                color: '#ff4500',
                                                border: 'none',
                                                fontWeight: 700,
                                            }}
                                        >
                                            ⚡ Flash Sale
                                        </Tag>
                                    )}
                                    {product.isFeatured && (
                                        <Tag
                                            color="gold"
                                            style={{
                                                background: '#FFF7E6',
                                                color: '#d46b08',
                                                border: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            ★ Nổi bật
                                        </Tag>
                                    )}
                                </div>

                                <Title level={4} style={{ margin: '0 0 12px 0', lineHeight: 1.35 }}>
                                    {product.name}
                                </Title>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Rate
                                            disabled
                                            defaultValue={product.ratingAverage || product.averageRating || 0}
                                            allowHalf
                                            style={{ fontSize: 14, color: '#faaf00' }}
                                        />
                                        <Text type="secondary">
                                            ({product.ratingCount || product.totalReviews || 0} đánh giá)
                                        </Text>
                                    </div>
                                    <Divider type="vertical" />
                                    <Text type="secondary">
                                        Đã bán <Text strong>{product.sold || 0}</Text>
                                    </Text>
                                </div>

                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, #FFF7F0 0%, #FFF0F0 100%)',
                                        borderRadius: 8,
                                        padding: 16,
                                        marginBottom: 24,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                                        <span style={{ color: '#ff4500', fontSize: '1.5rem', fontWeight: 800 }}>
                                            {currentPrice.toLocaleString('vi-VN')}₫
                                        </span>
                                        {product.originalPrice > 0 && product.originalPrice !== currentPrice && (
                                            <span
                                                style={{
                                                    textDecoration: 'line-through',
                                                    color: '#8899aa',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {product.originalPrice.toLocaleString('vi-VN')}₫
                                            </span>
                                        )}
                                        {discount > 0 && (
                                            <Tag color="volcano" style={{ fontWeight: 700 }}>
                                                Tiết kiệm {discount}%
                                            </Tag>
                                        )}
                                    </div>
                                </div>

                                {product.variants?.length > 0 &&
                                    product.variants.map((variant, vi) => (
                                        <div key={vi} style={{ marginBottom: 16 }}>
                                            <div style={{ marginBottom: 8, fontWeight: 600, color: '#5a6478' }}>
                                                {variant.name}:
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {variant.options?.map((opt, oi) => {
                                                    const isSelected = selectedVariants[variant.name] === oi;
                                                    return (
                                                        <div
                                                            key={oi}
                                                            onClick={() =>
                                                                setSelectedVariants((prev) => ({
                                                                    ...prev,
                                                                    [variant.name]: oi,
                                                                }))
                                                            }
                                                            style={{
                                                                padding: '4px 12px',
                                                                borderRadius: 4,
                                                                fontWeight: 600,
                                                                border: `1.5px solid ${isSelected ? '#1a3c8f' : '#e8ecf3'}`,
                                                                background: isSelected ? '#EEF2FF' : '#fff',
                                                                color: isSelected ? '#1a3c8f' : '#1a1a2e',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {opt.label}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                {(() => {
                                    // Tính stock dựa trên variant đang chọn
                                    let currentStock = product.stock || 0;
                                    if (product.variants?.length > 0) {
                                        const variantGroup = product.variants[0];
                                        const selectedOptIndex = selectedVariants[variantGroup.name];
                                        if (selectedOptIndex !== undefined) {
                                            currentStock = variantGroup.options[selectedOptIndex]?.stock || 0;
                                        } else {
                                            // Chưa chọn variant → tổng stock tất cả options
                                            currentStock =
                                                variantGroup.options?.reduce((sum, opt) => sum + (opt.stock || 0), 0) ||
                                                0;
                                        }
                                    }

                                    return (
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}
                                        >
                                            <Text strong style={{ color: '#5a6478' }}>
                                                Số lượng:
                                            </Text>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    border: '1.5px solid #e8ecf3',
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                                    style={{
                                                        padding: '4px 12px',
                                                        cursor: 'pointer',
                                                        background: '#f9fafb',
                                                    }}
                                                >
                                                    <MinusOutlined />
                                                </div>
                                                <div
                                                    style={{
                                                        padding: '4px 16px',
                                                        fontWeight: 700,
                                                        minWidth: 40,
                                                        textAlign: 'center',
                                                        borderLeft: '1px solid #e8ecf3',
                                                        borderRight: '1px solid #e8ecf3',
                                                    }}
                                                >
                                                    {quantity}
                                                </div>
                                                <div
                                                    onClick={() =>
                                                        setQuantity((q) => Math.min(currentStock || 1, q + 1))
                                                    }
                                                    style={{
                                                        padding: '4px 12px',
                                                        cursor: 'pointer',
                                                        background: '#f9fafb',
                                                    }}
                                                >
                                                    <PlusOutlined />
                                                </div>
                                            </div>
                                            <Text
                                                type="secondary"
                                                style={{
                                                    color: currentStock > 0 ? '#10b981' : '#ef4444',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {currentStock > 0 ? `${currentStock} sản phẩm có sẵn` : 'Hết hàng'}
                                            </Text>
                                        </div>
                                    );
                                })()}

                                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                    <Button
                                        size="large"
                                        icon={<ShoppingCartOutlined />}
                                        onClick={handleAddToCart}
                                        disabled={addingToCart || product.stock === 0}
                                        style={{
                                            flex: 1,
                                            height: 48,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            borderColor: '#1a3c8f',
                                            color: '#1a3c8f',
                                            borderWidth: 2,
                                        }}
                                    >
                                        Thêm vào giỏ
                                    </Button>
                                    <Button
                                        size="large"
                                        type="primary"
                                        onClick={handleBuyNow}
                                        disabled={product.stock === 0}
                                        style={{
                                            flex: 1,
                                            height: 48,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c33 100%)',
                                            border: 'none',
                                            boxShadow: '0 4px 16px rgba(255,107,0,0.35)',
                                        }}
                                    >
                                        Mua Ngay
                                    </Button>
                                </div>

                                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                                    <Button
                                        type="text"
                                        icon={
                                            wished ? (
                                                <HeartFilled style={{ color: '#ef4444' }} />
                                            ) : (
                                                <HeartOutlined style={{ color: '#8899aa' }} />
                                            )
                                        }
                                        onClick={async () => {
                                            if (!user) {
                                                navigate('/login');
                                                return;
                                            }
                                            try {
                                                await toggleWishlist(product._id);
                                                const next = !wished;
                                                setWished(next);
                                                message.success(
                                                    next ? '❤️ Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích',
                                                );
                                            } catch {
                                                message.error('Không thể cập nhật yêu thích');
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            color: wished ? '#ef4444' : '#5a6478',
                                            fontWeight: 600,
                                            border: wished ? '1px solid #fecaca' : '1px solid #e8ecf3',
                                        }}
                                    >
                                        {wished ? 'Đã yêu thích' : 'Yêu thích'}
                                    </Button>
                                    <Button
                                        type="text"
                                        icon={<FlagOutlined style={{ color: '#ef4444' }} />}
                                        onClick={() => setReportOpen(true)}
                                        style={{ color: '#ef4444', fontWeight: 600, border: '1px solid #fecaca' }}
                                        title="Báo cáo vi phạm"
                                    >
                                        Báo cáo
                                    </Button>
                                </div>

                                <Divider style={{ margin: '16px 0' }} />
                                <Row gutter={16}>
                                    {[
                                        { icon: <CarOutlined />, text: 'Miễn phí vận chuyển', sub: 'Đơn từ 500.000₫' },
                                        {
                                            icon: <SafetyCertificateOutlined />,
                                            text: 'Cam kết chính hãng',
                                            sub: '100% bảo đảm',
                                        },
                                        { icon: <ReloadOutlined />, text: 'Đổi trả miễn phí', sub: 'Trong 30 ngày' },
                                    ].map((item, i) => (
                                        <Col span={8} key={i}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ color: '#1a3c8f', marginBottom: 4, fontSize: 18 }}>
                                                    {item.icon}
                                                </div>
                                                <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.7rem' }}>
                                                    {item.text}
                                                </div>
                                                <div style={{ color: '#8899aa', fontSize: '0.65rem' }}>{item.sub}</div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                {product.store && (
                                    <>
                                        <Divider style={{ margin: '16px 0' }} />
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 16,
                                                padding: 16,
                                                background: '#f8f9fb',
                                                borderRadius: 8,
                                            }}
                                        >
                                            <Avatar
                                                src={product.store.logo}
                                                size={48}
                                                style={{ background: '#1a3c8f' }}
                                                icon={<ShopOutlined />}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700 }}>
                                                    <a
                                                        href={`/store/${product.store.slug}`}
                                                        style={{ color: 'inherit', textDecoration: 'none' }}
                                                    >
                                                        {product.store.name}
                                                    </a>
                                                </div>
                                                <div style={{ color: '#8899aa', fontSize: '0.8rem' }}>
                                                    Cửa hàng chính thức
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    icon={<MessageOutlined />}
                                                    style={{ background: '#1a3c8f', fontWeight: 600 }}
                                                    onClick={() => {
                                                        if (!user) {
                                                            message.warning('Vui lòng đăng nhập để chat với Shop');
                                                            navigate('/login');
                                                            return;
                                                        }
                                                        window.dispatchEvent(
                                                            new CustomEvent('OPEN_CHAT_WIDGET', {
                                                                detail: {
                                                                    storeId: product.store._id,
                                                                    product: {
                                                                        id: product._id,
                                                                        name: product.name,
                                                                        price: currentPrice,
                                                                        image: product.images?.[0],
                                                                    },
                                                                },
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    Chat ngay
                                                </Button>
                                                <Button
                                                    size="small"
                                                    style={{
                                                        borderColor: '#1a3c8f',
                                                        color: '#1a3c8f',
                                                        fontWeight: 600,
                                                    }}
                                                    onClick={() => navigate(`/store/${product.store.slug}`)}
                                                >
                                                    Xem shop
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </Col>
                    </Row>
                </div>

                <div
                    style={{
                        marginTop: 24,
                        borderRadius: 12,
                        border: '1px solid #e8ecf3',
                        background: '#fff',
                        overflow: 'hidden',
                    }}
                >
                    <Tabs
                        defaultActiveKey="1"
                        style={{ padding: '10px' }}
                        items={[
                            {
                                key: '1',
                                label: 'Mô tả sản phẩm',
                                children: (
                                    <div style={{ padding: '0 24px 24px' }}>
                                        {product.description ? (
                                            <div
                                                style={{ lineHeight: 1.8, color: '#3a3a4a', whiteSpace: 'pre-wrap' }}
                                                dangerouslySetInnerHTML={{ __html: product.description }}
                                            />
                                        ) : (
                                            <div style={{ color: '#8899aa', padding: '32px 0', textAlign: 'center' }}>
                                                Chưa có mô tả cho sản phẩm này.
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: '2',
                                label: `Đánh giá (${reviews.length || 0})`,
                                children: (
                                    <div style={{ padding: '0 24px 24px' }}>
                                        {/* AI Summary Block */}
                                        <div style={{ marginBottom: 24 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <Title level={5} style={{ margin: 0, color: '#1a1a2e' }}>
                                                    Tóm tắt từ AI
                                                </Title>
                                                {!aiSummary && reviews.length > 0 && (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<RobotOutlined />}
                                                        loading={loadingAi}
                                                        onClick={fetchAiSummary}
                                                        style={{
                                                            borderRadius: 6,
                                                            background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)',
                                                            border: 'none',
                                                        }}
                                                    >
                                                        Phân tích tự động
                                                    </Button>
                                                )}
                                            </div>
                                            {aiSummary && (
                                                <div
                                                    style={{
                                                        padding: 20,
                                                        background: '#f5f7fa',
                                                        borderRadius: 12,
                                                        border: '1px solid #e8ecf3',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 12,
                                                            marginBottom: 16,
                                                        }}
                                                    >
                                                        <RobotOutlined
                                                            style={{
                                                                color: '#1a3c8f',
                                                                fontSize: '1.5rem',
                                                                marginTop: 2,
                                                            }}
                                                        />
                                                        <div>
                                                            <div style={{ marginBottom: 4 }}>
                                                                <Text
                                                                    strong
                                                                    style={{
                                                                        color: '#1a1a2e',
                                                                        fontSize: '1rem',
                                                                        marginRight: 8,
                                                                    }}
                                                                >
                                                                    AI Nhận xét tổng quan:
                                                                </Text>
                                                                <Tag
                                                                    color={
                                                                        aiSummary.sentiment === 'positive'
                                                                            ? 'success'
                                                                            : aiSummary.sentiment === 'negative'
                                                                              ? 'error'
                                                                              : 'warning'
                                                                    }
                                                                >
                                                                    {aiSummary.sentimentScore}/100 Điểm
                                                                </Tag>
                                                            </div>
                                                            <Text style={{ color: '#3a3a4a', lineHeight: 1.6 }}>
                                                                {aiSummary.summary}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                    <Row gutter={[16, 16]}>
                                                        <Col xs={24} md={12}>
                                                            <div
                                                                style={{
                                                                    padding: 16,
                                                                    background: '#fff',
                                                                    borderRadius: 8,
                                                                    border: '1px solid #e8ecf3',
                                                                    height: '100%',
                                                                }}
                                                            >
                                                                <Text
                                                                    strong
                                                                    style={{
                                                                        color: '#10b981',
                                                                        display: 'block',
                                                                        marginBottom: 12,
                                                                    }}
                                                                >
                                                                    👍 Ưu điểm
                                                                </Text>
                                                                <ul
                                                                    style={{
                                                                        margin: 0,
                                                                        paddingLeft: 20,
                                                                        color: '#3a3a4a',
                                                                        lineHeight: 1.8,
                                                                    }}
                                                                >
                                                                    {aiSummary.pros?.length > 0 ? (
                                                                        aiSummary.pros.map((p, i) => (
                                                                            <li key={i}>{p}</li>
                                                                        ))
                                                                    ) : (
                                                                        <li>Chưa có thông tin</li>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </Col>
                                                        <Col xs={24} md={12}>
                                                            <div
                                                                style={{
                                                                    padding: 16,
                                                                    background: '#fff',
                                                                    borderRadius: 8,
                                                                    border: '1px solid #e8ecf3',
                                                                    height: '100%',
                                                                }}
                                                            >
                                                                <Text
                                                                    strong
                                                                    style={{
                                                                        color: '#ef4444',
                                                                        display: 'block',
                                                                        marginBottom: 12,
                                                                    }}
                                                                >
                                                                    👎 Nhược điểm
                                                                </Text>
                                                                <ul
                                                                    style={{
                                                                        margin: 0,
                                                                        paddingLeft: 20,
                                                                        color: '#3a3a4a',
                                                                        lineHeight: 1.8,
                                                                    }}
                                                                >
                                                                    {aiSummary.cons?.length > 0 ? (
                                                                        aiSummary.cons.map((c, i) => (
                                                                            <li key={i}>{c}</li>
                                                                        ))
                                                                    ) : (
                                                                        <li>Chưa có thông tin</li>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                    <div
                                                        style={{
                                                            marginTop: 16,
                                                            padding: '12px 16px',
                                                            background: '#eef2ff',
                                                            borderRadius: 8,
                                                        }}
                                                    >
                                                        <Text strong style={{ color: '#2b52c0' }}>
                                                            Khuyến nghị mua hàng:{' '}
                                                        </Text>
                                                        <Text style={{ color: '#3a3a4a' }}>
                                                            {aiSummary.recommendation}
                                                        </Text>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {reviews.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                {reviews.map((rev, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            padding: 16,
                                                            border: '1px solid #e8ecf3',
                                                            borderRadius: 8,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 12,
                                                                marginBottom: 8,
                                                            }}
                                                        >
                                                            <Avatar style={{ background: '#1a3c8f' }}>
                                                                {rev.user?.fullName?.charAt(0) || 'U'}
                                                            </Avatar>
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                                                    {rev.user?.fullName || 'Người dùng'}
                                                                </div>
                                                                <Rate
                                                                    disabled
                                                                    value={rev.rating || 0}
                                                                    style={{ fontSize: 12, color: '#faaf00' }}
                                                                />
                                                            </div>
                                                            <div
                                                                style={{
                                                                    marginLeft: 'auto',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                }}
                                                            >
                                                                <span style={{ color: '#8899aa', fontSize: '0.8rem' }}>
                                                                    {rev.createdAt
                                                                        ? new Date(rev.createdAt).toLocaleDateString(
                                                                              'vi-VN',
                                                                          )
                                                                        : ''}
                                                                </span>
                                                                {user &&
                                                                    (rev.user?._id === user._id ||
                                                                        rev.user?.id === user._id ||
                                                                        rev.user === user._id) && (
                                                                        <>
                                                                            <Button
                                                                                type="text"
                                                                                size="small"
                                                                                icon={<EditOutlined />}
                                                                                onClick={() => openEditModal(rev)}
                                                                                style={{ color: '#1a3c8f' }}
                                                                                title="Sửa đánh giá"
                                                                            />
                                                                            <Popconfirm
                                                                                title="Xóa đánh giá"
                                                                                description="Bạn có chắc muốn xóa đánh giá này không?"
                                                                                onConfirm={() =>
                                                                                    handleDeleteReview(rev._id)
                                                                                }
                                                                                okText="Xóa"
                                                                                cancelText="Hủy"
                                                                                okButtonProps={{ danger: true }}
                                                                            >
                                                                                <Button
                                                                                    type="text"
                                                                                    danger
                                                                                    size="small"
                                                                                    icon={<DeleteOutlined />}
                                                                                    loading={deletingReview === rev._id}
                                                                                    style={{ color: '#ef4444' }}
                                                                                    title="Xóa đánh giá"
                                                                                />
                                                                            </Popconfirm>
                                                                        </>
                                                                    )}
                                                            </div>
                                                        </div>
                                                        <div style={{ color: '#3a3a4a', marginTop: 8 }}>
                                                            {rev.content}
                                                        </div>
                                                        {rev.images?.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                                                {rev.images.map((img, j) => (
                                                                    <img
                                                                        key={j}
                                                                        src={img}
                                                                        style={{
                                                                            width: 64,
                                                                            height: 64,
                                                                            borderRadius: 4,
                                                                            objectFit: 'cover',
                                                                        }}
                                                                        alt=""
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        {rev.reply && rev.reply.content && (
                                                            <div
                                                                style={{
                                                                    marginTop: 16,
                                                                    padding: '12px 16px',
                                                                    background: '#f8f9fb',
                                                                    borderRadius: 8,
                                                                    borderLeft: '4px solid #1a3c8f',
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        marginBottom: 6,
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            fontWeight: 600,
                                                                            color: '#1a1a2e',
                                                                            fontSize: '0.85rem',
                                                                        }}
                                                                    >
                                                                        Phản hồi từ Người bán
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            color: '#8899aa',
                                                                            fontSize: '0.75rem',
                                                                        }}
                                                                    >
                                                                        {rev.reply.repliedAt
                                                                            ? new Date(
                                                                                  rev.reply.repliedAt,
                                                                              ).toLocaleDateString('vi-VN')
                                                                            : ''}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        color: '#3a3a4a',
                                                                        fontSize: '0.85rem',
                                                                        lineHeight: 1.6,
                                                                    }}
                                                                >
                                                                    {rev.reply.content}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                                <StarFilled
                                                    style={{ fontSize: 48, color: '#e8ecf3', marginBottom: 8 }}
                                                />
                                                <div style={{ color: '#8899aa' }}>
                                                    Chưa có đánh giá nào cho sản phẩm này.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: '3',
                                label: 'Thông số',
                                children: (
                                    <div style={{ padding: '0 24px 24px' }}>
                                        {product.attributes?.length > 0 ? (
                                            <div style={{ maxWidth: 600 }}>
                                                {product.attributes.map((attr, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            display: 'flex',
                                                            padding: '12px 0',
                                                            borderBottom: '1px solid #f0f2f5',
                                                        }}
                                                    >
                                                        <div style={{ width: 180, color: '#8899aa', flexShrink: 0 }}>
                                                            {attr.name}
                                                        </div>
                                                        <div style={{ fontWeight: 500, color: '#1a1a2e' }}>
                                                            {attr.value}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ color: '#8899aa', padding: '32px 0', textAlign: 'center' }}>
                                                Chưa có thông số kỹ thuật.
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>

                {relatedProducts.length > 0 && (
                    <div
                        style={{
                            marginTop: 24,
                            padding: 24,
                            borderRadius: 12,
                            border: '1px solid #e8ecf3',
                            background: '#fff',
                        }}
                    >
                        <Title level={4} style={{ marginBottom: 16 }}>
                            Sản Phẩm Tương Tự
                        </Title>
                        <Row gutter={[16, 16]}>
                            {relatedProducts.map((p, i) => (
                                <Col xs={12} sm={8} md={6} key={p.id}>
                                    <ProductCard product={p} index={i} />
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
            </div>

            {/* Report Modal */}
            <ReportModal
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetId={product?._id}
                targetType="product"
                targetName={product?.name}
            />

            {/* Edit Review Modal */}
            <Modal
                title="Sửa đánh giá của bạn"
                open={editModalOpen}
                onCancel={() => !submittingEdit && setEditModalOpen(false)}
                onOk={handleSubmitEdit}
                confirmLoading={submittingEdit}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                okButtonProps={{ style: { background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)', border: 'none' } }}
            >
                {editingReview && (
                    <div style={{ padding: '8px 0' }}>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>Đánh giá của bạn:</div>
                            <Rate
                                value={editRating}
                                onChange={setEditRating}
                                style={{ fontSize: 28, color: '#faaf00' }}
                            />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>Nhận xét:</div>
                            <Input.TextArea
                                rows={4}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                                maxLength={1000}
                                showCount
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

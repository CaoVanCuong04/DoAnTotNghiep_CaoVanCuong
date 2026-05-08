import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Typography, Button, Spin, Pagination, Empty, Tag, Select, Skeleton, Avatar, message } from 'antd';
import {
    ShopOutlined, EnvironmentOutlined, PhoneOutlined, StarFilled,
    HeartOutlined, HeartFilled, MessageOutlined, FireFilled,
    SortAscendingOutlined, SortDescendingOutlined, ThunderboltFilled,
    CalendarOutlined, TeamOutlined, ShoppingOutlined, AppstoreOutlined,
    CheckCircleFilled, FlagOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoreBySlug, getStoreProducts, checkFollowStore, toggleFollowStore } from '../api/apiStore';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import ReportModal from '../components/ReportModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

const SORT_OPTIONS = [
    { value: 'newest', label: 'Mới nhất', icon: <ThunderboltFilled style={{ color: '#8b5cf6' }} /> },
    { value: 'best_seller', label: 'Bán chạy', icon: <FireFilled style={{ color: '#ea580c' }} /> },
    { value: 'price_asc', label: 'Giá tăng', icon: <SortAscendingOutlined /> },
    { value: 'price_desc', label: 'Giá giảm', icon: <SortDescendingOutlined /> },
];

const StatBox = ({ icon, value, label, color }) => (
    <div style={{
        textAlign: 'center', padding: '12px 0',
    }}>
        <div style={{ fontSize: 14, color: color || '#64748b', marginBottom: 4 }}>{icon}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
            {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
);

export default function StoreProfilePage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState('newest');
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    // Fetch store info
    useEffect(() => {
        const fetchStore = async () => {
            setLoading(true);
            try {
                const res = await getStoreBySlug(slug);
                setStore(res.data.metadata);
            } catch (err) {
                console.error(err);
                message.error('Không tìm thấy cửa hàng');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, [slug]);

    // Check follow status
    useEffect(() => {
        if (!store || !user) return;
        checkFollowStore(store._id)
            .then(res => setIsFollowing(res.data.metadata?.followed || false))
            .catch(() => {});
    }, [store, user]);

    // Fetch products
    useEffect(() => {
        if (!store) return;
        const fetchProducts = async () => {
            setProductsLoading(true);
            try {
                const res = await getStoreProducts(slug, { page, limit: 12, sort });
                const rawProducts = res.data.metadata?.products || [];
                const mapped = rawProducts.map(p => ({
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    originalPrice: p.originalPrice || 0,
                    discount: p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0,
                    rating: p.ratingAverage || 0,
                    reviews: p.ratingCount || 0,
                    image: p.images?.[0] || 'https://placehold.co/300x300?text=No+Image',
                    slug: p.slug,
                    sold: p.sold || 0,
                    isFlashSale: p.isFlashSale || false,
                    isBestSeller: p.isFeatured || false,
                    category: p.category?.slug || '',
                }));
                setProducts(mapped);
                setTotal(res.data.metadata?.total || 0);
            } catch (err) {
                console.error(err);
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, [store, page, sort, slug]);

    const handleFollow = async () => {
        if (!user) { message.info('Vui lòng đăng nhập để theo dõi shop'); return; }
        setFollowLoading(true);
        try {
            await toggleFollowStore(store._id);
            setIsFollowing(prev => !prev);
            message.success(isFollowing ? 'Đã bỏ theo dõi' : 'Đã theo dõi shop!');
        } catch (err) {
            message.error('Có lỗi xảy ra');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleChat = () => {
        if (!user) { message.info('Vui lòng đăng nhập để chat'); return; }
        window.dispatchEvent(new CustomEvent('OPEN_CHAT_WIDGET', {
            detail: { storeId: store._id, sellerId: store.owner?._id || store.owner }
        }));
    };

    if (loading) {
        return (
            <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
                <Skeleton.Image active style={{ width: '100%', height: 280, display: 'block' }} />
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32 }}>
                        <Skeleton.Avatar active size={100} shape="circle" />
                        <Skeleton active paragraph={{ rows: 3 }} style={{ flex: 1 }} />
                    </div>
                    <Row gutter={[16, 16]}>
                        {[...Array(8)].map((_, i) => (
                            <Col xs={12} sm={8} md={6} key={i}>
                                <Skeleton active paragraph={{ rows: 3 }} />
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>
        );
    }

    if (!store) return null;

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
            {/* ── BANNER ── */}
            <div style={{
                position: 'relative',
                height: 280,
                background: store.banner
                    ? `url(${store.banner}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #1e40af 60%, #3b82f6 100%)',
                overflow: 'hidden',
            }}>
                {/* Dark overlay for readability */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%)',
                }} />

                {/* Decorative elements */}
                <div style={{ position: 'absolute', top: -60, right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
                <div style={{ position: 'absolute', bottom: -40, left: '15%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            </div>

            {/* ── STORE INFO CARD ── */}
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        background: '#fff',
                        borderRadius: 24,
                        marginTop: -80,
                        position: 'relative',
                        zIndex: 10,
                        padding: '28px 32px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                        border: '1px solid #f1f5f9',
                    }}
                >
                    <Row gutter={24} align="middle">
                        <Col xs={24} md={16}>
                            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                {/* Avatar */}
                                <motion.div whileHover={{ scale: 1.05 }}>
                                    <Avatar
                                        src={store.logo}
                                        icon={<ShopOutlined />}
                                        size={90}
                                        style={{
                                            background: store.logo ? '#fff' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                            border: '4px solid #fff',
                                            boxShadow: '0 4px 20px rgba(37,99,235,0.25)',
                                            fontSize: 36,
                                        }}
                                    />
                                </motion.div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                                            {store.name}
                                        </h1>
                                        <CheckCircleFilled style={{ color: '#2563eb', fontSize: 20 }} />
                                        <Tag color="blue" style={{ borderRadius: 12, fontWeight: 600, fontSize: 11 }}>
                                            Shop Mall
                                        </Tag>
                                    </div>

                                    {store.description && (
                                        <Text style={{ color: '#64748b', fontSize: 14, marginTop: 6, display: 'block', maxWidth: 500 }}>
                                            {store.description}
                                        </Text>
                                    )}

                                    <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                                        {store.address && (
                                            <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <EnvironmentOutlined /> {store.address}
                                            </span>
                                        )}
                                        {store.phone && (
                                            <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <PhoneOutlined /> {store.phone}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CalendarOutlined /> Tham gia {dayjs(store.createdAt).fromNow()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        {/* Actions + Stats */}
                        <Col xs={24} md={8}>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    <Button
                                        type={isFollowing ? 'default' : 'primary'}
                                        icon={isFollowing ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
                                        onClick={handleFollow}
                                        loading={followLoading}
                                        style={{
                                            borderRadius: 12, height: 44, fontWeight: 700, paddingInline: 24,
                                            background: isFollowing ? '#fff' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                            border: isFollowing ? '2px solid #fecaca' : 'none',
                                            color: isFollowing ? '#ef4444' : '#fff',
                                        }}
                                    >
                                        {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                                    </Button>
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    <Button
                                        icon={<MessageOutlined />}
                                        onClick={handleChat}
                                        style={{
                                            borderRadius: 12, height: 44, fontWeight: 700, paddingInline: 24,
                                            border: '2px solid #e2e8f0',
                                        }}
                                    >
                                        Chat ngay
                                    </Button>
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    <Button
                                        icon={<FlagOutlined />}
                                        onClick={() => setReportOpen(true)}
                                        style={{
                                            borderRadius: 12, height: 44, fontWeight: 700,
                                            border: '2px solid #fecaca',
                                            color: '#dc2626',
                                        }}
                                    >
                                        Báo cáo
                                    </Button>
                                </motion.div>
                            </div>

                            {/* Stat chips */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 12, background: '#f8fafc', padding: '12px', borderRadius: 16,
                            }}>
                                <StatBox icon={<AppstoreOutlined />} value={store.totalProducts || 0} label="Sản phẩm" color="#2563eb" />
                                <StatBox icon={<TeamOutlined />} value={store.totalFollowers || 0} label="Người theo dõi" color="#8b5cf6" />
                                <StatBox icon={<StarFilled />} value={store.rating ? store.rating.toFixed(1) : '5.0'} label="Đánh giá" color="#f59e0b" />
                            </div>
                        </Col>
                    </Row>
                </motion.div>

                {/* ── SORT BAR ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    marginTop: 28, marginBottom: 20,
                    padding: '14px 24px',
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                    border: '1px solid #f1f5f9',
                }}>
                    <ShoppingOutlined style={{ fontSize: 18, color: '#2563eb' }} />
                    <Text strong style={{ fontSize: 16 }}>Sản phẩm của Shop</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>({total} sản phẩm)</Text>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        {SORT_OPTIONS.map(opt => {
                            const isActive = sort === opt.value;
                            return (
                                <motion.button
                                    key={opt.value}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => { setSort(opt.value); setPage(1); }}
                                    style={{
                                        padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                                        background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                                        color: isActive ? '#fff' : '#64748b',
                                        border: isActive ? 'none' : '1.5px solid #e2e8f0',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                                        whiteSpace: 'nowrap', transition: 'all 0.2s',
                                    }}
                                >
                                    {opt.icon} {opt.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* ── PRODUCT GRID ── */}
                <div style={{ minHeight: '40vh' }}>
                    {productsLoading ? (
                        <Row gutter={[16, 16]}>
                            {[...Array(8)].map((_, i) => (
                                <Col xs={12} sm={8} md={6} key={i}>
                                    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                        <Skeleton.Image active style={{ width: '100%', height: 180, display: 'block' }} />
                                        <div style={{ padding: 16 }}>
                                            <Skeleton active paragraph={{ rows: 2 }} />
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    ) : products.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                background: '#fff', padding: '80px 24px', borderRadius: 20, textAlign: 'center',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                            }}
                        >
                            <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🏬</div>
                            <Title level={4} style={{ color: '#334155' }}>Shop chưa có sản phẩm nào</Title>
                            <Text style={{ color: '#94a3b8' }}>Hãy quay lại sau nhé!</Text>
                        </motion.div>
                    ) : (
                        <Row gutter={[16, 16]}>
                            <AnimatePresence>
                                {products.map((product, idx) => (
                                    <Col xs={12} sm={8} md={6} key={product.id || idx}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: idx * 0.04 }}
                                            style={{ height: '100%' }}
                                        >
                                            <ProductCard product={product} index={idx} />
                                        </motion.div>
                                    </Col>
                                ))}
                            </AnimatePresence>
                        </Row>
                    )}
                </div>

                {/* Pagination */}
                {!productsLoading && total > 12 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{
                            display: 'flex', justifyContent: 'center', marginTop: 40, marginBottom: 60,
                            padding: '20px 0', background: '#fff', borderRadius: 16,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                        }}
                    >
                        <Pagination
                            current={page}
                            pageSize={12}
                            total={total}
                            onChange={(p) => { setPage(p); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                            showSizeChanger={false}
                            showTotal={(t, range) => (
                                <span style={{ color: '#94a3b8' }}>
                                    {range[0]}-{range[1]} / {t} sản phẩm
                                </span>
                            )}
                        />
                    </motion.div>
                )}
            </div>

            {/* Report Modal */}
            <ReportModal
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetId={store?._id}
                targetType="store"
                targetName={store?.name}
            />
        </div>
    );
}

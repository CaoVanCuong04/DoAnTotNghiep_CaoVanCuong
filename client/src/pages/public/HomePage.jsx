import { useState, useEffect } from 'react';
import { Typography, Row, Col, Skeleton } from 'antd';
import { motion } from 'framer-motion';
import HeroBanner from '../components/HeroBanner';
import CategorySection from '../components/CategorySection';
import ProductCard from '../components/ProductCard';
import FlashSaleSection from '../components/FlashSaleSection';
import BannerAds from '../components/BannerAds';
import { productApi } from '../api';

const { Title, Text } = Typography;

function SectionHeader({ title, viewAllLabel = 'Xem Tất Cả →' }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>{title}</Title>
            <Text 
                strong 
                style={{ color: '#1a3c8f', cursor: 'pointer' }}
                className="hover-underline"
            >
                {viewAllLabel}
            </Text>
        </div>
    );
}

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await productApi.getAllProducts({ limit: 8, sort: '-createdAt' });
                const data = res.data.metadata?.products || res.data.metadata || res.data || [];

                const mapped = Array.isArray(data) ? data.map((p) => ({
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    originalPrice: p.originalPrice || 0,
                    discount: p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0,
                    rating: p.ratingAverage || p.averageRating || 0,
                    reviews: p.ratingCount || p.totalReviews || 0,
                    image: p.images?.[0] || 'https://placehold.co/300x300?text=No+Image',
                    category: p.category?.slug || '',
                    isFlashSale: p.isFlashSale || false,
                    isBestSeller: p.isFeatured || false,
                    slug: p.slug,
                })) : [];

                setProducts(mapped);
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

                {/* Hero Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <HeroBanner />
                </motion.div>

                {/* Categories */}
                <div style={{ marginTop: 24, padding: 24, borderRadius: 12, background: '#fff', border: '1px solid #e8ecf3' }}>
                    <CategorySection />
                </div>

                {/* Product Listing */}
                <div style={{ marginTop: 24, padding: 24, borderRadius: 12, background: '#fff', border: '1px solid #e8ecf3' }}>
                    <SectionHeader title="Danh Sách Sản Phẩm" />
                    {loading ? (
                        <Row gutter={[16, 16]}>
                            {[...Array(8)].map((_, i) => (
                                <Col xs={12} sm={8} md={6} key={i}>
                                    <Skeleton.Button active style={{ width: '100%', height: 280, borderRadius: 8 }} />
                                </Col>
                            ))}
                        </Row>
                    ) : products.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {products.map((product, i) => (
                                <Col xs={12} sm={8} md={6} key={product.id}>
                                    <ProductCard product={product} index={i} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <Text type="secondary">Chưa có sản phẩm nào. Hãy quay lại sau nhé!</Text>
                        </div>
                    )}
                </div>

                {/* Flash Sale */}
                <div style={{ marginTop: 24 }}>
                    <FlashSaleSection />
                </div>

                {/* Banner Ads */}
                <div style={{ marginTop: 24, padding: 24, borderRadius: 12, background: '#fff', border: '1px solid #e8ecf3' }}>
                    <BannerAds />
                </div>

            </div>
            
            <style jsx="true">{`
                .hover-underline:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}

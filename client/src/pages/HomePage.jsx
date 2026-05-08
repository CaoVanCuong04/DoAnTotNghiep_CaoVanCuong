import { useState, useEffect } from 'react';
import { Typography, Row, Col, Skeleton, Button } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AppstoreOutlined } from '@ant-design/icons';

import CategorySidebar from '../components/CategorySidebar';
import DualBanner from '../components/DualBanner';
import QuickCategories from '../components/QuickCategories';
import FlashSaleSection from '../components/FlashSaleSection';
import TopSellingSection from '../components/TopSellingSection';
import DailyPromotions from '../components/DailyPromotions';
import TestimonialSection from '../components/TestimonialSection';
import ProductCard from '../components/ProductCard';
import { productApi } from '../api';

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await productApi.getAllProducts({ limit: 24, sort: '-createdAt' });
                const data = res.data.metadata?.products || res.data.metadata || res.data || [];
                const mapped = Array.isArray(data)
                    ? data.map((p) => ({
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
                      }))
                    : [];
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
        <div style={{ background: 'linear-gradient(180deg, #e8edf5 0%, #f1f5f9 100%)', minHeight: '100vh', paddingBottom: 60 }}>
            <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '16px 0' }}>
                {/* ── Layout 2 cột: Sidebar + Main ── */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    {/* CỘT TRÁI: Category Sidebar */}
                    <CategorySidebar />

                    {/* CỘT PHẢI: Nội dung chính */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* 1. Dual Banner (2 banner cạnh nhau từ DB) */}
                        <DualBanner />

                        {/* 2. Quick Categories (icon row từ DB) */}
                        <QuickCategories />

                        {/* 3. Daily Promotions */}
                        <DailyPromotions />

                        {/* 4. Flash Sale */}
                        <div style={{ marginBottom: 24 }}>
                            <FlashSaleSection />
                        </div>

                        {/* 5. Top Deal – Bán chạy (scroll ngang) */}
                        <TopSellingSection />

                        {/* 6. Product Reviews Section */}

                        {/* 7. Gợi Ý Hôm Nay (grid sản phẩm) */}
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 12,
                                marginBottom: 12,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 18px',
                                    background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AppstoreOutlined style={{ fontSize: 18, color: '#fff' }} />
                                    <Typography.Title
                                        level={4}
                                        style={{
                                            margin: 0,
                                            color: '#fff',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            fontSize: 15,
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        GỢI Ý HÔM NAY
                                    </Typography.Title>
                                </div>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500 }}>
                                    Dành riêng cho bạn
                                </span>
                            </div>

                            <div style={{ padding: '12px' }}>
                                {loading ? (
                                    <div className="product-grid-5">
                                        {[...Array(10)].map((_, i) => (
                                            <Skeleton.Button
                                                active
                                                style={{
                                                    width: '100%',
                                                    height: 280,
                                                    borderRadius: 6,
                                                    display: 'block',
                                                }}
                                                key={i}
                                            />
                                        ))}
                                    </div>
                                ) : products.length > 0 ? (
                                    <div className="product-grid-5">
                                        {products.map((product, i) => (
                                            <ProductCard product={product} index={i} key={product.id} />
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                        <Typography.Text type="secondary">
                                            Chưa có sản phẩm nào. Hãy quay lại sau nhé!
                                        </Typography.Text>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Load More */}
                        {products.length > 0 && !loading && (
                            <div style={{ textAlign: 'center', marginTop: 20 }}>
                                <Link to="/search">
                                    <motion.button
                                        whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(37,99,235,0.2)' }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            width: 320,
                                            height: 44,
                                            background: 'linear-gradient(90deg, #1e40af, #2563eb)',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: 14,
                                            fontWeight: 700,
                                            borderRadius: 22,
                                            cursor: 'pointer',
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        Xem thêm sản phẩm →
                                    </motion.button>
                                </Link>
                            </div>
                        )}
                        <TestimonialSection />
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 992px) {
                    .category-sidebar {
                        display: none !important;
                    }
                }
                .product-grid-5 {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 12px;
                }
                @media (max-width: 1024px) {
                    .product-grid-5 {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
                @media (max-width: 768px) {
                    .product-grid-5 {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }
                }
                @media (max-width: 576px) {
                    .product-grid-5 {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                    }
                }
            `}</style>
        </div>
    );
}

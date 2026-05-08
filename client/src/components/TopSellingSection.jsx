import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { productApi } from '../api';
import { Skeleton, Tag } from 'antd';
import { FireOutlined, RightOutlined } from '@ant-design/icons';

export default function TopSellingSection() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await productApi.getAllProducts({ limit: 12, sort: '-sold' });
                const data = res.data.metadata?.products || res.data.metadata || res.data || [];
                setProducts(Array.isArray(data) ? data.slice(0, 12) : []);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    return (
        <div style={{
            background: '#fff',
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(90deg, #7f1d1d 0%, #dc2626 60%, #ef4444 100%)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FireOutlined style={{ fontSize: 18, color: '#fcd34d' }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        TOP DEAL · BÁN CHẠY
                    </span>
                    <Tag style={{ margin: 0, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>HOT</Tag>
                </div>
                <Link to="/search?sort=-sold" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                    Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
                </Link>
            </div>

            {/* Scroll horizontal product list */}
            <div style={{ padding: '14px 12px' }}>
                {loading ? (
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} style={{ flexShrink: 0, width: 148 }}>
                                <Skeleton.Button active style={{ width: 148, height: 148, borderRadius: 8, display: 'block', marginBottom: 8 }} />
                                <Skeleton.Input active size="small" style={{ width: '100%', height: 12, marginBottom: 4 }} />
                                <Skeleton.Input active size="small" style={{ width: 80, height: 14 }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            gap: 10,
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            paddingBottom: 4,
                        }}
                        className="top-deal-scroll"
                    >
                        {products.map((p, i) => {
                            const discount = p.originalPrice && p.originalPrice > p.price
                                ? Math.round((1 - p.price / p.originalPrice) * 100)
                                : 0;

                            return (
                                <motion.div
                                    key={p._id}
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -4 }}
                                    style={{ flexShrink: 0, width: 148 }}
                                >
                                    <Link to={`/product/${p.slug}`} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            border: '1px solid #f1f5f9',
                                            borderRadius: 10,
                                            overflow: 'hidden',
                                            background: '#fff',
                                            transition: 'all 0.25s',
                                            height: '100%',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                        }}
                                            className="top-deal-card"
                                        >
                                            {/* Image */}
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={p.images?.[0] || 'https://placehold.co/148x148?text=No+Image'}
                                                    alt={p.name}
                                                    style={{ width: '100%', height: 148, objectFit: 'cover', display: 'block' }}
                                                />
                                                {/* Rank badge */}
                                                {i < 3 && (
                                                    <div style={{
                                                        position: 'absolute', top: 6, left: 6,
                                                        width: 22, height: 22, borderRadius: '50%',
                                                        background: ['#f97316', '#64748b', '#a78bfa'][i],
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 11, fontWeight: 800, color: '#fff',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                    }}>
                                                        {i + 1}
                                                    </div>
                                                )}
                                                {/* Discount badge */}
                                                {discount > 0 && (
                                                    <div style={{
                                                        position: 'absolute', top: 6, right: 6,
                                                        background: '#dc2626', color: '#fff',
                                                        fontSize: 10, fontWeight: 700,
                                                        padding: '2px 5px', borderRadius: 4,
                                                    }}>
                                                        -{discount}%
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div style={{ padding: '8px 10px 10px' }}>
                                                <div style={{
                                                    fontSize: 12, color: '#374151', fontWeight: 500,
                                                    display: '-webkit-box', WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                    lineHeight: 1.4, marginBottom: 6, minHeight: 34,
                                                }}>
                                                    {p.name}
                                                </div>
                                                <div style={{ fontSize: 14, color: '#dc2626', fontWeight: 700 }}>
                                                    {p.price?.toLocaleString('vi-VN')}₫
                                                </div>
                                                {p.originalPrice > p.price && (
                                                    <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                                                        {p.originalPrice?.toLocaleString('vi-VN')}₫
                                                    </div>
                                                )}
                                                {p.sold > 0 && (
                                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                                                        Đã bán {p.sold > 999 ? `${(p.sold / 1000).toFixed(1)}k` : p.sold}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                .top-deal-scroll::-webkit-scrollbar { display: none; }
                .top-deal-card:hover {
                    border-color: #fca5a5 !important;
                    box-shadow: 0 6px 20px rgba(220,38,38,0.12) !important;
                    transform: translateY(-3px);
                }
            `}</style>
        </div>
    );
}

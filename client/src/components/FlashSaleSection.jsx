import { useState, useEffect } from 'react';
import { Row, Col, Skeleton, Typography } from 'antd';
import { motion } from 'framer-motion';
import { ThunderboltFilled } from '@ant-design/icons';
import ProductCard from './ProductCard';
import { productApi } from '../api';

const { Title, Text } = Typography;

function useCountdown(targetSeconds) {
    const [timeLeft, setTimeLeft] = useState(targetSeconds);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const hours = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');
    return { hours, minutes, seconds };
}

function TimeBlock({ value }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    background: '#fff',
                    color: '#ff4500',
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    lineHeight: 1.4,
                    minWidth: 40,
                    display: 'inline-block',
                    fontFamily: 'monospace',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
            >
                {value}
            </div>
        </div>
    );
}

export default function FlashSaleSection() {
    const [flashProducts, setFlashProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { hours, minutes, seconds } = useCountdown(1 * 60 * 60 + 23 * 60 + 45);

    useEffect(() => {
        const fetchFlashSale = async () => {
            try {
                const res = await productApi.getAllProducts({ isFlashSale: true, limit: 10 });
                const data = res.data.metadata?.products || res.data.metadata || res.data || [];

                const mapped = Array.isArray(data) ? data.map((p) => ({
                    id: p._id,
                    name: p.name,
                    price: p.flashSalePrice || p.price,
                    originalPrice: p.originalPrice || p.price,
                    discount: p.originalPrice ? Math.round((1 - (p.flashSalePrice || p.price) / p.originalPrice) * 100) : 0,
                    rating: p.ratingAverage || p.averageRating || 0,
                    reviews: p.ratingCount || p.totalReviews || 0,
                    image: p.images?.[0] || 'https://placehold.co/300x300?text=No+Image',
                    category: p.category?.slug || '',
                    isFlashSale: true,
                    isBestSeller: p.isFeatured || false,
                    slug: p.slug,
                })) : [];

                setFlashProducts(mapped);
            } catch (error) {
                console.error('Lỗi khi tải Flash Sale:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFlashSale();
    }, []);

    if (loading) {
        return (
            <div>
                <div style={{
                    background: 'linear-gradient(135deg, #ff4500 0%, #ff6b00 50%, #ff8c33 100%)',
                    borderRadius: '12px 12px 0 0', padding: 16
                }}>
                    <Skeleton.Button active style={{ width: 200, background: 'rgba(255,255,255,0.3)' }} />
                </div>
                <div style={{ border: '2px solid #ff6b00', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 16, background: '#fff9f5' }}>
                    <div className="product-grid-5">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton.Button active style={{ width: '100%', height: 280, borderRadius: 8 }} key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (flashProducts.length === 0) return null;

    return (
        <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(255,107,0,0.15)' }}>
            {/* Header */}
            <div
                style={{
                    background: 'linear-gradient(90deg, #c2410c 0%, #ff6b00 50%, #ff8c33 100%)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.4 }}
                    >
                        <ThunderboltFilled style={{ color: '#fff', fontSize: 28 }} />
                    </motion.div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                            Flash Sale Siêu Rẻ
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                            Sản phẩm giảm giá sốc có số lượng giới hạn
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TimeBlock value={hours} />
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1 }}>:</div>
                    <TimeBlock value={minutes} />
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1 }}>:</div>
                    <TimeBlock value={seconds} />
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}>
                        còn lại
                    </div>
                </div>
            </div>

            {/* Products */}
            <div
                style={{
                    borderTop: 'none',
                    padding: '14px 14px 16px',
                    background: '#fff',
                }}
            >
                <div className="product-grid-5">
                    {flashProducts.map((product, i) => (
                        <ProductCard product={product} index={i} key={product.id} />
                    ))}
                </div>
            </div>
        </div>
    );
}

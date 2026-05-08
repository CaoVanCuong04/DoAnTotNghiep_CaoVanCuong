import { useState, useEffect } from 'react';
import { Typography, Skeleton, message } from 'antd';
import { motion } from 'framer-motion';
import { TagOutlined, CarOutlined, FireFilled, ThunderboltFilled, GiftFilled, CrownFilled } from '@ant-design/icons';
import { getPublicCoupons } from '../api/apiCoupon';

const PALETTES = [
    {
        color: '#ff6b00', text: '#fff',
        bg: 'linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)',
        glow: 'rgba(255,107,0,0.3)',
        icon: <ThunderboltFilled />
    },
    {
        color: '#1d4ed8', text: '#fff',
        bg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        glow: 'rgba(29,78,216,0.3)',
        icon: <CarOutlined />
    },
    {
        color: '#dc2626', text: '#fff',
        bg: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
        glow: 'rgba(220,38,38,0.3)',
        icon: <FireFilled />
    },
    {
        color: '#059669', text: '#fff',
        bg: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
        glow: 'rgba(5,150,105,0.3)',
        icon: <GiftFilled />
    },
];

function CouponCard({ promo, idx, palette }) {
    const [copied, setCopied] = useState(false);

    const title = promo.discountType === 'percent'
        ? `GIẢM ${promo.discountValue}%`
        : `GIẢM ${(promo.discountValue / 1000).toFixed(0)}K`;
    const minText = promo.minOrderAmount > 0
        ? `Đơn từ ${(promo.minOrderAmount / 1000).toFixed(0)}K`
        : 'Không giới hạn đơn';
    const maxText = promo.maxDiscount ? `Tối đa ${(promo.maxDiscount / 1000).toFixed(0)}K` : '';

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(promo.code).then(() => {
            setCopied(true);
            message.success(`Đã sao chép mã ${promo.code}!`);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.09, duration: 0.45, ease: 'easeOut' }}
            whileHover={{ y: -6, boxShadow: `0 16px 40px ${palette.glow}` }}
            style={{
                background: palette.bg,
                borderRadius: 16,
                overflow: 'visible',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${palette.glow}`,
                transition: 'box-shadow 0.3s',
            }}
        >
            {/* Ribbon TOP RIGHT */}
            <div style={{
                position: 'absolute', top: -1, right: 16,
                background: 'rgba(0,0,0,0.18)',
                color: '#fff', fontSize: 9, fontWeight: 800,
                padding: '3px 10px', borderRadius: '0 0 8px 8px',
                letterSpacing: 0.5, textTransform: 'uppercase',
            }}>
                Sắp hết
            </div>

            {/* Main body */}
            <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 100 }}>
                {/* Left: Icon panel */}
                <div style={{
                    width: 72, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.12)',
                    gap: 4, padding: '12px 0',
                    borderRadius: '16px 0 0 0',
                }}>
                    <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.95)' }}>
                        {palette.icon}
                    </span>
                </div>

                {/* Notch */}
                <div style={{ position: 'relative', width: 0 }}>
                    <div style={{
                        position: 'absolute', top: '50%', left: -10,
                        transform: 'translateY(-50%)',
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#f1f5f9', zIndex: 2,
                    }} />
                </div>

                {/* Right: Info */}
                <div style={{
                    flex: 1, padding: '14px 14px 14px 18px',
                    borderLeft: '2px dashed rgba(255,255,255,0.3)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                            {minText} {maxText && `• ${maxText}`}
                        </div>
                        <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1.1, marginTop: 2 }}>
                            {title}
                        </div>
                        {promo.description && (
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 3, lineHeight: 1.3 }}>
                                {promo.description}
                            </div>
                        )}
                    </div>

                    {/* Code button */}
                    <button
                        onClick={handleCopy}
                        style={{
                            marginTop: 10, alignSelf: 'flex-start',
                            background: 'rgba(255,255,255,0.2)',
                            border: '1.5px dashed rgba(255,255,255,0.6)',
                            borderRadius: 6, padding: '4px 12px',
                            color: '#fff', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', letterSpacing: 1,
                            backdropFilter: 'blur(4px)',
                            transition: 'background 0.2s',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        <TagOutlined style={{ fontSize: 10 }} />
                        {copied ? '✓ Đã sao chép!' : promo.code}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function DailyPromotions() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPublicCoupons().then(res => {
            setPromotions(res.data.metadata || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[...Array(4)].map((_, i) => (
                    <Skeleton.Button key={i} active style={{ width: '100%', height: 116, borderRadius: 16, display: 'block' }} />
                ))}
            </div>
        </div>
    );
    if (promotions.length === 0) return null;

    return (
        <div style={{ marginBottom: 24 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CrownFilled style={{ color: '#f59e0b', fontSize: 20 }} />
                    <Typography.Title level={5} style={{
                        margin: 0, fontWeight: 800,
                        background: 'linear-gradient(90deg, #ff6b00, #dc2626)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        fontSize: 16,
                    }}>
                        ƯU ĐÃI GẤP BỘI
                    </Typography.Title>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                    Click để sao chép mã →
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(promotions.length, 4)}, 1fr)`,
                gap: 14,
            }}>
                {promotions.map((promo, idx) => (
                    <CouponCard
                        key={promo._id}
                        promo={promo}
                        idx={idx}
                        palette={PALETTES[idx % PALETTES.length]}
                    />
                ))}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Skeleton, Tag } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { bannerApi } from '../api';
import { bannerSlides as fallbackSlides } from '../data/mockData';

export default function DualBanner() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await bannerApi.getActiveBanners();
                const data = res.data.metadata || res.data || [];
                const mapped = (Array.isArray(data) ? data : []).map(b => ({
                    id: b._id,
                    title: b.title || '',
                    subtitle: b.highlight || b.subtitle || '',
                    cta: b.cta || 'Mua Ngay',
                    bg: b.darkGradient || b.lightGradient || 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    image: b.imageUrl || '',
                    link: b.link || '/search',
                    tag: b.tag || 'Ưu đãi giới hạn',
                }));
                setBanners(mapped.length > 0 ? mapped : fallbackSlides.map(s => ({
                    ...s, id: s.id || Math.random()
                })));
            } catch {
                setBanners(fallbackSlides.map(s => ({ ...s, id: s.id || Math.random() })));
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <Skeleton.Button active style={{ flex: '0 0 58%', height: 280, borderRadius: 10, display: 'block' }} />
                <Skeleton.Button active style={{ flex: 1, height: 280, borderRadius: 10, display: 'block' }} />
            </div>
        );
    }

    const primary = banners[0];
    const secondary = banners[1] || banners[0];

    const BannerCard = ({ banner, flex, height = 280 }) => (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            style={{ flex, minWidth: 0 }}
        >
            <Link to={banner.link} style={{ textDecoration: 'none', display: 'block', height }}>
                <div style={{
                    height: '100%',
                    background: banner.bg,
                    borderRadius: 10,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '24px 28px',
                }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ position: 'absolute', bottom: -40, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                    {/* Content */}
                    <div style={{ flex: 1, zIndex: 2 }}>
                        <Tag style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 10,
                            fontWeight: 700,
                            marginBottom: 10,
                            letterSpacing: 0.5,
                            backdropFilter: 'blur(4px)',
                        }}>
                            {banner.tag}
                        </Tag>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
                            {banner.subtitle}
                        </div>
                        <div style={{
                            color: '#fff',
                            fontSize: flex === '0 0 58%' ? 22 : 18,
                            fontWeight: 800,
                            lineHeight: 1.25,
                            marginBottom: 16,
                            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            maxWidth: 260,
                        }}>
                            {banner.title}
                        </div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#fff',
                            color: '#1e40af',
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '7px 16px',
                            borderRadius: 20,
                            cursor: 'pointer',
                        }}>
                            {banner.cta}
                            <span style={{ fontSize: 10 }}>→</span>
                        </div>
                    </div>

                    {/* Image */}
                    {banner.image && (
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                            <img
                                src={banner.image}
                                alt={banner.title}
                                style={{
                                    height: '85%',
                                    maxWidth: flex === '0 0 58%' ? 200 : 160,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    opacity: 0.9,
                                }}
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}
                </div>
            </Link>
        </motion.div>
    );

    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }} className="dual-banner">
            <BannerCard banner={primary} flex="0 0 58%" />
            <BannerCard banner={secondary} flex="1" />
            <style>{`
                @media (max-width: 768px) {
                    .dual-banner { flex-direction: column !important; }
                }
            `}</style>
        </div>
    );
}

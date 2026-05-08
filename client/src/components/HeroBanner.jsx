import { useState, useEffect, useRef } from 'react';
import { Button, Tag, Skeleton, Typography } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { bannerApi } from '../api';
import { bannerSlides as fallbackSlides } from '../data/mockData';

const { Title, Text } = Typography;

export default function HeroBanner() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await bannerApi.getActiveBanners();
                const data = res.data.metadata || res.data || [];
                if (data.length > 0) {
                    const mapped = data.map((b) => ({
                        id: b._id,
                        title: b.title || '',
                        subtitle: b.highlight || b.subtitle || '',
                        description: b.date || '',
                        cta: b.cta || 'Mua Ngay',
                        bg: b.darkGradient || b.lightGradient || 'linear-gradient(135deg, #1a3c8f 0%, #2b52c0 60%, #0f2660 100%)',
                        image: b.imageUrl || '',
                        link: b.link || '/',
                    }));
                    setSlides(mapped);
                } else {
                    setSlides(fallbackSlides);
                }
            } catch (error) {
                console.error('Lỗi khi tải banner:', error);
                setSlides(fallbackSlides);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    const goTo = (index, dir = 1) => {
        setDirection(dir);
        setCurrent(index);
    };

    const next = () => {
        if (slides.length === 0) return;
        goTo((current + 1) % slides.length, 1);
    };

    const prev = () => {
        if (slides.length === 0) return;
        goTo((current - 1 + slides.length) % slides.length, -1);
    };

    useEffect(() => {
        if (slides.length <= 1) return;
        timerRef.current = setInterval(next, 4500);
        return () => clearInterval(timerRef.current);
    }, [current, slides]);

    const variants = {
        enter: (dir) => ({
            x: dir > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({
            x: dir > 0 ? '-100%' : '100%',
            opacity: 0,
        }),
    };

    if (loading) {
        return (
            <Skeleton.Button active style={{ width: '100%', height: 340, borderRadius: 12, display: 'block' }} />
        );
    }

    if (slides.length === 0) return null;

    const slide = slides[current];

    return (
        <div
            style={{
                position: 'relative',
                overflow: 'hidden',
                height: 380,
                background: slide.bg,
                transition: 'background 0.6s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
            className="hero-banner-container"
        >
            <AnimatePresence custom={direction} initial={false}>
                <motion.div
                    key={current}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '32px 48px',
                    }}
                >
                    <div style={{ flex: 1, zIndex: 2 }}>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                            <Tag
                                color="default"
                                style={{
                                    background: 'rgba(255,255,255,0.25)',
                                    color: '#fff',
                                    border: 'none',
                                    fontWeight: 600,
                                    marginBottom: 12,
                                    fontSize: '0.7rem',
                                    backdropFilter: 'blur(8px)',
                                    padding: '2px 8px'
                                }}
                            >
                                Ưu Đãi Giới Hạn
                            </Tag>
                        </motion.div>

                        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }}>
                            <Title level={5} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, margin: '0 0 4px 0' }}>
                                {slide.title}
                            </Title>
                            <Title level={1} style={{ 
                                color: '#fff', 
                                fontWeight: 800, 
                                lineHeight: 1.15, 
                                textShadow: '0 2px 12px rgba(0,0,0,0.25)', 
                                margin: '0 0 8px 0',
                                fontSize: '2.4rem'
                            }}>
                                {slide.subtitle}
                            </Title>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: 20 }}>
                                {slide.description}
                            </div>
                        </motion.div>

                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.32 }}>
                            <Button
                                size="large"
                                style={{
                                    background: '#fff',
                                    color: '#1a3c8f',
                                    fontWeight: 700,
                                    padding: '0 28px',
                                    height: 44,
                                    borderRadius: 8,
                                    fontSize: '0.95rem',
                                    border: 'none'
                                }}
                            >
                                {slide.cta}
                            </Button>
                        </motion.div>
                    </div>

                    <div className="hero-banner-image-container" style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', height: '100%' }}>
                        <img
                            src={slide.image}
                            alt={slide.title}
                            style={{
                                height: '90%',
                                maxWidth: 340,
                                objectFit: 'cover',
                                borderRadius: 8,
                                opacity: 0.92,
                            }}
                            className="hero-banner-image"
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Arrows */}
            {slides.length > 1 && (
                <>
                    <Button
                        shape="circle"
                        icon={<LeftOutlined />}
                        onClick={prev}
                        style={{
                            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.25)', color: '#fff', border: 'none', backdropFilter: 'blur(6px)'
                        }}
                    />
                    <Button
                        shape="circle"
                        icon={<RightOutlined />}
                        onClick={next}
                        style={{
                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.25)', color: '#fff', border: 'none', backdropFilter: 'blur(6px)'
                        }}
                    />
                </>
            )}

            {/* Dots */}
            {slides.length > 1 && (
                <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => goTo(i, i > current ? 1 : -1)}
                            style={{
                                width: i === current ? 22 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                        />
                    ))}
                </div>
            )}
            
            <style jsx="true">{`
                @media (max-width: 768px) {
                    .hero-banner-container {
                        height: 220px !important;
                    }
                    .hero-banner-image-container {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

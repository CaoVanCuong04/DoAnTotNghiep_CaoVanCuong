import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const promos = [
    {
        id: 1,
        title: 'Điện Tử & Công Nghệ',
        subtitle: 'Giảm đến 40%',
        description: 'Laptop, điện thoại, phụ kiện',
        bg: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        accent: '#60a5fa',
        tag: 'HOT',
        link: '/search?category=dien-tu',
        badge: 'HOT',
    },
    {
        id: 2,
        title: 'Thời Trang & Phong Cách',
        subtitle: 'Ưu đãi lên đến 60%',
        description: 'Quần áo, giày dép, phụ kiện',
        bg: 'linear-gradient(135deg, #7c1d6f 0%, #db2777 100%)',
        accent: '#f9a8d4',
        tag: 'NEW',
        link: '/search?category=thoi-trang',
        badge: 'NEW',
    },
    {
        id: 3,
        title: 'Nhà Cửa & Đời Sống',
        subtitle: 'Flash sale mỗi ngày',
        description: 'Nội thất, gia dụng, trang trí',
        bg: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        accent: '#6ee7b7',
        tag: 'SALE',
        link: '/search?category=nha-cua',
        badge: 'SALE',
    },
];

export default function PromoGrid() {
    return (
        <div style={{ marginBottom: 20 }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                }}
                className="promo-grid"
            >
                {promos.map((promo, i) => (
                    <motion.div
                        key={promo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                    >
                        <Link to={promo.link} style={{ textDecoration: 'none' }}>
                            <div
                                style={{
                                    background: promo.bg,
                                    borderRadius: 10,
                                    padding: '22px 24px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                    minHeight: 130,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}
                            >
                                {/* Background decoration */}
                                <div style={{
                                    position: 'absolute',
                                    top: -20,
                                    right: -20,
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.06)',
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: -30,
                                    right: 20,
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.04)',
                                }} />

                                {/* Badge */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div>
                                        <span style={{
                                            background: 'rgba(255,255,255,0.25)',
                                            color: '#fff',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            letterSpacing: 1,
                                        }}>{promo.badge}</span>
                                    </div>
                                </div>

                                {/* Text */}
                                <div>
                                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 2 }}>
                                        {promo.description}
                                    </div>
                                    <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                                        {promo.title}
                                    </div>
                                    <div style={{ color: promo.accent, fontSize: 13, fontWeight: 600 }}>
                                        {promo.subtitle} →
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .promo-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (max-width: 992px) and (min-width: 769px) {
                    .promo-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            `}</style>
        </div>
    );
}

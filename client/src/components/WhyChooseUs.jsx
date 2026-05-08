import { motion } from 'framer-motion';
import {
    CarOutlined,
    SafetyCertificateOutlined,
    GiftOutlined,
    CustomerServiceOutlined,
    ThunderboltOutlined,
    StarOutlined,
} from '@ant-design/icons';

const benefits = [
    {
        icon: <CarOutlined style={{ fontSize: 28, color: '#2563eb' }} />,
        title: 'Miễn phí vận chuyển',
        desc: 'Đơn từ 150.000đ',
        bg: '#eff6ff',
        border: '#bfdbfe',
    },
    {
        icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: '#059669' }} />,
        title: 'Hàng chính hãng 100%',
        desc: 'Cam kết xác thực',
        bg: '#ecfdf5',
        border: '#a7f3d0',
    },
    {
        icon: <GiftOutlined style={{ fontSize: 28, color: '#dc2626' }} />,
        title: 'Đổi trả dễ dàng',
        desc: 'Trong vòng 30 ngày',
        bg: '#fef2f2',
        border: '#fecaca',
    },
    {
        icon: <CustomerServiceOutlined style={{ fontSize: 28, color: '#7c3aed' }} />,
        title: 'Hỗ trợ 24/7',
        desc: 'Tư vấn tận tình',
        bg: '#f5f3ff',
        border: '#ddd6fe',
    },
    {
        icon: <ThunderboltOutlined style={{ fontSize: 28, color: '#d97706' }} />,
        title: 'Giao hàng nhanh',
        desc: 'Trong 2–4 giờ nội thành',
        bg: '#fffbeb',
        border: '#fde68a',
    },
    {
        icon: <StarOutlined style={{ fontSize: 28, color: '#db2777' }} />,
        title: 'Tích điểm thưởng',
        desc: 'Đổi quà hấp dẫn',
        bg: '#fdf2f8',
        border: '#fbcfe8',
    },
];

export default function WhyChooseUs() {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 8,
                padding: '24px 20px',
                marginBottom: 20,
                boxShadow: 'rgba(0,0,0,0.04) 0 2px 8px',
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'linear-gradient(90deg, #ee4d2d, #ff7337)',
                    padding: '4px 16px',
                    borderRadius: 20,
                    marginBottom: 8,
                }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                        TẠI SAO CHỌN GLOBALMART
                    </span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                    Hơn 1 triệu khách hàng tin tưởng mua sắm mỗi ngày
                </div>
            </div>

            {/* Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: 12,
                }}
                className="why-grid"
            >
                {benefits.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -3, scale: 1.03 }}
                    >
                        <div
                            style={{
                                background: item.bg,
                                border: `1px solid ${item.border}`,
                                borderRadius: 10,
                                padding: '16px 10px',
                                textAlign: 'center',
                                cursor: 'default',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ marginBottom: 8 }}>{item.icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 3, lineHeight: 1.3 }}>
                                {item.title}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>
                                {item.desc}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <style>{`
                @media (max-width: 992px) {
                    .why-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                }
                @media (max-width: 576px) {
                    .why-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            `}</style>
        </div>
    );
}

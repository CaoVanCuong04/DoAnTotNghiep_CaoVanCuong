import { useState, useEffect } from 'react';
import { Row, Col, Skeleton, Typography } from 'antd';
import { motion } from 'framer-motion';
import { categoryApi } from '../api';
import * as LucideIcons from 'lucide-react';

const { Title, Text } = Typography;

const categoryColors = [
    '#EEF2FF',
    '#FFF0F6',
    '#F0FFF4',
    '#FFF7E6',
    '#E6F7FF',
    '#FFF1F0',
    '#F5F0FF',
    '#F0FFF7',
    '#FFF5F0',
    '#F0FAFF',
];
const iconColors = [
    '#1a3c8f',
    '#c21e6a',
    '#15803d',
    '#d46b08',
    '#0969c7',
    '#c0392b',
    '#6b21a8',
    '#0d9488',
    '#ea580c',
    '#0284c7',
];

// Map tên icon lucide từ DB (snake_case / kebab-case / lowercase) sang component name (PascalCase)
const toLucideName = (name) => {
    if (!name) return 'Folder';
    // Nếu đã PascalCase thì trả luôn
    if (/^[A-Z]/.test(name) && LucideIcons[name]) return name;
    // Chuyển kebab-case hoặc snake_case sang PascalCase
    const pascal = name
        .split(/[-_\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    return pascal;
};

const LucideIcon = ({ name, size = 28, color = '#1a3c8f', strokeWidth = 1.75 }) => {
    const iconName = toLucideName(name);
    const IconComponent = LucideIcons[iconName];
    if (!IconComponent) {
        // Fallback: thử tìm gần đúng
        const fallback = LucideIcons.Folder;
        return <fallback size={size} color={color} strokeWidth={strokeWidth} />;
    }
    return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
};

export default function CategorySection() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryApi.getAllCategories();
                setCategories(res.data.metadata || res.data || []);
            } catch (error) {
                console.error('Lỗi khi tải danh mục:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div>
                <Title level={4} style={{ marginBottom: 16 }}>
                    Danh Mục Sản Phẩm
                </Title>
                <Row gutter={[12, 12]}>
                    {[...Array(6)].map((_, i) => (
                        <Col xs={8} sm={4} key={i}>
                            <Skeleton.Button active style={{ width: '100%', height: 100, borderRadius: 12 }} />
                        </Col>
                    ))}
                </Row>
            </div>
        );
    }

    if (categories.length === 0) return null;

    return (
        <div style={{ padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                    Danh Mục Sản Phẩm
                </Title>
                <Text strong style={{ color: '#1a3c8f', cursor: 'pointer' }} className="hover-underline">
                    Xem Tất Cả →
                </Text>
            </div>

            <Row gutter={[12, 12]}>
                {categories.map((cat, i) => (
                    <Col xs={8} sm={4} key={cat._id || cat.id}>
                        <motion.div
                            whileHover={{ y: -6, scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.35 }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px 8px',
                                    borderRadius: 12,
                                    background: categoryColors[i % categoryColors.length],
                                    border: '1.5px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s ease',
                                }}
                                className="category-item"
                                onMouseOver={(e) =>
                                    (e.currentTarget.style.borderColor = iconColors[i % iconColors.length] + '55')
                                }
                                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                            >
                                <div style={{ marginBottom: 8, lineHeight: 1 }}>
                                    <LucideIcon
                                        name={cat.icon}
                                        size={28}
                                        color={iconColors[i % iconColors.length]}
                                        strokeWidth={1.75}
                                    />
                                </div>
                                <div
                                    style={{
                                        color: iconColors[i % iconColors.length],
                                        textAlign: 'center',
                                        fontSize: '0.72rem',
                                        lineHeight: 1.3,
                                        fontWeight: 600,
                                    }}
                                >
                                    {cat.name}
                                </div>
                            </div>
                        </motion.div>
                    </Col>
                ))}
            </Row>

            <style jsx="true">{`
                .hover-underline:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}

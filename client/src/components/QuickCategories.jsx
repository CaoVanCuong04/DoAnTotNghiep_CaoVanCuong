import { useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getAllCategories } from '../api/apiCategory';
import {
    AppstoreOutlined, LaptopOutlined, TagOutlined, HomeOutlined,
    CarOutlined, ReadOutlined, HeartOutlined, GiftOutlined,
    TrophyOutlined, ShoppingOutlined, MobileOutlined, CameraOutlined,
    ExperimentOutlined, ToolOutlined, BulbOutlined, FolderOutlined,
    StarOutlined, ThunderboltOutlined, SkinOutlined, CoffeeOutlined,
} from '@ant-design/icons';

const ICON_MAP = {
    folder: FolderOutlined, laptop: LaptopOutlined, mobile: MobileOutlined,
    phone: MobileOutlined, fashion: SkinOutlined, clothes: SkinOutlined,
    shirt: SkinOutlined, home: HomeOutlined, house: HomeOutlined,
    furniture: HomeOutlined, car: CarOutlined, vehicle: CarOutlined,
    electric: BulbOutlined, light: BulbOutlined, book: ReadOutlined,
    health: HeartOutlined, beauty: HeartOutlined, gift: GiftOutlined,
    sport: TrophyOutlined, camera: CameraOutlined, tool: ToolOutlined,
    food: CoffeeOutlined, drink: CoffeeOutlined, shopping: ShoppingOutlined,
    star: StarOutlined, thunder: ThunderboltOutlined, lab: ExperimentOutlined,
    tag: TagOutlined,
};

// Trả về Component class (không phải JSX element) để render linh hoạt
const getIconComponent = (iconName = '', catName = '') => {
    const key = Object.keys(ICON_MAP).find(k => iconName.toLowerCase().includes(k));
    if (key) return ICON_MAP[key];

    const n = catName.toLowerCase();
    if (n.includes('điện thoại') || n.includes('mobile')) return MobileOutlined;
    if (n.includes('laptop') || n.includes('máy tính')) return LaptopOutlined;
    if (n.includes('thời trang') || n.includes('quần') || n.includes('áo')) return SkinOutlined;
    if (n.includes('nhà') || n.includes('nội thất') || n.includes('gia dụng')) return HomeOutlined;
    if (n.includes('xe') || n.includes('ô tô')) return CarOutlined;
    if (n.includes('điện') || n.includes('đèn')) return BulbOutlined;
    if (n.includes('sách')) return ReadOutlined;
    if (n.includes('sức khỏe') || n.includes('làm đẹp')) return HeartOutlined;
    if (n.includes('quà') || n.includes('tặng')) return GiftOutlined;
    if (n.includes('thể thao')) return TrophyOutlined;
    if (n.includes('dụng cụ') || n.includes('kỹ thuật')) return ToolOutlined;
    if (n.includes('camera') || n.includes('máy ảnh')) return CameraOutlined;
    if (n.includes('thực phẩm') || n.includes('ăn')) return CoffeeOutlined;
    if (n.includes('mua sắm')) return ShoppingOutlined;
    return FolderOutlined;
};

// Màu accent cho từng item
const ACCENT_COLORS = [
    '#2563eb', '#dc2626', '#059669', '#d97706',
    '#7c3aed', '#0891b2', '#be185d', '#16a34a',
    '#ea580c', '#4f46e5',
];

export default function QuickCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getAllCategories();
                const data = res.data.metadata || [];
                // API trả về dạng cây — chỉ lấy roots (danh mục cha)
                setCategories(Array.isArray(data) ? data.slice(0, 10) : []);
            } catch {
                setCategories([]);
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
            padding: '16px 20px',
            marginBottom: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Danh Mục Nổi Bật
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>Click để khám phá</span>
            </div>
            {loading ? (
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} style={{ flexShrink: 0, textAlign: 'center', width: 72 }}>
                            <Skeleton.Avatar active size={52} />
                            <div style={{ marginTop: 8 }}>
                                <Skeleton.Input active size="small" style={{ width: 60, height: 10 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        gap: 0,
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        justifyContent: categories.length < 6 ? 'flex-start' : 'space-between',
                    }}
                    className="quick-cats-scroll"
                >
                    {categories.map((cat, i) => {
                        const IconComp = getIconComponent(cat.icon, cat.name);
                        const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
                        return (
                            <motion.div
                                key={cat._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -4 }}
                                onClick={() => navigate(`/search?category=${cat.slug}`)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '4px 12px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    minWidth: 72,
                                }}
                            >
                                {/* Icon circle */}
                                <div style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 14,
                                    background: `${color}18`,
                                    border: `1.5px solid ${color}35`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.25s',
                                    overflow: 'hidden',
                                    boxShadow: `0 2px 8px ${color}20`,
                                }}>
                                    <IconComp style={{ fontSize: 22, color }} />
                                </div>

                                {/* Label */}
                                <span style={{
                                    fontSize: 11,
                                    color: '#374151',
                                    textAlign: 'center',
                                    lineHeight: 1.3,
                                    fontWeight: 500,
                                    maxWidth: 70,
                                }}>
                                    {cat.name}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .quick-cats-scroll::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}

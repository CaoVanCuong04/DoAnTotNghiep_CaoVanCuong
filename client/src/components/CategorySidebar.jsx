import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AppstoreOutlined,
    RightOutlined,
    DownOutlined,
    LaptopOutlined,
    TagOutlined,
    HomeOutlined,
    CarOutlined,
    BulbOutlined,
    ShoppingOutlined,
    ReadOutlined,
    HeartOutlined,
    GiftOutlined,
    MobileOutlined,
    CameraOutlined,
    TrophyOutlined,
    ToolOutlined,
    FolderOutlined,
    SkinOutlined,
    CoffeeOutlined,
    StarOutlined,
    ThunderboltOutlined,
    ExperimentOutlined,
} from '@ant-design/icons';
import { getAllCategories } from '../api/apiCategory';

const ICON_MAP = {
    folder: FolderOutlined,
    laptop: LaptopOutlined,
    mobile: MobileOutlined,
    phone: MobileOutlined,
    fashion: SkinOutlined,
    clothes: SkinOutlined,
    shirt: SkinOutlined,
    home: HomeOutlined,
    house: HomeOutlined,
    furniture: HomeOutlined,
    car: CarOutlined,
    vehicle: CarOutlined,
    electric: BulbOutlined,
    light: BulbOutlined,
    book: ReadOutlined,
    health: HeartOutlined,
    beauty: HeartOutlined,
    gift: GiftOutlined,
    sport: TrophyOutlined,
    camera: CameraOutlined,
    tool: ToolOutlined,
    food: CoffeeOutlined,
    drink: CoffeeOutlined,
    shopping: ShoppingOutlined,
    star: StarOutlined,
    thunder: ThunderboltOutlined,
    lab: ExperimentOutlined,
    tag: TagOutlined,
};

const getCategoryIcon = (iconName = '', catName = '') => {
    const key = Object.keys(ICON_MAP).find((k) => iconName.toLowerCase().includes(k));
    if (key) return ICON_MAP[key];
    const n = catName.toLowerCase();
    if (n.includes('điện thoại') || n.includes('mobile')) return MobileOutlined;
    if (n.includes('laptop') || n.includes('máy tính')) return LaptopOutlined;
    if (n.includes('thời trang') || n.includes('quần') || n.includes('áo')) return SkinOutlined;
    if (n.includes('nhà') || n.includes('nội thất') || n.includes('gia dụng')) return HomeOutlined;
    if (n.includes('xe') || n.includes('ô tô')) return CarOutlined;
    if (n.includes('điện') || n.includes('đèn')) return BulbOutlined;
    if (n.includes('sách') || n.includes('văn phòng')) return ReadOutlined;
    if (n.includes('sức khỏe') || n.includes('làm đẹp')) return HeartOutlined;
    if (n.includes('quà') || n.includes('tặng')) return GiftOutlined;
    if (n.includes('thể thao')) return TrophyOutlined;
    if (n.includes('camera') || n.includes('máy ảnh')) return CameraOutlined;
    if (n.includes('thực phẩm') || n.includes('ăn') || n.includes('đồ uống')) return CoffeeOutlined;
    if (n.includes('dụng cụ') || n.includes('kỹ thuật')) return ToolOutlined;
    return FolderOutlined;
};

export default function CategorySidebar() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null); // Accordion state
    const [showAll, setShowAll] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getAllCategories();
                const data = res.data.metadata || [];
                setCategories(Array.isArray(data) ? data : []);
            } catch {
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const toggleExpand = (id, hasChildren, e) => {
        e.stopPropagation();
        if (!hasChildren) return;
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const displayed = showAll ? categories : categories.slice(0, 12);

    return (
        <div
            style={{
                width: 220,
                flexShrink: 0,
                background: '#fff',
                borderRadius: 8,
                boxShadow: 'rgba(0,0,0,0.04) 0 2px 8px',
                alignSelf: 'flex-start',
                position: 'sticky',
                top: 120,
                zIndex: 100,
                maxHeight: 'calc(100vh - 116px)',
                overflowY: 'auto',
                scrollbarWidth: 'none',
            }}
            className="category-sidebar"
        >
            {/* Header */}
            <div
                style={{
                    padding: '12px 14px',
                    background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <AppstoreOutlined style={{ color: '#fff', fontSize: 16 }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
                    DANH MỤC SẢN PHẨM
                </span>
            </div>

            {/* List */}
            <div style={{ padding: '6px 0' }}>
                {loading ? (
                    [...Array(10)].map((_, i) => (
                        <div key={i} style={{ padding: '8px 14px' }}>
                            <Skeleton.Input active size="small" style={{ width: '100%', height: 16 }} />
                        </div>
                    ))
                ) : displayed.length === 0 ? (
                    <div style={{ padding: '20px 14px', color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
                        Chưa có danh mục
                    </div>
                ) : (
                    displayed.map((cat, i) => {
                        const hasChildren = cat.children?.length > 0;
                        const isExpanded = expandedId === cat._id;
                        const IconComp = getCategoryIcon(cat.icon, cat.name);

                        return (
                            <div key={cat._id}>
                                {/* Row danh mục cha */}
                                <motion.div
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.025 }}
                                    onClick={(e) => {
                                        if (hasChildren) {
                                            toggleExpand(cat._id, hasChildren, e);
                                        } else {
                                            navigate(`/search?category=${cat.slug}`);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '9px 14px',
                                        cursor: 'pointer',
                                        background: isExpanded ? '#eff6ff' : 'transparent',
                                        borderLeft: isExpanded ? '3px solid #2563eb' : '3px solid transparent',
                                        transition: 'all 0.15s',
                                    }}
                                    whileHover={{
                                        background: '#eff6ff',
                                        borderLeft: '3px solid #2563eb',
                                    }}
                                >
                                    {/* Icon */}
                                    <span
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            background: isExpanded ? '#dbeafe' : '#f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isExpanded ? '#2563eb' : '#64748b',
                                            fontSize: 13,
                                            flexShrink: 0,
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <IconComp style={{ fontSize: 14 }} />
                                    </span>

                                    {/* Name */}
                                    <span
                                        style={{
                                            fontSize: 12.5,
                                            color: isExpanded ? '#1e40af' : '#374151',
                                            fontWeight: isExpanded ? 600 : 400,
                                            flex: 1,
                                            lineHeight: 1.3,
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {cat.name}
                                    </span>

                                    {/* Arrow icon */}
                                    {hasChildren && (
                                        <motion.span
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: 'flex', alignItems: 'center' }}
                                        >
                                            <RightOutlined
                                                style={{ fontSize: 9, color: isExpanded ? '#2563eb' : '#cbd5e1' }}
                                            />
                                        </motion.span>
                                    )}
                                </motion.div>

                                {/* Danh mục con — accordion */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && hasChildren && (
                                        <motion.div
                                            key="children"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                                            style={{ overflow: 'hidden', background: '#f8fafc' }}
                                        >
                                            {cat.children.map((child) => (
                                                <motion.div
                                                    key={child._id}
                                                    onClick={() => navigate(`/search?category=${child.slug}`)}
                                                    whileHover={{ background: '#dbeafe', paddingLeft: 44 }}
                                                    style={{
                                                        padding: '7px 14px 7px 40px',
                                                        fontSize: 12.5,
                                                        color: '#4b5563',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        borderLeft: '3px solid transparent',
                                                        transition: 'all 0.12s',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 5,
                                                            height: 5,
                                                            borderRadius: '50%',
                                                            background: '#93c5fd',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    {child.name}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Show more / less */}
            {!loading && categories.length > 12 && (
                <div
                    onClick={() => setShowAll((v) => !v)}
                    style={{
                        padding: '10px 14px',
                        textAlign: 'center',
                        color: '#2563eb',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                    }}
                >
                    {showAll ? 'Thu gọn' : `Xem thêm ${categories.length - 12} danh mục`}
                    <motion.span
                        animate={{ rotate: showAll ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex' }}
                    >
                        <DownOutlined style={{ fontSize: 10 }} />
                    </motion.span>
                </div>
            )}

            <style>{`
                .category-sidebar::-webkit-scrollbar { display: none; }
                .category-sidebar { border-radius: 8px; }
                @media (max-width: 992px) {
                    .category-sidebar { display: none !important; }
                }
            `}</style>
        </div>
    );
}

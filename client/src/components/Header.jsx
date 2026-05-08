import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input, Badge, Avatar, Drawer, Button, Dropdown, Menu, Divider } from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    BellOutlined,
    MenuOutlined,
    ShopOutlined,
    UserOutlined,
    LogoutOutlined,
    RobotOutlined,
} from '@ant-design/icons';
import { categoryApi } from '../api';
import { getAllProducts } from '../api/apiProduct';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const navLinks = ['Danh Mục', 'Khuyến Mãi', 'Bán Chạy', 'Hàng Mới'];

export default function Header() {
    const navigate = useNavigate();
    const { user, logoutAction } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [searchParams] = useSearchParams();
    const currentKeyword = searchParams.get('search') || '';
    const [keyword, setKeyword] = useState(currentKeyword);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        setKeyword(currentKeyword);
    }, [currentKeyword]);

    const handleSearch = () => {
        if (keyword.trim()) {
            navigate(`/search?search=${encodeURIComponent(keyword.trim())}`);
        }
    };

    const handleAiSearch = () => {
        if (keyword.trim()) {
            navigate(`/search?ai_query=${encodeURIComponent(keyword.trim())}`);
        }
    };

    const [suggestedProducts, setSuggestedProducts] = useState([]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!keyword.trim()) {
                setSuggestedProducts([]);
                return;
            }
            try {
                const res = await getAllProducts({ search: keyword.trim(), limit: 5 });
                setSuggestedProducts(res.data.metadata?.products || []);
            } catch (error) {
                console.error('Error fetching search autocomplete:', error);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [keyword]);

    const getDropdownItems = () => {
        const val = keyword.trim();
        if (!val) return [];
        const items = [
            {
                key: 'shop',
                label: (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '14px' }}
                        onClick={() => {
                            setDropdownOpen(false);
                            handleSearch();
                        }}
                    >
                        <ShopOutlined style={{ color: '#ff6b00', fontSize: 16 }} />
                        <span>
                            Tìm Shop <b>"{val}"</b>
                        </span>
                    </div>
                ),
            },
            { type: 'divider' },
        ];

        if (suggestedProducts.length > 0) {
            suggestedProducts.forEach((product) => {
                const thumbnail = product.images?.[0] || 'https://placehold.co/100x100?text=No+Image';
                items.push({
                    key: `product_${product._id}`,
                    label: (
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}
                            onClick={() => {
                                setDropdownOpen(false);
                                navigate(`/product/${product.slug}`);
                            }}
                        >
                            <Avatar shape="square" size={32} src={thumbnail} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>
                                    {product.name}
                                </span>
                                <span style={{ fontSize: '12px', color: '#ff6b00', fontWeight: 600 }}>
                                    {product.price?.toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        </div>
                    ),
                });
            });
            items.push({ type: 'divider' });
        }

        items.push({
            key: 'normal',
            label: (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 0',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                    onClick={() => {
                        setDropdownOpen(false);
                        handleSearch();
                    }}
                >
                    <SearchOutlined style={{ color: '#64748b' }} />
                    <span>
                        Tìm tất cả kết quả cho <b>"{val}"</b>
                    </span>
                </div>
            ),
        });

        items.push({
            key: 'ai',
            label: (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 0',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                    onClick={() => {
                        setDropdownOpen(false);
                        handleAiSearch();
                    }}
                >
                    <RobotOutlined style={{ color: '#1a3c8f' }} />
                    <span style={{ color: '#1a3c8f' }}>
                        ✨ Tối ưu bằng AI: <b>"{val}"</b>
                    </span>
                </div>
            ),
        });

        return items;
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryApi.getAllCategories();
                setCategories(res.data.metadata || res.data || []);
            } catch (error) {
                console.error('Lỗi khi tải danh mục:', error);
            }
        };
        fetchCategories();
    }, []);

    const [cartCount, setCartCount] = useState(0);

    const fetchCartCount = async () => {
        if (!user) {
            setCartCount(0);
            return;
        }
        try {
            const { getCart } = await import('../api/apiCart');
            const res = await getCart();
            if (res.data?.metadata?.items) {
                setCartCount(res.data.metadata.items.length);
            } else {
                setCartCount(0);
            }
        } catch (err) {
            setCartCount(0);
        }
    };

    useEffect(() => {
        fetchCartCount();

        const handleCartUpdate = () => fetchCartCount();
        window.addEventListener('cart_updated', handleCartUpdate);
        return () => window.removeEventListener('cart_updated', handleCartUpdate);
    }, [user]);

    const userMenuItems = [
        {
            key: 'info',
            label: (
                <div style={{ padding: '4px 8px' }}>
                    <div style={{ fontWeight: 700, color: '#1a1a2e' }}>{user?.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#8899aa' }}>{user?.email}</div>
                </div>
            ),
        },
        { type: 'divider' },
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link to="/profile">Tài khoản chung</Link>,
        },
        {
            key: 'seller',
            icon: <ShopOutlined />,
            label: <Link to="/seller">Kênh Người Bán</Link>,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: logoutAction,
        },
    ];

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1200,
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
        >
        

            {/* Tier 2: Main Search & Brand Bar */}
            <div style={{ background: '#ffffff', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        maxWidth: 1200,
                        margin: '0 auto',
                        padding: '0 24px',
                        gap: '32px',
                    }}
                >
                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <div
                                style={{
                                    background: '#ff6b00',
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
                                }}
                            >
                                <ShopOutlined style={{ color: '#fff', fontSize: 20 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span
                                    style={{
                                        fontWeight: 900,
                                        color: '#0f172a',
                                        letterSpacing: '-0.5px',
                                        fontSize: '1.25rem',
                                        lineHeight: '1.2',
                                    }}
                                >
                                    GLOBAL<span style={{ color: '#ff6b00' }}>MART</span>
                                </span>
                                <span
                                    style={{
                                        fontSize: '9px',
                                        color: '#64748b',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Mua sắm ưu việt
                                </span>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Search Bar */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Dropdown
                            open={dropdownOpen && keyword.trim().length > 0}
                            onOpenChange={(v) => setDropdownOpen(v)}
                            menu={{ items: getDropdownItems() }}
                            trigger={['click']}
                            placement="bottomLeft"
                            styles={{ root: { zIndex: 9999, paddingTop: 4, minWidth: '100%' } }}
                            getPopupContainer={(triggerNode) => triggerNode.parentNode}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    border: '2px solid #ff6b00',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    background: '#fff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                }}
                            >
                                <Input
                                    size="middle"
                                    value={keyword}
                                    onChange={(e) => {
                                        setKeyword(e.target.value);
                                        if (e.target.value.trim().length > 0) setDropdownOpen(true);
                                    }}
                                    onFocus={() => {
                                        if (keyword.trim().length > 0) setDropdownOpen(true);
                                    }}
                                    onPressEnter={() => {
                                        setDropdownOpen(false);
                                        handleSearch();
                                    }}
                                    placeholder="Trải nghiệm mua sắm không giới hạn..."
                                    style={{
                                        border: 'none',
                                        boxShadow: 'none',
                                        fontSize: '13px',
                                        padding: '8px 14px',
                                        flex: 1,
                                    }}
                                />
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        handleSearch();
                                    }}
                                    style={{
                                        background: '#ff6b00',
                                        border: 'none',
                                        borderRadius: 0,
                                        height: 'auto',
                                        padding: '0 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontWeight: 600,
                                        fontSize: '13px',
                                    }}
                                >
                                    <SearchOutlined style={{ fontSize: 16 }} />
                                    <span>Tìm Kiếm</span>
                                </Button>
                            </div>
                        </Dropdown>
                    </div>

                    {/* User Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Badge count={cartCount} offset={[-2, 2]} color="#1a3c8f" size="small">
                                <Button
                                    type="text"
                                    onClick={() => navigate('/cart')}
                                    icon={<ShoppingCartOutlined style={{ fontSize: 26, color: '#ff6b00' }} />}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                />
                            </Badge>
                        </motion.div>

                        <NotificationDropdown />

                        {/* User Profile Area */}
                        {user ? (
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="hide-on-mobile">
                                <Dropdown
                                    menu={{ items: userMenuItems }}
                                    placement="bottomRight"
                                    trigger={['click']}
                                    overlayStyle={{ zIndex: 1300 }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            cursor: 'pointer',
                                            background: '#f8fafc',
                                            padding: '4px 12px 4px 4px',
                                            borderRadius: 30,
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.3s',
                                        }}
                                        className="user-profile-btn"
                                    >
                                        <Avatar
                                            src={user.avatar || undefined}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                background: '#1a3c8f',
                                                color: '#fff',
                                                fontWeight: 700,
                                                fontSize: 14,
                                            }}
                                        >
                                            {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </Avatar>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>
                                                Tài khoản
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '13px',
                                                    color: '#0f172a',
                                                    fontWeight: 700,
                                                    maxWidth: 90,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {user.fullName}
                                            </span>
                                        </div>
                                    </div>
                                </Dropdown>
                            </div>
                        ) : (
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
                                className="hide-on-mobile"
                            >
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Xin chào!</span>
                                <div style={{ display: 'flex', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                                    <span
                                        onClick={() => navigate('/login')}
                                        style={{ color: '#1a3c8f', cursor: 'pointer' }}
                                        className="hover-orange"
                                    >
                                        Đăng nhập
                                    </span>
                                    <span style={{ color: '#cbd5e1' }}>|</span>
                                    <span
                                        onClick={() => navigate('/register')}
                                        style={{ color: '#1a3c8f', cursor: 'pointer' }}
                                        className="hover-orange"
                                    >
                                        Đăng ký
                                    </span>
                                </div>
                            </div>
                        )}

                        <Button
                            type="text"
                            icon={<MenuOutlined style={{ fontSize: 22, color: '#0f172a' }} />}
                            onClick={() => setMobileOpen(true)}
                            className="show-on-mobile"
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            </div>

            {/* Tier 3: Category & Nav Links Bar */}

            {/* Mobile Drawer */}
            <Drawer
                title={<span style={{ color: '#ff6b00', fontWeight: 900, fontSize: 18 }}>GLOBALMART</span>}
                placement="left"
                onClose={() => setMobileOpen(false)}
                open={mobileOpen}
                size="default"
                styles={{ body: { padding: 0 } }}
            >
                <Menu
                    mode="inline"
                    items={[
                        ...navLinks.map((link) => ({
                            key: link,
                            label: <span style={{ fontWeight: 600 }}>{link}</span>,
                        })),
                        { type: 'divider' },
                        ...categories.map((cat) => ({ key: cat._id || cat.id, label: cat.name })),
                    ]}
                    onClick={() => setMobileOpen(false)}
                    style={{ borderRight: 'none' }}
                />
            </Drawer>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: inline-flex !important; }
        }
        
        .top-link:hover { color: #fff !important; }
        
        .trending-tag {
          cursor: pointer;
          transition: color 0.2s;
        }
        .trending-tag:hover {
          color: #ff6b00;
        }

        .hover-orange:hover {
          color: #ff6b00 !important;
        }

        .user-profile-btn:hover {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }

        .nav-tier-3 {
          font-weight: 600;
          color: #334155;
          font-size: 13px;
          cursor: pointer;
          padding: 10px 0;
          position: relative;
          transition: color 0.3s;
        }
        .nav-tier-3:hover {
          color: #ff6b00;
        }
        .nav-tier-3::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 3px;
          background: #ff6b00;
          transition: width 0.3s ease;
        }
        .nav-tier-3:hover::after {
          width: 100%;
        }

        .ant-input-affix-wrapper-focused {
          box-shadow: none !important;
        }
        .ant-input:focus {
          box-shadow: none !important;
        }
      `,
                }}
            />
        </header>
    );
}

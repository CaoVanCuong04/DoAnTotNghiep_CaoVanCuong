import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Input, Divider, Typography, Button, theme, message } from 'antd';
import {
    DashboardOutlined,
    AppstoreOutlined,
    ShoppingCartOutlined,
    GiftOutlined,
    LogoutOutlined,
    SearchOutlined,
    BellOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ShopOutlined,
    WalletOutlined,
    StarOutlined,
    SettingOutlined,
    MessageOutlined,
    RollbackOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getMyStoreStatus } from '../../api/apiStore';
import NotificationDropdown from '../../components/NotificationDropdown';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export default function SellerLayout() {
    const { user, loading: authLoading, logoutAction } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [storeStatus, setStoreStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        const checkStoreStatus = async () => {
            try {
                const res = await getMyStoreStatus();
                const status = res.data?.metadata?.status;
                setStoreStatus(status);

                if (!status) {
                    navigate('/seller/register');
                } else if (status === 'pending' || status === 'banned') {
                    navigate('/seller/register'); // Register page will handle pending/banned UI
                }
            } catch (err) {
                navigate('/seller/register');
            } finally {
                setLoading(false);
            }
        };

        if (authLoading) return; // Đợi load thông tin tài khoản xong

        if (user) {
            checkStoreStatus();
        } else {
            navigate('/login');
        }
    }, [user, navigate, authLoading]);

    if (loading || authLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                Loading...
            </div>
        );
    }

    // Nếu không phải là shop active và đang không ở trang đăng ký thì không render layout
    if (storeStatus !== 'active' && location.pathname !== '/seller/register') {
        return null;
    }

    // Nếu ở trang đăng ký, render một layout đơn giản hoặc chính form đăng ký (được handle bởi Route)
    if (location.pathname === '/seller/register') {
        return <Outlet />;
    }

    const navItems = [
        {
            key: '/seller',
            icon: <DashboardOutlined />,
            label: (
                <NavLink to="/seller" end>
                    Dashboard
                </NavLink>
            ),
        },
        {
            key: '/seller/products',
            icon: <AppstoreOutlined />,
            label: <NavLink to="/seller/products">Sản phẩm</NavLink>,
        },
        { key: '/seller/chat', icon: <MessageOutlined />, label: <NavLink to="/seller/chat">Tin nhắn</NavLink> },
        {
            key: '/seller/orders',
            icon: <ShoppingCartOutlined />,
            label: <NavLink to="/seller/orders">Đơn hàng</NavLink>,
        },
        {
            key: '/seller/returns',
            icon: <RollbackOutlined />,
            label: <NavLink to="/seller/returns">Trả hàng / Hoàn tiền</NavLink>,
        },
        { key: '/seller/coupons', icon: <GiftOutlined />, label: <NavLink to="/seller/coupons">Mã giảm giá</NavLink> },
        { key: '/seller/reviews', icon: <StarOutlined />, label: <NavLink to="/seller/reviews">Đánh giá</NavLink> },
        { key: '/seller/wallet', icon: <WalletOutlined />, label: <NavLink to="/seller/wallet">Ví Tài Khoản</NavLink> },
        {
            key: '/seller/settings',
            icon: <SettingOutlined />,
            label: <NavLink to="/seller/settings">Cài đặt Shop</NavLink>,
        },
        {
            key: '/seller/profile',
            icon: <UserOutlined />,
            label: <NavLink to="/seller/profile">Thông tin cá nhân</NavLink>,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                style={{
                    background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)', // Màu xanh dương cho Seller
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1200,
                    boxShadow: '4px 0 24px rgba(30,64,175,0.15)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: collapsed ? '20px 0' : '20px 24px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        cursor: 'pointer',
                    }}
                    onClick={() => navigate('/')}
                >
                    <ShopOutlined style={{ fontSize: 32, color: '#fbbf24' }} />
                    {!collapsed && (
                        <Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
                            Kênh Người Bán
                        </Title>
                    )}
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    style={{ background: 'transparent', borderRight: 0, marginTop: 10 }}
                    items={navItems}
                />

                <div style={{ position: 'absolute', bottom: 20, width: '100%' }}>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '0 0 16px 0' }} />

                    {!collapsed && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '0 24px',
                                marginBottom: 16,
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate('/seller/profile')}
                        >
                            <Avatar
                                src={user?.avatar}
                                size="large"
                                style={{ border: '2px solid rgba(255,255,255,0.3)' }}
                            >
                                {user?.fullName?.[0] || 'S'}
                            </Avatar>
                            <div style={{ overflow: 'hidden' }}>
                                <Text strong style={{ color: '#fff', display: 'block' }} ellipsis>
                                    {user?.fullName || 'Seller'}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} ellipsis>
                                    Cửa hàng của bạn
                                </Text>
                            </div>
                        </div>
                    )}

                    <div style={{ padding: collapsed ? '0' : '0 16px', display: 'flex', justifyContent: 'center' }}>
                        <Button
                            type="text"
                            icon={<LogoutOutlined />}
                            onClick={logoutAction}
                            style={{
                                color: 'rgba(255,255,255,0.7)',
                                width: collapsed ? 'auto' : '100%',
                                display: 'flex',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                paddingLeft: collapsed ? 0 : 16,
                            }}
                        >
                            {!collapsed && 'Đăng xuất'}
                        </Button>
                    </div>
                </div>
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
                <Header
                    style={{
                        padding: '0 24px',
                        background: colorBgContainer,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        borderBottom: '1px solid #e8ecf3',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: '16px', width: 64, height: 64 }}
                        />
                        <Title level={5} style={{ margin: 0, color: '#334155' }}>
                            Trang quản trị Shop
                        </Title>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <NotificationDropdown />
                        <Avatar src={user?.avatar} style={{ cursor: 'pointer', border: '2px solid #e8ecf3' }}>
                            {user?.fullName?.[0] || 'S'}
                        </Avatar>
                    </div>
                </Header>
                <Content style={{ margin: '24px 24px 0', overflow: 'initial' }}>
                    <div style={{ minHeight: '80vh', borderRadius: borderRadiusLG }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}

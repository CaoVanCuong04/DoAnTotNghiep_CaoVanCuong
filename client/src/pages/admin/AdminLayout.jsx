import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Input, Tooltip, Divider, Typography, Button, theme } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    AppstoreOutlined,
    ShoppingCartOutlined,
    TagsOutlined,
    GiftOutlined,
    FlagOutlined,
    LogoutOutlined,
    SearchOutlined,
    BellOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ShopOutlined,
    BankOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../../components/NotificationDropdown';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export default function AdminLayout() {
    const { user, logoutAction } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const navItems = [
        {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: (
                <NavLink to="/admin" end>
                    Dashboard
                </NavLink>
            ),
        },
        { key: '/admin/stores', icon: <ShopOutlined />, label: <NavLink to="/admin/stores">Cửa hàng</NavLink> },
        {
            key: '/admin/withdrawals',
            icon: <BankOutlined />,
            label: <NavLink to="/admin/withdrawals">Y/c Rút tiền</NavLink>,
        },
        { key: '/admin/users', icon: <UserOutlined />, label: <NavLink to="/admin/users">Người dùng</NavLink> },
        { key: '/admin/products', icon: <AppstoreOutlined />, label: <NavLink to="/admin/products">Sản phẩm</NavLink> },
        { key: '/admin/orders', icon: <ShoppingCartOutlined />, label: <NavLink to="/admin/orders">Đơn hàng</NavLink> },
        { key: '/admin/categories', icon: <TagsOutlined />, label: <NavLink to="/admin/categories">Danh mục</NavLink> },
        { key: '/admin/banners', icon: <PictureOutlined />, label: <NavLink to="/admin/banners">Banner</NavLink> },
        { key: '/admin/coupons', icon: <GiftOutlined />, label: <NavLink to="/admin/coupons">Mã giảm giá</NavLink> },
        { key: '/admin/reports', icon: <FlagOutlined />, label: <NavLink to="/admin/reports">Báo cáo</NavLink> },
        {
            key: '/admin/profile',
            icon: <UserOutlined />,
            label: <NavLink to="/admin/profile">Thông tin cá nhân</NavLink>,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f4f6fb' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                style={{
                    background: 'linear-gradient(180deg, #7c3aed 0%, #4c1d95 100%)',
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1200,
                    boxShadow: '4px 0 24px rgba(124,58,237,0.15)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: collapsed ? '20px 0' : '20px 24px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                >
                    <ShopOutlined style={{ fontSize: 32, color: '#fbbf24' }} />
                    {!collapsed && (
                        <Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
                            Admin Panel
                        </Title>
                    )}
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={[window.location.pathname]}
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
                            onClick={() => navigate('/admin/profile')}
                        >
                            <Avatar
                                src={user?.avatar}
                                size="large"
                                style={{ border: '2px solid rgba(255,255,255,0.3)' }}
                            >
                                {user?.fullName?.[0] || 'A'}
                            </Avatar>
                            <div style={{ overflow: 'hidden' }}>
                                <Text strong style={{ color: '#fff', display: 'block' }} ellipsis>
                                    {user?.fullName || 'Admin'}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} ellipsis>
                                    {user?.email || 'admin@shop.vn'}
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
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}></div>
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

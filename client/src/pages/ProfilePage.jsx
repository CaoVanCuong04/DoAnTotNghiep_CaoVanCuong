import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, Input, Avatar, Card, Row, Col, Divider, message, Modal, Tag, Empty, Skeleton, DatePicker, Menu, Badge, List } from 'antd';
import { UserOutlined, LockOutlined, EnvironmentOutlined, ShoppingOutlined, EditOutlined, CameraOutlined, PhoneOutlined, MailOutlined, PlusOutlined, DeleteOutlined, WalletOutlined, HeartOutlined, HeartFilled, BellOutlined, LogoutOutlined, CloseOutlined, CheckOutlined, DollarOutlined, ShopOutlined, TeamOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api';
import { getOrders } from '../api/apiOrder';
import { getMyWishlist, removeFromWishlist, toggleWishlist } from '../api/apiWishlist';
import { getUserWallet } from '../api/apiWallet';
import { getNotifications, markAsRead, markAllAsRead } from '../api/apiNotification';
import { getFollowingStores, toggleFollowStore } from '../api/apiStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ProfilePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser, logoutAction } = useAuth();

    const [activeKey, setActiveKey] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    // Profile form
    const [profileForm, setProfileForm] = useState({
        fullName: '', email: '', phone: '', address: '', birthDay: null,
    });

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '', newPassword: '', confirmPassword: '',
    });

    // Addresses
    const [addresses, setAddresses] = useState([]);
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressForm, setAddressForm] = useState({
        fullName: '', phone: '', province: '', district: '', ward: '', detail: '', isDefault: false,
    });

    // Orders
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Wishlist
    const [wishlist, setWishlist] = useState([]);
    const [loadingWishlist, setLoadingWishlist] = useState(true);

    // Wallet
    const [wallet, setWallet] = useState(null);
    const [loadingWallet, setLoadingWallet] = useState(true);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    // Followed stores
    const [followedStores, setFollowedStores] = useState([]);
    const [loadingFollowed, setLoadingFollowed] = useState(true);

    // Detect initial route only on mount
    useEffect(() => {
        if (location.pathname === '/profile/orders') {
            setActiveKey('orders');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (user) {
            setProfileForm({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                birthDay: user.birthDay || null,
            });
        }
    }, [user]);

    useEffect(() => {
        if (activeKey === 'addresses') loadAddresses();
        if (activeKey === 'orders') loadOrders();
        if (activeKey === 'wishlist') loadWishlist();
        if (activeKey === 'wallet') loadWallet();
        if (activeKey === 'notifications') loadNotifications();
        if (activeKey === 'following') loadFollowedStores();
    }, [activeKey]);

    const loadAddresses = async () => {
        try {
            const res = await userApi.getAddresses();
            setAddresses(res.data?.metadata || []);
        } catch (err) { console.error(err); }
    };

    const loadOrders = async () => {
        setLoadingOrders(true);
        try {
            const res = await getOrders();
            setOrders(res.data?.metadata || []);
        } catch (err) { console.error(err); }
        finally { setLoadingOrders(false); }
    };

    const loadWishlist = async () => {
        setLoadingWishlist(true);
        try {
            const res = await getMyWishlist();
            setWishlist(res.data?.metadata?.docs || res.data?.metadata || []);
        } catch (err) { console.error(err); }
        finally { setLoadingWishlist(false); }
    };

    const loadWallet = async () => {
        setLoadingWallet(true);
        try {
            const res = await getUserWallet();
            setWallet(res.data?.metadata || res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingWallet(false); }
    };

    const loadNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const res = await getNotifications();
            setNotifications(res.data?.metadata?.docs || res.data?.metadata || []);
        } catch (err) { console.error(err); }
        finally { setLoadingNotifications(false); }
    };

    const loadFollowedStores = async () => {
        setLoadingFollowed(true);
        try {
            const res = await getFollowingStores();
            setFollowedStores(res.data?.metadata || []);
        } catch (err) { console.error(err); }
        finally { setLoadingFollowed(false); }
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            await userApi.updateProfile(profileForm);
            setUser(prev => ({ ...prev, ...profileForm }));
            message.success('Cập nhật thông tin thành công!');
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi cập nhật');
        } finally { setLoading(false); }
    };

    const handleUploadAvatar = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('avatar', file, file.name);
        setAvatarLoading(true);
        try {
            const res = await userApi.uploadAvatar(formData);
            const data = res.data?.metadata || res.data;
            setUser(prev => ({ ...prev, avatar: data.avatar || data }));
            message.success('Cập nhật ảnh đại diện thành công!');
        } catch (err) { message.error('Lỗi khi tải ảnh lên'); }
        finally { e.target.value = ''; setAvatarLoading(false); }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword.length < 6) { message.error('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) { message.error('Mật khẩu xác nhận không khớp'); return; }
        setLoading(true);
        try {
            await userApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
            message.success('Đổi mật khẩu thành công!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) { message.error(err.response?.data?.message || 'Lỗi đổi mật khẩu'); }
        finally { setLoading(false); }
    };

    const handleSaveAddress = async () => {
        if (!addressForm.fullName || !addressForm.phone || !addressForm.detail) { message.error('Vui lòng nhập đầy đủ thông tin'); return; }
        setLoading(true);
        try {
            if (editingAddress) {
                await userApi.updateAddress(editingAddress._id, addressForm);
                message.success('Cập nhật địa chỉ thành công');
            } else {
                await userApi.addAddress(addressForm);
                message.success('Thêm địa chỉ mới thành công');
            }
            setAddressModalOpen(false); setEditingAddress(null);
            setAddressForm({ fullName: '', phone: '', province: '', district: '', ward: '', detail: '', isDefault: false });
            loadAddresses();
        } catch (err) { message.error(err.response?.data?.message || 'Lỗi'); }
        finally { setLoading(false); }
    };

    const handleDeleteAddress = (addressId) => {
        Modal.confirm({
            title: 'Xoá địa chỉ?', content: 'Bạn có chắc muốn xoá địa chỉ này?',
            okText: 'Xoá', okButtonProps: { danger: true }, cancelText: 'Huỷ',
            onOk: async () => {
                try { await userApi.deleteAddress(addressId); message.success('Đã xoá'); loadAddresses(); }
                catch (err) { message.error('Lỗi khi xoá'); }
            }
        });
    };

    const handleSetDefault = async (addressId) => {
        try { await userApi.setDefaultAddress(addressId); message.success('Đã đặt làm mặc định'); loadAddresses(); }
        catch { message.error('Lỗi'); }
    };

    const statusColor = { pending: 'gold', confirmed: 'blue', shipping: 'cyan', delivered: 'green', received: 'green', cancelled: 'red', return_requested: 'orange', returned: 'purple' };
    const statusLabel = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', received: 'Đã nhận', cancelled: 'Đã huỷ', return_requested: 'Yêu cầu trả', returned: 'Đã trả hàng' };

    if (!user) {
        return <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '40px 16px' }}><div style={{ maxWidth: 1100, margin: '0 auto' }}><Skeleton active paragraph={{ rows: 12 }} /></div></div>;
    }

    // ─── Sidebar Menu Items ──────────────────────────────────────────────────
    const sidebarItems = [
        { key: 'profile', icon: <UserOutlined />, label: 'Thông tin cá nhân' },
        { key: 'orders', icon: <ShoppingOutlined />, label: 'Đơn hàng của tôi' },
        { key: 'addresses', icon: <EnvironmentOutlined />, label: 'Sổ địa chỉ' },
        { key: 'password', icon: <LockOutlined />, label: 'Đổi mật khẩu' },
        { type: 'divider' },
        { key: 'wishlist', icon: <HeartOutlined />, label: 'Yêu thích' },
        { key: 'following', icon: <ShopOutlined />, label: 'Shop đang theo dõi' },
        { key: 'wallet', icon: <WalletOutlined />, label: 'Ví của tôi' },
        { key: 'notifications', icon: <BellOutlined />, label: 'Thông báo' },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
    ];

    // ─── Render Content Based on activeKey ───────────────────────────────────
    const renderContent = () => {
        switch (activeKey) {
            case 'profile':
                return (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} key="profile">
                        <Card style={{ borderRadius: 12, border: '1px solid #e8ecf3' }}>
                            <Title level={5} style={{ marginBottom: 24 }}>Thông tin cá nhân</Title>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                                <div style={{ position: 'relative' }}>
                                    <Avatar src={user.avatar} size={80} icon={<UserOutlined />} style={{ border: '3px solid #e8ecf3' }} />
                                    <label htmlFor="avatar-uploader" style={{
                                        position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: '50%',
                                        background: avatarLoading ? '#94a3b8' : '#1a3c8f', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: avatarLoading ? 'not-allowed' : 'pointer', border: '2px solid #fff', color: '#fff', fontSize: 12,
                                        opacity: avatarLoading ? 0.8 : 1
                                    }}>
                                        <CameraOutlined />
                                    </label>
                                    <input id="avatar-uploader" type="file" accept="image/*" onChange={handleUploadAvatar} disabled={avatarLoading} style={{ display: 'none' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ margin: 0 }}>{user.fullName}</Title>
                                    <Text type="secondary">{user.email}</Text>
                                </div>
                            </div>

                            <Row gutter={[16, 20]}>
                                <Col xs={24} sm={12}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontSize: '0.85rem' }}>Họ và tên</label>
                                    <Input size="large" prefix={<UserOutlined style={{ color: '#9ca3af' }} />} value={profileForm.fullName} onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))} />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontSize: '0.85rem' }}>Email</label>
                                    <Input size="large" prefix={<MailOutlined style={{ color: '#9ca3af' }} />} value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontSize: '0.85rem' }}>Số điện thoại</label>
                                    <Input size="large" prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />} value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontSize: '0.85rem' }}>Ngày sinh</label>
                                    <DatePicker
                                        size="large" style={{ width: '100%' }} format="DD/MM/YYYY"
                                        value={profileForm.birthDay ? dayjs(profileForm.birthDay) : null}
                                        onChange={(date) => setProfileForm(p => ({ ...p, birthDay: date ? date.toISOString() : null }))}
                                        placeholder="Chọn ngày sinh"
                                    />
                                </Col>
                                <Col xs={24}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontSize: '0.85rem' }}>Địa chỉ</label>
                                    <Input size="large" prefix={<EnvironmentOutlined style={{ color: '#9ca3af' }} />} value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} />
                                </Col>
                            </Row>

                            <div style={{ marginTop: 24, textAlign: 'right' }}>
                                <Button type="primary" size="large" loading={loading} onClick={handleUpdateProfile} style={{ borderRadius: 8, background: '#1a3c8f', padding: '0 32px' }}>
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                );

            case 'password':
                return (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} key="password">
                        <Card style={{ borderRadius: 12, border: '1px solid #e8ecf3', maxWidth: 480 }}>
                            <Title level={5} style={{ marginBottom: 24 }}>Đổi mật khẩu</Title>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontSize: '0.85rem' }}>Mật khẩu hiện tại</label>
                                    <Input.Password size="large" prefix={<LockOutlined style={{ color: '#9ca3af' }} />} value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontSize: '0.85rem' }}>Mật khẩu mới</label>
                                    <Input.Password size="large" prefix={<LockOutlined style={{ color: '#9ca3af' }} />} value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Ít nhất 6 ký tự" />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontSize: '0.85rem' }}>Xác nhận mật khẩu mới</label>
                                    <Input.Password size="large" prefix={<LockOutlined style={{ color: '#9ca3af' }} />} value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                                </div>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <Button type="primary" size="large" loading={loading} onClick={handleChangePassword} style={{ borderRadius: 8, background: '#1a3c8f' }}>Đổi mật khẩu</Button>
                            </div>
                        </Card>
                    </motion.div>
                );

            case 'addresses':
                return (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} key="addresses">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>Sổ địa chỉ ({addresses.length})</Title>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingAddress(null); setAddressForm({ fullName: '', phone: '', province: '', district: '', ward: '', detail: '', isDefault: false }); setAddressModalOpen(true); }} style={{ borderRadius: 8, background: '#1a3c8f' }}>Thêm địa chỉ</Button>
                        </div>
                        {addresses.length === 0 ? (
                            <Card style={{ borderRadius: 12 }}><Empty description="Chưa có địa chỉ nào" /></Card>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {addresses.map((addr) => (
                                    <Card key={addr._id} style={{ borderRadius: 12, border: addr.isDefault ? '2px solid #1a3c8f' : '1px solid #e8ecf3' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <Text strong>{addr.fullName}</Text>
                                                    <Divider type="vertical" />
                                                    <Text type="secondary">{addr.phone}</Text>
                                                    {addr.isDefault && <Tag color="blue" style={{ marginLeft: 4 }}>Mặc định</Tag>}
                                                </div>
                                                <Text type="secondary">{[addr.detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}</Text>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                                <Button size="small" type="link" onClick={() => { setEditingAddress(addr); setAddressForm(addr); setAddressModalOpen(true); }}>Sửa</Button>
                                                {!addr.isDefault && <Button size="small" type="link" onClick={() => handleSetDefault(addr._id)}>Đặt mặc định</Button>}
                                                <Button size="small" type="link" danger onClick={() => handleDeleteAddress(addr._id)}>Xoá</Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );

            case 'orders':
                return (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} key="orders">
                        <Title level={5} style={{ marginBottom: 16 }}>Đơn hàng của tôi</Title>
                        {loadingOrders ? (
                            <Skeleton active paragraph={{ rows: 6 }} />
                        ) : orders.length === 0 ? (
                            <Card style={{ borderRadius: 12 }}>
                                <Empty description="Bạn chưa có đơn hàng nào" />
                                <div style={{ textAlign: 'center', marginTop: 16 }}>
                                    <Button type="primary" onClick={() => navigate('/')} style={{ borderRadius: 8, background: '#1a3c8f' }}>Mua sắm ngay</Button>
                                </div>
                            </Card>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {orders.map((order) => (
                                    <Card key={order._id} style={{ borderRadius: 12, border: '1px solid #e8ecf3', cursor: 'pointer' }} hoverable onClick={() => navigate(`/orders/${order._id}`)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <div>
                                                <Text strong style={{ color: '#1a3c8f' }}>#{order.orderCode || order._id?.substring(order._id.length - 8).toUpperCase()}</Text>
                                                <Text type="secondary" style={{ marginLeft: 12 }}>{dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                                            </div>
                                            <Tag color={statusColor[order.orderStatus]}>{statusLabel[order.orderStatus] || order.orderStatus}</Tag>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            {(order.items || []).slice(0, 3).map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <img src={item.image} alt={item.name} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, border: '1px solid #f0f2f5' }} />
                                                    <div>
                                                        <Text style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</Text>
                                                        <Text type="secondary" style={{ fontSize: '0.75rem' }}>x{item.quantity}</Text>
                                                    </div>
                                                </div>
                                            ))}
                                            {(order.items || []).length > 3 && <Text type="secondary" style={{ alignSelf: 'center' }}>+{order.items.length - 3} sản phẩm khác</Text>}
                                        </div>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text type="secondary">{order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod?.toUpperCase()}</Text>
                                            <Text strong style={{ color: '#ff4500', fontSize: '1.05rem' }}>{order.finalPrice?.toLocaleString('vi-VN')}₫</Text>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );

            case 'wishlist':
                return (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} key="wishlist">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>❤️ Sản phẩm yêu thích ({wishlist.length})</Title>
                        </div>
                        {loadingWishlist ? <Skeleton active paragraph={{ rows: 4 }} /> : wishlist.length === 0 ? (
                            <Card style={{ borderRadius: 12 }}>
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ fontSize: 56, marginBottom: 12, opacity: 0.3 }}>❤️</div>
                                    <Title level={5} style={{ color: '#64748b' }}>Chưa có sản phẩm yêu thích</Title>
                                    <Button type="primary" onClick={() => navigate('/')} style={{ borderRadius: 8, background: '#1a3c8f', marginTop: 8 }}>Khám phá ngay</Button>
                                </div>
                            </Card>
                        ) : (
                            <Row gutter={[12, 12]}>
                                {wishlist.map((item) => {
                                    const product = item.product || item;
                                    return (
                                        <Col xs={24} sm={12} key={product._id}>
                                            <Card
                                                style={{ borderRadius: 12, border: '1px solid #e8ecf3', cursor: 'pointer' }}
                                                hoverable
                                                onClick={() => navigate(`/product/${product.slug}`)}
                                                styles={{ body: { padding: '12px' } }}
                                            >
                                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                    <img
                                                        src={product.images?.[0] || product.image}
                                                        alt={product.name}
                                                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid #f0f2f5' }}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{product.name}</div>
                                                        {product.store && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>🏠 {product.store?.name}</div>}
                                                        <div style={{ color: '#ff4500', fontWeight: 700, fontSize: 15 }}>{product.price?.toLocaleString('vi-VN')}₫</div>
                                                        {product.originalPrice > product.price && (
                                                            <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 12 }}>{product.originalPrice?.toLocaleString('vi-VN')}₫</div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleWishlist(product._id)
                                                                .then(() => { message.success('Đã xóa khỏi yêu thích'); loadWishlist(); })
                                                                .catch(() => message.error('Lỗi'));
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444', fontSize: 20, lineHeight: 1 }}
                                                        title="Xóa khỏi yêu thích"
                                                    >
                                                        <HeartFilled />
                                                    </button>
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        )}
                    </motion.div>
                );

            case 'following':
                return (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} key="following">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>🏠 Shop đang theo dõi ({followedStores.length})</Title>
                        </div>
                        {loadingFollowed ? <Skeleton active paragraph={{ rows: 4 }} /> : followedStores.length === 0 ? (
                            <Card style={{ borderRadius: 12 }}>
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ fontSize: 56, marginBottom: 12, opacity: 0.3 }}>🏠</div>
                                    <Title level={5} style={{ color: '#64748b' }}>Chưa theo dõi shop nào</Title>
                                    <Button type="primary" onClick={() => navigate('/')} style={{ borderRadius: 8, background: '#1a3c8f', marginTop: 8 }}>Khám phá shop</Button>
                                </div>
                            </Card>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {followedStores.map((item) => {
                                    const store = item.store || item;
                                    return (
                                        <Card
                                            key={store._id}
                                            style={{ borderRadius: 12, border: '1px solid #e8ecf3' }}
                                            styles={{ body: { padding: '14px 18px' } }}
                                        >
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                                <img
                                                    src={store.logo || 'https://placehold.co/60x60?text=Shop'}
                                                    alt={store.name}
                                                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e8ecf3', flexShrink: 0 }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{store.name}</div>
                                                    {store.description && <div style={{ color: '#64748b', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.description}</div>}
                                                    <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>📦 {store.totalProducts || 0} sản phẩm</span>
                                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>👥 {store.totalFollowers || 0} theo dõi</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                                    <Button size="small" type="primary" style={{ background: '#1a3c8f', borderRadius: 8 }} onClick={() => navigate(`/store/${store.slug}`)}>Xem shop</Button>
                                                    <Button
                                                        size="small"
                                                        danger
                                                        style={{ borderRadius: 8 }}
                                                        onClick={async () => {
                                                            try {
                                                                await toggleFollowStore(store._id);
                                                                message.success('Bỏ theo dõi shop');
                                                                loadFollowedStores();
                                                            } catch { message.error('Lỗi'); }
                                                        }}
                                                    >Hủy theo dõi</Button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                );

            case 'wallet':
                return (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} key="wallet">
                        <Title level={5} style={{ marginBottom: 16 }}>Ví của tôi</Title>
                        {loadingWallet ? <Skeleton active paragraph={{ rows: 4 }} /> : (
                            <>
                                <Card style={{ borderRadius: 16, background: 'linear-gradient(135deg, #1a3c8f 0%, #2b52c0 60%, #4f72d9 100%)', border: 'none', marginBottom: 16 }}>
                                    <div style={{ color: '#fff' }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>Số dư ví</Text>
                                        <Title level={2} style={{ color: '#fff', margin: 0 }}>
                                            <DollarOutlined style={{ marginRight: 8 }} />
                                            {(wallet?.balance || user?.balance || 0).toLocaleString('vi-VN')}₫
                                        </Title>
                                    </div>
                                </Card>
                                {wallet?.transactions && wallet.transactions.length > 0 ? (
                                    <Card style={{ borderRadius: 12, border: '1px solid #e8ecf3' }}>
                                        <Title level={5} style={{ marginBottom: 12 }}>Lịch sử giao dịch</Title>
                                        <List
                                            dataSource={wallet.transactions}
                                            renderItem={(tx) => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        title={tx.description || tx.type}
                                                        description={dayjs(tx.createdAt).format('DD/MM/YYYY HH:mm')}
                                                    />
                                                    <Text strong style={{ color: tx.amount >= 0 ? '#10b981' : '#ef4444' }}>
                                                        {tx.amount >= 0 ? '+' : ''}{tx.amount?.toLocaleString('vi-VN')}₫
                                                    </Text>
                                                </List.Item>
                                            )}
                                        />
                                    </Card>
                                ) : (
                                    <Card style={{ borderRadius: 12 }}><Empty description="Chưa có giao dịch nào" /></Card>
                                )}
                            </>
                        )}
                    </motion.div>
                );

            case 'notifications':
                return (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} key="notifications">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>Thông báo</Title>
                            {notifications.length > 0 && <Button type="link" onClick={async () => { await markAllAsRead(); message.success('Đã đọc tất cả'); loadNotifications(); }}>Đánh dấu tất cả đã đọc</Button>}
                        </div>
                        {loadingNotifications ? <Skeleton active paragraph={{ rows: 4 }} /> : notifications.length === 0 ? (
                            <Card style={{ borderRadius: 12 }}><Empty description="Không có thông báo mới" /></Card>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {notifications.map((noti) => (
                                    <Card key={noti._id} style={{ borderRadius: 10, border: noti.isRead ? '1px solid #e8ecf3' : '1px solid #93c5fd', background: noti.isRead ? '#fff' : '#eff6ff', cursor: 'pointer' }}
                                        onClick={async () => { if (!noti.isRead) { await markAsRead(noti._id); loadNotifications(); } }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <Text strong={!noti.isRead}>{noti.message || noti.title}</Text>
                                                <Text type="secondary" style={{ display: 'block', fontSize: '0.8rem', marginTop: 4 }}>{dayjs(noti.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                                            </div>
                                            {!noti.isRead && <Badge status="processing" />}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px 16px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <Row gutter={[24, 24]}>
                    {/* ─── Sidebar ─────────────────────────────────── */}
                    <Col xs={24} md={7} lg={6}>
                        <div style={{ position: 'sticky', top: 80 }}>
                            {/* User Card */}
                            <Card style={{ borderRadius: 12, border: '1px solid #e8ecf3', marginBottom: 12, textAlign: 'center' }}>
                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                                    <Avatar src={user.avatar} size={72} icon={<UserOutlined />} style={{ border: '3px solid #e8ecf3' }} />
                                </div>
                                <Title level={5} style={{ margin: '0 0 2px 0' }}>{user.fullName}</Title>
                                <Text type="secondary" style={{ fontSize: '0.8rem' }}>{user.email}</Text>
                                <div style={{ marginTop: 8 }}>
                                    <Tag color="blue">{user.role === 'admin' ? 'Quản trị viên' : user.role === 'seller' ? 'Người bán' : 'Khách hàng'}</Tag>
                                </div>
                            </Card>

                            {/* Navigation */}
                            <Card style={{ borderRadius: 12, border: '1px solid #e8ecf3', padding: 0 }} styles={{ body: { padding: 0 } }}>
                                <Menu
                                    selectedKeys={[activeKey]}
                                    onClick={({ key }) => {
                                        if (key === 'logout') {
                                            logoutAction();
                                            return;
                                        }
                                        setActiveKey(key);
                                    }}
                                    items={sidebarItems}
                                    style={{ border: 'none', borderRadius: 12 }}
                                />
                            </Card>
                        </div>
                    </Col>

                    {/* ─── Content ─────────────────────────────────── */}
                    <Col xs={24} md={17} lg={18}>
                        {renderContent()}
                    </Col>
                </Row>
            </div>

            {/* Address Modal */}
            <Modal
                title={editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                open={addressModalOpen}
                onCancel={() => { setAddressModalOpen(false); setEditingAddress(null); }}
                onOk={handleSaveAddress}
                confirmLoading={loading}
                okText={editingAddress ? 'Cập nhật' : 'Thêm'}
                cancelText="Huỷ"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                    <Input placeholder="Họ và tên người nhận" value={addressForm.fullName} onChange={e => setAddressForm(p => ({ ...p, fullName: e.target.value }))} />
                    <Input placeholder="Số điện thoại" value={addressForm.phone} onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} />
                    <Input placeholder="Tỉnh/Thành phố" value={addressForm.province} onChange={e => setAddressForm(p => ({ ...p, province: e.target.value }))} />
                    <Input placeholder="Quận/Huyện" value={addressForm.district} onChange={e => setAddressForm(p => ({ ...p, district: e.target.value }))} />
                    <Input placeholder="Phường/Xã" value={addressForm.ward} onChange={e => setAddressForm(p => ({ ...p, ward: e.target.value }))} />
                    <Input placeholder="Số nhà, tên đường..." value={addressForm.detail} onChange={e => setAddressForm(p => ({ ...p, detail: e.target.value }))} />
                </div>
            </Modal>
        </div>
    );
}

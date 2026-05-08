import { useState, useEffect } from 'react';
import { Typography, Card, Form, Input, Button, message, Upload, Avatar, Tabs, Row, Col, Space } from 'antd';
import {
    UserOutlined,
    SaveOutlined,
    LockOutlined,
    CameraOutlined,
    MailOutlined,
    PhoneOutlined,
    EditOutlined,
    ShopOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, uploadAvatar, changePassword } from '../../api/apiUser';

const { Title, Text } = Typography;

export default function SellerProfile() {
    const { user, setUser } = useAuth();
    const [infoForm] = Form.useForm();
    const [pwForm] = Form.useForm();
    const [savingInfo, setSavingInfo] = useState(false);
    const [savingPw, setSavingPw] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

    useEffect(() => {
        infoForm.setFieldsValue({
            fullName: user?.fullName || '',
            email: user?.email || '',
            phone: user?.phone || '',
        });
        setAvatarUrl(user?.avatar || '');
    }, [user, infoForm]);

    /* ── Upload avatar ── */
    const handleAvatarUpload = async ({ file }) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('avatar', file);
        setAvatarLoading(true);
        try {
            const res = await uploadAvatar(fd);
            const newUrl = res.data?.metadata?.avatar || res.data?.avatar || avatarUrl;
            setAvatarUrl(newUrl);
            if (setUser) setUser((prev) => ({ ...prev, avatar: newUrl }));
            message.success('Cập nhật ảnh đại diện thành công!');
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi tải ảnh');
        } finally {
            setAvatarLoading(false);
        }
    };

    /* ── Update info ── */
    const handleSaveInfo = async () => {
        try {
            const values = await infoForm.validateFields(['fullName', 'phone']);
            setSavingInfo(true);
            const res = await updateProfile(values);
            const updated = res.data?.metadata || res.data;
            if (setUser) setUser((prev) => ({ ...prev, ...updated }));
            message.success('Cập nhật thông tin thành công!');
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err.response?.data?.message || 'Lỗi cập nhật');
        } finally {
            setSavingInfo(false);
        }
    };

    /* ── Change password ── */
    const handleChangePw = async () => {
        try {
            const values = await pwForm.validateFields();
            if (values.newPassword !== values.confirmPassword) {
                message.error('Mật khẩu xác nhận không khớp!');
                return;
            }
            setSavingPw(true);
            await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            message.success('Đổi mật khẩu thành công!');
            pwForm.resetFields();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err.response?.data?.message || 'Lỗi đổi mật khẩu');
        } finally {
            setSavingPw(false);
        }
    };

    const tabItems = [
        {
            key: 'info',
            label: (
                <Space>
                    <EditOutlined />
                    Thông tin cá nhân
                </Space>
            ),
            children: (
                <div style={{ paddingTop: 8 }}>
                    {/* Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar
                                src={avatarUrl}
                                size={96}
                                icon={<UserOutlined />}
                                style={{
                                    border: '3px solid #e8ecf3',
                                    background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                                }}
                            >
                                {user?.fullName?.[0]?.toUpperCase()}
                            </Avatar>
                            <Upload
                                showUploadList={false}
                                beforeUpload={() => false}
                                onChange={({ file }) => handleAvatarUpload({ file })}
                                accept="image/*"
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: '#1e40af',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #fff',
                                    }}
                                >
                                    <CameraOutlined style={{ color: '#fff', fontSize: 12 }} />
                                </div>
                            </Upload>
                        </div>
                        <div>
                            <Text strong style={{ fontSize: 16, display: 'block' }}>
                                {user?.fullName || 'Seller'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {user?.email}
                            </Text>
                            <br />
                            <Text style={{ fontSize: 11, color: '#1e40af', fontWeight: 600 }}>
                                <ShopOutlined style={{ marginRight: 4 }} />
                                NGƯỜI BÁN
                            </Text>
                        </div>
                    </div>

                    <Form form={infoForm} layout="vertical" size="large">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="fullName"
                                    label={<Text strong>Họ và tên</Text>}
                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                >
                                    <Input
                                        prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                                        placeholder="Nhập họ và tên..."
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="phone" label={<Text strong>Số điện thoại</Text>}>
                                    <Input
                                        prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
                                        placeholder="Nhập số điện thoại..."
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="email" label={<Text strong>Email</Text>}>
                            <Input prefix={<MailOutlined style={{ color: '#9ca3af' }} />} disabled />
                        </Form.Item>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={savingInfo}
                                onClick={handleSaveInfo}
                                style={{
                                    background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                                    border: 'none',
                                    fontWeight: 600,
                                    height: 42,
                                    paddingInline: 28,
                                }}
                            >
                                Lưu thông tin
                            </Button>
                        </div>
                    </Form>
                </div>
            ),
        },
        {
            key: 'password',
            label: (
                <Space>
                    <LockOutlined />
                    Đổi mật khẩu
                </Space>
            ),
            children: (
                <div style={{ paddingTop: 8, maxWidth: 480 }}>
                    <Form form={pwForm} layout="vertical" size="large">
                        <Form.Item
                            name="currentPassword"
                            label={<Text strong>Mật khẩu hiện tại</Text>}
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Nhập mật khẩu hiện tại..."
                            />
                        </Form.Item>
                        <Form.Item
                            name="newPassword"
                            label={<Text strong>Mật khẩu mới</Text>}
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Tối thiểu 6 ký tự..."
                            />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label={<Text strong>Xác nhận mật khẩu mới</Text>}
                            rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Nhập lại mật khẩu mới..."
                            />
                        </Form.Item>
                        <Button
                            type="primary"
                            icon={<LockOutlined />}
                            loading={savingPw}
                            onClick={handleChangePw}
                            style={{
                                background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                                border: 'none',
                                fontWeight: 600,
                                height: 42,
                                paddingInline: 28,
                            }}
                        >
                            Đổi mật khẩu
                        </Button>
                    </Form>
                </div>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>
                    Thông tin cá nhân
                </Title>
                <Text type="secondary">Quản lý thông tin tài khoản người bán của bạn.</Text>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card bordered={false} style={{ borderRadius: 16, border: '1px solid #e8ecf3' }}>
                    <Tabs items={tabItems} size="large" />
                </Card>
            </motion.div>
        </div>
    );
}

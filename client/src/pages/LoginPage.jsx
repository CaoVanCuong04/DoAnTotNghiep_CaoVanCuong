import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Input, Button, Divider, Alert } from 'antd';
import { motion } from 'framer-motion';
import { MailOutlined, LockOutlined, ShopOutlined, GoogleOutlined, FacebookFilled } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const { Title, Text } = Typography;

export default function LoginPage() {
    const navigate = useNavigate();
    const { loginAction, loginWithGoogleAction } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ email: '', password: '' });

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setError('Vui lòng nhập đầy đủ thông tin.');
            return;
        }
        setLoading(true);
        try {
            await loginAction(form);
            // navigate('/') -> Đã được xử lý triệt để qua tính năng DomainRedirect
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = async (response) => {
        const { credential } = response; // Nhận ID Token từ Google
        try {
            const data = {
                credential,
            };
            const res = await loginWithGoogleAction(data);
            toast.success(res.message);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/');
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f0f2f5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: -120,
                    left: -100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'rgba(26,60,143,0.08)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: -100,
                    right: -80,
                    width: 350,
                    height: 350,
                    borderRadius: '50%',
                    background: 'rgba(255,107,0,0.07)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />

            <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 16,
                            boxShadow: '0 8px 40px rgba(26,60,143,0.12)',
                            padding: '40px 32px',
                            border: '1px solid #e8ecf3',
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <motion.div
                                whileHover={{ scale: 1.06 }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                            >
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 14px rgba(26,60,143,0.35)',
                                    }}
                                >
                                    <ShopOutlined style={{ color: '#fff', fontSize: 26 }} />
                                </div>
                                <Title
                                    level={3}
                                    style={{
                                        margin: 0,
                                        background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        letterSpacing: '-0.5px',
                                        fontWeight: 800,
                                    }}
                                >
                                    GLOBALMART
                                </Title>
                            </motion.div>

                            <Title level={5} style={{ marginTop: 20, marginBottom: 4, color: '#1a1a2e' }}>
                                Chào mừng trở lại!
                            </Title>
                            <Text type="secondary">Đăng nhập để tiếp tục mua sắm</Text>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                                <Alert
                                    message={error}
                                    type="error"
                                    showIcon
                                    style={{ marginBottom: 20, borderRadius: 8 }}
                                />
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 20 }}>
                                <Input
                                    size="large"
                                    name="email"
                                    type="email"
                                    placeholder="example@email.com"
                                    prefix={<MailOutlined style={{ color: '#8899aa' }} />}
                                    value={form.email}
                                    onChange={handleChange}
                                    style={{ borderRadius: 8 }}
                                />
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <Input.Password
                                    size="large"
                                    name="password"
                                    placeholder="Nhập mật khẩu"
                                    prefix={<LockOutlined style={{ color: '#8899aa' }} />}
                                    value={form.password}
                                    onChange={handleChange}
                                    style={{ borderRadius: 8 }}
                                />
                            </div>

                            <div style={{ textAlign: 'right', marginBottom: 24 }}>
                                <Link to="/forgot-password">
                                    <Text style={{ color: '#1a3c8f', fontWeight: 600 }}>Quên mật khẩu?</Text>
                                </Link>
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                size="large"
                                loading={loading}
                                style={{
                                    height: 48,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    background: 'linear-gradient(135deg, #1a3c8f 0%, #2b52c0 100%)',
                                    border: 'none',
                                    boxShadow: '0 4px 16px rgba(26,60,143,0.3)',
                                    marginBottom: 20,
                                }}
                            >
                                Đăng Nhập
                            </Button>

                            <Divider style={{ color: '#8899aa', fontSize: '0.85rem', margin: '20px 0' }} plain>
                                hoặc đăng nhập với
                            </Divider>
                            <div style={{ marginTop: '20px' }}>
                                <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                                    <GoogleLogin
                                        onSuccess={handleSuccess}
                                        onError={() => console.log('Login Failed')}
                                    />
                                </GoogleOAuthProvider>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <Text type="secondary">Chưa có tài khoản? </Text>
                                <Link to="/register">
                                    <Text strong style={{ color: '#ff6b00' }}>
                                        Đăng ký ngay
                                    </Text>
                                </Link>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

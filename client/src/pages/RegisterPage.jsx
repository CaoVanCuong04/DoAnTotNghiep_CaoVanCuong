import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Input, Button, Divider, Alert, Checkbox, Steps } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MailOutlined,
    LockOutlined,
    UserOutlined,
    PhoneOutlined,
    ShopOutlined,
    GoogleOutlined,
    FacebookFilled,
    CheckCircleFilled,
} from '@ant-design/icons';
import { userApi } from '../api';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const stepsList = ['Thông tin cá nhân', 'Tài khoản', 'Hoàn tất'];

export default function RegisterPage() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const { loginWithGoogleAction } = useAuth();

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const validateStep = () => {
        if (activeStep === 0) {
            if (!form.fullName.trim()) {
                setError('Vui lòng nhập họ và tên.');
                return false;
            }
            if (!form.phone.trim()) {
                setError('Vui lòng nhập số điện thoại.');
                return false;
            }
        }
        if (activeStep === 1) {
            if (!form.email.trim()) {
                setError('Vui lòng nhập email.');
                return false;
            }
            if (form.password.length < 6) {
                setError('Mật khẩu phải có ít nhất 6 ký tự.');
                return false;
            }
            if (form.password !== form.confirmPassword) {
                setError('Mật khẩu xác nhận không khớp.');
                return false;
            }
            if (!agreed) {
                setError('Vui lòng đồng ý với điều khoản dịch vụ.');
                return false;
            }
        }
        return true;
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

    const handleNext = () => {
        if (!validateStep()) return;
        setError('');
        setActiveStep((prev) => Math.min(prev + 1, 2));
    };

    const handleBack = () => {
        setError('');
        setActiveStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;
        setLoading(true);
        try {
            await userApi.register({
                fullName: form.fullName,
                phone: form.phone,
                email: form.email,
                password: form.password,
            });
            setActiveStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const slideVariants = {
        enter: { x: 40, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -40, opacity: 0 },
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #fff7f0 0%, #f0f4ff 50%, #f0f2f5 100%)',
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
                    position: 'fixed',
                    top: -100,
                    right: -80,
                    width: 380,
                    height: 380,
                    borderRadius: '50%',
                    background: 'rgba(255,107,0,0.07)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    bottom: -120,
                    left: -100,
                    width: 360,
                    height: 360,
                    borderRadius: '50%',
                    background: 'rgba(26,60,143,0.07)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />

            <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
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
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 14px rgba(26,60,143,0.35)',
                                    }}
                                >
                                    <ShopOutlined style={{ color: '#fff', fontSize: 24 }} />
                                </div>
                                <Title
                                    level={4}
                                    style={{
                                        margin: 0,
                                        background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontWeight: 800,
                                    }}
                                >
                                    GLOBALMART
                                </Title>
                            </div>
                            <Title level={5} style={{ marginTop: 16, marginBottom: 4, color: '#1a1a2e' }}>
                                Tạo tài khoản mới
                            </Title>
                            <Text type="secondary">Tham gia cùng hàng triệu khách hàng của chúng tôi</Text>
                        </div>

                        {activeStep < 2 && (
                            <div style={{ marginBottom: 32 }}>
                                <Steps
                                    current={activeStep}
                                    items={stepsList.slice(0, 2).map((title) => ({ title }))}
                                    size="small"
                                />
                            </div>
                        )}

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Alert
                                        message={error}
                                        type="error"
                                        showIcon
                                        style={{ marginBottom: 20, borderRadius: 8 }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {activeStep === 0 && (
                                <motion.div
                                    key="step0"
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    <div style={{ marginBottom: 20 }}>
                                        <Input
                                            size="large"
                                            name="fullName"
                                            placeholder="Họ và tên (VD: Nguyễn Văn A)"
                                            prefix={<UserOutlined style={{ color: '#8899aa' }} />}
                                            value={form.fullName}
                                            onChange={handleChange}
                                            style={{ borderRadius: 8 }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: 24 }}>
                                        <Input
                                            size="large"
                                            name="phone"
                                            placeholder="Số điện thoại (VD: 0912 345 678)"
                                            prefix={<PhoneOutlined style={{ color: '#8899aa' }} />}
                                            value={form.phone}
                                            onChange={handleChange}
                                            style={{ borderRadius: 8 }}
                                        />
                                    </div>
                                    <Button
                                        type="primary"
                                        block
                                        size="large"
                                        onClick={handleNext}
                                        style={{
                                            height: 48,
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #1a3c8f 0%, #2b52c0 100%)',
                                            border: 'none',
                                            boxShadow: '0 4px 16px rgba(26,60,143,0.3)',
                                        }}
                                    >
                                        Tiếp theo
                                    </Button>
                                </motion.div>
                            )}

                            {activeStep === 1 && (
                                <motion.div
                                    key="step1"
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
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
                                        <div style={{ marginBottom: 20 }}>
                                            <Input.Password
                                                size="large"
                                                name="password"
                                                placeholder="Mật khẩu (Ít nhất 6 ký tự)"
                                                prefix={<LockOutlined style={{ color: '#8899aa' }} />}
                                                value={form.password}
                                                onChange={handleChange}
                                                style={{ borderRadius: 8 }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: 20 }}>
                                            <Input.Password
                                                size="large"
                                                name="confirmPassword"
                                                placeholder="Xác nhận mật khẩu"
                                                prefix={<LockOutlined style={{ color: '#8899aa' }} />}
                                                value={form.confirmPassword}
                                                onChange={handleChange}
                                                style={{ borderRadius: 8 }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: 24 }}>
                                            <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
                                                <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                                                    Tôi đồng ý với{' '}
                                                    <Link to="#" style={{ color: '#1a3c8f', fontWeight: 600 }}>
                                                        Điều khoản dịch vụ
                                                    </Link>{' '}
                                                    và{' '}
                                                    <Link to="#" style={{ color: '#1a3c8f', fontWeight: 600 }}>
                                                        Chính sách bảo mật
                                                    </Link>
                                                </Text>
                                            </Checkbox>
                                        </div>

                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <Button
                                                size="large"
                                                block
                                                onClick={handleBack}
                                                style={{ height: 48, fontWeight: 700, borderRadius: 8 }}
                                            >
                                                Quay lại
                                            </Button>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                block
                                                size="large"
                                                loading={loading}
                                                style={{
                                                    height: 48,
                                                    fontWeight: 700,
                                                    borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c33 100%)',
                                                    border: 'none',
                                                    boxShadow: '0 4px 16px rgba(255,107,0,0.3)',
                                                }}
                                            >
                                                Hoàn tất
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {activeStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                >
                                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                        <motion.div animate={{ scale: [0.8, 1.15, 1] }} transition={{ duration: 0.6 }}>
                                            <CheckCircleFilled
                                                style={{ fontSize: 72, color: '#22c55e', marginBottom: 16 }}
                                            />
                                        </motion.div>
                                        <Title level={4} style={{ color: '#1a1a2e', marginBottom: 8 }}>
                                            Đăng ký thành công!
                                        </Title>
                                        <Text
                                            type="secondary"
                                            style={{ display: 'block', marginBottom: 32, lineHeight: 1.7 }}
                                        >
                                            Chào mừng <strong>{form.fullName}</strong> đã gia nhập GlobalMart!
                                            <br />
                                            Hãy bắt đầu trải nghiệm mua sắm tuyệt vời ngay.
                                        </Text>
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={() => navigate('/')}
                                            style={{
                                                height: 48,
                                                padding: '0 40px',
                                                fontWeight: 700,
                                                borderRadius: 8,
                                                background: 'linear-gradient(135deg, #1a3c8f 0%, #2b52c0 100%)',
                                                border: 'none',
                                                boxShadow: '0 4px 16px rgba(26,60,143,0.3)',
                                            }}
                                        >
                                            Bắt đầu mua sắm
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {activeStep === 0 && (
                            <>
                                <div style={{ marginTop: '20px' }}>
                                    <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                                        <GoogleLogin
                                            onSuccess={handleSuccess}
                                            onError={() => console.log('Login Failed')}
                                        />
                                    </GoogleOAuthProvider>
                                </div>
                            </>
                        )}

                        {activeStep < 2 && (
                            <div style={{ textAlign: 'center', marginTop: 12 }}>
                                <Text type="secondary">Đã có tài khoản? </Text>
                                <Link to="/login">
                                    <Text strong style={{ color: '#1a3c8f' }}>
                                        Đăng nhập
                                    </Text>
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

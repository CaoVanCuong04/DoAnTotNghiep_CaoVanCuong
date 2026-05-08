import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Input, Button, Alert, Steps } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MailOutlined,
    LockOutlined,
    ShopOutlined,
    SafetyCertificateOutlined,
    CheckCircleFilled,
    ArrowLeftOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { forgotPassword, resetPassword } from '../api/apiUser';

const { Title, Text } = Typography;

const fadeSlide = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.32, ease: 'easeOut' },
};

export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    // step: 'email' | 'reset' | 'done'
    const [step, setStep] = useState('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // ── Bước 1: gửi email lấy OTP ──
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) { setError('Vui lòng nhập địa chỉ email.'); return; }

        setLoading(true);
        try {
            await forgotPassword({ email: email.trim() });
            setSuccess('Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.');
            setStep('reset');
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // ── Bước 2: đặt lại mật khẩu ──
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (!otp.trim()) { setError('Vui lòng nhập mã OTP.'); return; }
        if (newPassword.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
        if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }

        setLoading(true);
        try {
            await resetPassword({ otp: otp.trim(), newPassword });
            setStep('done');
        } catch (err) {
            setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // ── Gửi lại OTP ──
    const handleResendOtp = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await forgotPassword({ email: email.trim() });
            setSuccess('Đã gửi lại mã OTP mới!');
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể gửi lại OTP.');
        } finally {
            setLoading(false);
        }
    };

    const stepIndex = step === 'email' ? 0 : step === 'reset' ? 1 : 2;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f0f2f5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', top: -120, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(26,60,143,0.08)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -100, right: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,107,0,0.07)', zIndex: 0, pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease: 'easeOut' }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 8px 40px rgba(26,60,143,0.12)',
                        padding: '40px 36px',
                        border: '1px solid #e8ecf3',
                    }}>
                        {/* Logo */}
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <motion.div whileHover={{ scale: 1.06 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(26,60,143,0.35)',
                                }}>
                                    <ShopOutlined style={{ color: '#fff', fontSize: 22 }} />
                                </div>
                                <Title level={3} style={{
                                    margin: 0,
                                    background: 'linear-gradient(135deg, #1a3c8f, #2b52c0)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    letterSpacing: '-0.5px',
                                    fontWeight: 800,
                                }}>GLOBALMART</Title>
                            </motion.div>
                        </div>

                        {/* Steps indicator */}
                        {step !== 'done' && (
                            <Steps
                                current={stepIndex}
                                size="small"
                                style={{ marginBottom: 28 }}
                                items={[
                                    { title: 'Email', icon: <MailOutlined /> },
                                    { title: 'Xác nhận', icon: <SafetyCertificateOutlined /> },
                                    { title: 'Hoàn tất', icon: <CheckCircleFilled /> },
                                ]}
                            />
                        )}

                        {/* ── STEP 1: Nhập Email ── */}
                        <AnimatePresence mode="wait">
                            {step === 'email' && (
                                <motion.div key="step-email" {...fadeSlide}>
                                    <div style={{ marginBottom: 20 }}>
                                        <Title level={5} style={{ margin: 0, color: '#1a1a2e' }}>Quên mật khẩu?</Title>
                                        <Text type="secondary" style={{ fontSize: 13 }}>
                                            Nhập email đăng ký để nhận mã OTP đặt lại mật khẩu
                                        </Text>
                                    </div>

                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                                            <Alert message={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
                                        </motion.div>
                                    )}

                                    <form onSubmit={handleSendOtp}>
                                        <div style={{ marginBottom: 20 }}>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                                                Địa chỉ email
                                            </label>
                                            <Input
                                                id="forgot-email"
                                                size="large"
                                                type="email"
                                                placeholder="example@email.com"
                                                prefix={<MailOutlined style={{ color: '#8899aa' }} />}
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                                style={{ borderRadius: 8 }}
                                                autoFocus
                                            />
                                        </div>

                                        <Button
                                            id="btn-send-otp"
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            size="large"
                                            loading={loading}
                                            style={{
                                                height: 48, fontSize: '1rem', fontWeight: 700,
                                                borderRadius: 8,
                                                background: 'linear-gradient(135deg, #1a3c8f 0%, #2b52c0 100%)',
                                                border: 'none',
                                                boxShadow: '0 4px 16px rgba(26,60,143,0.3)',
                                                marginBottom: 16,
                                            }}
                                        >
                                            Gửi mã OTP
                                        </Button>

                                        <div style={{ textAlign: 'center' }}>
                                            <Link to="/login">
                                                <Text style={{ color: '#1a3c8f', fontWeight: 600, fontSize: 13 }}>
                                                    <ArrowLeftOutlined style={{ marginRight: 4 }} />
                                                    Quay lại đăng nhập
                                                </Text>
                                            </Link>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* ── STEP 2: Nhập OTP + Mật khẩu mới ── */}
                            {step === 'reset' && (
                                <motion.div key="step-reset" {...fadeSlide}>
                                    <div style={{ marginBottom: 20 }}>
                                        <Title level={5} style={{ margin: 0, color: '#1a1a2e' }}>Đặt lại mật khẩu</Title>
                                        <Text type="secondary" style={{ fontSize: 13 }}>
                                            Nhập mã OTP đã gửi tới <strong>{email}</strong>
                                        </Text>
                                    </div>

                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                                            <Alert message={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
                                        </motion.div>
                                    )}
                                    {success && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                                            <Alert message={success} type="success" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
                                        </motion.div>
                                    )}

                                    <form onSubmit={handleResetPassword}>
                                        {/* OTP */}
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <label style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>Mã OTP</label>
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    icon={<ReloadOutlined />}
                                                    loading={loading}
                                                    onClick={handleResendOtp}
                                                    style={{ padding: 0, fontSize: 12, color: '#1a3c8f' }}
                                                >
                                                    Gửi lại OTP
                                                </Button>
                                            </div>
                                            <Input
                                                id="forgot-otp"
                                                size="large"
                                                placeholder="Nhập mã 6 chữ số"
                                                prefix={<SafetyCertificateOutlined style={{ color: '#8899aa' }} />}
                                                value={otp}
                                                onChange={(e) => { setOtp(e.target.value); setError(''); }}
                                                maxLength={6}
                                                style={{ borderRadius: 8, letterSpacing: 6, fontWeight: 700 }}
                                                autoFocus
                                            />
                                        </div>

                                        {/* New password */}
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                                                Mật khẩu mới
                                            </label>
                                            <Input.Password
                                                id="forgot-new-password"
                                                size="large"
                                                placeholder="Ít nhất 6 ký tự"
                                                prefix={<LockOutlined style={{ color: '#8899aa' }} />}
                                                value={newPassword}
                                                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                                style={{ borderRadius: 8 }}
                                            />
                                        </div>

                                        {/* Confirm password */}
                                        <div style={{ marginBottom: 24 }}>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                                                Xác nhận mật khẩu
                                            </label>
                                            <Input.Password
                                                id="forgot-confirm-password"
                                                size="large"
                                                placeholder="Nhập lại mật khẩu mới"
                                                prefix={<LockOutlined style={{ color: '#8899aa' }} />}
                                                value={confirmPassword}
                                                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                                style={{ borderRadius: 8 }}
                                                status={confirmPassword && confirmPassword !== newPassword ? 'error' : ''}
                                            />
                                            {confirmPassword && confirmPassword !== newPassword && (
                                                <Text type="danger" style={{ fontSize: 12 }}>Mật khẩu không khớp</Text>
                                            )}
                                        </div>

                                        <Button
                                            id="btn-reset-password"
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            size="large"
                                            loading={loading}
                                            style={{
                                                height: 48, fontSize: '1rem', fontWeight: 700,
                                                borderRadius: 8,
                                                background: 'linear-gradient(135deg, #1a3c8f 0%, #2b52c0 100%)',
                                                border: 'none',
                                                boxShadow: '0 4px 16px rgba(26,60,143,0.3)',
                                                marginBottom: 16,
                                            }}
                                        >
                                            Đặt lại mật khẩu
                                        </Button>

                                        <div style={{ textAlign: 'center' }}>
                                            <Button
                                                type="link"
                                                onClick={() => { setStep('email'); setError(''); setSuccess(''); setOtp(''); }}
                                                style={{ padding: 0, fontSize: 13, color: '#1a3c8f', fontWeight: 600 }}
                                            >
                                                <ArrowLeftOutlined style={{ marginRight: 4 }} />
                                                Đổi email khác
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* ── STEP 3: Thành công ── */}
                            {step === 'done' && (
                                <motion.div
                                    key="step-done"
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    style={{ textAlign: 'center', padding: '12px 0 8px' }}
                                >
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                                        style={{
                                            width: 88, height: 88,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 20px',
                                            boxShadow: '0 8px 28px rgba(16,185,129,0.22)',
                                        }}
                                    >
                                        <CheckCircleFilled style={{ fontSize: 44, color: '#10b981' }} />
                                    </motion.div>

                                    <Title level={4} style={{ margin: '0 0 8px', color: '#1a1a2e' }}>
                                        Đặt lại mật khẩu thành công!
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 28 }}>
                                        Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập để tiếp tục mua sắm.
                                    </Text>

                                    <Button
                                        id="btn-goto-login"
                                        type="primary"
                                        block
                                        size="large"
                                        onClick={() => navigate('/login')}
                                        style={{
                                            height: 48, fontSize: '1rem', fontWeight: 700,
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #1a3c8f 0%, #2b52c0 100%)',
                                            border: 'none',
                                            boxShadow: '0 4px 16px rgba(26,60,143,0.3)',
                                        }}
                                    >
                                        Đăng nhập ngay
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

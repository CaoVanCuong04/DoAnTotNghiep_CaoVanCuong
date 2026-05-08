import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Form, Input, Button, Upload, message, Result, Spin, Steps } from 'antd';
import { ShopOutlined, UploadOutlined, SolutionOutlined, CheckCircleOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { getMyStoreStatus, registerStore } from '../../api/apiStore';
import { useAuth } from '../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function SellerRegisterPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null);
    
    // File states
    const [logoList, setLogoList] = useState([]);
    const [bannerList, setBannerList] = useState([]);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await getMyStoreStatus();
            const currentStatus = res.data?.metadata?.status;
            setStatus(currentStatus);
            if (currentStatus === 'active') {
                navigate('/seller');
            }
        } catch (err) {
            console.log('Chưa có shop', err);
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = ({ fileList }) => setLogoList(fileList.slice(-1));
    const handleBannerChange = ({ fileList }) => setBannerList(fileList.slice(-1));

    const onFinish = async (values) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('description', values.description || '');
            formData.append('phone', values.phone || '');
            formData.append('address', values.address || '');

            if (logoList[0]?.originFileObj) {
                formData.append('logo', logoList[0].originFileObj);
            }
            if (bannerList[0]?.originFileObj) {
                formData.append('banner', bannerList[0].originFileObj);
            }

            await registerStore(formData);
            message.success('Đăng ký gian hàng thành công! Vui lòng chờ duyệt.');
            checkStatus();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
                <Spin size="large" />
            </div>
        );
    }

    // ─── Đã nộp đơn, đang chờ duyệt ───
    if (status === 'pending') {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card style={{ maxWidth: 600, width: '100%', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', padding: '40px 20px' }}>
                        <Result
                            icon={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
                            title="Hồ sơ đang chờ duyệt"
                            subTitle="Bạn đã gửi yêu cầu đăng ký gian hàng thành công. Ban quản trị đang xem xét hồ sơ của bạn. Vui lòng quay lại sau."
                            extra={[
                                <Button type="primary" key="home" onClick={() => navigate('/')} size="large" style={{ background: '#1e40af', borderRadius: 8 }}>
                                    Về trang chủ
                                </Button>
                            ]}
                        />
                    </Card>
                </motion.div>
            </div>
        );
    }

    // ─── Bị khóa / Từ chối ───
    if (status === 'banned') {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card style={{ maxWidth: 600, width: '100%', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', padding: '40px 20px' }}>
                        <Result
                            status="error"
                            title="Gian hàng bị khóa hoặc bị từ chối"
                            subTitle="Yêu cầu đăng ký gian hàng của bạn đã bị từ chối hoặc gian hàng đang bị khóa do vi phạm chính sách."
                            extra={[
                                <Button type="primary" key="home" onClick={() => navigate('/')} size="large" style={{ borderRadius: 8 }}>
                                    Về trang chủ
                                </Button>
                            ]}
                        />
                    </Card>
                </motion.div>
            </div>
        );
    }

    // ─── Chưa đăng ký -> Hiện form ───
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <ShopOutlined style={{ fontSize: 48, color: '#1e40af', marginBottom: 16 }} />
                    <Title level={2} style={{ color: '#1e293b', margin: 0 }}>Đăng ký trở thành Người bán</Title>
                    <Text type="secondary" style={{ fontSize: '1.1rem' }}>Mở gian hàng và tiếp cận hàng triệu khách hàng ngay hôm nay</Text>
                </div>

                <div style={{ marginBottom: 40 }}>
                    <Steps
                        current={0}
                        items={[
                            { title: 'Đăng ký', icon: <SolutionOutlined /> },
                            { title: 'Chờ duyệt', icon: <InfoCircleOutlined /> },
                            { title: 'Bắt đầu bán', icon: <CheckCircleOutlined /> },
                        ]}
                    />
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 20px 30px' }}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                size="large"
                            >
                                <Title level={4} style={{ marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                                    Thông tin gian hàng cơ bản
                                </Title>

                                <Form.Item
                                    name="name"
                                    label={<Text strong>Tên gian hàng</Text>}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập tên gian hàng' },
                                        { min: 3, message: 'Tên phải có ít nhất 3 ký tự' },
                                        { max: 50, message: 'Tên không quá 50 ký tự' }
                                    ]}
                                    tooltip="Tên gian hàng là duy nhất và sẽ hiển thị tới khách hàng"
                                >
                                    <Input placeholder="Ví dụ: L2Team Official Store" allowClear />
                                </Form.Item>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <Form.Item name="phone" label={<Text strong>Số điện thoại liên hệ</Text>} rules={[{ required: true, message: 'Vui lòng cung cấp số ĐT' }]}>
                                        <Input placeholder="Nhập SĐT hỗ trợ khách hàng" />
                                    </Form.Item>
                                    <Form.Item name="address" label={<Text strong>Địa chỉ lấy hàng / Kho</Text>} rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
                                        <Input placeholder="Nhập địa chỉ lấy hàng" />
                                    </Form.Item>
                                </div>

                                <Form.Item
                                    name="description"
                                    label={<Text strong>Mô tả gian hàng</Text>}
                                    rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                                >
                                    <TextArea
                                        placeholder="Giới thiệu về các sản phẩm bạn đang bán..."
                                        rows={4}
                                        maxLength={500}
                                        showCount
                                    />
                                </Form.Item>

                                <Title level={4} style={{ marginTop: 40, marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                                    Hình ảnh gian hàng
                                </Title>

                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 32 }}>
                                    <div>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Logo Shop (1:1)</Text>
                                        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>Nên dùng ảnh vuông, tối đa 2MB.</Text>
                                        <Upload
                                            listType="picture-card"
                                            fileList={logoList}
                                            onChange={handleLogoChange}
                                            beforeUpload={() => false}
                                            maxCount={1}
                                            accept="image/*"
                                        >
                                            {logoList.length < 1 && (
                                                <div style={{ color: '#94a3b8' }}>
                                                    <UploadOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                                    <div style={{ marginTop: 8 }}>Tải Logo</div>
                                                </div>
                                            )}
                                        </Upload>
                                    </div>
                                    <div>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Banner Gian Hàng (16:9)</Text>
                                        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>Ảnh bìa hiển thị ở trang chi tiết shop.</Text>
                                        <Upload
                                            listType="picture-card"
                                            fileList={bannerList}
                                            onChange={handleBannerChange}
                                            beforeUpload={() => false}
                                            maxCount={1}
                                            accept="image/*"
                                            style={{ width: '100%' }}
                                        >
                                            {bannerList.length < 1 && (
                                                <div style={{ color: '#94a3b8' }}>
                                                    <UploadOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                                    <div style={{ marginTop: 8 }}>Tải Banner</div>
                                                </div>
                                            )}
                                        </Upload>
                                    </div>
                                </div>

                                <div style={{ marginTop: 48, background: '#eff6ff', padding: '16px 20px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                                    <Paragraph style={{ margin: 0, color: '#1e3a8a' }}>
                                        Bằng việc nhấn "Đăng ký", bạn đã đồng ý thỏa thuận <a href="#">Điều khoản dịch vụ Người bán</a> của chúng tôi. 
                                        Gian hàng của bạn sẽ được review trong vòng 24h.
                                    </Paragraph>
                                </div>

                                <Form.Item style={{ marginTop: 24, textAlign: 'center' }}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        size="large"
                                        loading={submitting}
                                        style={{ background: '#1e40af', width: 280, borderRadius: 8, height: 48, fontSize: '1.1rem' }}
                                    >
                                        Đăng ký Gian hàng
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

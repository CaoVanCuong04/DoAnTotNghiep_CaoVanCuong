import { useState, useEffect } from 'react';
import { Typography, Card, Form, Input, Button, message, Upload, Avatar, Divider } from 'antd';
import { UploadOutlined, SaveOutlined, ShopOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { getMyStore, updateMyStore } from '../../api/apiStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SellerSettings() {
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    
    // Upload states
    const [logoList, setLogoList] = useState([]);
    const [bannerList, setBannerList] = useState([]);

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const res = await getMyStore();
            const data = res.data?.metadata || res.data;
            setStore(data);
            form.setFieldsValue({
                name: data.name,
                description: data.description,
                phone: data.phone,
                address: data.address
            });
            
            if (data.logo) {
                setLogoList([{ uid: '-1', name: 'logo.png', status: 'done', url: data.logo }]);
            }
            if (data.banner) {
                setBannerList([{ uid: '-2', name: 'banner.png', status: 'done', url: data.banner }]);
            }
        } catch (err) {
            message.error('Lỗi tải thông tin shop');
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

            await updateMyStore(formData);
            message.success('Cập nhật thông tin gian hàng thành công');
            fetchStore();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Cài đặt Shop</Title>
                <Text type="secondary">Cập nhật hồ sơ để khách hàng dễ dàng nhận diện thương hiệu của bạn.</Text>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card bordered={false} style={{ borderRadius: 16, border: '1px solid #e8ecf3', overflow: 'hidden' }}>
                    <Form form={form} layout="vertical" onFinish={onFinish} size="large">
                        
                        {/* Hình ảnh */}
                        <Title level={5} style={{ marginBottom: 24, marginTop: 10 }}>1. Hình ảnh nhận diện</Title>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 32, marginBottom: 32 }}>
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>Logo Shop</Text>
                                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>Ảnh vuông, tối đa 2MB.</Text>
                                <Upload
                                    listType="picture-card"
                                    fileList={logoList}
                                    onChange={handleLogoChange}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    accept="image/*"
                                >
                                    {logoList.length < 1 && (
                                        <div><UploadOutlined /><div style={{ marginTop: 8 }}>Tải Logo</div></div>
                                    )}
                                </Upload>
                            </div>
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>Banner Gian Hàng</Text>
                                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>Ảnh bìa tỉ lệ 16:9, tối đa 5MB.</Text>
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
                                        <div><UploadOutlined /><div style={{ marginTop: 8 }}>Tải Banner</div></div>
                                    )}
                                </Upload>
                            </div>
                        </div>

                        <Divider />

                        {/* Thông tin chung */}
                        <Title level={5} style={{ marginBottom: 24 }}>2. Thông tin chung</Title>
                        
                        <Form.Item
                            name="name"
                            label={<Text strong>Tên gian hàng</Text>}
                            rules={[{ required: true, message: 'Vui lòng nhập tên gian hàng' }]}
                        >
                            <Input prefix={<ShopOutlined style={{ color: '#9ca3af' }} />} placeholder="Tên hiển thị với khách hàng" />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <Form.Item name="phone" label={<Text strong>Số điện thoại hỗ trợ</Text>} rules={[{ required: true }]}>
                                <Input prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />} placeholder="Nhập SĐT..." />
                            </Form.Item>
                            <Form.Item name="address" label={<Text strong>Địa chỉ kho lấy hàng</Text>} rules={[{ required: true }]}>
                                <Input prefix={<EnvironmentOutlined style={{ color: '#9ca3af' }} />} placeholder="Nhập địa chỉ..." />
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="description"
                            label={<Text strong>Thông tin giới thiệu shop</Text>}
                            rules={[{ required: true, message: 'Vui lòng nhập giới thiệu' }]}
                        >
                            <TextArea 
                                placeholder="Viết giới thiệu về các sản phẩm/dịch vụ shop đang cung cấp..." 
                                rows={5} 
                                maxLength={1000} 
                                showCount 
                            />
                        </Form.Item>

                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 8, marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text type="secondary">Đường dẫn gian hàng của bạn: <a href={`/shop/${store?.slug}`} target="_blank" rel="noreferrer">/shop/{store?.slug}</a></Text>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                icon={<SaveOutlined />} 
                                loading={submitting}
                                style={{ background: '#1e40af', width: 140 }}
                            >
                                Lưu thay đổi
                            </Button>
                        </div>
                    </Form>
                </Card>
            </motion.div>
        </div>
    );
}

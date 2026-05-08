import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Typography, Result, Button, Card, Row, Col, Divider, Skeleton, Tag } from 'antd';
import { ShoppingOutlined, EnvironmentOutlined, CreditCardOutlined, CheckCircleFilled } from '@ant-design/icons';
import { getOrderById } from '../api/apiOrder';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function OrderSuccessPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status');
    const { user } = useAuth();
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await getOrderById(id);
                setOrder(res.data?.metadata || res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', padding: '40px 20px', background: '#f4f6fb', display: 'flex', justifyContent: 'center' }}>
                <Card style={{ width: '100%', maxWidth: 800, borderRadius: 12 }}>
                    <Skeleton active paragraph={{ rows: 10 }} />
                </Card>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ minHeight: '80vh', padding: '40px 20px', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Result
                    status="404"
                    title="Không tìm thấy đơn hàng"
                    subTitle="Xin lỗi, đơn hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
                    extra={<Link to="/"><Button type="primary">Quay lại trang chủ</Button></Link>}
                />
            </div>
        );
    }

    const items = order.items || [];
    const shippingInfo = order.shippingInfo || {};
    const paymentMethod = order.paymentMethod;
    const totalPrice = order.totalPrice || 0;
    const shippingFee = order.shippingFee || 0;
    const shopDiscount = order.shopDiscountAmount || 0;
    const systemDiscount = order.systemDiscountAmount || 0;
    const totalDiscount = shopDiscount + systemDiscount;
    const finalPrice = order.finalPrice || 0;

    const paymentLabel = {
        cod: 'Thanh toán khi nhận hàng (COD)',
        momo: 'Ví Điện Tử MoMo',
        vnpay: 'Thẻ ATM / VNPAY'
    }[paymentMethod] || paymentMethod;

    return (
        <div style={{ minHeight: '100vh', padding: '40px 20px', background: '#f0f2f5' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 24, overflow: 'hidden' }}>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <CheckCircleFilled style={{ fontSize: 72, color: '#10b981', marginBottom: 16 }} />
                        <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>Đặt hàng thành công!</Title>
                        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: '1rem' }}>
                            Mã đơn hàng của bạn là <Text strong style={{ color: '#1a3c8f' }}>#{order.orderCode || order._id?.substring(order._id.length - 8).toUpperCase()}</Text>
                        </Text>
                        
                        {(status === 'momo' || status === 'vnpay') && (
                            <Tag color="success" style={{ marginTop: 12, padding: '4px 12px', borderRadius: 4, fontWeight: 600 }}>
                                Đã thanh toán qua {status.toUpperCase()}
                            </Tag>
                        )}
                    </div>

                    <Divider style={{ margin: 0 }} />

                    <div style={{ padding: 24 }}>
                        <Title level={5} style={{ marginBottom: 16 }}><ShoppingOutlined style={{ marginRight: 8 }}/>Sản Phẩm Đã Đặt</Title>
                        {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                <img src={item.image} alt={item.name} style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, border: '1px solid #f0f2f5', background: '#fff' }} />
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: 4 }}>{item.name}</Text>
                                    {item.variantLabel && <Text type="secondary" style={{ fontSize: '0.85rem' }}>Phân loại: {item.variantLabel}</Text>}
                                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong style={{ color: '#ff4500' }}>{item.price?.toLocaleString('vi-VN')}₫</Text>
                                        <Text type="secondary">Số lượng: x{item.quantity}</Text>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Divider />

                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <Title level={5} style={{ marginBottom: 12 }}><EnvironmentOutlined style={{ marginRight: 8, color: '#1a3c8f' }} />Giao hàng đến</Title>
                                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Người nhận: {shippingInfo.fullName || '—'}</Text>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Điện thoại: {shippingInfo.phone || '—'}</Text>
                                    <Text type="secondary" style={{ display: 'block' }}>Địa chỉ: {shippingInfo.address || '—'}</Text>
                                </div>
                            </Col>
                            
                            <Col xs={24} md={12}>
                                <Title level={5} style={{ marginBottom: 12 }}><CreditCardOutlined style={{ marginRight: 8, color: '#1a3c8f' }} />Phương thức thanh toán</Title>
                                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{paymentLabel}</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text type="secondary">Tạm tính</Text>
                                        <Text strong>{totalPrice.toLocaleString('vi-VN')}₫</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text type="secondary">Phí vận chuyển</Text>
                                        <Text strong>{shippingFee.toLocaleString('vi-VN')}₫</Text>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text type="secondary">Giảm giá</Text>
                                            <Text strong style={{ color: '#10b981' }}>-{totalDiscount.toLocaleString('vi-VN')}₫</Text>
                                        </div>
                                    )}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong>Tổng cộng</Text>
                                        <Title level={4} style={{ margin: 0, color: '#ff4500' }}>{finalPrice.toLocaleString('vi-VN')}₫</Title>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        
                    </div>
                    
                    <div style={{ padding: '0 24px 24px 24px', display: 'flex', gap: 16, justifyContent: 'center' }}>
                        <Link to="/">
                            <Button size="large" style={{ borderRadius: 8, padding: '0 32px' }}>Tiếp tục mua hàng</Button>
                        </Link>
                        <Link to="/profile/orders">
                            <Button type="primary" size="large" style={{ borderRadius: 8, padding: '0 32px', background: '#1a3c8f' }}>Xem đơn hàng của tôi</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}

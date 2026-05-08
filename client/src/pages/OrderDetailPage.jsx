import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Typography,
    Button,
    Card,
    Row,
    Col,
    Divider,
    Skeleton,
    Tag,
    Steps,
    Modal,
    Input,
    message,
    Rate,
    Upload,
    Select,
} from 'antd';
import {
    ShoppingOutlined,
    EnvironmentOutlined,
    CreditCardOutlined,
    CheckCircleFilled,
    ClockCircleOutlined,
    CarOutlined,
    CloseCircleOutlined,
    ArrowLeftOutlined,
    ExclamationCircleOutlined,
    StarOutlined,
    UploadOutlined,
    RestOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { getOrderById, cancelOrder, confirmReceived } from '../api/apiOrder';
import { createReview } from '../api/apiReview';
import { createReturnRequest } from '../api/apiReturn';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusSteps = ['pending', 'confirmed', 'shipping', 'delivered', 'received'];
const statusLabel = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    received: 'Đã nhận',
    cancelled: 'Đã huỷ',
    return_requested: 'Yêu cầu trả',
    returned: 'Đã trả hàng',
};
const statusColor = {
    pending: 'gold',
    confirmed: 'blue',
    shipping: 'cyan',
    delivered: 'green',
    received: 'green',
    cancelled: 'red',
    return_requested: 'orange',
    returned: 'purple',
};

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cancel modal
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    // Review modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewItem, setReviewItem] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewFileList, setReviewFileList] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    // Return modal
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnReason, setReturnReason] = useState('Hàng lỗi / hỏng');
    const [returnDescription, setReturnDescription] = useState('');
    const [returnFileList, setReturnFileList] = useState([]);
    const [submittingReturn, setSubmittingReturn] = useState(false);

    const fetchOrder = async () => {
        try {
            const res = await getOrderById(id);
            setOrder(res.data?.metadata || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            message.error('Vui lòng nhập lý do huỷ đơn');
            return;
        }
        setCancelling(true);
        try {
            await cancelOrder(id, { reason: cancelReason });
            message.success('Huỷ đơn hàng thành công');
            setCancelModalOpen(false);
            setCancelReason('');
            fetchOrder();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi khi huỷ đơn');
        } finally {
            setCancelling(false);
        }
    };

    const handleConfirmReceived = () => {
        Modal.confirm({
            title: 'Xác nhận đã nhận hàng?',
            content: 'Bạn xác nhận đã nhận được đơn hàng này. Hành động này không thể hoàn tác.',
            okText: 'Đã nhận hàng',
            cancelText: 'Huỷ',
            onOk: async () => {
                try {
                    await confirmReceived(id);
                    message.success('Xác nhận nhận hàng thành công!');
                    fetchOrder();
                } catch (err) {
                    message.error(err.response?.data?.message || 'Lỗi');
                }
            },
        });
    };

    const openCreateReviewModal = (item) => {
        setReviewItem(item);
        setReviewRating(5);
        setReviewComment('');
        setReviewFileList([]);
        setReviewModalOpen(true);
    };

    const closeReviewModal = () => {
        setReviewModalOpen(false);
        setReviewItem(null);
        setReviewFileList([]);
    };

    const handleSubmitReview = async () => {
        if (!reviewComment.trim()) {
            message.error('Vui lòng nhập nhận xét');
            return;
        }
        setSubmittingReview(true);
        try {
            const formData = new FormData();
            formData.append('rating', reviewRating);
            formData.append('content', reviewComment);
            reviewFileList.forEach((f) => {
                if (f.originFileObj) formData.append('images', f.originFileObj);
            });

            formData.append('productId', reviewItem.product);
            formData.append('orderId', order._id);
            await createReview(formData);
            message.success('Đánh giá thành công!');

            closeReviewModal();
            fetchOrder();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi khi gửi đánh giá');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleSubmitReturn = async () => {
        if (!returnDescription.trim()) {
            message.error('Vui lòng nhập mô tả chi tiết');
            return;
        }
        if (returnFileList.length === 0) {
            message.error('Vui lòng cung cấp ít nhất 1 hình ảnh làm bằng chứng');
            return;
        }

        setSubmittingReturn(true);
        try {
            const formData = new FormData();
            formData.append('orderId', order._id);
            formData.append('reason', returnReason);
            formData.append('description', returnDescription);

            returnFileList.forEach((f) => {
                if (f.originFileObj) {
                    formData.append('images', f.originFileObj);
                }
            });

            await createReturnRequest(formData);
            message.success('Gửi yêu cầu hoàn trả thành công! Vui lòng chờ người bán phản hồi.');
            setReturnModalOpen(false);
            setReturnReason('Hàng lỗi / hỏng');
            setReturnDescription('');
            setReturnFileList([]);
            fetchOrder();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
        } finally {
            setSubmittingReturn(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', padding: '32px 16px', background: '#f0f2f5' }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <Skeleton active paragraph={{ rows: 12 }} />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div
                style={{
                    minHeight: '80vh',
                    padding: '32px 16px',
                    background: '#f0f2f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Card style={{ textAlign: 'center', borderRadius: 12, padding: 32 }}>
                    <Title level={4}>Không tìm thấy đơn hàng</Title>
                    <Link to="/profile">
                        <Button type="primary" style={{ borderRadius: 8 }}>
                            Quay lại
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const { items = [], shippingInfo = {}, paymentMethod, totalPrice = 0, shippingFee = 0, finalPrice = 0 } = order;
    const shopDiscount = (order.shopDiscountAmount || 0) + (order.systemDiscountAmount || 0);
    const currentStep = order.orderStatus === 'cancelled' ? -1 : statusSteps.indexOf(order.orderStatus);
    const isCancelled = order.orderStatus === 'cancelled';
    const canCancel = ['pending'].includes(order.orderStatus);
    const canConfirmReceived = order.orderStatus === 'delivered';
    const canReview = order.orderStatus === 'received';
    const canReturn = order.orderStatus === 'delivered' || order.orderStatus === 'received'; // Theo logic BE, nếu đã giao có thể trả

    const paymentLabel = { cod: 'COD', momo: 'MoMo', vnpay: 'VNPAY' }[paymentMethod] || paymentMethod;

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px 16px' }}>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}
                    >
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            onClick={() => navigate('/profile/orders')}
                            style={{ fontWeight: 600, color: '#1a3c8f' }}
                        >
                            Quay lại đơn hàng
                        </Button>
                        <Tag
                            color={statusColor[order.orderStatus]}
                            style={{ fontSize: '0.85rem', padding: '4px 12px' }}
                        >
                            {statusLabel[order.orderStatus]}
                        </Tag>
                    </div>
                </motion.div>

                {/* Order Progress */}
                {!isCancelled && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #e8ecf3' }}>
                            <Title level={5} style={{ marginBottom: 20 }}>
                                Trạng thái đơn hàng
                            </Title>
                            <Steps
                                current={currentStep}
                                size="small"
                                items={[
                                    { title: 'Chờ xác nhận', icon: <ClockCircleOutlined /> },
                                    { title: 'Đã xác nhận', icon: <CheckCircleFilled /> },
                                    { title: 'Đang giao', icon: <CarOutlined /> },
                                    { title: 'Đã giao', icon: <EnvironmentOutlined /> },
                                    { title: 'Hoàn thành', icon: <CheckCircleFilled /> },
                                ]}
                            />
                        </Card>
                    </motion.div>
                )}

                {isCancelled && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card
                            style={{
                                borderRadius: 12,
                                marginBottom: 16,
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <CloseCircleOutlined style={{ fontSize: 24, color: '#ef4444' }} />
                                <div>
                                    <Text strong style={{ color: '#dc2626' }}>
                                        Đơn hàng đã bị huỷ
                                    </Text>
                                    {order.cancelReason && (
                                        <Text type="secondary" style={{ display: 'block' }}>
                                            Lý do: {order.cancelReason}
                                        </Text>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Order Info + Shipping */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                        <Col xs={24} md={12}>
                            <Card style={{ borderRadius: 12, border: '1px solid #e8ecf3', height: '100%' }}>
                                <Title level={5} style={{ marginBottom: 12 }}>
                                    <EnvironmentOutlined style={{ marginRight: 8, color: '#1a3c8f' }} />
                                    Thông tin giao hàng
                                </Title>
                                <div style={{ lineHeight: 2 }}>
                                    <Text strong style={{ display: 'block' }}>
                                        {shippingInfo.fullName}
                                    </Text>
                                    <Text type="secondary" style={{ display: 'block' }}>
                                        {shippingInfo.phone}
                                    </Text>
                                    <Text type="secondary" style={{ display: 'block' }}>
                                        {shippingInfo.address}
                                    </Text>
                                </div>
                                {order.ghnOrderCode && (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: '8px 12px',
                                            background: '#f0fdf4',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <Text style={{ fontSize: '0.8rem', color: '#16a34a' }}>
                                            Mã vận đơn GHN: <Text strong>{order.ghnOrderCode}</Text>
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card style={{ borderRadius: 12, border: '1px solid #e8ecf3', height: '100%' }}>
                                <Title level={5} style={{ marginBottom: 12 }}>
                                    <CreditCardOutlined style={{ marginRight: 8, color: '#1a3c8f' }} />
                                    Thanh toán
                                </Title>
                                <div style={{ lineHeight: 2 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">Phương thức</Text>
                                        <Tag>{paymentLabel}</Tag>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">Trạng thái</Text>
                                        <Tag color={order.paymentStatus === 'paid' ? 'green' : 'gold'}>
                                            {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </Tag>
                                    </div>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">Tạm tính</Text>
                                        <Text>{totalPrice.toLocaleString('vi-VN')}₫</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">Phí ship</Text>
                                        <Text>{shippingFee.toLocaleString('vi-VN')}₫</Text>
                                    </div>
                                    {shopDiscount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text type="secondary">Giảm giá</Text>
                                            <Text style={{ color: '#10b981' }}>
                                                -{shopDiscount.toLocaleString('vi-VN')}₫
                                            </Text>
                                        </div>
                                    )}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong>Tổng cộng</Text>
                                        <Text strong style={{ color: '#ff4500', fontSize: '1.1rem' }}>
                                            {finalPrice.toLocaleString('vi-VN')}₫
                                        </Text>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </motion.div>

                {/* Items */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #e8ecf3' }}>
                        <Title level={5} style={{ marginBottom: 16 }}>
                            <ShoppingOutlined style={{ marginRight: 8 }} />
                            Sản phẩm ({items.length})
                        </Title>
                        {items.map((item, idx) => (
                            <div key={idx}>
                                <div style={{ display: 'flex', gap: 16, padding: '12px 0' }}>
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        style={{
                                            width: 72,
                                            height: 72,
                                            objectFit: 'contain',
                                            borderRadius: 8,
                                            border: '1px solid #f0f2f5',
                                            background: '#fff',
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <Text strong style={{ display: 'block', marginBottom: 4 }}>
                                            {item.name}
                                        </Text>
                                        {item.variantLabel && (
                                            <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                                                Phân loại: {item.variantLabel}
                                            </Text>
                                        )}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: 8,
                                            }}
                                        >
                                            <div>
                                                <Text strong style={{ color: '#ff4500' }}>
                                                    {item.price?.toLocaleString('vi-VN')}₫
                                                </Text>
                                                <Text type="secondary" style={{ marginLeft: 8 }}>
                                                    x{item.quantity}
                                                </Text>
                                            </div>
                                            {canReview &&
                                                (item.isReviewed ? (
                                                    <Link to={item.slug ? `/product/${item.slug}?tab=reviews` : '#'}>
                                                        <Button
                                                            size="small"
                                                            icon={<EyeOutlined />}
                                                            style={{ borderColor: '#10b981', color: '#10b981' }}
                                                        >
                                                            Xem đánh giá
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        icon={<StarOutlined />}
                                                        onClick={() => openCreateReviewModal(item)}
                                                        style={{ borderColor: '#faad14', color: '#faad14' }}
                                                    >
                                                        Đánh giá
                                                    </Button>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                                {idx < items.length - 1 && <Divider style={{ margin: 0 }} />}
                            </div>
                        ))}
                    </Card>
                </motion.div>

                {/* Order meta */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Card style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #e8ecf3' }}>
                        <Row gutter={[16, 8]}>
                            <Col xs={12}>
                                <Text type="secondary">Mã đơn hàng</Text>
                            </Col>
                            <Col xs={12} style={{ textAlign: 'right' }}>
                                <Text strong style={{ color: '#1a3c8f' }}>
                                    #{order.orderCode}
                                </Text>
                            </Col>
                            <Col xs={12}>
                                <Text type="secondary">Ngày đặt</Text>
                            </Col>
                            <Col xs={12} style={{ textAlign: 'right' }}>
                                <Text>{dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                            </Col>
                            {order.note && (
                                <>
                                    <Col xs={12}>
                                        <Text type="secondary">Ghi chú</Text>
                                    </Col>
                                    <Col xs={12} style={{ textAlign: 'right' }}>
                                        <Text>{order.note}</Text>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Card>
                </motion.div>

                {/* Action Buttons */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {canCancel && (
                            <Button
                                danger
                                size="large"
                                onClick={() => setCancelModalOpen(true)}
                                style={{ borderRadius: 8 }}
                            >
                                Huỷ đơn hàng
                            </Button>
                        )}
                        {canReturn && (
                            <Button
                                size="large"
                                onClick={() => setReturnModalOpen(true)}
                                style={{ borderRadius: 8, borderColor: '#f97316', color: '#f97316' }}
                            >
                                Trả hàng / Hoàn tiền
                            </Button>
                        )}
                        {canConfirmReceived && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleConfirmReceived}
                                style={{ borderRadius: 8, background: '#10b981' }}
                            >
                                Đã nhận hàng
                            </Button>
                        )}
                        <Link to="/">
                            <Button size="large" style={{ borderRadius: 8 }}>
                                Tiếp tục mua hàng
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Cancel Modal */}
            <Modal
                title={
                    <>
                        <ExclamationCircleOutlined style={{ color: '#ff4500', marginRight: 8 }} />
                        Huỷ đơn hàng
                    </>
                }
                open={cancelModalOpen}
                onCancel={() => setCancelModalOpen(false)}
                onOk={handleCancel}
                confirmLoading={cancelling}
                okText="Xác nhận huỷ"
                okButtonProps={{ danger: true }}
                cancelText="Đóng"
            >
                <div style={{ marginTop: 16 }}>
                    <Text style={{ display: 'block', marginBottom: 8 }}>
                        Vui lòng cho chúng tôi biết lý do bạn muốn huỷ:
                    </Text>
                    <TextArea
                        rows={3}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Ví dụ: Đặt nhầm, muốn đổi địa chỉ..."
                        maxLength={500}
                    />
                </div>
            </Modal>

            {/* Review Modal */}
            <Modal
                title="⭐ Đánh giá sản phẩm"
                open={reviewModalOpen}
                onCancel={closeReviewModal}
                onOk={handleSubmitReview}
                confirmLoading={submittingReview}
                okText="Gửi đánh giá"
                cancelText="Huỷ"
            >
                {reviewItem && (
                    <div style={{ marginTop: 16 }}>
                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                marginBottom: 16,
                                padding: 12,
                                background: '#f8fafc',
                                borderRadius: 8,
                            }}
                        >
                            <img
                                src={reviewItem.image}
                                alt={reviewItem.name}
                                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 6 }}
                            />
                            <div>
                                <Text strong>{reviewItem.name}</Text>
                                {reviewItem.variantLabel && (
                                    <Text type="secondary" style={{ display: 'block', fontSize: '0.8rem' }}>
                                        {reviewItem.variantLabel}
                                    </Text>
                                )}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <Text style={{ display: 'block', marginBottom: 8 }}>Bạn cảm thấy sản phẩm thế nào?</Text>
                            <Rate value={reviewRating} onChange={setReviewRating} style={{ fontSize: 32 }} />
                        </div>
                        <TextArea
                            rows={4}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                            maxLength={1000}
                        />

                        <div style={{ marginTop: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Hình ảnh đánh giá (tối đa 5 ảnh)
                            </Text>
                            <Upload
                                listType="picture-card"
                                fileList={reviewFileList}
                                onChange={({ fileList }) => setReviewFileList(fileList)}
                                beforeUpload={() => false}
                                maxCount={5}
                                accept="image/*"
                            >
                                {reviewFileList.length >= 5 ? null : (
                                    <div>
                                        <UploadOutlined />
                                        <div style={{ marginTop: 8, fontSize: 12 }}>Tải ảnh</div>
                                    </div>
                                )}
                            </Upload>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Return Modal */}
            <Modal
                title={
                    <>
                        <RestOutlined style={{ color: '#f97316', marginRight: 8 }} /> Yêu cầu Trả hàng / Hoàn tiền
                    </>
                }
                open={returnModalOpen}
                onCancel={() => !submittingReturn && setReturnModalOpen(false)}
                onOk={handleSubmitReturn}
                confirmLoading={submittingReturn}
                okText="Gửi yêu cầu"
                cancelText="Huỷ"
                okButtonProps={{ style: { background: '#f97316', borderColor: '#f97316' } }}
            >
                <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Hệ thống chỉ hỗ trợ hoàn trả sản phẩm theo đúng quy định. Việc gửi yêu cầu ảo có thể khiến tài
                        khoản của bạn bị xem xét.
                    </Text>

                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Lý do trả hàng <span style={{ color: 'red' }}>*</span>
                    </Text>
                    <Select
                        value={returnReason}
                        onChange={setReturnReason}
                        style={{ width: '100%', marginBottom: 16 }}
                        options={[
                            { value: 'Hàng lỗi / hỏng', label: 'Sản phẩm lỗi, hỏng, không hoạt động' },
                            { value: 'Giao sai mẫu mã', label: 'Giao sai sản phẩm, sai màu/size' },
                            { value: 'Thiếu hàng / phụ kiện', label: 'Đơn hàng giao thiếu sản phẩm/phụ kiện' },
                            { value: 'Không đúng mô tả', label: 'Sản phẩm khác biệt quá nhiều so với mô tả' },
                            { value: 'Hàng giả / nhái', label: 'Nghi ngờ hàng nhái, kém chất lượng' },
                        ]}
                    />

                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Mô tả chi tiết <span style={{ color: 'red' }}>*</span>
                    </Text>
                    <TextArea
                        rows={3}
                        value={returnDescription}
                        onChange={(e) => setReturnDescription(e.target.value)}
                        placeholder="Hãy mô tả rõ hơn về tình trạng sản phẩm..."
                        maxLength={500}
                        style={{ marginBottom: 16 }}
                    />

                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Hình ảnh bằng chứng <span style={{ color: 'red' }}>*</span>
                    </Text>
                    <Upload
                        listType="picture-card"
                        fileList={returnFileList}
                        onChange={({ fileList }) => setReturnFileList(fileList)}
                        beforeUpload={() => false}
                        maxCount={5}
                        accept="image/*"
                    >
                        {returnFileList.length >= 5 ? null : (
                            <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8, fontSize: 12 }}>Tải ảnh</div>
                            </div>
                        )}
                    </Upload>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Tối đa 5 hình ảnh minh họa tình trạng sản phẩm.
                    </Text>
                </div>
            </Modal>
        </div>
    );
}

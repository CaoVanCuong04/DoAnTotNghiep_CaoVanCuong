import { useState, useEffect } from 'react';
import {
    Typography,
    Table,
    Tag,
    Button,
    Input,
    Select,
    Modal,
    message,
    Card,
    Row,
    Col,
    Divider,
    Avatar,
    Descriptions,
    Image,
    Badge,
    Tooltip,
} from 'antd';
import { motion } from 'framer-motion';
import {
    SearchOutlined,
    EditOutlined,
    EyeOutlined,
    UserOutlined,
    EnvironmentOutlined,
    CreditCardOutlined,
    ShoppingOutlined,
    PhoneOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { orderApi } from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusMap = {
    pending: { label: 'Chờ xác nhận', color: 'warning' },
    confirmed: { label: 'Đã xác nhận', color: 'processing' },
    shipping: { label: 'Đang giao', color: 'purple' },
    delivered: { label: 'Đã giao', color: 'cyan' },
    received: { label: 'Hoàn thành', color: 'success' },
    cancelled: { label: 'Đã hủy', color: 'error' },
    return_requested: { label: 'Yêu cầu trả', color: 'orange' },
    returned: { label: 'Đã trả hàng', color: 'default' },
};

const paymentStatusMap = {
    pending: { label: 'Chưa TT', color: 'gold' },
    paid: { label: 'Đã TT', color: 'green' },
    failed: { label: 'Thất bại', color: 'red' },
    refunded: { label: 'Hoàn tiền', color: 'blue' },
};

const statusOptions = Object.entries(statusMap).map(([key, val]) => ({
    value: key,
    label: val.label,
}));

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Status update modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [updating, setUpdating] = useState(false);

    // Detail drawer
    const [detailOrder, setDetailOrder] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await orderApi.adminGetAllOrders({ limit: 100 });
            const data = res.data?.metadata || res.data;
            setOrders(Array.isArray(data) ? data : data?.orders || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openStatusModal = (order) => {
        setSelectedOrder(order);
        setNewStatus(order.orderStatus);
        setModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        setUpdating(true);
        try {
            await orderApi.adminUpdateOrderStatus(selectedOrder._id, { orderStatus: newStatus });
            message.success('Cập nhật trạng thái thành công!');
            setModalOpen(false);
            fetchOrders();
            // Also refresh detail if open
            if (detailOrder && detailOrder._id === selectedOrder._id) {
                fetchOrderDetail(selectedOrder._id);
            }
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi cập nhật');
        } finally {
            setUpdating(false);
        }
    };

    const fetchOrderDetail = async (id) => {
        setLoadingDetail(true);
        try {
            const res = await orderApi.adminGetOrderById(id);
            setDetailOrder(res.data?.metadata || res.data);
        } catch (err) {
            message.error('Không thể tải chi tiết đơn hàng');
        } finally {
            setLoadingDetail(false);
        }
    };

    const openDetail = (order) => {
        setDetailModalOpen(true);
        fetchOrderDetail(order._id);
    };

    const filtered = orders.filter((o) => {
        const matchSearch =
            o._id?.toLowerCase().includes(search.toLowerCase()) ||
            o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.email?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || o.orderStatus === filterStatus;
        return matchSearch && matchStatus;
    });

    // Stats
    const stats = {
        total: orders.length,
        pending: orders.filter((o) => o.orderStatus === 'pending').length,
        shipping: orders.filter((o) => o.orderStatus === 'shipping').length,
        completed: orders.filter((o) => ['delivered', 'received'].includes(o.orderStatus)).length,
        cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
    };

    const columns = [
        {
            title: 'Đơn hàng',
            key: 'order',
            width: 280,
            render: (_, record) => (
                <div>
                    <Text strong style={{ color: '#7c3aed', display: 'block' }}>
                        #{record.orderCode || record._id?.slice(-8).toUpperCase()}
                    </Text>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        {(record.items || []).slice(0, 2).map((item, idx) => (
                            <Tooltip key={idx} title={`${item.name} x${item.quantity}`}>
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        objectFit: 'contain',
                                        borderRadius: 4,
                                        border: '1px solid #f0f2f5',
                                    }}
                                />
                            </Tooltip>
                        ))}
                        {(record.items || []).length > 2 && (
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 4,
                                    background: '#f4f6fb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    fontWeight: 600,
                                }}
                            >
                                +{record.items.length - 2}
                            </div>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginTop: 4 }}>
                        {record.items?.length || 0} sản phẩm
                    </Text>
                </div>
            ),
        },
        {
            title: 'Khách hàng',
            key: 'user',
            width: 180,
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar
                        size="small"
                        src={record.user?.avatar}
                        icon={<UserOutlined />}
                        style={{ background: '#e0e7ff' }}
                    />
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '0.85rem' }}>
                            {record.user?.fullName || 'N/A'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                            {record.user?.email}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 130,
            align: 'center',
            render: (_, record) => (
                <div>
                    <Tag color="purple" style={{ marginBottom: 4 }}>
                        {(record.paymentMethod || 'cod').toUpperCase()}
                    </Tag>
                    <br />
                    <Tag color={paymentStatusMap[record.paymentStatus]?.color || 'gold'} style={{ fontSize: '0.7rem' }}>
                        {paymentStatusMap[record.paymentStatus]?.label || 'Chưa TT'}
                    </Tag>
                </div>
            ),
        },
        {
            title: 'Tổng tiền',
            key: 'total',
            width: 140,
            align: 'right',
            sorter: (a, b) => (a.finalPrice || 0) - (b.finalPrice || 0),
            render: (_, record) => (
                <div>
                    <Text strong style={{ color: '#1a3c8f', fontSize: '0.95rem' }}>
                        {(record.finalPrice || 0).toLocaleString('vi-VN')}₫
                    </Text>
                    {record.shippingFee > 0 && (
                        <Text type="secondary" style={{ display: 'block', fontSize: '0.7rem' }}>
                            Ship: {record.shippingFee.toLocaleString('vi-VN')}₫
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 130,
            align: 'center',
            filters: Object.entries(statusMap).map(([k, v]) => ({ text: v.label, value: k })),
            onFilter: (value, record) => record.orderStatus === value,
            render: (_, record) => {
                const st = statusMap[record.orderStatus] || statusMap.pending;
                return <Tag color={st.color}>{st.label}</Tag>;
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'date',
            width: 120,
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            defaultSortOrder: 'descend',
            render: (date) => (
                <div>
                    <Text style={{ display: 'block', fontSize: '0.85rem' }}>{dayjs(date).format('DD/MM/YYYY')}</Text>
                    <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                        {dayjs(date).format('HH:mm')}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: '#3b82f6' }} />}
                            onClick={() => openDetail(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Cập nhật trạng thái">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: '#7c3aed' }} />}
                            onClick={() => openStatusModal(record)}
                        />
                    </Tooltip>
                </div>
            ),
        },
    ];

    return (
        <div>
            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {[
                    { label: 'Tổng đơn', value: stats.total, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Chờ xử lý', value: stats.pending, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Đang giao', value: stats.shipping, color: '#8b5cf6', bg: '#f5f3ff' },
                    { label: 'Hoàn thành', value: stats.completed, color: '#10b981', bg: '#ecfdf5' },
                    { label: 'Đã hủy', value: stats.cancelled, color: '#ef4444', bg: '#fef2f2' },
                ].map((item, idx) => (
                    <Col flex="1" style={{ minWidth: 140 }} key={idx}>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card style={{ borderRadius: 12, border: '1px solid #e8ecf3', textAlign: 'center' }}>
                                <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>
                                    {item.label}
                                </Text>
                                <Title level={3} style={{ margin: '4px 0 0', color: item.color }}>
                                    {item.value}
                                </Title>
                            </Card>
                        </motion.div>
                    </Col>
                ))}
            </Row>

            {/* Filter Bar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        Quản lý đơn hàng
                    </Title>
                    <Text type="secondary">{filtered.length} đơn hàng</Text>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        style={{ width: 180 }}
                        size="large"
                        options={[{ value: 'all', label: 'Tất cả trạng thái' }, ...statusOptions]}
                    />
                    <Input
                        placeholder="Tìm mã đơn, tên KH..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 240, borderRadius: 8 }}
                        size="large"
                        allowClear
                    />
                </div>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} đơn` }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                    scroll={{ x: 1000 }}
                />
            </motion.div>

            {/* Update Status Modal */}
            <Modal
                title="Cập nhật trạng thái đơn hàng"
                open={modalOpen}
                onOk={handleUpdateStatus}
                onCancel={() => setModalOpen(false)}
                okText="Cập nhật"
                cancelText="Hủy"
                confirmLoading={updating}
            >
                {selectedOrder && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                            <Text type="secondary">Đơn hàng: </Text>
                            <Text strong style={{ color: '#7c3aed' }}>
                                #{selectedOrder.orderCode || selectedOrder._id?.slice(-8).toUpperCase()}
                            </Text>
                            <br />
                            <Text type="secondary">Khách hàng: </Text>
                            <Text strong>{selectedOrder.user?.fullName}</Text>
                        </div>
                        <Text style={{ display: 'block', marginBottom: 8 }}>Chọn trạng thái mới:</Text>
                        <Select
                            value={newStatus}
                            onChange={setNewStatus}
                            options={statusOptions}
                            style={{ width: '100%' }}
                            size="large"
                        />
                    </div>
                )}
            </Modal>

            {/* Order Detail Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShoppingOutlined style={{ color: '#7c3aed' }} />
                        <span>Chi tiết đơn hàng</span>
                        {detailOrder && (
                            <Tag color={statusMap[detailOrder.orderStatus]?.color}>
                                {statusMap[detailOrder.orderStatus]?.label}
                            </Tag>
                        )}
                    </div>
                }
                open={detailModalOpen}
                onCancel={() => {
                    setDetailModalOpen(false);
                    setDetailOrder(null);
                }}
                footer={
                    detailOrder ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setDetailModalOpen(false);
                                    openStatusModal(detailOrder);
                                }}
                            >
                                <EditOutlined /> Cập nhật trạng thái
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => setDetailModalOpen(false)}
                                style={{ background: '#7c3aed' }}
                            >
                                Đóng
                            </Button>
                        </div>
                    ) : null
                }
                width={720}
                loading={loadingDetail}
            >
                {detailOrder && (
                    <div>
                        {/* Order Code & Date */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 16,
                                padding: '12px 16px',
                                background: '#f8fafc',
                                borderRadius: 8,
                            }}
                        >
                            <div>
                                <Text type="secondary">Mã đơn: </Text>
                                <Text strong style={{ color: '#7c3aed', fontSize: '1rem' }}>
                                    #{detailOrder.orderCode}
                                </Text>
                            </div>
                            <Text type="secondary">{dayjs(detailOrder.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                        </div>

                        <Row gutter={[16, 16]}>
                            {/* Customer Info */}
                            <Col xs={24} md={12}>
                                <Card
                                    size="small"
                                    title={
                                        <>
                                            <UserOutlined style={{ marginRight: 6 }} />
                                            Khách hàng
                                        </>
                                    }
                                    style={{ borderRadius: 10, height: '100%' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <Avatar src={detailOrder.user?.avatar} icon={<UserOutlined />} />
                                        <div>
                                            <Text strong>{detailOrder.user?.fullName}</Text>
                                            <Text type="secondary" style={{ display: 'block', fontSize: '0.8rem' }}>
                                                {detailOrder.user?.email}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>

                            {/* Shipping Info */}
                            <Col xs={24} md={12}>
                                <Card
                                    size="small"
                                    title={
                                        <>
                                            <EnvironmentOutlined style={{ marginRight: 6 }} />
                                            Giao hàng
                                        </>
                                    }
                                    style={{ borderRadius: 10, height: '100%' }}
                                >
                                    <Text strong style={{ display: 'block' }}>
                                        {detailOrder.shippingInfo?.fullName}
                                    </Text>
                                    <Text type="secondary" style={{ display: 'block' }}>
                                        <PhoneOutlined style={{ marginRight: 4 }} />
                                        {detailOrder.shippingInfo?.phone}
                                    </Text>
                                    <Text type="secondary" style={{ display: 'block', fontSize: '0.8rem' }}>
                                        {detailOrder.shippingInfo?.address}
                                    </Text>
                                    {detailOrder.ghnOrderCode && (
                                        <Tag color="green" style={{ marginTop: 6 }}>
                                            GHN: {detailOrder.ghnOrderCode}
                                        </Tag>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        {/* Products */}
                        <Divider style={{ margin: '16px 0 12px' }}>
                            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                                Sản phẩm ({detailOrder.items?.length || 0})
                            </Text>
                        </Divider>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(detailOrder.items || []).map((item, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        gap: 12,
                                        padding: '10px 12px',
                                        background: '#f8fafc',
                                        borderRadius: 8,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={56}
                                        height={56}
                                        style={{ objectFit: 'contain', borderRadius: 6, border: '1px solid #e8ecf3' }}
                                        preview={{ mask: <EyeOutlined /> }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <Text strong style={{ display: 'block', fontSize: '0.9rem' }}>
                                            {item.name}
                                        </Text>
                                        {item.variantLabel && (
                                            <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                                                Phân loại: {item.variantLabel}
                                            </Text>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                            <Text style={{ color: '#7c3aed', fontWeight: 600 }}>
                                                {item.price?.toLocaleString('vi-VN')}₫ × {item.quantity}
                                            </Text>
                                            <Text strong>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</Text>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Summary */}
                        <Divider style={{ margin: '16px 0 12px' }}>
                            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                                Thanh toán
                            </Text>
                        </Divider>

                        <Card size="small" style={{ borderRadius: 10 }}>
                            <Row gutter={[8, 6]}>
                                <Col span={12}>
                                    <Text type="secondary">Phương thức</Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Tag color="purple">{(detailOrder.paymentMethod || 'cod').toUpperCase()}</Tag>
                                    <Tag color={paymentStatusMap[detailOrder.paymentStatus]?.color}>
                                        {paymentStatusMap[detailOrder.paymentStatus]?.label}
                                    </Tag>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">Tạm tính</Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text>{(detailOrder.totalPrice || 0).toLocaleString('vi-VN')}₫</Text>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">Phí vận chuyển</Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text>{(detailOrder.shippingFee || 0).toLocaleString('vi-VN')}₫</Text>
                                </Col>
                                {(detailOrder.shopDiscountAmount > 0 || detailOrder.systemDiscountAmount > 0) && (
                                    <>
                                        <Col span={12}>
                                            <Text type="secondary">Giảm giá</Text>
                                        </Col>
                                        <Col span={12} style={{ textAlign: 'right' }}>
                                            <Text style={{ color: '#10b981' }}>
                                                -
                                                {(
                                                    (detailOrder.shopDiscountAmount || 0) +
                                                    (detailOrder.systemDiscountAmount || 0)
                                                ).toLocaleString('vi-VN')}
                                                ₫
                                            </Text>
                                        </Col>
                                    </>
                                )}
                                <Col span={24}>
                                    <Divider style={{ margin: '6px 0' }} />
                                </Col>
                                <Col span={12}>
                                    <Text strong style={{ fontSize: '1rem' }}>
                                        Tổng cộng
                                    </Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text strong style={{ fontSize: '1.1rem', color: '#7c3aed' }}>
                                        {(detailOrder.finalPrice || 0).toLocaleString('vi-VN')}₫
                                    </Text>
                                </Col>
                            </Row>
                        </Card>

                        {/* Note */}
                        {detailOrder.note && (
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: '10px 14px',
                                    background: '#fffbeb',
                                    borderRadius: 8,
                                    border: '1px dashed #fbbf24',
                                }}
                            >
                                <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                                    Ghi chú:{' '}
                                </Text>
                                <Text>{detailOrder.note}</Text>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

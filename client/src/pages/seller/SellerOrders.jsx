import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Input, Select, message, Button, Collapse, Steps, Space } from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { sellerGetMyOrders, sellerUpdateItemStatus } from '../../api/apiSeller';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const statusColors = {
    pending: 'orange',
    confirmed: 'blue',
    shipping: 'purple',
    delivered: 'green',
    cancelled: 'red',
    returned: 'red'
};

const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    returned: 'Trả hàng'
};

export default function SellerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { search, status: statusFilter };
            const res = await sellerGetMyOrders(params);
            const data = res.data?.metadata?.orders || res.data?.orders || [];
            setOrders(data);
        } catch (err) {
            message.error('Lỗi lấy danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => setSearch(e.target.value);
    
    useEffect(() => {
        const timer = setTimeout(() => { fetchOrders(); }, 500);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateStatus = async (orderId, itemId, newStatus) => {
        try {
            await sellerUpdateItemStatus(orderId, itemId, { status: newStatus });
            message.success('Cập nhật trạng thái thành công!');
            fetchOrders();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderCode',
            key: 'orderCode',
            render: (text) => <Text strong style={{ color: '#1e40af' }}>#{text}</Text>
        },
        {
            title: 'Khách hàng',
            key: 'user',
            render: (_, record) => {
                const info = record.shippingInfo || {};
                return (
                    <div>
                        <Text strong style={{ display: 'block' }}>{info.fullName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{info.phone}</Text>
                    </div>
                );
            }
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Tag>{record.paymentMethod?.toUpperCase()}</Tag>
                    <Tag color={record.paymentStatus === 'paid' ? 'green' : 'orange'}>
                        {record.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </Tag>
                </div>
            )
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <Text>{new Date(date).toLocaleString('vi-VN')}</Text>
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Quản lý Đơn hàng</Title>
                    <Text type="secondary">Xử lý các sản phẩm khách đã đặt từ shop của bạn</Text>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Select allowClear placeholder="Lọc trạng thái" style={{ width: 150 }} onChange={setStatusFilter}>
                        {Object.keys(statusLabels).map(k => (
                            <Option key={k} value={k}>{statusLabels[k]}</Option>
                        ))}
                    </Select>
                    <Input
                        placeholder="Tìm mã đơn, tên, SĐT..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        value={search}
                        onChange={handleSearch}
                        style={{ width: 250, borderRadius: 8 }}
                    />
                    <Button icon={<SyncOutlined />} onClick={fetchOrders}>Làm mới</Button>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={orders}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>Danh sách sản phẩm thuộc chi nhánh bạn:</Text>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {record.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                <img src={item.image} alt={item.name} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                                                <div>
                                                    <Text strong style={{ display: 'block' }}>{item.name}</Text>
                                                    <Text type="secondary">SL: {item.quantity} | Giá: {item.price?.toLocaleString('vi-VN')}₫</Text>
                                                    <div style={{ marginTop: 8 }}>
                                                        <Tag color={statusColors[item.itemStatus]}>{statusLabels[item.itemStatus]}</Tag>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                {['cancelled', 'returned', 'delivered'].includes(item.itemStatus) ? (
                                                    <Text type="secondary" italic>Không thể đổi trạng thái</Text>
                                                ) : (
                                                    <Space>
                                                        <Text strong>Cập nhật:</Text>
                                                        <Select 
                                                            value={item.itemStatus} 
                                                            style={{ width: 140 }}
                                                            onChange={(val) => updateStatus(record._id, item._id, val)}
                                                        >
                                                            <Option value="pending" disabled>Chờ xác nhận</Option>
                                                            <Option value="confirmed" disabled={['confirmed', 'shipping'].includes(item.itemStatus)}>Đã xác nhận</Option>
                                                            <Option value="shipping">Đang giao</Option>
                                                            <Option value="delivered">Đã giao (Hoàn thành)</Option>
                                                        </Select>
                                                    </Space>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ),
                        rowExpandable: (record) => record.items.length > 0,
                    }}
                />
            </motion.div>
        </div>
    );
}

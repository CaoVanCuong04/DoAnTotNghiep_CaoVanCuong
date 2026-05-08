import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Input, Select, Button, message, Space, Avatar, Popconfirm } from 'antd';
import { SearchOutlined, SyncOutlined, ShopOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { adminGetAllStores, adminUpdateStoreStatus } from '../../api/apiStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function StoresPage() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchStores();
    }, [statusFilter]);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const params = { status: statusFilter, search, limit: 50 };
            const res = await adminGetAllStores(params);
            const data = res.data?.metadata?.stores || res.data?.stores || [];
            setStores(data);
        } catch (err) {
            message.error('Lỗi tải danh sách cửa hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => setSearch(e.target.value);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStores();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateStatus = async (id, newStatus) => {
        try {
            await adminUpdateStoreStatus(id, { status: newStatus });
            message.success(`Đã cập nhật trạng thái cửa hàng thành: ${newStatus}`);
            fetchStores(); // Reload
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    };

    const columns = [
        {
            title: 'Cửa hàng',
            key: 'store',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar src={record.logo} shape="square" size={50} icon={<ShopOutlined />} />
                    <div>
                        <Text strong style={{ display: 'block', fontSize: 16 }}>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>ID: {record._id.substring(record._id.length - 6)}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Chủ sở hữu',
            key: 'owner',
            render: (_, record) => (
                <div>
                    <Text strong style={{ display: 'block' }}>{record.owner?.fullName}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.owner?.email}</Text>
                </div>
            )
        },
        {
            title: 'Liên hệ',
            key: 'contact',
            render: (_, record) => (
                <div>
                    <Text style={{ display: 'block' }}>SĐT: {record.phone || 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.address || 'Chưa cung cấp'}</Text>
                </div>
            )
        },
        {
            title: 'Chỉ số',
            key: 'stats',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <div style={{ fontSize: 12 }}>SP: <Text strong>{record.totalProducts}</Text></div>
                    <div style={{ fontSize: 12 }}>Bán: <Text strong>{record.totalSales}</Text></div>
                </div>
            )
        },
        {
            title: 'Trạng thái',
            key: 'status',
            align: 'center',
            render: (_, record) => {
                const map = {
                    pending: { color: 'orange', text: 'Chờ duyệt' },
                    active: { color: 'green', text: 'Hoạt động' },
                    banned: { color: 'red', text: 'Bị khóa' },
                };
                const st = map[record.status] || { color: 'default', text: record.status };
                return <Tag color={st.color}>{st.text}</Tag>;
            }
        },
        {
            title: 'Ngày ĐK',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD/MM/YYYY')}</Text>
        },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' && (
                        <>
                            <Popconfirm title="Chi nhánh này đạt yêu cầu để duyệt bán?" onConfirm={() => updateStatus(record._id, 'active')}>
                                <Button type="primary" size="small" icon={<CheckCircleOutlined />} style={{ background: '#16a34a' }}>Duyệt</Button>
                            </Popconfirm>
                            <Popconfirm title="Từ chối việc mở shop của người này?" onConfirm={() => updateStatus(record._id, 'banned')}>
                                <Button danger size="small">Từ chối</Button>
                            </Popconfirm>
                        </>
                    )}
                    {record.status === 'active' && (
                        <Popconfirm title="Khóa cửa hàng này? Cửa hàng sẽ bị ẩn!" onConfirm={() => updateStatus(record._id, 'banned')}>
                            <Button danger type="dashed" size="small" icon={<StopOutlined />}>Khóa</Button>
                        </Popconfirm>
                    )}
                    {record.status === 'banned' && (
                        <Popconfirm title="Mở khóa cho cửa hàng này hoạt động lại?" onConfirm={() => updateStatus(record._id, 'active')}>
                            <Button type="primary" ghost size="small">Mở khóa</Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Quản lý Gian Hàng (Sellers)</Title>
                    <Text type="secondary">Duyệt hồ sơ đăng ký shop mới hoặc quản lý các shop đang hoạt động</Text>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
                        <Option value="">Tất cả trạng thái</Option>
                        <Option value="pending">Chờ phân duyệt</Option>
                        <Option value="active">Đang hoạt động</Option>
                        <Option value="banned">Bị khóa</Option>
                    </Select>
                    <Input
                        placeholder="Tìm theo tên shop, email..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        value={search}
                        onChange={handleSearchChange}
                        style={{ width: 220, borderRadius: 6 }}
                    />
                    <Button icon={<SyncOutlined />} onClick={fetchStores}>Làm mới</Button>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={stores}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                    style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Typography, Table, Avatar, Tag, Button, Input, Tooltip, message, Popconfirm } from 'antd';
import { motion } from 'framer-motion';
import { SearchOutlined, StopOutlined, CheckCircleOutlined, KeyOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/users/admin/manage/list');
            const data = res.data?.metadata || res.data;
            setUsers(Array.isArray(data) ? data : data?.users || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId, currentIsActive) => {
        try {
            await axiosInstance.patch(`/users/admin/manage/${userId}/status`, { isActive: !currentIsActive });
            message.success(currentIsActive ? 'Đã khóa tài khoản!' : 'Đã mở khóa tài khoản!');
            fetchUsers();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    };

    const handleResetPassword = async (userId) => {
        try {
            await axiosInstance.patch(`/users/admin/manage/${userId}/reset-password`, { newPassword: 'Abc123456@' });
            message.success('Đã reset mật khẩu về: Abc123456@');
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi reset mật khẩu');
        }
    };

    const filtered = users.filter(
        (u) =>
            u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()),
    );

    const columns = [
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar src={record.avatar} style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
                        {record.fullName?.[0] || 'U'}
                    </Avatar>
                    <Text strong>{record.fullName}</Text>
                </div>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text) => <Text type="secondary">{text}</Text>,
        },
        {
            title: 'Vai trò',
            key: 'role',
            render: (_, record) => {
                let color = 'default';
                let label = 'User';
                if (record.role === 'admin') {
                    color = 'volcano';
                    label = 'Admin';
                } else if (record.role === 'seller') {
                    color = 'purple';
                    label = 'Seller';
                } else {
                    color = 'success';
                }
                return <Tag color={color}>{label}</Tag>;
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            align: 'center',
            render: (_, record) => (
                <Tag color={record.isActive === false ? 'error' : 'success'}>
                    {record.isActive === false ? 'Đã khóa' : 'Hoạt động'}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            align: 'right',
            render: (date) => <Text type="secondary">{new Date(date).toLocaleDateString('vi-VN')}</Text>,
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Tooltip title={record.isActive === false ? 'Mở khóa' : 'Khóa tài khoản'}>
                        <Popconfirm
                            title={`Bạn có chắc muốn ${record.isActive === false ? 'mở khóa' : 'khóa'} tài khoản này?`}
                            onConfirm={() => handleToggleStatus(record._id, record.isActive !== false)}
                            okText="Đồng ý"
                            cancelText="Hủy"
                            okButtonProps={{ danger: record.isActive !== false }}
                        >
                            <Button
                                type="text"
                                shape="circle"
                                icon={
                                    record.isActive === false ? (
                                        <CheckCircleOutlined style={{ color: '#22c55e' }} />
                                    ) : (
                                        <StopOutlined style={{ color: '#ef4444' }} />
                                    )
                                }
                            />
                        </Popconfirm>
                    </Tooltip>
                    <Tooltip title="Reset mật khẩu">
                        <Popconfirm
                            title="Xác nhận reset mật khẩu người dùng này?"
                            onConfirm={() => handleResetPassword(record._id)}
                            okText="Đồng ý"
                            cancelText="Hủy"
                        >
                            <Button type="text" shape="circle" icon={<KeyOutlined style={{ color: '#f59e0b' }} />} />
                        </Popconfirm>
                    </Tooltip>
                </div>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        Quản lý người dùng
                    </Title>
                    <Text type="secondary">{users.length} người dùng trong hệ thống</Text>
                </div>
                <Input
                    placeholder="Tìm kiếm..."
                    prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 280, borderRadius: 8 }}
                    size="large"
                />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>
        </div>
    );
}

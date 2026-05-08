import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Input, Select, Button, message, Space, Modal, Form, Popconfirm } from 'antd';
import { SearchOutlined, SyncOutlined, BankOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { adminGetWithdrawals, adminApproveWithdrawal, adminRejectWithdrawal } from '../../api/apiWallet';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal States
    const [actionModal, setActionModal] = useState({ open: false, type: '', record: null });
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchWithdrawals();
    }, [statusFilter]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const params = { status: statusFilter, search, limit: 50 };
            const res = await adminGetWithdrawals(params);
            const data = res.data?.metadata?.withdrawals || res.data?.withdrawals || [];
            setWithdrawals(data);
        } catch (err) {
            message.error('Lỗi tải danh sách yêu cầu rút tiền');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => setSearch(e.target.value);

    useEffect(() => {
        const timer = setTimeout(() => fetchWithdrawals(), 500);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const openModal = (type, record) => {
        setActionModal({ open: true, type, record });
        form.resetFields();
    };

    const handleActionSubmit = async (values) => {
        setSubmitting(true);
        try {
            const id = actionModal.record._id;
            const payload = { adminNote: values.adminNote };

            if (actionModal.type === 'approve') {
                await adminApproveWithdrawal(id, payload);
                message.success('Đã duyệt và đánh dấu lệnh rút tiền thành công!');
            } else {
                await adminRejectWithdrawal(id, payload);
                message.success('Đã từ chối lệnh rút tiền và hoàn tiền ví tạm cho Seller.');
            }
            
            setActionModal({ open: false, type: '', record: null });
            fetchWithdrawals();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Mã GD',
            dataIndex: '_id',
            key: 'id',
            render: (id) => <Text type="secondary" copyable>{id.substring(id.length - 8).toUpperCase()}</Text>
        },
        {
            title: 'Gian Hàng',
            key: 'seller',
            render: (_, record) => (
                <div>
                    <Text strong style={{ display: 'block' }}>{record.seller?.fullName}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.seller?.email}</Text>
                </div>
            )
        },
        {
            title: 'Số Tiền Rút',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => <Text strong style={{ color: '#ea580c', fontSize: 15 }}>{amount?.toLocaleString('vi-VN')}₫</Text>
        },
        {
            title: 'Tài Khoản Nhận',
            key: 'bank',
            render: (_, record) => (
                <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <Text strong style={{ display: 'block', color: '#1e40af' }}>{record.bankName}</Text>
                    <Text style={{ display: 'block' }}>STK: <Text strong copyable>{record.accountNumber}</Text></Text>
                    <Text type="secondary">Tên: {record.accountName}</Text>
                </div>
            )
        },
        {
            title: 'Ngày Yêu Cầu',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
        },
        {
            title: 'Trạng Thái',
            key: 'status',
            align: 'center',
            render: (_, record) => {
                const map = {
                    pending: { color: 'orange', text: 'Chờ duyệt' },
                    completed: { color: 'green', text: 'Đã thanh toán' },
                    rejected: { color: 'red', text: 'Bị từ chối' },
                };
                const st = map[record.status] || { color: 'default', text: record.status };
                return <Tag color={st.color}>{st.text}</Tag>;
            }
        },
        {
            title: 'Hành Động',
            key: 'actions',
            align: 'center',
            render: (_, record) => {
                if (record.status === 'pending') {
                    return (
                        <Space>
                            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => openModal('approve', record)} style={{ background: '#16a34a' }}>
                                Duyệt
                            </Button>
                            <Button danger type="dashed" size="small" icon={<CloseCircleOutlined />} onClick={() => openModal('reject', record)}>
                                Từ chối
                            </Button>
                        </Space>
                    );
                }

                if (record.adminNote) {
                    return <Text type="secondary" italic style={{ fontSize: 12 }}>Note: {record.adminNote}</Text>;
                }

                return <Text type="secondary">-</Text>;
            }
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Duyệt Rút Doanh Thu</Title>
                    <Text type="secondary">Quản lý và thanh toán các khoản tiền Seller (Người bán) yêu cầu rút về.</Text>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
                        <Option value="">Tất cả</Option>
                        <Option value="pending">Chờ thanh toán</Option>
                        <Option value="completed">Đã thanh toán</Option>
                        <Option value="rejected">Bị từ chối</Option>
                    </Select>
                    <Input
                        placeholder="Tìm email, mã GD..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        value={search}
                        onChange={handleSearchChange}
                        style={{ width: 220, borderRadius: 6 }}
                    />
                    <Button icon={<SyncOutlined />} onClick={fetchWithdrawals}>Làm mới</Button>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={withdrawals}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                    style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>

            <Modal
                title={
                    actionModal.type === 'approve' ? 
                    <span style={{ color: '#16a34a' }}><BankOutlined /> Duyệt & Xác nhận Chuyển Khoản</span> :
                    <span style={{ color: '#dc2626' }}><CloseCircleOutlined /> Từ Chối Lệnh Rút Tiền</span>
                }
                open={actionModal.open}
                onCancel={() => !submitting && setActionModal({ open: false, type: '', record: null })}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                okText={actionModal.type === 'approve' ? 'Đã chuyển tiền (Xác nhận)' : 'Từ chối Rút'}
                okButtonProps={{ danger: actionModal.type === 'reject', type: 'primary' }}
                cancelText="Hủy"
            >
                {actionModal.record && (
                    <div style={{ padding: '10px 0' }}>
                        {actionModal.type === 'approve' ? (
                            <div style={{ marginBottom: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 8 }}>
                                <Text strong style={{ display: 'block', color: '#166534' }}>Hãy chắc chắn bạn (Admin) ĐÃ chuyển khoản thành công khoản tiền:</Text>
                                <Title level={3} style={{ color: '#16a34a', margin: '4px 0 0 0' }}>{actionModal.record.amount?.toLocaleString('vi-VN')}₫</Title>
                                <Text style={{ display: 'block', marginTop: 8 }}>Tới STK: <b>{actionModal.record.accountNumber}</b> ({actionModal.record.bankName})</Text>
                            </div>
                        ) : (
                            <div style={{ marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 8 }}>
                                <Text strong style={{ color: '#991b1b' }}>Vì sao bạn lại từ chối giao dịch rút tiền này?</Text>
                                <Text style={{ display: 'block', marginTop: 4, fontSize: 12 }}>Tiền sẽ được cộng hoàn lại vào ví tạm của Seller.</Text>
                            </div>
                        )}

                        <Form form={form} layout="vertical" onFinish={handleActionSubmit}>
                            <Form.Item 
                                name="adminNote" 
                                label={actionModal.type === 'approve' ? "Mã giao dịch / Ghi chú (Tuỳ chọn)" : "Lý do từ chối (Bắt buộc)"}
                                rules={[{ required: actionModal.type === 'reject', message: 'Vui lòng nhập lý do từ chối!' }]}
                            >
                                <TextArea rows={3} placeholder={actionModal.type === 'approve' ? "Nhập mã tham chiếu từ ngân hàng hoặc lưu ý..." : "Ghi rõ lý do tại sao không duyệt lệnh này..."} />
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>
        </div>
    );
}

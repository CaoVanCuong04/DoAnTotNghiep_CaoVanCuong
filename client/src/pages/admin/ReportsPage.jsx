import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, Input, Select, Modal, message, Row, Col, Card, Space, Divider } from 'antd';
import { motion } from 'framer-motion';
import {
    SearchOutlined, EyeOutlined, CheckCircleOutlined,
    CloseCircleOutlined, FlagOutlined, ShopOutlined, StarOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { adminGetAllReports, adminUpdateReport } from '../../api/apiReport';
import dayjs from 'dayjs';

const { Title, Text, TextArea } = Typography;

const STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: '⏳ Đang chờ' },
    { value: 'reviewing', label: '🔍 Đang xem xét' },
    { value: 'resolved', label: '✅ Đã xử lý' },
    { value: 'rejected', label: '❌ Đã từ chối' },
];

const STATUS_MAP = {
    pending:   { label: 'Đang chờ',     color: 'orange' },
    reviewing: { label: 'Đang xem xét', color: 'blue' },
    resolved:  { label: 'Đã xử lý',    color: 'green' },
    rejected:  { label: 'Từ chối',      color: 'default' },
};

const TYPE_MAP = {
    product: { label: 'Sản phẩm', color: 'purple', icon: <AppstoreOutlined /> },
    store:   { label: 'Cửa hàng', color: 'blue',   icon: <ShopOutlined /> },
    review:  { label: 'Đánh giá', color: 'gold',   icon: <StarOutlined /> },
};

// Thống kê nhanh
function StatCard({ label, value, color }) {
    return (
        <Card size="small" style={{ borderLeft: `4px solid ${color}`, borderRadius: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>{label}</div>
        </Card>
    );
}

export default function ReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Detail + action
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [actionOpen, setActionOpen] = useState(false);
    const [actionType, setActionType] = useState('resolve'); // 'resolve' | 'reject'
    const [adminNote, setAdminNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await adminGetAllReports({ limit: 200 });
            const data = res.data?.metadata || res.data;
            setReports(Array.isArray(data) ? data : data?.reports || []);
        } catch (err) {
            message.error('Không thể tải danh sách báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        setSubmitting(true);
        try {
            await adminUpdateReport(selected._id, { status, note: adminNote });
            message.success(`Đã cập nhật trạng thái báo cáo!`);
            setActionOpen(false);
            setDetailOpen(false);
            setAdminNote('');
            fetchReports();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi xử lý báo cáo');
        } finally {
            setSubmitting(false);
        }
    };

    const openAction = (type) => {
        setActionType(type);
        setAdminNote('');
        setActionOpen(true);
    };

    const filtered = reports.filter((r) => {
        const q = search.toLowerCase();
        const matchSearch =
            r.reason?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchType   = filterType   === 'all' || r.targetType === filterType;
        return matchSearch && matchStatus && matchType;
    });

    // Stats
    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        reviewing: reports.filter(r => r.status === 'reviewing').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
    };

    const columns = [
        {
            title: '#',
            width: 50,
            render: (_, __, idx) => <Text type="secondary">{idx + 1}</Text>,
        },
        {
            title: 'Lý do vi phạm',
            dataIndex: 'reason',
            key: 'reason',
            render: (text) => <Text strong>{text || 'Không rõ'}</Text>,
        },
        {
            title: 'Đối tượng',
            dataIndex: 'targetType',
            key: 'targetType',
            render: (type) => {
                const t = TYPE_MAP[type] || { label: type, color: 'default', icon: null };
                return <Tag color={t.color} icon={t.icon}>{t.label}</Tag>;
            },
        },
        {
            title: 'Người báo cáo',
            key: 'reporter',
            render: (_, r) => <Text>{r.reporter?.fullName || '—'}</Text>,
        },
        {
            title: 'Loại tài khoản',
            dataIndex: 'reporterRole',
            render: (role) => <Tag>{role === 'seller' ? 'Người bán' : 'Khách hàng'}</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status) => {
                const s = STATUS_MAP[status] || STATUS_MAP.pending;
                return <Tag color={s.color}>{s.label}</Tag>;
            },
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <Text type="secondary">{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button icon={<EyeOutlined />} onClick={() => { setSelected(record); setDetailOpen(true); }}>
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FlagOutlined style={{ color: '#dc2626' }} /> Quản lý Báo cáo Vi phạm
                    </Title>
                    <Text type="secondary">Xem xét và giải quyết các báo cáo từ người dùng</Text>
                </div>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}><StatCard label="Tổng báo cáo" value={stats.total} color="#6366f1" /></Col>
                <Col xs={12} md={6}><StatCard label="Đang chờ" value={stats.pending} color="#f97316" /></Col>
                <Col xs={12} md={6}><StatCard label="Đang xem xét" value={stats.reviewing} color="#3b82f6" /></Col>
                <Col xs={12} md={6}><StatCard label="Đã xử lý" value={stats.resolved} color="#10b981" /></Col>
            </Row>

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <Input
                    placeholder="Tìm theo lý do, mô tả..."
                    prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 260, borderRadius: 8 }}
                />
                <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    style={{ width: 180 }}
                    options={STATUS_OPTIONS}
                />
                <Select
                    value={filterType}
                    onChange={setFilterType}
                    style={{ width: 150 }}
                    options={[
                        { value: 'all', label: 'Tất cả loại' },
                        { value: 'product', label: 'Sản phẩm' },
                        { value: 'store',   label: 'Cửa hàng' },
                        { value: 'review',  label: 'Đánh giá' },
                    ]}
                />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>

            {/* ── DETAIL MODAL ── */}
            <Modal
                title={<Space><FlagOutlined style={{ color: '#dc2626' }} /> Chi tiết Báo cáo</Space>}
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                width={660}
                footer={
                    selected?.status === 'pending' || selected?.status === 'reviewing' ? (
                        <Space>
                            <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => openAction('reject')}
                            >
                                Từ chối báo cáo
                            </Button>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                style={{ background: '#10b981', borderColor: '#10b981' }}
                                onClick={() => openAction('resolve')}
                            >
                                Đánh dấu đã xử lý
                            </Button>
                        </Space>
                    ) : (
                        <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
                    )
                }
            >
                {selected && (
                    <div>
                        {/* Trạng thái + loại */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <Tag color={STATUS_MAP[selected.status]?.color}>{STATUS_MAP[selected.status]?.label}</Tag>
                            <Tag color={TYPE_MAP[selected.targetType]?.color} icon={TYPE_MAP[selected.targetType]?.icon}>
                                {TYPE_MAP[selected.targetType]?.label}
                            </Tag>
                        </div>

                        {/* Người báo cáo */}
                        <Card size="small" style={{ marginBottom: 12 }}>
                            <Row gutter={[16, 8]}>
                                <Col span={12}>
                                    <Text type="secondary">Người báo cáo</Text>
                                    <div><Text strong>{selected.reporter?.fullName || '—'}</Text></div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">Vai trò</Text>
                                    <div>
                                        <Tag>{selected.reporterRole === 'seller' ? 'Người bán' : 'Khách hàng'}</Tag>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">Ngày gửi</Text>
                                    <div><Text>{dayjs(selected.createdAt).format('DD/MM/YYYY HH:mm')}</Text></div>
                                </Col>
                                {selected.resolvedAt && (
                                    <Col span={12}>
                                        <Text type="secondary">Ngày xử lý</Text>
                                        <div><Text>{dayjs(selected.resolvedAt).format('DD/MM/YYYY HH:mm')}</Text></div>
                                    </Col>
                                )}
                            </Row>
                        </Card>

                        {/* Nội dung vi phạm */}
                        <Card
                            size="small"
                            style={{ marginBottom: 12, borderColor: '#fecaca', background: '#fef2f2' }}
                        >
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Lý do vi phạm</Text>
                            <Text strong style={{ fontSize: 15 }}>{selected.reason}</Text>

                            {selected.description && (
                                <>
                                    <Divider style={{ margin: '10px 0' }} />
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Mô tả chi tiết</Text>
                                    <div style={{ padding: '10px 12px', background: '#fff', borderRadius: 6, border: '1px solid #fde8d0' }}>
                                        <Text>{selected.description}</Text>
                                    </div>
                                </>
                            )}
                        </Card>

                        {/* Ghi chú admin */}
                        {selected.adminNote && (
                            <Card size="small" title="Ghi chú xử lý của Admin">
                                <Text>{selected.adminNote}</Text>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── ACTION MODAL ── */}
            <Modal
                title={
                    actionType === 'resolve'
                        ? <Space><CheckCircleOutlined style={{ color: '#10b981' }} /> Xác nhận đã xử lý</Space>
                        : <Space><CloseCircleOutlined style={{ color: '#dc2626' }} /> Từ chối báo cáo</Space>
                }
                open={actionOpen}
                onCancel={() => !submitting && setActionOpen(false)}
                onOk={() => handleUpdateStatus(actionType === 'resolve' ? 'resolved' : 'rejected')}
                confirmLoading={submitting}
                okText="Xác nhận"
                cancelText="Huỷ"
                okButtonProps={{
                    danger: actionType === 'reject',
                    style: actionType === 'resolve' ? { background: '#10b981', borderColor: '#10b981' } : {},
                }}
                width={460}
            >
                <div style={{ paddingTop: 8 }}>
                    {actionType === 'resolve' ? (
                        <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, marginBottom: 16, border: '1px solid #bbf7d0' }}>
                            <Text>Đánh dấu báo cáo này đã được giải quyết. Hành động sẽ được ghi nhận và người gửi sẽ được thông báo.</Text>
                        </div>
                    ) : (
                        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, marginBottom: 16, border: '1px solid #fecaca' }}>
                            <Text>Báo cáo này sẽ bị từ chối và đóng lại. Hãy ghi rõ lý do bên dưới.</Text>
                        </div>
                    )}

                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Ghi chú xử lý {actionType === 'reject' && <span style={{ color: 'red' }}>*</span>}
                    </Text>
                    <Input.TextArea
                        rows={4}
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder={
                            actionType === 'resolve'
                                ? 'Mô tả hành động đã thực hiện (VD: đã ẩn sản phẩm, cảnh cáo người bán...)'
                                : 'Lý do từ chối báo cáo này...'
                        }
                        maxLength={500}
                    />
                </div>
            </Modal>
        </div>
    );
}

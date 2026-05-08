import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, Space, message, Modal, Input, Row, Col, Card, Divider } from 'antd';
import { RollbackOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getSellerReturnRequests, respondToReturnRequest } from '../../api/apiReturn';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusLabel = {
    pending: 'Đang chờ',
    approved: 'Đã chấp nhận',
    rejected: 'Đã từ chối',
};

const statusColor = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
};

export default function SellerReturns() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Detail modal
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Action modal: approve | reject
    const [actionOpen, setActionOpen] = useState(false);
    const [actionType, setActionType] = useState('approve');
    const [sellerNote, setSellerNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await getSellerReturnRequests();
            setRequests(res.data?.metadata || []);
        } catch (err) {
            message.error('Lỗi khi tải danh sách yêu cầu trả hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const openDetail = (record) => {
        setSelectedRequest(record);
        setDetailOpen(true);
    };

    const openAction = (type) => {
        setActionType(type);
        setSellerNote('');
        setActionOpen(true);
    };

    const handleRespond = async () => {
        if (actionType === 'reject' && !sellerNote.trim()) {
            message.error('Vui lòng nhập lý do từ chối');
            return;
        }
        setSubmitting(true);
        try {
            await respondToReturnRequest(selectedRequest._id, { action: actionType, sellerNote });
            message.success(actionType === 'approve' ? 'Đã chấp nhận yêu cầu hoàn trả' : 'Đã từ chối yêu cầu hoàn trả');
            setActionOpen(false);
            setDetailOpen(false);
            fetchRequests();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'order',
            key: 'orderCode',
            render: (order) => <Text strong style={{ color: '#1a3c8f' }}>#{order?.orderCode}</Text>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'user',
            key: 'user',
            render: (user) => (
                <Space>
                    <img
                        src={user?.avatar || 'https://via.placeholder.com/32'}
                        alt="avt"
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <Text>{user?.fullName}</Text>
                </Space>
            ),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            render: (reason) => <Text>{reason}</Text>,
        },
        {
            title: 'Số tiền hoàn',
            dataIndex: 'refundAmount',
            key: 'refundAmount',
            render: (amount) => <Text strong style={{ color: '#ff4d4f' }}>{amount?.toLocaleString('vi-VN')}₫</Text>,
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status) => <Tag color={statusColor[status]}>{statusLabel[status]}</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={() => openDetail(record)}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: 24, background: '#fff', borderRadius: 12, minHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>
                    <RollbackOutlined style={{ marginRight: 8, color: '#f97316' }} />
                    Quản lý Yêu cầu Hoàn trả
                </Title>
            </div>

            <Table
                columns={columns}
                dataSource={requests}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 15 }}
                scroll={{ x: 1000 }}
            />

            {/* ── DETAIL MODAL ── */}
            <Modal
                title={<Space><RollbackOutlined style={{ color: '#f97316' }} /> Chi tiết Yêu cầu Hoàn trả</Space>}
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                width={720}
                footer={
                    selectedRequest?.status === 'pending' ? (
                        <Space>
                            <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => openAction('reject')}
                            >
                                Từ chối
                            </Button>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                style={{ background: '#10b981', borderColor: '#10b981' }}
                                onClick={() => openAction('approve')}
                            >
                                Duyệt hoàn tiền
                            </Button>
                        </Space>
                    ) : (
                        <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
                    )
                }
            >
                {selectedRequest && (
                    <div>
                        {/* ── Thông tin chung ── */}
                        <Card size="small" style={{ marginBottom: 12 }}>
                            <Row gutter={[16, 10]}>
                                <Col span={12}>
                                    <Text type="secondary">Mã đơn hàng</Text>
                                    <div><Text strong>#{selectedRequest.order?.orderCode}</Text></div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">Khách hàng</Text>
                                    <div><Text strong>{selectedRequest.user?.fullName}</Text></div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">Số tiền hoàn</Text>
                                    <div><Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>{selectedRequest.refundAmount?.toLocaleString('vi-VN')}₫</Text></div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">Trạng thái</Text>
                                    <div><Tag color={statusColor[selectedRequest.status]}>{statusLabel[selectedRequest.status]}</Tag></div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">Ngày gửi</Text>
                                    <div><Text>{dayjs(selectedRequest.createdAt).format('DD/MM/YYYY HH:mm')}</Text></div>
                                </Col>
                            </Row>
                        </Card>

                        {/* ── Lý do ── */}
                        <Card
                            size="small"
                            style={{ marginBottom: 12, borderColor: '#fed7aa', background: '#fff7ed' }}
                        >
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Lý do trả hàng</Text>
                            <Text strong style={{ fontSize: 15 }}>{selectedRequest.reason}</Text>
                            {selectedRequest.description && (
                                <>
                                    <Divider style={{ margin: '10px 0' }} />
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Mô tả chi tiết từ khách</Text>
                                    <div style={{ padding: '10px 12px', background: '#fff', borderRadius: 6, border: '1px solid #fde8d0' }}>
                                        <Text>{selectedRequest.description}</Text>
                                    </div>
                                </>
                            )}
                        </Card>

                        {/* ── Sản phẩm hoàn trả ── */}
                        {selectedRequest.order?.items?.length > 0 && (
                            <Card size="small" title="Sản phẩm trong đơn" style={{ marginBottom: 12 }}>
                                {selectedRequest.order.items.map((item, idx) => (
                                    <div key={idx}>
                                        <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e8ecf3', flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ display: 'block', marginBottom: 2 }} ellipsis>{item.name}</Text>
                                                {item.variantLabel && (
                                                    <Tag style={{ marginBottom: 4 }}>{item.variantLabel}</Tag>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>{item.price?.toLocaleString('vi-VN')}₫</Text>
                                                    <Text type="secondary">x{item.quantity}</Text>
                                                </div>
                                            </div>
                                        </div>
                                        {idx < selectedRequest.order.items.length - 1 && <Divider style={{ margin: 0 }} />}
                                    </div>
                                ))}
                            </Card>
                        )}

                        {/* ── Hình ảnh bằng chứng ── */}
                        {selectedRequest.images?.length > 0 && (
                            <Card size="small" title="Hình ảnh bằng chứng từ khách" style={{ marginBottom: 12 }}>
                                <Space wrap>
                                    {selectedRequest.images.map((img, i) => (
                                        <a key={i} href={img} target="_blank" rel="noreferrer">
                                            <img
                                                src={img}
                                                alt={`Bằng chứng ${i + 1}`}
                                                style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'zoom-in' }}
                                            />
                                        </a>
                                    ))}
                                </Space>
                            </Card>
                        )}

                        {/* ── Ghi chú seller (nếu đã xử lý) ── */}
                        {selectedRequest.sellerNote && (
                            <Card size="small" title="Ghi chú phản hồi của bạn">
                                <Text>{selectedRequest.sellerNote}</Text>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── ACTION MODAL (Duyệt / Từ chối) ── */}
            <Modal
                title={
                    actionType === 'approve'
                        ? <Space><CheckCircleOutlined style={{ color: '#10b981' }} /> Xác nhận Duyệt hoàn tiền</Space>
                        : <Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Từ chối yêu cầu hoàn trả</Space>
                }
                open={actionOpen}
                onCancel={() => !submitting && setActionOpen(false)}
                onOk={handleRespond}
                confirmLoading={submitting}
                okText={actionType === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                cancelText="Huỷ"
                okButtonProps={{
                    danger: actionType === 'reject',
                    style: actionType === 'approve' ? { background: '#10b981', borderColor: '#10b981' } : {},
                }}
                width={480}
            >
                <div style={{ padding: '8px 0' }}>
                    {actionType === 'approve' ? (
                        <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, marginBottom: 16, border: '1px solid #bbf7d0' }}>
                            <Text>Bạn xác nhận chấp nhận yêu cầu trả hàng này. Hệ thống sẽ tự động hoàn tiền <Text strong style={{ color: '#10b981' }}>{selectedRequest?.refundAmount?.toLocaleString('vi-VN')}₫</Text> vào ví khách hàng.</Text>
                        </div>
                    ) : (
                        <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 8, marginBottom: 16, border: '1px solid #fecaca' }}>
                            <Text>Bạn đang từ chối yêu cầu trả hàng. Khách hàng sẽ nhận được thông báo cùng lý do từ chối bên dưới.</Text>
                        </div>
                    )}

                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        {actionType === 'approve' ? 'Ghi chú cho khách (tuỳ chọn)' : 'Lý do từ chối '}
                        {actionType === 'reject' && <span style={{ color: 'red' }}>*</span>}
                    </Text>
                    <TextArea
                        rows={4}
                        value={sellerNote}
                        onChange={(e) => setSellerNote(e.target.value)}
                        placeholder={
                            actionType === 'approve'
                                ? 'Nhập lời xin lỗi hoặc hướng dẫn gửi trả hàng (nếu có)...'
                                : 'Giải thích rõ lý do bạn từ chối yêu cầu này...'
                        }
                        maxLength={500}
                    />
                </div>
            </Modal>
        </div>
    );
}

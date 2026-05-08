import { useEffect, useState } from 'react';
import { Modal, Tag, Card, Descriptions, Typography, Space, Spin, message } from 'antd';
import { FlagOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminGetReport } from '../api/apiReport';

const { Text } = Typography;

const STATUS_MAP = {
    pending: { label: 'Đang chờ', color: 'orange' },
    reviewing: { label: 'Đang xem xét', color: 'blue' },
    resolved: { label: 'Đã xử lý', color: 'green' },
    rejected: { label: 'Từ chối', color: 'default' },
};

const TYPE_MAP = {
    product: 'Sản phẩm',
    store: 'Cửa hàng',
    review: 'Đánh giá',
};

export default function ReportNotificationModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    useEffect(() => {
        const handleOpen = async (e) => {
            const { reportId } = e.detail || {};
            if (!reportId) return;
            setOpen(true);
            setLoading(true);
            try {
                const res = await adminGetReport(reportId);
                setReport(res.data?.metadata || res.data || null);
            } catch (err) {
                message.error('Không thể tải chi tiết báo cáo');
                setOpen(false);
            } finally {
                setLoading(false);
            }
        };

        const handleDebugOpen = () => {
            console.log('[ReportNotificationModal] mounted');
        };

        handleDebugOpen();

        window.addEventListener('OPEN_REPORT_MODAL', handleOpen);
        return () => window.removeEventListener('OPEN_REPORT_MODAL', handleOpen);
    }, []);

    return (
        <Modal
            open={open}
            onCancel={() => setOpen(false)}
            footer={null}
            width={720}
            title={
                <Space>
                    <FlagOutlined style={{ color: '#dc2626' }} />
                    Chi tiết báo cáo
                </Space>
            }
        >
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
                    <Spin />
                </div>
            ) : report ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag color={STATUS_MAP[report.status]?.color}>{STATUS_MAP[report.status]?.label}</Tag>
                        <Tag color="blue">{TYPE_MAP[report.targetType] || report.targetType}</Tag>
                    </div>

                    <Card size="small">
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label="Người báo cáo">{report.reporter?.fullName || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Vai trò">{report.reporterRole === 'seller' ? 'Người bán' : 'Khách hàng'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày gửi">{report.createdAt ? dayjs(report.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày xử lý">{report.resolvedAt ? dayjs(report.resolvedAt).format('DD/MM/YYYY HH:mm') : 'Chưa xử lý'}</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card size="small" title="Nội dung báo cáo" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div>
                                <Text type="secondary">Lý do</Text>
                                <div><Text strong>{report.reason || 'Không rõ'}</Text></div>
                            </div>
                            {report.description && (
                                <div>
                                    <Text type="secondary">Mô tả</Text>
                                    <div style={{ marginTop: 4 }}><Text>{report.description}</Text></div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card
                        size="small"
                        title={
                            <Space>
                                {report.status === 'resolved' ? <CheckCircleOutlined style={{ color: '#10b981' }} /> : <CloseCircleOutlined style={{ color: '#dc2626' }} />}
                                Thông tin đã giải quyết
                            </Space>
                        }
                    >
                        {report.status === 'resolved' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div>
                                    <Text type="secondary">Ghi chú xử lý của admin</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text>{report.adminNote || 'Đã xử lý báo cáo.'}</Text>
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary">Kết quả</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text strong style={{ color: '#10b981' }}>Báo cáo đã được giải quyết</Text>
                                    </div>
                                </div>
                            </div>
                        ) : report.status === 'rejected' ? (
                            <div>
                                <Text strong style={{ color: '#6b7280' }}>Báo cáo đã bị từ chối.</Text>
                                <div style={{ marginTop: 8 }}>
                                    <Text type="secondary">Lý do</Text>
                                    <div><Text>{report.adminNote || 'Không có ghi chú.'}</Text></div>
                                </div>
                            </div>
                        ) : (
                            <Text type="secondary">Báo cáo này هنوز chưa được giải quyết.</Text>
                        )}
                    </Card>
                </div>
            ) : null}
        </Modal>
    );
}

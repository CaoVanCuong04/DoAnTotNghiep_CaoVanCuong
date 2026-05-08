import { useEffect, useMemo, useState } from 'react';
import { Modal, Tag, Card, Descriptions, Typography, Space, Spin, message } from 'antd';
import { FlagOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getMyReports } from '../api/apiReport';

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

export default function UserReportNotificationModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [selectedReportId, setSelectedReportId] = useState(null);

    const selectedReport = useMemo(
        () => reports.find((r) => r._id === selectedReportId) || null,
        [reports, selectedReportId],
    );

    useEffect(() => {
        const handleOpen = async (e) => {
            const { reportId } = e.detail || {};
            if (!reportId) return;

            setOpen(true);
            setSelectedReportId(reportId);
            setLoading(true);
            try {
                const res = await getMyReports();
                const data = res.data?.metadata || res.data || [];
                const list = Array.isArray(data) ? data : data?.reports || [];
                setReports(list);
            } catch (err) {
                message.error('Không thể tải báo cáo của bạn');
                setOpen(false);
            } finally {
                setLoading(false);
            }
        };

        window.addEventListener('OPEN_USER_REPORT_MODAL', handleOpen);
        return () => window.removeEventListener('OPEN_USER_REPORT_MODAL', handleOpen);
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
                    Chi tiết báo cáo của tôi
                </Space>
            }
        >
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
                    <Spin />
                </div>
            ) : selectedReport ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag color={STATUS_MAP[selectedReport.status]?.color}>
                            {STATUS_MAP[selectedReport.status]?.label}
                        </Tag>
                        <Tag color="blue">{TYPE_MAP[selectedReport.targetType] || selectedReport.targetType}</Tag>
                    </div>

                    <Card size="small">
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label="Ngày gửi">
                                {selectedReport.createdAt ? dayjs(selectedReport.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày xử lý">
                                {selectedReport.resolvedAt ? dayjs(selectedReport.resolvedAt).format('DD/MM/YYYY HH:mm') : 'Chưa xử lý'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Lý do">{selectedReport.reason || 'Không rõ'}</Descriptions.Item>
                            <Descriptions.Item label="Loại đối tượng">{TYPE_MAP[selectedReport.targetType] || selectedReport.targetType}</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card size="small" title="Nội dung báo cáo" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                        {selectedReport.description ? (
                            <Text>{selectedReport.description}</Text>
                        ) : (
                            <Text type="secondary">Không có mô tả thêm.</Text>
                        )}
                    </Card>

                    <Card
                        size="small"
                        title={
                            <Space>
                                {selectedReport.status === 'resolved' ? (
                                    <CheckCircleOutlined style={{ color: '#10b981' }} />
                                ) : selectedReport.status === 'rejected' ? (
                                    <CloseCircleOutlined style={{ color: '#6b7280' }} />
                                ) : (
                                    <InfoCircleOutlined style={{ color: '#3b82f6' }} />
                                )}
                                Kết quả xử lý
                            </Space>
                        }
                    >
                        {selectedReport.status === 'resolved' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div>
                                    <Text type="secondary">Ghi chú từ admin</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text>{selectedReport.adminNote || 'Báo cáo đã được xử lý thành công.'}</Text>
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary">Trạng thái cuối</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Tag color="green">Đã xử lý</Tag>
                                    </div>
                                </div>
                            </div>
                        ) : selectedReport.status === 'rejected' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div>
                                    <Text type="secondary">Lý do từ chối</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text>{selectedReport.adminNote || 'Không có ghi chú từ admin.'}</Text>
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary">Trạng thái cuối</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Tag>Đã từ chối</Tag>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Text type="secondary">Báo cáo của bạn hiện vẫn đang được xử lý.</Text>
                        )}
                    </Card>
                </div>
            ) : (
                <Text type="secondary">Không tìm thấy báo cáo.</Text>
            )}
        </Modal>
    );
}

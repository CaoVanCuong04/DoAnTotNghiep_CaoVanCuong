import { useState } from 'react';
import { Modal, Select, Input, Typography, message } from 'antd';
import { FlagOutlined } from '@ant-design/icons';
import { createReport } from '../api/apiReport';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Text } = Typography;

// mapping targetType → backend `type` field
const TYPE_MAP = {
    product: 'customer_report_shop',  // báo cáo sản phẩm → dùng chung loại shop
    store:   'customer_report_shop',
    review:  'customer_report_shop',
};

const REASONS = {
    product: [
        'Hàng giả / hàng nhái',
        'Mô tả không đúng thực tế',
        'Nội dung phản cảm hoặc bạo lực',
        'Sản phẩm vi phạm pháp luật',
        'Spam / trùng lặp',
        'Khác',
    ],
    store: [
        'Lừa đảo / gian lận',
        'Bán hàng giả / kém chất lượng',
        'Hành vi tiêu cực với khách hàng',
        'Vi phạm chính sách nền tảng',
        'Thông tin sai lệch',
        'Khác',
    ],
    review: [
        'Đánh giá giả mạo / không thực tế',
        'Nội dung không phù hợp',
        'Spam',
        'Khác',
    ],
};

const TYPE_LABEL = {
    product: 'sản phẩm',
    store:   'cửa hàng',
    review:  'đánh giá',
};

/**
 * ReportModal — Component tái sử dụng để báo cáo sản phẩm / cửa hàng / đánh giá
 *
 * Props:
 * - open (bool)
 * - onClose (fn)
 * - targetId (string): _id của đối tượng bị báo cáo
 * - targetType ('product' | 'store' | 'review')
 * - targetName (string): Tên hiển thị
 */
export default function ReportModal({ open, onClose, targetId, targetType = 'store', targetName = '' }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [reason, setReason] = useState(undefined);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reasons = REASONS[targetType] || REASONS.store;
    const typeLabel = TYPE_LABEL[targetType] || 'đối tượng';

    const handleClose = () => {
        setReason(undefined);
        setDescription('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!user) {
            message.warning('Vui lòng đăng nhập để gửi báo cáo');
            navigate('/login');
            return;
        }
        if (!reason) {
            message.error('Vui lòng chọn lý do báo cáo');
            return;
        }
        if (!description.trim()) {
            message.error('Vui lòng mô tả chi tiết vi phạm');
            return;
        }

        setSubmitting(true);
        try {
            // Gửi đúng format mà backend service.createReport() yêu cầu
            const payload = {
                type: TYPE_MAP[targetType] || 'customer_report_shop',
                reason,
                description,
            };

            // Gắn đúng target field theo loại
            if (targetType === 'store')   payload.targetStore = targetId;
            if (targetType === 'product') payload.targetStore = targetId;
            if (targetType === 'review')  payload.targetStore = targetId;

            await createReport(payload);
            message.success('Cảm ơn! Báo cáo của bạn đã được gửi đến đội ngũ xét duyệt.');
            handleClose();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}>
                    <FlagOutlined />
                    Báo cáo {typeLabel}
                </span>
            }
            open={open}
            onCancel={handleClose}
            onOk={handleSubmit}
            confirmLoading={submitting}
            okText="Gửi báo cáo"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
            width={500}
            destroyOnClose
        >
            <div style={{ paddingTop: 8 }}>
                {targetName && (
                    <div style={{
                        padding: '10px 14px',
                        background: '#fef2f2',
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                        marginBottom: 16,
                    }}>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Đối tượng bị báo cáo</Text>
                        <Text strong>{targetName}</Text>
                    </div>
                )}

                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Lý do báo cáo <span style={{ color: 'red' }}>*</span>
                    </Text>
                    <Select
                        value={reason}
                        onChange={setReason}
                        placeholder="Chọn lý do vi phạm..."
                        style={{ width: '100%' }}
                        options={reasons.map(r => ({ value: r, label: r }))}
                        size="large"
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Mô tả chi tiết <span style={{ color: 'red' }}>*</span>
                    </Text>
                    <TextArea
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Hãy mô tả rõ hành vi vi phạm để chúng tôi có thể xem xét chính xác hơn..."
                        maxLength={1000}
                        showCount
                    />
                </div>

                <Text type="secondary" style={{ fontSize: 12 }}>
                    ⚠️ Báo cáo giả mạo hoặc ác ý có thể dẫn đến việc tài khoản của bạn bị hạn chế.
                </Text>
            </div>
        </Modal>
    );
}

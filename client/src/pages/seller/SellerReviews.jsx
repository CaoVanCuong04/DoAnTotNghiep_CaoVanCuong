import { useState, useEffect } from 'react';
import { Typography, Table, Rate, Avatar, Button, Input, Modal, message, Segmented, Space, Tag } from 'antd';
import { CommentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { sellerGetMyReviews, sellerReplyToReview } from '../../api/apiSeller';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SellerReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unreplied
    
    // Modal state
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [filter]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = { limit: 50 };
            if (filter === 'unreplied') params.replied = 'no';
            
            const res = await sellerGetMyReviews(params);
            const data = res.data?.metadata?.reviews || res.data?.reviews || [];
            setReviews(data);
        } catch (err) {
            message.error('Lỗi tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const openReplyModal = (review) => {
        setReplyingTo(review);
        setReplyContent(review.reply?.content || '');
        setReplyModalOpen(true);
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) {
            message.error('Vui lòng nhập nội dung phản hồi');
            return;
        }
        setSubmitting(true);
        try {
            await sellerReplyToReview(replyingTo._id, { content: replyContent });
            message.success('Phản hồi đánh giá thành công');
            setReplyModalOpen(false);
            fetchReviews();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi phản hồi');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            width: 300,
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 12 }}>
                    <img src={record.product?.images?.[0]} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} alt="product" />
                    <div style={{ overflow: 'hidden' }}>
                        <Text strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {record.product?.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>Đơn hàng: #{record.order?.orderCode}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Khách hàng',
            key: 'user',
            width: 150,
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar src={record.user?.avatar}>{record.user?.fullName?.[0]}</Avatar>
                    <Text>{record.user?.fullName}</Text>
                </div>
            )
        },
        {
            title: 'Đánh giá',
            key: 'review',
            flex: 1,
            render: (_, record) => (
                <div>
                    <Rate disabled defaultValue={record.rating} style={{ fontSize: 14, color: '#f59e0b', display: 'block', marginBottom: 4 }} />
                    <Text>{record.content || <Text type="secondary" italic>(Không có nhận xét)</Text>}</Text>
                    
                    {record.reply?.content && (
                        <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8, borderLeft: '4px solid #22c55e' }}>
                            <Text strong style={{ display: 'block', color: '#166534', fontSize: 12, marginBottom: 4 }}>Shop phản hồi:</Text>
                            <Text style={{ color: '#166534' }}>{record.reply.content}</Text>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                record.reply?.content ? (
                    <Button type="text" icon={<CheckCircleOutlined />} onClick={() => openReplyModal(record)} style={{ color: '#22c55e' }}>
                        Đã phản hồi
                    </Button>
                ) : (
                    <Button type="primary" ghost icon={<CommentOutlined />} onClick={() => openReplyModal(record)}>
                        Phản hồi
                    </Button>
                )
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Đánh giá của khách hàng</Title>
                    <Text type="secondary">Xây dựng uy tín gian hàng bằng việc phản hồi tốt khách hàng.</Text>
                </div>
                <div>
                    <Segmented
                        options={[
                            { label: 'Tất cả', value: 'all' },
                            { label: 'Chưa phản hồi', value: 'unreplied' },
                        ]}
                        value={filter}
                        onChange={setFilter}
                    />
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={reviews}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>

            <Modal
                title="Phản hồi đánh giá"
                open={replyModalOpen}
                onCancel={() => !submitting && setReplyModalOpen(false)}
                onOk={handleSubmitReply}
                confirmLoading={submitting}
                okText="Gửi phản hồi"
                cancelText="Hủy"
            >
                {replyingTo && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text strong>{replyingTo.user?.fullName}</Text>
                                <Rate disabled defaultValue={replyingTo.rating} style={{ fontSize: 12 }} />
                            </div>
                            <Text>{replyingTo.content}</Text>
                        </div>

                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Câu trả lời của Shop:</Text>
                        <TextArea
                            rows={4}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Cảm ơn bạn đã ủng hộ shop..."
                        />
                        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                            Lưu ý: Phản hồi này sẽ được hiển thị công khai trên trang sản phẩm.
                        </Text>
                    </div>
                )}
            </Modal>
        </div>
    );
}

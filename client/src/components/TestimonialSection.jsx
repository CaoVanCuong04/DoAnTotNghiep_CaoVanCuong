import { useState, useEffect } from 'react';
import { Typography, Row, Col, Avatar, Rate, Skeleton } from 'antd';
import { motion } from 'framer-motion';
import { CommentOutlined, CheckCircleFilled, UserOutlined, StarFilled } from '@ant-design/icons';
import { getPublicReviews } from '../api/apiReview';

export default function TestimonialSection() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPublicReviews().then(res => {
            setReviews(res.data.metadata || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ marginBottom: 32, marginTop: 24 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
        </div>
    );
    if (reviews.length === 0) return null;

    return (
        <div style={{
            marginBottom: 24, marginTop: 8,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)',
            borderRadius: 16,
            padding: '32px 28px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decorative blobs */}
            <div style={{
                position: 'absolute', top: -60, right: -60, width: 240, height: 240,
                borderRadius: '50%', background: 'rgba(99,102,241,0.15)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: -80, left: -40, width: 200, height: 200,
                borderRadius: '50%', background: 'rgba(37,99,235,0.15)',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CommentOutlined style={{ color: '#93c5fd', fontSize: 20 }} />
                        <Typography.Title level={5} style={{
                            margin: 0, color: '#fff', fontWeight: 800, fontSize: 16,
                        }}>
                            KHÁCH HÀNG NÓI GÌ VỀ CHÚNG TÔI
                        </Typography.Title>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4, marginLeft: 28 }}>
                        Đánh giá thực từ người dùng đã mua hàng
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px' }}>
                    <StarFilled style={{ color: '#fbbf24', fontSize: 14 }} />
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>5.0</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>/ 5 sao</span>
                </div>
            </div>

            {/* Cards */}
            <Row gutter={[16, 16]}>
                {reviews.map((review, idx) => (
                    <Col xs={24} sm={24} md={8} key={review._id}>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.12, duration: 0.5 }}
                            whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(0,0,0,0.3)' }}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 14,
                                padding: '20px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'default',
                                transition: 'box-shadow 0.3s',
                            }}
                        >
                            {/* Quote icon background */}
                            <div style={{
                                position: 'absolute', top: 8, right: 12,
                                fontSize: 64, fontWeight: 900, lineHeight: 1,
                                color: 'rgba(255,255,255,0.07)',
                                fontFamily: 'Georgia, serif', userSelect: 'none',
                            }}>
                                "
                            </div>

                            {/* User */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <Avatar
                                    src={review.user?.avatar}
                                    icon={!review.user?.avatar && <UserOutlined />}
                                    size={44}
                                    style={{
                                        border: '2px solid rgba(255,255,255,0.25)',
                                        flexShrink: 0,
                                        background: '#2563eb',
                                    }}
                                />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        color: '#fff', fontWeight: 700, fontSize: 14,
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {review.user?.fullName || 'Khách hàng'}
                                        </span>
                                        <CheckCircleFilled style={{ color: '#34d399', fontSize: 12, flexShrink: 0 }} />
                                    </div>
                                    <Rate
                                        disabled
                                        defaultValue={review.rating}
                                        style={{ fontSize: 11, display: 'block', marginTop: 2 }}
                                        character={<StarFilled style={{ color: '#fbbf24' }} />}
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{
                                color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 1.65,
                                fontStyle: 'italic', flex: 1,
                                display: '-webkit-box', WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                "{review.content}"
                            </div>

                            {/* Product Tag */}
                            <div style={{
                                marginTop: 14, paddingTop: 12,
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 11, color: 'rgba(255,255,255,0.45)',
                                whiteSpace: 'nowrap', overflow: 'hidden',
                            }}>
                                <span>Đã mua:</span>
                                <span style={{
                                    color: '#93c5fd', fontWeight: 600,
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {review.product?.name || 'Sản phẩm'}
                                </span>
                            </div>
                        </motion.div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}

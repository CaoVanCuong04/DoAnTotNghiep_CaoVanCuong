import { Row, Col, Typography, Button } from 'antd';
import { motion } from 'framer-motion';
import { bannerAds } from '../data/mockData';

const { Title, Text } = Typography;

export default function BannerAds() {
    return (
        <div>
            <Title level={4} style={{ marginBottom: 16 }}>
                Quảng Cáo Đặc Biệt
            </Title>
            <Row gutter={[16, 16]}>
                {bannerAds.map((ad, i) => (
                    <Col xs={24} sm={12} key={ad.id}>
                        <motion.div
                            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.45 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: 20,
                                    borderRadius: 12,
                                    background: ad.bg,
                                    border: `1.5px solid ${ad.accentColor}22`,
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    minHeight: 130,
                                }}
                            >
                                {/* Decorative circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: -30,
                                        top: -30,
                                        width: 120,
                                        height: 120,
                                        borderRadius: '50%',
                                        background: `${ad.accentColor}10`,
                                    }}
                                />

                                <div style={{ flex: 1, zIndex: 1 }}>
                                    <div
                                        style={{
                                            color: '#8899aa',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            fontSize: '0.68rem',
                                            fontWeight: 600,
                                            marginBottom: 4
                                        }}
                                    >
                                        Quảng Cáo
                                    </div>
                                    <div
                                        style={{
                                            color: '#1a1a2e',
                                            lineHeight: 1.3,
                                            marginBottom: 4,
                                            fontSize: '1rem',
                                            fontWeight: 700
                                        }}
                                    >
                                        {ad.title}
                                    </div>
                                    {ad.subtitle && (
                                        <div style={{ display: 'block', marginBottom: 12, fontSize: '0.75rem', color: '#6b7280' }}>
                                            {ad.subtitle}
                                        </div>
                                    )}
                                    <Button
                                        type="primary"
                                        size="small"
                                        style={{
                                            background: ad.accentColor,
                                            borderColor: ad.accentColor,
                                            fontSize: '0.75rem',
                                            padding: '0 16px',
                                            height: 28,
                                            borderRadius: 6,
                                        }}
                                    >
                                        {ad.cta}
                                    </Button>
                                </div>

                                <img
                                    src={ad.image}
                                    alt={ad.title}
                                    style={{
                                        width: 90,
                                        height: 90,
                                        objectFit: 'cover',
                                        borderRadius: 8,
                                        flexShrink: 0,
                                        zIndex: 1,
                                    }}
                                />
                            </div>
                        </motion.div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}

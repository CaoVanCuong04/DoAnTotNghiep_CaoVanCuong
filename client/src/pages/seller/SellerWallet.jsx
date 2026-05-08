import { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Table, Tag, Button, Modal, Form, Input, InputNumber, message, Statistic } from 'antd';
import { WalletOutlined, BankOutlined, ArrowUpOutlined, ArrowDownOutlined, AccountBookOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { sellerGetMyWallet, sellerRequestWithdrawal } from '../../api/apiSeller';

const { Title, Text } = Typography;

export default function SellerWallet() {
    const [wallet, setWallet] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Modal rút tiền
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        setLoading(true);
        try {
            const res = await sellerGetMyWallet();
            setWallet(res.data?.metadata || res.data || {});
        } catch (err) {
            message.error('Lỗi tải thông tin ví');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (values) => {
        setSubmitting(true);
        try {
            await sellerRequestWithdrawal(values);
            message.success('Đã gửi yêu cầu rút tiền thành công. Vui lòng chờ Admin duyệt.');
            setIsWithdrawOpen(false);
            form.resetFields();
            fetchWallet();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi khi gửi yêu cầu rút tiền');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Ngày giao dịch',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
        },
        {
            title: 'Loại',
            key: 'type',
            render: (_, record) => {
                const isCredit = record.type === 'credit';
                const isWithdrawal = record.type === 'withdrawal';
                
                let color = 'blue';
                let label = 'Trừ tiền';
                let icon = <ArrowDownOutlined />;
                
                if (isCredit) {
                    color = 'green';
                    label = 'Nhận tiền';
                    icon = <ArrowUpOutlined />;
                } else if (isWithdrawal) {
                    color = 'volcano';
                    label = 'Rút tiền';
                    icon = <BankOutlined />;
                }

                return (
                    <Tag color={color} icon={icon}>
                        {label}
                    </Tag>
                );
            }
        },
        {
            title: 'Số tiền',
            key: 'amount',
            align: 'right',
            render: (_, record) => {
                const isCredit = record.type === 'credit';
                return (
                    <Text strong style={{ color: isCredit ? '#166534' : '#dc2626' }}>
                        {isCredit ? '+' : '-'}{record.amount?.toLocaleString('vi-VN')}₫
                    </Text>
                );
            }
        },
        {
            title: 'Trạng thái',
            key: 'status',
            align: 'center',
            render: (_, record) => {
                const statusMap = {
                    pending: { color: 'orange', text: 'Đang xử lý' },
                    completed: { color: 'green', text: 'Thành công' },
                    failed: { color: 'red', text: 'Thất bại' },
                    rejected: { color: 'red', text: 'Bị từ chối' }
                };
                const st = statusMap[record.status] || { color: 'default', text: record.status };
                return <Tag color={st.color}>{st.text}</Tag>;
            }
        },
        {
            title: 'Nội dung',
            dataIndex: 'description',
            key: 'description',
            render: (text) => <Text type="secondary">{text}</Text>
        }
    ];

    const cards = [
        {
            title: 'Số Dư Khả Dụng',
            value: wallet.balance || 0,
            icon: <WalletOutlined style={{ color: '#2563eb' }} />,
            color: '#eff6ff',
            borderColor: '#bfdbfe'
        },
        {
            title: 'Tổng Nhận',
            value: wallet.totalReceived || 0,
            icon: <ArrowUpOutlined style={{ color: '#16a34a' }} />,
            color: '#f0fdf4',
            borderColor: '#bbf7d0'
        },
        {
            title: 'Tổng Đã Rút',
            value: wallet.totalWithdrawn || 0,
            icon: <ArrowDownOutlined style={{ color: '#ea580c' }} />,
            color: '#fff7ed',
            borderColor: '#fed7aa'
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Ví Gian Hàng</Title>
                    <Text type="secondary">Quản lý doanh thu và rút tiền về tài khoản ngân hàng</Text>
                </div>
                <div>
                    <Button 
                        type="primary" 
                        icon={<BankOutlined />} 
                        size="large"
                        onClick={() => setIsWithdrawOpen(true)}
                        style={{ background: '#1e40af', borderRadius: 8 }}
                    >
                        Yêu cầu rút tiền
                    </Button>
                </div>
            </div>

            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                {cards.map((c, i) => (
                    <Col xs={24} sm={8} key={i}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card 
                                bordered={false} 
                                style={{ background: c.color, border: `1px solid ${c.borderColor}`, borderRadius: 16 }}
                            >
                                <Statistic 
                                    title={<Text strong style={{ fontSize: 16 }}>{c.title}</Text>}
                                    value={c.value} 
                                    prefix={c.icon}
                                    suffix="₫"
                                    valueStyle={{ fontWeight: 700, marginTop: 8 }}
                                />
                            </Card>
                        </motion.div>
                    </Col>
                ))}
            </Row>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card 
                    title={<span><AccountBookOutlined style={{ marginRight: 8 }} />Lịch sử giao dịch</span>}
                    bordered={false} 
                    style={{ borderRadius: 12, border: '1px solid #e8ecf3' }}
                >
                    <Table
                        dataSource={wallet.transactions || []}
                        columns={columns}
                        rowKey={(record) => record._id || Math.random()}
                        loading={loading}
                        pagination={{ pageSize: 15 }}
                    />
                </Card>
            </motion.div>

            <Modal
                title={<span><BankOutlined style={{ color: '#2563eb', marginRight: 8 }} />Tạo yêu cầu rút tiền</span>}
                open={isWithdrawOpen}
                onCancel={() => !submitting && setIsWithdrawOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                okText="Gửi yêu cầu"
                cancelText="Hủy"
            >
                <div style={{ padding: '16px 0' }}>
                    <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, marginBottom: 24, textAlign: 'center' }}>
                        <Text type="secondary" style={{ display: 'block' }}>Số dư khả dụng để rút</Text>
                        <Title level={3} style={{ color: '#1e40af', margin: 0 }}>{(wallet.balance || 0).toLocaleString('vi-VN')}₫</Title>
                    </div>

                    <Form layout="vertical" form={form} onFinish={handleWithdraw}>
                        <Form.Item 
                            name="amount" 
                            label="Số tiền muốn rút (₫)" 
                            rules={[
                                { required: true, message: 'Nhập số tiền cần rút' },
                                { type: 'number', min: 10000, message: 'Rút tối thiểu 10.000₫' },
                                { type: 'number', max: wallet.balance, message: 'Số dư không đủ' }
                            ]}
                        >
                            <InputNumber 
                                style={{ width: '100%' }} 
                                size="large"
                                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                                placeholder="Nhập số tiền..."
                            />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Form.Item 
                                name="bankName" 
                                label="Ngân hàng thụ hưởng" 
                                rules={[{ required: true, message: 'Nhập tên ngân hàng' }]}
                            >
                                <Input size="large" placeholder="Vd: Vietcombank, MB Bank..." />
                            </Form.Item>

                            <Form.Item 
                                name="accountNumber" 
                                label="Số tài khoản" 
                                rules={[{ required: true, message: 'Nhập số tài khoản' }]}
                            >
                                <Input size="large" placeholder="Nhập STK..." />
                            </Form.Item>
                        </div>

                        <Form.Item 
                            name="accountName" 
                            label="Tên chủ tài khoản" 
                            rules={[{ required: true, message: 'Nhập tên chủ tài khoản' }]}
                        >
                            <Input size="large" placeholder="Nhập họ và tên không dấu (Vd: NGUYEN VAN A)" style={{ textTransform: 'uppercase' }} />
                        </Form.Item>

                        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 16 }}>
                            * Yêu cầu rút tiền của bạn sẽ được Ban quản trị duyệt trong vòng 24 - 48 giờ làm việc. Tiền sẽ được chuyển thẳng vào tài khoản ngân hàng của bạn.
                        </Text>
                    </Form>
                </div>
            </Modal>
        </div>
    );
}

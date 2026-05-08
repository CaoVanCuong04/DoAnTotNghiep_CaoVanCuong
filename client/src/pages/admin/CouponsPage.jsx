import { useState, useEffect } from 'react';
import {
    Typography,
    Table,
    Tag,
    Button,
    Input,
    Switch,
    Modal,
    Form,
    Select,
    DatePicker,
    message,
    InputNumber,
    Row,
    Col,
    Popconfirm,
} from 'antd';
import { motion } from 'framer-motion';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined } from '@ant-design/icons';
import { couponApi } from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function CouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Form and Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const discountType = Form.useWatch('discountType', form);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await couponApi.adminGetAllCoupons({ limit: 50 });
            const data = res.data?.metadata || res.data;
            setCoupons(Array.isArray(data) ? data : data?.coupons || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditTarget(null);
        form.resetFields();
        form.setFieldsValue({ discountType: 'percent', isActive: true });
        setModalOpen(true);
    };

    const openEdit = (coupon) => {
        setEditTarget(coupon);
        form.setFieldsValue({
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType || 'percent',
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount,
            minOrderAmount: coupon.minOrderAmount,
            usageLimit: coupon.usageLimit,
            expiresAt: coupon.expiresAt ? dayjs(coupon.expiresAt) : null,
            isActive: coupon.isActive !== false,
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                discountValue: Number(values.discountValue),
                minOrderAmount: Number(values.minOrderAmount) || 0,
            };
            if (values.maxDiscount) payload.maxDiscount = Number(values.maxDiscount);
            if (values.usageLimit) payload.usageLimit = Number(values.usageLimit);
            if (values.expiresAt) payload.expiresAt = values.expiresAt.toISOString();

            if (!editTarget) {
                await couponApi.adminCreateCoupon(payload);
                message.success('Tạo mã giảm giá thành công!');
            } else {
                await couponApi.adminUpdateCoupon(editTarget._id, payload);
                message.success('Cập nhật mã giảm giá thành công!');
            }
            setModalOpen(false);
            fetchCoupons();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi xử lý');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await couponApi.adminDeleteCoupon(id);
            message.success('Xóa thành công!');
            fetchCoupons();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi xóa');
        }
    };

    const filtered = coupons.filter(
        (c) =>
            c.code?.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase()),
    );

    const isExpired = (coupon) => coupon.expiresAt && dayjs(coupon.expiresAt).isBefore(dayjs());

    const columns = [
        {
            title: 'Mã',
            dataIndex: 'code',
            key: 'code',
            render: (text) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TagOutlined style={{ color: '#7c3aed' }} />
                    <Text strong style={{ color: '#7c3aed', letterSpacing: 1 }}>
                        {text}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (text) => (
                <Text
                    style={{
                        maxWidth: 200,
                        WebkitLineClamp: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {text || '—'}
                </Text>
            ),
        },
        {
            title: 'Giảm giá',
            key: 'discount',
            render: (_, record) => {
                const label =
                    record.discountType === 'percent'
                        ? `${record.discountValue}%${record.maxDiscount ? ` (tối đa ${record.maxDiscount.toLocaleString('vi-VN')}₫)` : ''}`
                        : `${record.discountValue?.toLocaleString('vi-VN')}₫`;
                return <Tag color={record.discountType === 'percent' ? 'gold' : 'purple'}>{label}</Tag>;
            },
        },
        {
            title: 'Đã dùng',
            key: 'used',
            align: 'center',
            render: (_, record) => (
                <Text strong>
                    {record.usedCount || 0} {record.usageLimit ? `/ ${record.usageLimit}` : ''}
                </Text>
            ),
        },
        {
            title: 'Hạn dùng',
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            align: 'center',
            render: (date, record) => {
                if (!date) return <Text type="secondary">Không giới hạn</Text>;
                return (
                    <Tag color={isExpired(record) ? 'error' : 'success'}>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Tag>
                );
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            align: 'center',
            render: (_, record) => (
                <Tag color={record.isActive ? 'success' : 'default'}>{record.isActive ? 'Hoạt động' : 'Tắt'}</Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#3b82f6' }} />}
                        onClick={() => openEdit(record)}
                    />
                    <Popconfirm
                        title="Bạn có chắc muốn xóa mã giảm giá này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                    flexWrap: 'wrap',
                    gap: 16,
                }}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        Quản lý mã giảm giá
                    </Title>
                    <Text type="secondary">{coupons.length} mã giảm giá</Text>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Input
                        placeholder="Tìm mã giảm giá..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 260, borderRadius: 8 }}
                        size="large"
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">
                        Thêm mã
                    </Button>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>

            <Modal
                title={editTarget ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={() => setModalOpen(false)}
                okText={editTarget ? 'Lưu thay đổi' : 'Tạo mới'}
                cancelText="Hủy"
                confirmLoading={submitting}
                width={700}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label="Mã giảm giá"
                                rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
                            >
                                <Input size="large" placeholder="VD: SALE50" style={{ textTransform: 'uppercase' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="discountType" label="Loại giảm">
                                <Select size="large">
                                    <Select.Option value="percent">Phần trăm (%)</Select.Option>
                                    <Select.Option value="fixed">Cố định (₫)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Mô tả">
                        <Input size="large" placeholder="VD: Giảm 50% cho đơn từ 200K" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={discountType === 'percent' ? 12 : 12}>
                            <Form.Item
                                name="discountValue"
                                label={discountType === 'percent' ? 'Giá trị giảm (%)' : 'Giá trị giảm (₫)'}
                                rules={[{ required: true, message: 'Vui lòng nhập giá trị giảm' }]}
                            >
                                <InputNumber
                                    size="large"
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value.replace(/\$\s?|(\.*)/g, '').replace(/,/g, '')}
                                />
                            </Form.Item>
                        </Col>
                        {discountType === 'percent' && (
                            <Col span={12}>
                                <Form.Item name="maxDiscount" label="Giảm tối đa (₫)">
                                    <InputNumber
                                        size="large"
                                        style={{ width: '100%' }}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value.replace(/\$\s?|(\.*)/g, '').replace(/,/g, '')}
                                    />
                                </Form.Item>
                            </Col>
                        )}
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="minOrderAmount" label="Đơn hàng tối thiểu (₫)">
                                <InputNumber
                                    size="large"
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value.replace(/\$\s?|(\.*)/g, '').replace(/,/g, '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="usageLimit" label="Giới hạn lượt dùng" tooltip="Bỏ trống = không giới hạn">
                                <InputNumber
                                    size="large"
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value.replace(/\$\s?|(\.*)/g, '').replace(/,/g, '')}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="expiresAt"
                                label="Hạn sử dụng"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn ngày hết hạn' },
                                    {
                                        validator: (_, value) => {
                                            if (!value || value.isAfter(dayjs())) return Promise.resolve();
                                            return Promise.reject(new Error('Ngày hết hạn phải ở tương lai'));
                                        },
                                    },
                                ]}
                            >
                                <DatePicker
                                    showTime
                                    size="large"
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY HH:mm"
                                    placeholder="Chọn ngày hết hạn"
                                    disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                                <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}

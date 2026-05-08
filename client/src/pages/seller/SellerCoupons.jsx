import { useState, useEffect } from 'react';
import {
    Typography,
    Table,
    Button,
    Input,
    Tag,
    Switch,
    Modal,
    Form,
    InputNumber,
    Select,
    message,
    DatePicker,
    Popconfirm,
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { sellerGetMyCoupons, sellerCreateCoupon, sellerUpdateCoupon, sellerDeleteCoupon } from '../../api/apiSeller';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function SellerCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Watcher for form conditional rendering
    const discountType = Form.useWatch('discountType', form);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await sellerGetMyCoupons();
            const data = res.data?.metadata?.coupons || res.data?.coupons || [];

            // Lọc trên frontend vì API đang chưa có text search params
            const filtered = search.trim()
                ? data.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()))
                : data;
            setCoupons(filtered);
        } catch (err) {
            message.error('Lỗi tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCoupons();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const openModal = (coupon = null) => {
        setIsModalOpen(true);
        setEditingId(coupon?._id || null);
        if (coupon) {
            form.setFieldsValue({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscount: coupon.maxDiscount,
                usageLimit: coupon.usageLimit,
                expiresAt: coupon.expiresAt ? dayjs(coupon.expiresAt) : null,
                description: coupon.description,
                isActive: coupon.isActive,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ discountType: 'percent', isActive: true });
        }
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const data = {
                ...values,
                expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
            };

            if (editingId) {
                await sellerUpdateCoupon(editingId, data);
                message.success('Cập nhật mã thành công');
            } else {
                await sellerCreateCoupon(data);
                message.success('Tạo mã giảm giá thành công');
            }
            setIsModalOpen(false);
            fetchCoupons();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await sellerDeleteCoupon(id);
            message.success('Bỏ mã thành công');
            fetchCoupons();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi xóa mã');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await sellerUpdateCoupon(id, { isActive: !currentStatus });
            message.success('Đã cập nhật trạng thái');
            fetchCoupons();
        } catch (err) {
            message.error('Lỗi cập nhật trạng thái');
        }
    };

    const columns = [
        {
            title: 'Mã voucher',
            dataIndex: 'code',
            key: 'code',
            render: (text) => (
                <Text strong style={{ color: '#ea580c', fontSize: 16 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Loại / Mức giảm',
            key: 'discount',
            render: (_, record) => {
                if (record.discountType === 'percent') {
                    return (
                        <div>
                            <Text strong>{record.discountValue}%</Text>
                            {record.maxDiscount > 0 && (
                                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                                    Tối đa {record.maxDiscount.toLocaleString('vi-VN')}₫
                                </Text>
                            )}
                        </div>
                    );
                } else {
                    return <Text strong>{record.discountValue.toLocaleString('vi-VN')}₫</Text>;
                }
            },
        },
        {
            title: 'Đơn Tối Thiểu',
            dataIndex: 'minOrderAmount',
            key: 'minOrderAmount',
            render: (min) => <Text>{(min || 0).toLocaleString('vi-VN')}₫</Text>,
        },
        {
            title: 'Đã dùng / Giới hạn',
            key: 'usage',
            align: 'center',
            render: (_, record) => (
                <Text>
                    {record.usedCount || 0} / {record.usageLimit || '∞'}
                </Text>
            ),
        },
        {
            title: 'Hạn sử dụng',
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Không giới hạn'),
        },
        {
            title: 'Trạng thái',
            key: 'isActive',
            align: 'center',
            render: (_, record) => (
                <Switch
                    checked={record.isActive}
                    onChange={() => toggleStatus(record._id, record.isActive)}
                    size="small"
                />
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
                        icon={<EditOutlined style={{ color: '#1e40af' }} />}
                        onClick={() => openModal(record)}
                    />
                    <Popconfirm title="Xóa mã này?" onConfirm={() => handleDelete(record._id)}>
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
                        Quản lý Mã giảm giá
                    </Title>
                    <Text type="secondary">Tạo các voucher khuyến mãi riêng cho shop của bạn</Text>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Input
                        placeholder="Tìm theo mã code..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        value={search}
                        onChange={handleSearch}
                        style={{ width: 200, borderRadius: 8 }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => openModal()}
                        style={{ background: '#1e40af', borderRadius: 8 }}
                    >
                        Thêm voucher
                    </Button>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={coupons}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>

            <Modal
                title={
                    <span>
                        <GiftOutlined style={{ color: '#ea580c', marginRight: 8 }} />
                        {editingId ? 'Sửa Voucher' : 'Tạo Voucher Mới'}
                    </span>
                }
                open={isModalOpen}
                onCancel={() => !submitting && setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                width={600}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit} style={{ marginTop: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item
                            name="code"
                            label="Mã Voucher (Code)"
                            rules={[{ required: true, message: 'Nhập mã giảm giá' }]}
                        >
                            <Input placeholder="Vd: SUMMER2023" style={{ textTransform: 'uppercase' }} />
                        </Form.Item>
                        <Form.Item name="isActive" label="Kích hoạt ngay" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="discountType" label="Loại giảm giá" rules={[{ required: true }]}>
                            <Select>
                                <Option value="percent">Theo phần trăm (%)</Option>
                                <Option value="fixed">Số tiền cố định (₫)</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="discountValue"
                            label="Mức giảm"
                            rules={[{ required: true, message: 'Nhập mức giảm' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={1}
                                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </Form.Item>
                    </div>

                    {discountType === 'percent' && (
                        <Form.Item name="maxDiscount" label="Giảm tối đa (₫)">
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                placeholder="Để trống nếu không giới hạn"
                                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </Form.Item>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="minOrderAmount" label="Giá trị đơn tối thiểu (₫)" rules={[{ required: true }]}>
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </Form.Item>
                        <Form.Item name="usageLimit" label="Số lượt dùng tối đa">
                            <InputNumber style={{ width: '100%' }} min={1} placeholder="Để trống nếu Vô hạn" />
                        </Form.Item>
                    </div>

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
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY HH:mm"
                            placeholder="Chọn ngày kết thúc"
                            disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                        />
                    </Form.Item>

                    <Form.Item name="description" label="Quy định sử dụng / Mô tả">
                        <TextArea rows={2} placeholder="Vd: Chỉ áp dụng cho sản phẩm nhất định..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

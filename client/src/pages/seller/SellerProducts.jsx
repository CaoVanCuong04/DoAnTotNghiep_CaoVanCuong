import { useState, useEffect, useCallback } from 'react';
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
    Upload,
    Popconfirm,
    Space,
    Divider,
    Tabs,
    Row,
    Col,
    Tooltip,
    DatePicker,
    Card,
    Alert,
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    ThunderboltOutlined,
    FireOutlined,
    StarFilled,
    EyeOutlined,
    AppstoreOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import {
    sellerGetMyProducts,
    sellerCreateProduct,
    sellerUpdateProduct,
    sellerDeleteProduct,
    sellerUpdateFlashSale,
} from '../../api/apiSeller';
import { getAllCategories } from '../../api/apiCategory';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const STATUS_COLOR = { active: 'success', pending: 'warning', rejected: 'error' };
const STATUS_LABEL = { active: 'Đang bán', pending: 'Chờ duyệt', rejected: 'Từ chối' };
const fmt = (n) => (n ?? 0).toLocaleString('vi-VN');

export default function SellerProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterFlash, setFilterFlash] = useState(false);

    // Modal thêm/sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    // Watch variants → nếu có biến thể thì disable trưᤁàng giá & kho cơ bản
    const watchedVariants = Form.useWatch('variants', form);
    const hasVariants = Array.isArray(watchedVariants) && watchedVariants.length > 0;
    const [editingProduct, setEditingProduct] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Modal Flash Sale riêng
    const [flashModalOpen, setFlashModalOpen] = useState(false);
    const [flashForm] = Form.useForm();
    const [flashProductId, setFlashProductId] = useState(null);
    const [flashSaving, setFlashSaving] = useState(false);

    /* ── fetch ── */
    const fetchCategories = useCallback(async () => {
        try {
            const res = await getAllCategories();
            const raw = res.data?.metadata;
            setCategories(Array.isArray(raw) ? raw : (raw?.categories ?? []));
        } catch {
            /* ignore */
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await sellerGetMyProducts();
            const raw = res.data?.metadata;
            setProducts(raw?.products ?? (Array.isArray(raw) ? raw : []));
        } catch {
            message.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts, fetchCategories]);

    /* ── filter client-side ── */
    const filtered = products.filter((p) => {
        const q = search.toLowerCase();
        const matchSearch = p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchFlash = !filterFlash || p.isFlashSale;
        return matchSearch && matchStatus && matchFlash;
    });

    /* ── open modal thêm/sửa ── */
    const openModal = (product = null) => {
        setEditingProduct(product);
        if (product) {
            form.setFieldsValue({
                name: product.name,
                brand: product.brand,
                category: product.category?._id || product.category,
                price: product.price,
                originalPrice: product.originalPrice,
                stock: product.stock ?? product.quantity,
                shortDescription: product.shortDescription,
                description: product.description,
                weight: product.weight ?? 500,
                length: product.length ?? 15,
                width: product.width ?? 15,
                height: product.height ?? 10,
                variants: product.variants || [],
                attributes: product.attributes || [],
            });
            setFileList(
                (product.images || []).map((url, i) => ({
                    uid: `-old-${i}`,
                    name: `img-${i}`,
                    status: 'done',
                    url,
                    isOld: true,
                })),
            );
        } else {
            form.resetFields();
            form.setFieldsValue({ weight: 500, length: 15, width: 15, height: 10, variants: [], attributes: [] });
            setFileList([]);
        }
        setIsModalOpen(true);
    };

    /* ── submit thêm/sửa ── */
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (!editingProduct && fileList.length === 0) {
                message.error('Vui lòng chọn ít nhất 1 ảnh sản phẩm');
                return;
            }
            setSubmitting(true);

            const fd = new FormData();
            const fields = [
                'name',
                'brand',
                'category',
                'price',
                'originalPrice',
                'stock',
                'shortDescription',
                'description',
                'weight',
                'length',
                'width',
                'height',
            ];
            fields.forEach((k) => {
                if (values[k] !== undefined) fd.append(k, values[k]);
            });

            // Gửi variants và attributes dạng JSON string
            if (values.variants?.length > 0) fd.append('variants', JSON.stringify(values.variants));
            if (values.attributes?.length > 0) fd.append('attributes', JSON.stringify(values.attributes));

            const keepImages = [];
            fileList.forEach((f) => {
                if (f.originFileObj) fd.append('images', f.originFileObj);
                else if (f.url) keepImages.push(f.url);
            });
            fd.append('keepImages', JSON.stringify(keepImages));

            if (editingProduct) {
                await sellerUpdateProduct(editingProduct._id, fd);
                message.success('Cập nhật sản phẩm thành công!');
            } else {
                await sellerCreateProduct(fd);
                message.success('Thêm sản phẩm thành công! Đang chờ admin duyệt.');
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    /* ── delete ── */
    const handleDelete = async (id) => {
        try {
            await sellerDeleteProduct(id);
            message.success('Xóa sản phẩm thành công!');
            fetchProducts();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi xóa sản phẩm');
        }
    };

    /* ── Flash Sale modal ── */
    const openFlashModal = (product) => {
        setFlashProductId(product._id);
        flashForm.setFieldsValue({
            isFlashSale: !!product.isFlashSale,
            flashSalePrice: product.flashSalePrice || 0,
            flashSaleEndTime: product.flashSaleEndTime ? dayjs(product.flashSaleEndTime) : null,
        });
        setFlashModalOpen(true);
    };

    const handleSaveFlash = async () => {
        try {
            const values = await flashForm.validateFields();
            setFlashSaving(true);
            await sellerUpdateFlashSale(flashProductId, {
                ...values,
                flashSaleEndTime: values.flashSaleEndTime ? values.flashSaleEndTime.toISOString() : null,
            });
            message.success('Cập nhật Flash Sale thành công!');
            setFlashModalOpen(false);
            fetchProducts();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err.response?.data?.message || 'Lỗi cập nhật Flash Sale');
        } finally {
            setFlashSaving(false);
        }
    };

    /* ── Columns ── */
    const columns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            width: 300,
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                            src={r.images?.[0] || 'https://placehold.co/48'}
                            alt={r.name}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 8,
                                objectFit: 'cover',
                                border: '1px solid #e8ecf3',
                            }}
                        />
                        {r.isFlashSale && (
                            <FireOutlined
                                style={{ position: 'absolute', top: -4, right: -4, color: '#f97316', fontSize: 13 }}
                            />
                        )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <Text
                            strong
                            style={{
                                display: 'block',
                                maxWidth: 210,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: 13,
                            }}
                        >
                            {r.name}
                        </Text>
                        <Space size={4}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {r.category?.name || '—'}
                            </Text>
                            {r.brand && <Text style={{ fontSize: 11, color: '#6366f1' }}>· {r.brand}</Text>}
                        </Space>
                    </div>
                </div>
            ),
        },
        {
            title: 'Giá / Giá gốc',
            key: 'pricing',
            align: 'right',
            width: 155,
            render: (_, r) => (
                <div>
                    <Text strong style={{ color: '#1e40af', display: 'block' }}>
                        {fmt(r.price)}₫
                    </Text>
                    {r.originalPrice > 0 && (
                        <Text delete type="secondary" style={{ fontSize: 11 }}>
                            {fmt(r.originalPrice)}₫
                        </Text>
                    )}
                    {r.isFlashSale && r.flashSalePrice > 0 && (
                        <Tag color="orange" icon={<FireOutlined />} style={{ marginTop: 2, fontSize: 10 }}>
                            Flash {fmt(r.flashSalePrice)}₫
                        </Tag>
                    )}
                    {r.isFlashSale && r.flashSaleEndTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                            <ClockCircleOutlined style={{ fontSize: 10, color: '#f97316' }} />
                            <Text style={{ fontSize: 10, color: '#f97316' }}>
                                {dayjs(r.flashSaleEndTime).format('DD/MM HH:mm')}
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Tồn kho',
            key: 'stock',
            align: 'center',
            width: 120,
            sorter: (a, b) => (a.stock ?? 0) - (b.stock ?? 0),
            render: (_, r) => {
                const stock = r.stock ?? r.quantity ?? 0;
                const stockColor =
                    stock === 0 ? '#ef4444' : stock < 10 ? '#f97316' : stock < 50 ? '#f59e0b' : '#10b981';
                const stockLabel = stock === 0 ? 'Hết hàng' : stock < 10 ? 'Sắp hết' : stock < 50 ? 'Thấp' : 'Còn hàng';

                const hasVariantStock = r.variants?.length > 0 && r.variants.some((v) => v.options?.length > 0);
                const tooltipContent = hasVariantStock ? (
                    <div style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6, color: '#fff' }}>
                            Chi tiết tồn kho theo biến thể:
                        </div>
                        {r.variants.map((variant, vi) => (
                            <div key={vi} style={{ marginBottom: 6 }}>
                                <div style={{ color: '#d1d5db', fontSize: 11, marginBottom: 3 }}>{variant.name}:</div>
                                {variant.options?.map((opt, oi) => (
                                    <div
                                        key={oi}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            fontSize: 12,
                                        }}
                                    >
                                        <span style={{ color: '#e5e7eb' }}>{opt.label}</span>
                                        <span
                                            style={{
                                                color:
                                                    (opt.stock ?? 0) === 0
                                                        ? '#f87171'
                                                        : (opt.stock ?? 0) < 10
                                                          ? '#fb923c'
                                                          : '#4ade80',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {(opt.stock ?? 0).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div
                            style={{
                                borderTop: '1px solid #4b5563',
                                marginTop: 6,
                                paddingTop: 6,
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span style={{ color: '#9ca3af' }}>Tổng:</span>
                            <span style={{ color: '#fff', fontWeight: 700 }}>{stock.toLocaleString('vi-VN')}</span>
                        </div>
                    </div>
                ) : null;

                return (
                    <Tooltip title={tooltipContent} color="#1f2937" overlayStyle={{ maxWidth: 260 }}>
                        <div style={{ cursor: hasVariantStock ? 'help' : 'default' }}>
                            <div
                                style={{
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: stockColor,
                                    lineHeight: 1.2,
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {stock.toLocaleString('vi-VN')}
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: stockColor,
                                    background: stockColor + '18',
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                    display: 'inline-block',
                                    marginTop: 2,
                                }}
                            >
                                {stockLabel}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                                Bán: {(r.sold || 0).toLocaleString('vi-VN')}
                            </div>
                            {hasVariantStock && (
                                <div style={{ fontSize: 10, color: '#6366f1', marginTop: 2 }}>
                                    {r.variants.length} biến thể ℹ️
                                </div>
                            )}
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Đánh giá',
            key: 'rating',
            align: 'center',
            width: 90,
            render: (_, r) => {
                const avg = r.averageRating || r.ratingAverage || 0;
                const cnt = r.totalReviews || r.ratingCount || 0;
                return avg > 0 ? (
                    <div>
                        <StarFilled style={{ color: '#facc15', fontSize: 12 }} /> {avg.toFixed(1)}
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {cnt} đánh giá
                        </Text>
                    </div>
                ) : (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        —
                    </Text>
                );
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            align: 'center',
            width: 110,
            render: (_, r) => (
                <Tag color={STATUS_COLOR[r.status] || 'default'} style={{ fontSize: 11 }}>
                    {STATUS_LABEL[r.status] || r.status}
                </Tag>
            ),
        },
        {
            title: 'Ship (cm/g)',
            key: 'dims',
            align: 'center',
            width: 115,
            render: (_, r) => (
                <Text type="secondary" style={{ fontSize: 11 }}>
                    {r.length}×{r.width}×{r.height}
                    <br />
                    {r.weight}g
                </Text>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 130,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Cài Flash Sale">
                        <Button
                            type="text"
                            icon={
                                <ThunderboltOutlined
                                    style={{ color: r.isFlashSale ? '#f97316' : '#bfbfbf', fontSize: 16 }}
                                />
                            }
                            onClick={() => openFlashModal(r)}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: '#1e40af' }} />}
                            onClick={() => openModal(r)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa sản phẩm này?"
                        onConfirm={() => handleDelete(r._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    /* ── Summary cards ── */
    const totalProducts = products.length;
    const totalActive = products.filter((p) => p.status === 'active').length;
    const totalPending = products.filter((p) => p.status === 'pending').length;
    const totalFlash = products.filter((p) => p.isFlashSale).length;
    const totalSold = products.reduce((s, p) => s + (p.sold || 0), 0);

    const cards = [
        { label: 'Tổng SP', value: totalProducts, color: '#6366f1', icon: <AppstoreOutlined /> },
        { label: 'Đang bán', value: totalActive, color: '#10b981', icon: <EyeOutlined /> },
        { label: 'Chờ duyệt', value: totalPending, color: '#f59e0b', icon: <ClockCircleOutlined /> },
        { label: 'Flash Sale', value: totalFlash, color: '#f97316', icon: <FireOutlined /> },
        { label: 'Tổng đã bán', value: totalSold, color: '#8b5cf6', icon: <StarFilled /> },
    ];

    return (
        <div>
            {/* Header */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        Quản lý Sản phẩm
                    </Title>
                    <Text type="secondary">{totalProducts} sản phẩm trong cửa hàng</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openModal()}
                    style={{
                        background: 'linear-gradient(135deg,#1e40af,#6366f1)',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                    }}
                >
                    Thêm sản phẩm
                </Button>
            </div>

            {/* Summary cards */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                {cards.map((c) => (
                    <Col key={c.label} xs={12} sm={8} md={24 / cards.length}>
                        <Card
                            size="small"
                            style={{ borderRadius: 10, border: '1px solid #e8ecf3' }}
                            bodyStyle={{ padding: '12px 16px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                    style={{
                                        background: c.color + '18',
                                        color: c.color,
                                        borderRadius: 8,
                                        padding: 8,
                                        fontSize: 18,
                                        lineHeight: 1,
                                    }}
                                >
                                    {c.icon}
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                        {c.label}
                                    </Text>
                                    <Text strong style={{ fontSize: 18, color: c.color }}>
                                        {c.value}
                                    </Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                <Input
                    placeholder="Tìm theo tên / thương hiệu..."
                    prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 260, borderRadius: 8 }}
                    allowClear
                />
                <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 160 }}>
                    <Option value="all">Tất cả trạng thái</Option>
                    <Option value="active">Đang bán</Option>
                    <Option value="pending">Chờ duyệt</Option>
                    <Option value="rejected">Từ chối</Option>
                </Select>
                <Tag
                    color={filterFlash ? 'orange' : 'default'}
                    icon={<FireOutlined />}
                    onClick={() => setFilterFlash((f) => !f)}
                    style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 13, userSelect: 'none' }}
                >
                    Flash Sale
                </Tag>
                <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 13 }}>
                    Hiển thị {filtered.length} / {totalProducts}
                </Text>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    scroll={{ x: 1060 }}
                    pagination={{ pageSize: 12, showSizeChanger: true, pageSizeOptions: ['12', '25', '50'] }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                    rowClassName={(r) =>
                        r.status === 'pending' ? 'row-pending' : r.status === 'rejected' ? 'row-rejected' : ''
                    }
                />
            </motion.div>

            {/* ── Modal Thêm/Sửa ── */}
            <Modal
                title={
                    <Space>
                        {editingProduct ? (
                            <EditOutlined style={{ color: '#1e40af' }} />
                        ) : (
                            <PlusOutlined style={{ color: '#1e40af' }} />
                        )}
                        {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                    </Space>
                }
                open={isModalOpen}
                onCancel={() => !submitting && setIsModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={submitting}
                okText={editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                cancelText="Hủy"
                width={820}
                styles={{ body: { maxHeight: '74vh', overflowY: 'auto' } }}
                okButtonProps={{ style: { background: '#1e40af', borderColor: '#1e40af' } }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                    <Tabs
                        items={[
                            {
                                key: 'basic',
                                label: 'Thông tin cơ bản',
                                children: (
                                    <>
                                        <Row gutter={16}>
                                            <Col span={16}>
                                                <Form.Item
                                                    name="name"
                                                    label="Tên sản phẩm"
                                                    rules={[{ required: true, message: 'Nhập tên sản phẩm' }]}
                                                >
                                                    <Input placeholder="VD: Áo thun nam oversize cotton 100%" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item name="brand" label="Thương hiệu">
                                                    <Input placeholder="VD: Nike, Adidas..." />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="category"
                                            label="Danh mục"
                                            rules={[{ required: true, message: 'Chọn danh mục' }]}
                                        >
                                            <Select placeholder="Chọn danh mục" showSearch optionFilterProp="children">
                                                {categories.map((c) => (
                                                    <Option key={c._id} value={c._id}>
                                                        {c.name}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item name="shortDescription" label="Mô tả ngắn">
                                            <Input placeholder="Tóm tắt nổi bật của sản phẩm (hiển thị ở card)" />
                                        </Form.Item>

                                        <Form.Item name="description" label="Mô tả chi tiết">
                                            <TextArea
                                                rows={5}
                                                placeholder="Mô tả đầy đủ: chất liệu, tính năng, hướng dẫn sử dụng..."
                                            />
                                        </Form.Item>

                                        <Divider orientation="left" style={{ fontSize: 13 }}>
                                            Hình ảnh sản phẩm (tối đa 8 ảnh)
                                        </Divider>
                                        <Upload
                                            listType="picture-card"
                                            fileList={fileList}
                                            onChange={({ fileList: fl }) => setFileList(fl)}
                                            beforeUpload={() => false}
                                            multiple
                                            accept="image/*"
                                        >
                                            {fileList.length < 8 && (
                                                <div>
                                                    <UploadOutlined />
                                                    <div style={{ marginTop: 4, fontSize: 12 }}>Tải ảnh</div>
                                                </div>
                                            )}
                                        </Upload>
                                    </>
                                ),
                            },
                            {
                                key: 'pricing',
                                label: 'Giá & Kho',
                                children: (
                                    <div style={{ paddingTop: 8 }}>
                                        {hasVariants && (
                                            <Alert
                                                type="info"
                                                showIcon
                                                style={{ marginBottom: 16, borderRadius: 8 }}
                                                message="Giá & kho tự động tính từ biến thể"
                                                description={
                                                    'Sản phẩm có biến thể. Giá bán = giá thấp nhất, tồn kho = tổng tất cả option. Hãy điều chỉnh trong tab "Biến thể".'
                                                }
                                            />
                                        )}
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="price"
                                                    label="Giá bán (₫)"
                                                    rules={[{ required: !hasVariants, message: 'Nhập giá bán' }]}
                                                    tooltip={
                                                        hasVariants
                                                            ? 'Tự động tính từ biến thể (giá thấp nhất)'
                                                            : undefined
                                                    }
                                                >
                                                    <InputNumber
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        disabled={hasVariants}
                                                        placeholder={
                                                            hasVariants ? 'Tự động tính từ biến thể' : undefined
                                                        }
                                                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={(v) => v.replace(/,/g, '')}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item name="originalPrice" label="Giá gốc / Thị trường (₫)">
                                                    <InputNumber
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={(v) => v.replace(/,/g, '')}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="stock"
                                                    label="Tồn kho"
                                                    rules={[{ required: !hasVariants, message: 'Nhập số lượng' }]}
                                                    tooltip={
                                                        hasVariants
                                                            ? 'Tự động tính từ biến thể (tổng tất cả option)'
                                                            : undefined
                                                    }
                                                >
                                                    <InputNumber
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        disabled={hasVariants}
                                                        placeholder={
                                                            hasVariants ? 'Tự động tính từ biến thể' : undefined
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ),
                            },
                            {
                                key: 'variants',
                                label: 'Biến thể',
                                children: (
                                    <div style={{ paddingTop: 8 }}>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 13, display: 'block', marginBottom: 12 }}
                                        >
                                            Thêm nhóm biến thể (màu sắc, kích thước...). Mỗi tùy chọn có giá và tồn kho
                                            riêng.
                                        </Text>
                                        <Form.List name="variants">
                                            {(varFields, { add: addVar, remove: removeVar }) => (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {varFields.map((varField) => (
                                                        <Card
                                                            key={varField.key}
                                                            size="small"
                                                            style={{ borderRadius: 10, border: '1.5px solid #e0e7ff' }}
                                                            title={
                                                                <Form.Item
                                                                    name={[varField.name, 'name']}
                                                                    noStyle
                                                                    rules={[
                                                                        { required: true, message: 'Nhập tên nhóm' },
                                                                    ]}
                                                                >
                                                                    <Input
                                                                        placeholder="Tên nhóm (VD: Màu sắc, Kích cỡ)"
                                                                        style={{ fontWeight: 600, width: 250 }}
                                                                    />
                                                                </Form.Item>
                                                            }
                                                            extra={
                                                                <Button
                                                                    danger
                                                                    size="small"
                                                                    type="text"
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => removeVar(varField.name)}
                                                                >
                                                                    Xóa nhóm
                                                                </Button>
                                                            }
                                                        >
                                                            <Row gutter={8} style={{ marginBottom: 6 }}>
                                                                <Col span={6}>
                                                                    <Text
                                                                        type="secondary"
                                                                        style={{ fontSize: 11, fontWeight: 600 }}
                                                                    >
                                                                        NHÃN
                                                                    </Text>
                                                                </Col>
                                                                <Col span={7}>
                                                                    <Text
                                                                        type="secondary"
                                                                        style={{ fontSize: 11, fontWeight: 600 }}
                                                                    >
                                                                        GIÁ (₫)
                                                                    </Text>
                                                                </Col>
                                                                <Col span={4}>
                                                                    <Text
                                                                        type="secondary"
                                                                        style={{ fontSize: 11, fontWeight: 600 }}
                                                                    >
                                                                        KHO
                                                                    </Text>
                                                                </Col>
                                                                <Col span={5}>
                                                                    <Text
                                                                        type="secondary"
                                                                        style={{ fontSize: 11, fontWeight: 600 }}
                                                                    >
                                                                        SKU
                                                                    </Text>
                                                                </Col>
                                                                <Col span={2} />
                                                            </Row>
                                                            <Form.List name={[varField.name, 'options']}>
                                                                {(optFields, { add: addOpt, remove: removeOpt }) => (
                                                                    <div>
                                                                        {optFields.map((optField) => (
                                                                            <Row
                                                                                key={optField.key}
                                                                                gutter={8}
                                                                                style={{ marginBottom: 10 }}
                                                                                align="middle"
                                                                            >
                                                                                <Col span={6}>
                                                                                    <Form.Item
                                                                                        name={[optField.name, 'label']}
                                                                                        noStyle
                                                                                        rules={[{ required: true }]}
                                                                                    >
                                                                                        <Input placeholder="VD: Đỏ, XL" />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col span={7}>
                                                                                    <Form.Item
                                                                                        name={[optField.name, 'price']}
                                                                                        noStyle
                                                                                        rules={[{ required: true }]}
                                                                                    >
                                                                                        <InputNumber
                                                                                            style={{ width: '100%' }}
                                                                                            min={0}
                                                                                            formatter={(v) =>
                                                                                                `${v}`.replace(
                                                                                                    /\B(?=(\d{3})+(?!\d))/g,
                                                                                                    ',',
                                                                                                )
                                                                                            }
                                                                                            parser={(v) =>
                                                                                                v.replace(/,/g, '')
                                                                                            }
                                                                                        />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col span={4}>
                                                                                    <Form.Item
                                                                                        name={[optField.name, 'stock']}
                                                                                        noStyle
                                                                                    >
                                                                                        <InputNumber
                                                                                            style={{ width: '100%' }}
                                                                                            min={0}
                                                                                        />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col span={5}>
                                                                                    <Form.Item
                                                                                        name={[optField.name, 'sku']}
                                                                                        noStyle
                                                                                    >
                                                                                        <Input placeholder="SKU-001" />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col
                                                                                    span={2}
                                                                                    style={{ textAlign: 'center' }}
                                                                                >
                                                                                    <Button
                                                                                        danger
                                                                                        type="text"
                                                                                        icon={<DeleteOutlined />}
                                                                                        onClick={() =>
                                                                                            removeOpt(optField.name)
                                                                                        }
                                                                                    />
                                                                                </Col>
                                                                            </Row>
                                                                        ))}
                                                                        <Button
                                                                            type="dashed"
                                                                            icon={<PlusOutlined />}
                                                                            onClick={() =>
                                                                                addOpt({
                                                                                    label: '',
                                                                                    price: 0,
                                                                                    stock: 0,
                                                                                    sku: '',
                                                                                })
                                                                            }
                                                                            style={{
                                                                                borderColor: '#6366f1',
                                                                                color: '#6366f1',
                                                                                marginTop: 4,
                                                                            }}
                                                                        >
                                                                            Thêm tùy chọn
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </Form.List>
                                                        </Card>
                                                    ))}
                                                    <Button
                                                        type="dashed"
                                                        block
                                                        icon={<PlusOutlined />}
                                                        onClick={() =>
                                                            addVar({
                                                                name: '',
                                                                options: [{ label: '', price: 0, stock: 0, sku: '' }],
                                                            })
                                                        }
                                                        style={{ borderColor: '#6366f1', color: '#6366f1', height: 42 }}
                                                    >
                                                        Thêm nhóm biến thể
                                                    </Button>
                                                </div>
                                            )}
                                        </Form.List>
                                    </div>
                                ),
                            },
                            {
                                key: 'attributes',
                                label: 'Thông số KT',
                                children: (
                                    <div style={{ paddingTop: 8 }}>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 13, display: 'block', marginBottom: 12 }}
                                        >
                                            Thông số kỹ thuật hiển thị trong bảng chi tiết trang sản phẩm.
                                        </Text>
                                        <Row gutter={12} style={{ marginBottom: 8 }}>
                                            <Col span={11}>
                                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                                                    TÊN THÔNG SỐ
                                                </Text>
                                            </Col>
                                            <Col span={11}>
                                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                                                    GIÁ TRỊ
                                                </Text>
                                            </Col>
                                        </Row>
                                        <Form.List name="attributes">
                                            {(attrFields, { add: addAttr, remove: removeAttr }) => (
                                                <div>
                                                    {attrFields.map((attrField) => (
                                                        <Row
                                                            key={attrField.key}
                                                            gutter={12}
                                                            style={{ marginBottom: 10 }}
                                                            align="middle"
                                                        >
                                                            <Col span={11}>
                                                                <Form.Item
                                                                    name={[attrField.name, 'name']}
                                                                    noStyle
                                                                    rules={[{ required: true }]}
                                                                >
                                                                    <Input placeholder="VD: RAM, CPU, Chất liệu..." />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={11}>
                                                                <Form.Item
                                                                    name={[attrField.name, 'value']}
                                                                    noStyle
                                                                    rules={[{ required: true }]}
                                                                >
                                                                    <Input placeholder="VD: 8GB, Intel i5, Cotton 100%..." />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={2} style={{ textAlign: 'center' }}>
                                                                <Button
                                                                    danger
                                                                    type="text"
                                                                    size="small"
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => removeAttr(attrField.name)}
                                                                />
                                                            </Col>
                                                        </Row>
                                                    ))}
                                                    <Button
                                                        type="dashed"
                                                        block
                                                        icon={<PlusOutlined />}
                                                        onClick={() => addAttr({ name: '', value: '' })}
                                                        style={{
                                                            marginTop: 8,
                                                            borderColor: '#6366f1',
                                                            color: '#6366f1',
                                                            height: 40,
                                                        }}
                                                    >
                                                        Thêm thông số kỹ thuật
                                                    </Button>
                                                </div>
                                            )}
                                        </Form.List>
                                    </div>
                                ),
                            },
                            {
                                key: 'shipping',
                                label: 'Vận chuyển',
                                children: (
                                    <>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 13, display: 'block', marginBottom: 16 }}
                                        >
                                            Thông tin kích thước dùng để tính phí vận chuyển GHN. Đơn vị: cm và gram.
                                        </Text>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="weight" label="Khối lượng">
                                                    <InputNumber min={1} addonAfter="gram" style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="length" label="Chiều dài">
                                                    <InputNumber min={1} addonAfter="cm" style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="width" label="Chiều rộng">
                                                    <InputNumber min={1} addonAfter="cm" style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="height" label="Chiều cao">
                                                    <InputNumber min={1} addonAfter="cm" style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </>
                                ),
                            },
                        ]}
                    />
                </Form>
            </Modal>

            {/* ── Modal Flash Sale ── */}
            <Modal
                title={
                    <Space>
                        <ThunderboltOutlined style={{ color: '#f97316' }} />
                        Cài đặt Flash Sale
                    </Space>
                }
                open={flashModalOpen}
                onCancel={() => setFlashModalOpen(false)}
                onOk={handleSaveFlash}
                confirmLoading={flashSaving}
                okText="Lưu Flash Sale"
                cancelText="Hủy"
                okButtonProps={{ style: { background: '#f97316', borderColor: '#f97316' } }}
            >
                <Form form={flashForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="isFlashSale" label="Kích hoạt Flash Sale" valuePropName="checked">
                        <Switch checkedChildren={<FireOutlined />} unCheckedChildren="Tắt" />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.isFlashSale !== curr.isFlashSale}>
                        {({ getFieldValue }) =>
                            getFieldValue('isFlashSale') ? (
                                <>
                                    <Form.Item
                                        name="flashSalePrice"
                                        label="Giá Flash Sale (₫)"
                                        rules={[{ required: true, message: 'Nhập giá flash sale' }]}
                                    >
                                        <InputNumber
                                            min={0}
                                            style={{ width: '100%' }}
                                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={(v) => v.replace(/,/g, '')}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="flashSaleEndTime"
                                        label="Thời gian kết thúc"
                                        rules={[{ required: true, message: 'Chọn thời gian kết thúc' }]}
                                    >
                                        <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
                                    </Form.Item>
                                </>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .row-pending  { background: #fffbeb !important; }
                .row-rejected { background: #fff1f2 !important; }
            `}</style>
        </div>
    );
}

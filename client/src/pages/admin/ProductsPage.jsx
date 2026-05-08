import { useState, useEffect, useCallback } from 'react';
import {
    Typography,
    Table,
    Tag,
    Button,
    Input,
    Switch,
    message,
    Popconfirm,
    Modal,
    Form,
    InputNumber,
    Select,
    Upload,
    Divider,
    Tabs,
    Space,
    Badge,
    Tooltip,
    Row,
    Col,
    Checkbox,
    DatePicker,
    Card,
    Drawer,
    Alert,
} from 'antd';
import {
    SearchOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    UploadOutlined,
    StarFilled,
    FireOutlined,
    EyeOutlined,
    TagOutlined,
    ShopOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import {
    adminGetAllProducts,
    adminCreateProduct,
    adminUpdateProduct,
    adminDeleteProduct,
    adminToggleProduct,
} from '../../api/apiProduct';
import { getAllCategories } from '../../api/apiCategory';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const STATUS_COLORS = { active: 'success', pending: 'warning', rejected: 'error' };
const STATUS_LABELS = { active: 'Đang bán', pending: 'Chờ duyệt', rejected: 'Từ chối' };

/* ─── Helpers ─────────────────────────────────────────────── */
const fmt = (n) => (n ?? 0).toLocaleString('vi-VN');

export default function ProductsPage() {
    // ── state ──
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterFeatured, setFilterFeatured] = useState(false);
    const [filterFlash, setFilterFlash] = useState(false);

    // modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null); // null = tạo mới
    const [saving, setSaving] = useState(false);
    const [fileList, setFileList] = useState([]);

    const [form] = Form.useForm();
    // Watch variants field → nếu có biến thể thì disable giá & kho cơ bản
    const watchedVariants = Form.useWatch('variants', form);
    const hasVariants = Array.isArray(watchedVariants) && watchedVariants.length > 0;

    /* ── fetch ── */
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminGetAllProducts({ limit: 200 });
            const raw = res.data?.metadata;
            setProducts(Array.isArray(raw) ? raw : (raw?.products ?? []));
        } catch {
            message.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await getAllCategories();
            const raw = res.data?.metadata;
            setCategories(Array.isArray(raw) ? raw : (raw?.categories ?? []));
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts, fetchCategories]);

    /* ── flatten categories (cha + con) ── */
    const flatCategories = categories.flatMap((c) =>
        c.children?.length
            ? [{ ...c, _isParent: true }, ...c.children.map((ch) => ({ ...ch, _isChild: true }))]
            : [{ ...c, _isParent: !c.parent }],
    );

    /* ── filter ── */
    const filtered = products.filter((p) => {
        const matchSearch =
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.brand?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchFeatured = !filterFeatured || p.isFeatured;
        const matchFlash = !filterFlash || p.isFlashSale;
        return matchSearch && matchStatus && matchFeatured && matchFlash;
    });

    /* ── toggle active ── */
    const handleToggle = async (id) => {
        try {
            await adminToggleProduct(id);
            message.success('Đã cập nhật trạng thái hiển thị!');
            fetchProducts();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi cập nhật');
        }
    };

    /* ── delete ── */
    const handleDelete = async (id) => {
        try {
            await adminDeleteProduct(id);
            message.success('Xóa sản phẩm thành công!');
            fetchProducts();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi xóa');
        }
    };

    /* ── open modal ── */
    const openCreate = () => {
        setEditProduct(null);
        setFileList([]);
        form.resetFields();
        form.setFieldsValue({
            status: 'active',
            isActive: true,
            isFeatured: false,
            isFlashSale: false,
            weight: 500,
            length: 15,
            width: 15,
            height: 10,
            variants: [],
            attributes: [],
        });
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setEditProduct(record);
        setFileList(
            (record.images || []).map((url, i) => ({
                uid: `-${i}`,
                name: `image-${i}`,
                status: 'done',
                url,
            })),
        );
        form.setFieldsValue({
            name: record.name,
            brand: record.brand,
            category: record.category?._id || record.category,
            price: record.price,
            originalPrice: record.originalPrice,
            stock: record.stock,
            status: record.status,
            isActive: record.isActive !== false,
            isFeatured: !!record.isFeatured,
            isFlashSale: !!record.isFlashSale,
            flashSalePrice: record.flashSalePrice,
            flashSaleEndTime: record.flashSaleEndTime ? dayjs(record.flashSaleEndTime) : null,
            shortDescription: record.shortDescription,
            description: record.description,
            weight: record.weight ?? 500,
            length: record.length ?? 15,
            width: record.width ?? 15,
            height: record.height ?? 10,
            variants: record.variants || [],
            attributes: record.attributes || [],
        });
        setModalOpen(true);
    };

    /* ── submit ── */
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const fd = new FormData();
            Object.entries(values).forEach(([k, v]) => {
                if (v === undefined || v === null) return;
                if (k === 'flashSaleEndTime') {
                    fd.append(k, v ? v.toISOString() : '');
                    return;
                }
                // JSON fields
                if (k === 'variants' || k === 'attributes') {
                    fd.append(k, JSON.stringify(v || []));
                    return;
                }
                // Boolean → gửi string 'true'/'false'
                if (typeof v === 'boolean') {
                    fd.append(k, String(v));
                    return;
                }
                fd.append(k, v);
            });

            // ảnh mới (file object)
            fileList.forEach((f) => {
                if (f.originFileObj) fd.append('images', f.originFileObj);
            });

            // ảnh cũ (url string) — gửi dạng JSON array để backend parse nhất quán
            const existingUrls = fileList.filter((f) => !f.originFileObj && f.url).map((f) => f.url);
            fd.append('existingImages', JSON.stringify(existingUrls));

            if (editProduct) {
                await adminUpdateProduct(editProduct._id, fd);
                message.success('Cập nhật sản phẩm thành công!');
            } else {
                await adminCreateProduct(fd);
                message.success('Tạo sản phẩm thành công!');
            }
            setModalOpen(false);
            fetchProducts();
        } catch (err) {
            if (err?.errorFields) return; // validation error
            message.error(err.response?.data?.message || 'Lỗi lưu sản phẩm');
        } finally {
            setSaving(false);
        }
    };

    /* ── columns ── */
    const columns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            width: 300,
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={r.images?.[0] || 'https://placehold.co/48'}
                            alt={r.name}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 8,
                                objectFit: 'cover',
                                border: '1px solid #e8ecf3',
                                flexShrink: 0,
                            }}
                        />
                        {r.isFlashSale && (
                            <FireOutlined
                                style={{ position: 'absolute', top: -4, right: -4, color: '#f97316', fontSize: 13 }}
                            />
                        )}
                    </div>
                    <div>
                        <Text
                            strong
                            style={{
                                display: 'block',
                                maxWidth: 220,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: 13,
                            }}
                        >
                            {r.name}
                        </Text>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {r.category?.name || '—'}
                            </Text>
                            {r.brand && <Text style={{ fontSize: 11, color: '#6366f1' }}>· {r.brand}</Text>}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Giá / Giá gốc',
            key: 'pricing',
            align: 'right',
            width: 160,
            render: (_, r) => (
                <div>
                    <Text strong style={{ color: '#7c3aed', display: 'block' }}>
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
                const stock = r.stock ?? 0;
                const stockColor =
                    stock === 0 ? '#ef4444' : stock < 10 ? '#f97316' : stock < 50 ? '#f59e0b' : '#10b981';
                const stockLabel = stock === 0 ? 'Hết hàng' : stock < 10 ? 'Sắp hết' : stock < 50 ? 'Thấp' : 'Còn hàng';

                // Tạo nội dung tooltip cho biến thể
                const hasVariantStock = r.variants?.length > 0 && r.variants.some((v) => v.options?.length > 0);
                // Tính tổng thực từ variant options (không dùng r.stock có thể chưa sync)
                const variantTotal = hasVariantStock
                    ? r.variants.reduce((sum, v) => sum + (v.options?.reduce((s, o) => s + (o.stock ?? 0), 0) ?? 0), 0)
                    : stock;
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
                            <span style={{ color: '#fff', fontWeight: 700 }}>
                                {variantTotal.toLocaleString('vi-VN')}
                            </span>
                        </div>
                    </div>
                ) : null;

                return (
                    <Tooltip title={tooltipContent} color="#1f2937" overlayStyle={{ maxWidth: 260 }}>
                        <div style={{ cursor: hasVariantStock ? 'help' : 'default' }}>
                            {/* Số tồn kho lớn rõ ràng */}
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
                            {/* Badge trạng thái */}
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
                            {/* Số đã bán */}
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                                Bán: {(r.sold || 0).toLocaleString('vi-VN')}
                            </div>
                            {/* Badge biến thể */}
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
            width: 100,
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
            width: 120,
            render: (_, r) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Tag color={STATUS_COLORS[r.status] || 'default'} style={{ fontSize: 11 }}>
                        {STATUS_LABELS[r.status] || r.status}
                    </Tag>
                    {r.isFeatured && (
                        <Tag color="purple" icon={<StarFilled />} style={{ fontSize: 10 }}>
                            Nổi bật
                        </Tag>
                    )}
                    {r.store && (
                        <Tag color="cyan" icon={<ShopOutlined />} style={{ fontSize: 10 }}>
                            Seller
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Kích thước (cm/g)',
            key: 'dims',
            align: 'center',
            width: 130,
            render: (_, r) => (
                <Text type="secondary" style={{ fontSize: 11 }}>
                    {r.length}×{r.width}×{r.height} cm
                    <br />
                    {r.weight}g
                </Text>
            ),
        },
        {
            title: 'Hiển thị',
            key: 'isActive',
            align: 'center',
            width: 80,
            render: (_, r) => (
                <Switch checked={r.isActive !== false} onChange={() => handleToggle(r._id)} size="small" />
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 100,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Popconfirm
                        title="Bạn có chắc muốn xóa sản phẩm này?"
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

    /* ── summary cards ── */
    const totalProducts = products.length;
    const totalActive = products.filter((p) => p.isActive !== false).length;
    const totalFlash = products.filter((p) => p.isFlashSale).length;
    const totalFeatured = products.filter((p) => p.isFeatured).length;
    const totalPending = products.filter((p) => p.status === 'pending').length;

    const summaryCards = [
        { label: 'Tổng sản phẩm', value: totalProducts, color: '#6366f1', icon: <AppstoreOutlined /> },
        { label: 'Đang hiển thị', value: totalActive, color: '#10b981', icon: <EyeOutlined /> },
        { label: 'Flash Sale', value: totalFlash, color: '#f97316', icon: <FireOutlined /> },
        { label: 'Nổi bật', value: totalFeatured, color: '#8b5cf6', icon: <StarFilled /> },
        { label: 'Chờ duyệt', value: totalPending, color: '#f59e0b', icon: <TagOutlined /> },
    ];

    return (
        <div>
            {/* Header */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        Quản lý sản phẩm
                    </Title>
                    <Text type="secondary">{totalProducts} sản phẩm trong hệ thống</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    style={{
                        background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
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
                {summaryCards.map((c) => (
                    <Col key={c.label} xs={12} sm={8} md={24 / summaryCards.length}>
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
                <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 150, borderRadius: 8 }}>
                    <Option value="all">Tất cả trạng thái</Option>
                    <Option value="active">Đang bán</Option>
                    <Option value="pending">Chờ duyệt</Option>
                    <Option value="rejected">Từ chối</Option>
                </Select>
                <Checkbox checked={filterFeatured} onChange={(e) => setFilterFeatured(e.target.checked)}>
                    <StarFilled style={{ color: '#8b5cf6' }} /> Nổi bật
                </Checkbox>
                <Checkbox checked={filterFlash} onChange={(e) => setFilterFlash(e.target.checked)}>
                    <FireOutlined style={{ color: '#f97316' }} /> Flash Sale
                </Checkbox>
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
                    scroll={{ x: 1100 }}
                    pagination={{ pageSize: 12, showSizeChanger: true, pageSizeOptions: ['12', '25', '50'] }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                    rowClassName={(r) => (r.status === 'pending' ? 'row-pending' : '')}
                />
            </motion.div>

            {/* ── Add / Edit Modal ── */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {editProduct ? (
                                <EditOutlined style={{ color: '#fff' }} />
                            ) : (
                                <PlusOutlined style={{ color: '#fff' }} />
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>
                                {editProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                            </div>
                            {editProduct && (
                                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                                    ID: {editProduct._id}
                                </div>
                            )}
                        </div>
                    </div>
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSubmit}
                okText={editProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                cancelText="Hủy"
                confirmLoading={saving}
                width={900}
                styles={{ body: { maxHeight: '72vh', overflowY: 'auto', padding: '0 24px 8px' } }}
                okButtonProps={{
                    style: {
                        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                        borderColor: '#4f46e5',
                        fontWeight: 700,
                        height: 38,
                        borderRadius: 8,
                    },
                }}
                cancelButtonProps={{ style: { height: 38, borderRadius: 8 } }}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
                    <Tabs
                        type="card"
                        size="small"
                        items={[
                            /* ── Tab 1: Cơ bản ── */
                            {
                                key: 'basic',
                                label: 'Cơ bản',
                                children: (
                                    <div style={{ padding: '12px 0' }}>
                                        <Row gutter={16}>
                                            <Col span={16}>
                                                <Form.Item
                                                    name="name"
                                                    label={
                                                        <b>
                                                            Tên sản phẩm <span style={{ color: 'red' }}>*</span>
                                                        </b>
                                                    }
                                                    rules={[{ required: true, message: 'Nhập tên sản phẩm' }]}
                                                >
                                                    <Input size="large" placeholder="VD: iPhone 15 Pro Max 256GB" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item name="brand" label={<b>Thương hiệu</b>}>
                                                    <Input size="large" placeholder="VD: Apple, Samsung..." />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={14}>
                                                <Form.Item
                                                    name="category"
                                                    label={
                                                        <b>
                                                            Danh mục <span style={{ color: 'red' }}>*</span>
                                                        </b>
                                                    }
                                                    rules={[{ required: true, message: 'Chọn danh mục' }]}
                                                >
                                                    <Select
                                                        size="large"
                                                        placeholder="Chọn danh mục sản phẩm"
                                                        showSearch
                                                        optionFilterProp="label"
                                                        options={flatCategories.map((c) => ({
                                                            value: c._id,
                                                            label: c._isChild ? `  ↳ ${c.name}` : c.name,
                                                        }))}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={10}>
                                                <Form.Item name="status" label={<b>Trạng thái duyệt</b>}>
                                                    <Select size="large">
                                                        <Option value="active">
                                                            <Tag color="success">Đang bán</Tag>
                                                        </Option>
                                                        <Option value="pending">
                                                            <Tag color="warning">Chờ duyệt</Tag>
                                                        </Option>
                                                        <Option value="rejected">
                                                            <Tag color="error">Từ chối</Tag>
                                                        </Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item name="shortDescription" label={<b>Mô tả ngắn</b>}>
                                            <Input
                                                placeholder="Mô tả ngắn gọn hiển thị ở card sản phẩm..."
                                                showCount
                                                maxLength={200}
                                            />
                                        </Form.Item>
                                        <Form.Item name="description" label={<b>Mô tả chi tiết</b>}>
                                            <Input.TextArea
                                                rows={4}
                                                placeholder="Mô tả đầy đủ tính năng, chất liệu, công nghệ..."
                                                showCount
                                                maxLength={5000}
                                            />
                                        </Form.Item>
                                        <Divider
                                            orientation="left"
                                            style={{ fontSize: 12, color: '#6b7280', margin: '12px 0' }}
                                        >
                                            Hiển thị & Phân loại
                                        </Divider>
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="isActive"
                                                    valuePropName="checked"
                                                    label="Hiển thị sản phẩm"
                                                >
                                                    <Switch checkedChildren="Hiển" unCheckedChildren="Ẩn" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="isFeatured"
                                                    valuePropName="checked"
                                                    label="Đánh dấu nổi bật"
                                                >
                                                    <Switch
                                                        checkedChildren={<StarFilled />}
                                                        unCheckedChildren="Nổi bật"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="isFlashSale"
                                                    valuePropName="checked"
                                                    label="Flash Sale"
                                                >
                                                    <Switch
                                                        checkedChildren={<FireOutlined />}
                                                        unCheckedChildren="Flash"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ),
                            },
                            /* ── Tab 2: Giá & Kho ── */
                            {
                                key: 'pricing',
                                label: 'Giá & Kho',
                                children: (
                                    <div style={{ padding: '12px 0' }}>
                                        {hasVariants && (
                                            <Alert
                                                type="info"
                                                showIcon
                                                style={{ marginBottom: 16, borderRadius: 8 }}
                                                message="Giá & kho tự động tính từ biến thể"
                                                description="Sản phẩm này có biến thể. Giá bán sẽ lấy giá thấp nhất và tồn kho sẽ là tổng tất cả biến thể. Hãy điều chỉnh giá & kho trực tiếp trong tab “Biến thể”."
                                            />
                                        )}
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="price"
                                                    label={
                                                        <b>
                                                            Giá bán (₫) <span style={{ color: 'red' }}>*</span>
                                                        </b>
                                                    }
                                                    rules={[{ required: !hasVariants, message: 'Nhập giá bán' }]}
                                                    tooltip={
                                                        hasVariants
                                                            ? 'Tự động tính từ biến thể (giá thấp nhất)'
                                                            : undefined
                                                    }
                                                >
                                                    <InputNumber
                                                        size="large"
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        addonAfter="₫"
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
                                                <Form.Item name="originalPrice" label={<b>Giá gốc / Niêm yết (₫)</b>}>
                                                    <InputNumber
                                                        size="large"
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        addonAfter="₫"
                                                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={(v) => v.replace(/,/g, '')}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="stock"
                                                    label={<b>Tồn kho</b>}
                                                    tooltip={
                                                        hasVariants
                                                            ? 'Tự động tính từ biến thể (tổng tất cả option)'
                                                            : undefined
                                                    }
                                                >
                                                    <InputNumber
                                                        size="large"
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        addonAfter="sp"
                                                        disabled={hasVariants}
                                                        placeholder={
                                                            hasVariants ? 'Tự động tính từ biến thể' : undefined
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Divider
                                            orientation="left"
                                            style={{ fontSize: 12, color: '#f97316', margin: '12px 0' }}
                                        >
                                            <FireOutlined /> Flash Sale
                                        </Divider>
                                        <Row gutter={16}>
                                            <Col span={10}>
                                                <Form.Item name="flashSalePrice" label={<b>Giá Flash Sale (₫)</b>}>
                                                    <InputNumber
                                                        size="large"
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        addonAfter="₫"
                                                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={(v) => v.replace(/,/g, '')}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={14}>
                                                <Form.Item name="flashSaleEndTime" label={<b>Kết thúc Flash Sale</b>}>
                                                    <DatePicker
                                                        showTime
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                        format="DD/MM/YYYY HH:mm"
                                                        placeholder="Chọn ngày giờ kết thúc"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ),
                            },
                            /* ── Tab 3: Ảnh ── */
                            {
                                key: 'images',
                                label: 'Ảnh',
                                children: (
                                    <div style={{ padding: '12px 0' }}>
                                        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
                                            Tải lên tối đa 8 ảnh. Ảnh đầu tiên sẽ làm ảnh đại diện sản phẩm.
                                        </p>
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
                                                    <UploadOutlined style={{ fontSize: 20, color: '#6366f1' }} />
                                                    <div style={{ marginTop: 8, fontSize: 12 }}>Tải ảnh lên</div>
                                                </div>
                                            )}
                                        </Upload>
                                        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
                                            Đã chọn {fileList.length}/8 ảnh
                                        </p>
                                    </div>
                                ),
                            },
                            /* ── Tab 4: Biến thể ── */
                            {
                                key: 'variants',
                                label: 'Biến thể',
                                children: (
                                    <div style={{ padding: '12px 0' }}>
                                        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
                                            Thêm các biến thể (màu sắc, kích thước...). Mỗi biến thể có giá và tồn kho
                                            riêng.
                                        </p>
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
                                                                        {
                                                                            required: true,
                                                                            message: 'Nhập tên biến thể',
                                                                        },
                                                                    ]}
                                                                >
                                                                    <Input
                                                                        placeholder="Tên nhóm (VD: Màu sắc, Kích cỡ)"
                                                                        style={{ fontWeight: 600, width: 260 }}
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
                                                                <Col span={5}>
                                                                    <Text
                                                                        type="secondary"
                                                                        style={{ fontSize: 11, fontWeight: 600 }}
                                                                    >
                                                                        NHÃN
                                                                    </Text>
                                                                </Col>
                                                                <Col span={6}>
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
                                                                <Col span={6}>
                                                                    <Text
                                                                        type="secondary"
                                                                        style={{ fontSize: 11, fontWeight: 600 }}
                                                                    >
                                                                        SKU
                                                                    </Text>
                                                                </Col>
                                                                <Col span={3}></Col>
                                                            </Row>
                                                            <Form.List name={[varField.name, 'options']}>
                                                                {(optFields, { add: addOpt, remove: removeOpt }) => (
                                                                    <div>
                                                                        {optFields.map((optField) => (
                                                                            <Row
                                                                                key={optField.key}
                                                                                gutter={8}
                                                                                style={{ marginBottom: 12 }}
                                                                                align="middle"
                                                                            >
                                                                                <Col span={5}>
                                                                                    <Form.Item
                                                                                        name={[optField.name, 'label']}
                                                                                        noStyle
                                                                                        rules={[{ required: true }]}
                                                                                    >
                                                                                        <Input placeholder="VD: Đỏ, XL" />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col span={6}>
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
                                                                                <Col span={6}>
                                                                                    <Form.Item
                                                                                        name={[optField.name, 'sku']}
                                                                                        noStyle
                                                                                    >
                                                                                        <Input placeholder="SKU-001" />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col
                                                                                    span={3}
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
                            /* ── Tab 5: Thông số KT ── */
                            {
                                key: 'attributes',
                                label: 'Thông số KT',
                                children: (
                                    <div style={{ padding: '12px 0' }}>
                                        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
                                            Thông số kỹ thuật hiển thị trong bảng chi tiết ở trang sản phẩm.
                                        </p>
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
                                                                    <Input placeholder="VD: 8GB, Intel i5, Cotton..." />
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
                            /* ── Tab 6: Vận chuyển ── */
                            {
                                key: 'shipping',
                                label: 'Vận chuyển',
                                children: (
                                    <div style={{ padding: '12px 0' }}>
                                        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
                                            Kích thước dùng để tính phí vận chuyển tự động qua GHN / GHTK.
                                        </p>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="weight" label={<b>Khối lượng</b>}>
                                                    <InputNumber
                                                        size="large"
                                                        min={1}
                                                        style={{ width: '100%' }}
                                                        addonAfter="gram"
                                                        placeholder="500"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="length" label={<b>Chiều dài</b>}>
                                                    <InputNumber
                                                        size="large"
                                                        min={1}
                                                        style={{ width: '100%' }}
                                                        addonAfter="cm"
                                                        placeholder="15"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="width" label={<b>Chiều rộng</b>}>
                                                    <InputNumber
                                                        size="large"
                                                        min={1}
                                                        style={{ width: '100%' }}
                                                        addonAfter="cm"
                                                        placeholder="15"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="height" label={<b>Chiều cao</b>}>
                                                    <InputNumber
                                                        size="large"
                                                        min={1}
                                                        style={{ width: '100%' }}
                                                        addonAfter="cm"
                                                        placeholder="10"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Form>
            </Modal>

            <style>{`
                .row-pending { background: #fffbeb !important; }
            `}</style>
        </div>
    );
}

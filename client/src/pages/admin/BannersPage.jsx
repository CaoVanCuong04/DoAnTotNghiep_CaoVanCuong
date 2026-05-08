import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Table, Tag, Button, Switch, message, Popconfirm,
    Modal, Form, Input, Select, Upload, Space, Tooltip, Row, Col, Card,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
    EyeOutlined, EyeInvisibleOutlined, PictureOutlined, LinkOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import {
    adminGetAllBanners, adminCreateBanner,
    adminUpdateBanner, adminDeleteBanner, adminToggleBanner,
} from '../../api/apiBanner';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const POSITION_LABEL = { home_main: 'Banner chính', home_sub: 'Banner phụ' };
const POSITION_COLOR = { home_main: 'purple', home_sub: 'blue' };

export default function BannersPage() {
    const [banners, setBanners]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [filterPos, setFilterPos] = useState('all');

    // Modal
    const [modalOpen, setModalOpen]     = useState(false);
    const [editBanner, setEditBanner]   = useState(null);
    const [saving, setSaving]           = useState(false);
    const [fileList, setFileList]       = useState([]);
    const [previewUrl, setPreviewUrl]   = useState('');

    // Preview modal
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewBanner, setPreviewBanner] = useState(null);

    const [form] = Form.useForm();

    /* ── fetch ── */
    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminGetAllBanners({ limit: 100 });
            const raw = res.data?.metadata;
            setBanners(raw?.banners ?? (Array.isArray(raw) ? raw : []));
        } catch {
            message.error('Không thể tải danh sách banner');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBanners(); }, [fetchBanners]);

    /* ── filter ── */
    const filtered = filterPos === 'all'
        ? banners
        : banners.filter(b => b.position === filterPos);

    /* ── toggle ── */
    const handleToggle = async (id) => {
        try {
            await adminToggleBanner(id);
            message.success('Cập nhật trạng thái thành công!');
            fetchBanners();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi cập nhật');
        }
    };

    /* ── delete ── */
    const handleDelete = async (id) => {
        try {
            await adminDeleteBanner(id);
            message.success('Xóa banner thành công!');
            fetchBanners();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi xóa');
        }
    };

    /* ── open modal ── */
    const openCreate = () => {
        setEditBanner(null);
        setFileList([]);
        setPreviewUrl('');
        form.resetFields();
        form.setFieldsValue({ position: 'home_main', isActive: true });
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setEditBanner(record);
        setFileList(
            record.imageUrl
                ? [{ uid: '-1', name: 'banner', status: 'done', url: record.imageUrl }]
                : []
        );
        setPreviewUrl(record.imageUrl || '');
        form.setFieldsValue({
            title:         record.title,
            highlight:     record.highlight,
            subtitle:      record.subtitle,
            date:          record.date,
            cta:           record.cta,
            link:          record.link,
            position:      record.position,
            isActive:      record.isActive !== false,
            lightGradient: record.lightGradient,
            darkGradient:  record.darkGradient,
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
                if (v !== undefined && v !== null) fd.append(k, v);
            });

            // Ảnh mới
            const newFile = fileList.find(f => f.originFileObj);
            if (newFile) fd.append('image', newFile.originFileObj);

            if (editBanner) {
                await adminUpdateBanner(editBanner._id, fd);
                message.success('Cập nhật banner thành công!');
            } else {
                if (!newFile) {
                    message.error('Vui lòng chọn ảnh banner!');
                    setSaving(false);
                    return;
                }
                await adminCreateBanner(fd);
                message.success('Tạo banner thành công!');
            }
            setModalOpen(false);
            fetchBanners();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err.response?.data?.message || 'Lỗi lưu banner');
        } finally {
            setSaving(false);
        }
    };

    /* ── preview ── */
    const openPreview = (record) => {
        setPreviewBanner(record);
        setPreviewOpen(true);
    };

    /* ── upload preview ── */
    const handleUploadChange = ({ fileList: fl }) => {
        setFileList(fl);
        const last = fl[fl.length - 1];
        if (last?.originFileObj) {
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(last.originFileObj);
        } else if (last?.url) {
            setPreviewUrl(last.url);
        } else {
            setPreviewUrl('');
        }
    };

    /* ── stat cards ── */
    const totalActive   = banners.filter(b => b.isActive !== false).length;
    const totalMain     = banners.filter(b => b.position === 'home_main').length;
    const totalSub      = banners.filter(b => b.position === 'home_sub').length;

    const statCards = [
        { label: 'Tổng banner',    value: banners.length, color: '#6366f1', icon: <PictureOutlined /> },
        { label: 'Đang hiển thị',  value: totalActive,    color: '#10b981', icon: <EyeOutlined /> },
        { label: 'Banner chính',   value: totalMain,       color: '#8b5cf6', icon: <PictureOutlined /> },
        { label: 'Banner phụ',     value: totalSub,        color: '#3b82f6', icon: <PictureOutlined /> },
    ];

    /* ── columns ── */
    const columns = [
        {
            title: 'Hình ảnh',
            key: 'image',
            width: 140,
            render: (_, r) => (
                <div
                    style={{
                        width: 120, height: 64, borderRadius: 8, overflow: 'hidden',
                        border: '1px solid #e8ecf3', cursor: 'pointer', position: 'relative',
                        background: r.lightGradient || '#f4f6fb',
                    }}
                    onClick={() => openPreview(r)}
                >
                    {r.imageUrl
                        ? <img src={r.imageUrl} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                            <PictureOutlined style={{ fontSize: 24 }} />
                          </div>
                    }
                    <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: '0.2s',
                    }} className="img-overlay">
                        <EyeOutlined style={{ color: '#fff', fontSize: 18 }} />
                    </div>
                </div>
            ),
        },
        {
            title: 'Tiêu đề / Nội dung',
            key: 'content',
            render: (_, r) => (
                <div>
                    <Text strong style={{ display: 'block', fontSize: 13 }}>{r.title}</Text>
                    {r.highlight && <Tag color="gold" style={{ fontSize: 10, marginTop: 2 }}>{r.highlight}</Tag>}
                    {r.subtitle && <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>{r.subtitle}</Text>}
                    {r.date && <Text style={{ fontSize: 11, color: '#9ca3af' }}>📅 {r.date}</Text>}
                    {r.cta && <Tag style={{ marginTop: 4, fontSize: 10 }}>{r.cta}</Tag>}
                </div>
            ),
        },
        {
            title: 'Vị trí',
            dataIndex: 'position',
            key: 'position',
            align: 'center',
            width: 130,
            render: (pos) => <Tag color={POSITION_COLOR[pos] || 'default'}>{POSITION_LABEL[pos] || pos}</Tag>,
        },
        {
            title: 'Gradient',
            key: 'gradient',
            align: 'center',
            width: 130,
            render: (_, r) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                    {r.lightGradient && (
                        <div title={r.lightGradient} style={{
                            width: 80, height: 14, borderRadius: 4,
                            background: r.lightGradient, border: '1px solid #e8ecf3',
                        }} />
                    )}
                    {r.darkGradient && (
                        <div title={r.darkGradient} style={{
                            width: 80, height: 14, borderRadius: 4,
                            background: r.darkGradient, border: '1px solid #e8ecf3',
                        }} />
                    )}
                    {!r.lightGradient && !r.darkGradient && <Text type="secondary" style={{ fontSize: 11 }}>—</Text>}
                </div>
            ),
        },
        {
            title: 'Liên kết',
            key: 'link',
            width: 120,
            render: (_, r) => r.link
                ? <a href={r.link} target="_blank" rel="noreferrer">
                    <LinkOutlined /> <Text style={{ fontSize: 11 }}>Xem link</Text>
                  </a>
                : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
        },
        {
            title: 'Hiển thị',
            key: 'isActive',
            align: 'center',
            width: 90,
            render: (_, r) => (
                <Switch
                    checked={r.isActive !== false}
                    onChange={() => handleToggle(r._id)}
                    size="small"
                    checkedChildren={<EyeOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                />
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 110,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Xem trước">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => openPreview(r)} />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined style={{ color: '#6366f1' }} />} onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa banner này?"
                        onConfirm={() => handleDelete(r._id)}
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Quản lý Banner</Title>
                    <Text type="secondary">{banners.length} banner trong hệ thống</Text>
                </div>
                <Button
                    type="primary" icon={<PlusOutlined />} onClick={openCreate}
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)', border: 'none', borderRadius: 8, fontWeight: 600 }}
                >
                    Thêm banner
                </Button>
            </div>

            {/* Stat cards */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                {statCards.map(c => (
                    <Col key={c.label} xs={12} md={6}>
                        <Card size="small" style={{ borderRadius: 10, border: '1px solid #e8ecf3' }} bodyStyle={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ background: c.color + '18', color: c.color, borderRadius: 8, padding: 8, fontSize: 18, lineHeight: 1 }}>
                                    {c.icon}
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{c.label}</Text>
                                    <Text strong style={{ fontSize: 20, color: c.color }}>{c.value}</Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Filter */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                <Select value={filterPos} onChange={setFilterPos} style={{ width: 180 }}>
                    <Option value="all">Tất cả vị trí</Option>
                    <Option value="home_main">Banner chính</Option>
                    <Option value="home_sub">Banner phụ</Option>
                </Select>
                <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 13 }}>
                    Hiển thị {filtered.length} / {banners.length}
                </Text>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10 }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>

            {/* ── Modal Thêm / Sửa ── */}
            <Modal
                title={
                    <Space>
                        {editBanner ? <EditOutlined style={{ color: '#6366f1' }} /> : <PlusOutlined style={{ color: '#6366f1' }} />}
                        {editBanner ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
                    </Space>
                }
                open={modalOpen}
                onCancel={() => !saving && setModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={saving}
                okText={editBanner ? 'Lưu thay đổi' : 'Tạo banner'}
                cancelText="Hủy"
                width={860}
                styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
                okButtonProps={{ style: { background: '#6366f1', borderColor: '#6366f1' } }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                    <Row gutter={16}>
                        {/* Left: form fields */}
                        <Col span={14}>
                            <Form.Item name="title" label="Tiêu đề chính" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                                <Input placeholder="VD: Siêu Sale Tháng 4" />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="highlight" label="Highlight (chữ nhấn mạnh)">
                                        <Input placeholder="VD: -50%" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="cta" label="Nút CTA">
                                        <Input placeholder="VD: Mua ngay" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="subtitle" label="Mô tả phụ">
                                <TextArea rows={2} placeholder="VD: Giảm đến 50% hàng ngàn sản phẩm" />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="date" label="Nhãn ngày / thời gian">
                                        <Input placeholder="VD: 10 - 15/04/2025" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="position" label="Vị trí hiển thị" rules={[{ required: true }]}>
                                        <Select>
                                            <Option value="home_main">Banner chính</Option>
                                            <Option value="home_sub">Banner phụ</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="link" label="Liên kết (URL khi click)">
                                <Input prefix={<LinkOutlined />} placeholder="VD: /search?category=dien-tu" />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="lightGradient" label="Gradient sáng (CSS)">
                                        <Input placeholder="VD: linear-gradient(135deg,#fff7ed,#fef3c7)" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="darkGradient" label="Gradient tối (CSS)">
                                        <Input placeholder="VD: linear-gradient(135deg,#451a03,#78350f)" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="isActive" label="Hiển thị banner" valuePropName="checked">
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>

                        {/* Right: image upload + preview */}
                        <Col span={10}>
                            <Form.Item label="Ảnh banner">
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    onChange={handleUploadChange}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    accept="image/*"
                                    style={{ width: '100%' }}
                                >
                                    {fileList.length < 1 && (
                                        <div>
                                            <UploadOutlined />
                                            <div style={{ marginTop: 8, fontSize: 12 }}>Tải ảnh</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>

                            {/* Live preview card */}
                            {previewUrl && (
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        Xem trước
                                    </Text>
                                    <div style={{
                                        borderRadius: 10, overflow: 'hidden',
                                        border: '1px solid #e8ecf3', position: 'relative',
                                        height: 140,
                                        background: form.getFieldValue('lightGradient') || '#f4f6fb',
                                    }}>
                                        <img
                                            src={previewUrl} alt="preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ── Modal xem trước Banner ── */}
            <Modal
                title="Xem trước banner"
                open={previewOpen}
                onCancel={() => setPreviewOpen(false)}
                footer={null}
                width={800}
                centered
            >
                {previewBanner && (
                    <div style={{
                        borderRadius: 12, overflow: 'hidden', position: 'relative',
                        background: previewBanner.lightGradient || '#f4f6fb',
                        minHeight: 200,
                    }}>
                        {previewBanner.imageUrl && (
                            <img
                                src={previewBanner.imageUrl}
                                alt={previewBanner.title}
                                style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
                            />
                        )}
                        <div style={{ padding: '16px 20px' }}>
                            {previewBanner.highlight && (
                                <Tag color="gold" style={{ marginBottom: 6 }}>{previewBanner.highlight}</Tag>
                            )}
                            <Title level={4} style={{ margin: 0 }}>{previewBanner.title}</Title>
                            {previewBanner.subtitle && <Text type="secondary">{previewBanner.subtitle}</Text>}
                            <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                {previewBanner.date && <Tag>{previewBanner.date}</Tag>}
                                {previewBanner.cta && (
                                    <Button type="primary" size="small" style={{ background: '#7c3aed', border: 'none' }}>
                                        {previewBanner.cta}
                                    </Button>
                                )}
                                <Tag color={POSITION_COLOR[previewBanner.position]}>{POSITION_LABEL[previewBanner.position]}</Tag>
                                <Tag color={previewBanner.isActive !== false ? 'success' : 'error'}>
                                    {previewBanner.isActive !== false ? 'Đang hiển thị' : 'Đã ẩn'}
                                </Tag>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <style>{`
                tr:hover .img-overlay { opacity: 1 !important; }
            `}</style>
        </div>
    );
}

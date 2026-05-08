import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, Switch, Modal, Form, Input, message, Popconfirm } from 'antd';
import { motion } from 'framer-motion';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/categories/admin/all');
            const data = res.data?.metadata || res.data;
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            try {
                const res2 = await axiosInstance.get('/categories');
                const data2 = res2.data?.metadata || res2.data;
                setCategories(Array.isArray(data2) ? data2 : []);
            } catch (e2) { console.error(e2); }
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditTarget(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (cat) => {
        setEditTarget(cat);
        form.setFieldsValue({ name: cat.name, slug: cat.slug });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setSubmitting(true);
        try {
            if (!editTarget) {
                await axiosInstance.post('/categories/admin/create', values);
                message.success('Tạo danh mục thành công!');
            } else {
                await axiosInstance.put(`/categories/admin/${editTarget._id}`, values);
                message.success('Cập nhật danh mục thành công!');
            }
            setModalOpen(false);
            fetchCategories();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await axiosInstance.patch(`/categories/admin/${id}/toggle`);
            message.success('Cập nhật trạng thái!');
            fetchCategories();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/categories/admin/${id}`);
            message.success('Xóa thành công!');
            fetchCategories();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi');
        }
    };

    const columns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (text) => <Tag color="purple">{text}</Tag>
        },
        {
            title: 'Số sản phẩm',
            dataIndex: 'productCount',
            key: 'productCount',
            align: 'center',
            render: (count) => <Text strong>{count || 0}</Text>
        },
        {
            title: 'Hiển thị',
            key: 'isActive',
            align: 'center',
            render: (_, record) => (
                <Switch
                    checked={record.isActive !== false}
                    onChange={() => handleToggle(record._id)}
                    size="small"
                />
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Button type="text" icon={<EditOutlined style={{ color: '#3b82f6' }} />} onClick={() => openEdit(record)} />
                    <Popconfirm
                        title="Xóa danh mục này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Quản lý danh mục</Title>
                    <Text type="secondary">{categories.length} danh mục</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">
                    Thêm danh mục
                </Button>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Table
                    dataSource={categories}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf3' }}
                />
            </motion.div>

            <Modal
                title={editTarget ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={() => setModalOpen(false)}
                okText={editTarget ? 'Lưu' : 'Tạo mới'}
                cancelText="Hủy"
                confirmLoading={submitting}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}>
                        <Input size="large" placeholder="VD: Điện thoại" />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug (tùy chọn)">
                        <Input size="large" placeholder="VD: dien-thoai" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

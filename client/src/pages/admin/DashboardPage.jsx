import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Avatar, Skeleton, Tooltip, Progress, Badge } from 'antd';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    ComposedChart,
    Line,
} from 'recharts';
import {
    UserOutlined,
    ShoppingCartOutlined,
    RiseOutlined,
    AppstoreOutlined,
    ShopOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';
import { orderApi } from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_CONFIG = {
    pending: { label: 'Chờ xác nhận', color: '#f59e0b', tagColor: 'warning' },
    confirmed: { label: 'Đã xác nhận', color: '#3b82f6', tagColor: 'processing' },
    shipping: { label: 'Đang giao', color: '#8b5cf6', tagColor: 'purple' },
    delivered: { label: 'Đã giao', color: '#10b981', tagColor: 'success' },
    received: { label: 'Đã nhận', color: '#06b6d4', tagColor: 'cyan' },
    cancelled: { label: 'Đã hủy', color: '#ef4444', tagColor: 'error' },
    returned: { label: 'Hoàn trả', color: '#f97316', tagColor: 'orange' },
    return_requested: { label: 'Yêu cầu hoàn', color: '#ec4899', tagColor: 'magenta' },
};
const PAYMENT_LABELS = { cod: 'COD', momo: 'MoMo', vnpay: 'VNPay' };
const PAYMENT_COLORS = { cod: '#f59e0b', momo: '#a855f7', vnpay: '#0ea5e9' };

const fmt = (n) => (n || 0).toLocaleString('vi-VN');
const fmtS = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
};

/* ── Shared tooltip ── */
const DarkTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: 12,
                padding: '10px 16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                fontSize: 13,
            }}
        >
            <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: p.color || p.stroke,
                            display: 'inline-block',
                        }}
                    />
                    <span>
                        {p.name}: <strong>{p.name === 'Doanh thu' ? fmt(p.value) + ' ₫' : p.value}</strong>
                    </span>
                </div>
            ))}
        </div>
    );
};

/* ── Gradient Stat Card ── */
function StatCard({ title, value, subtext, icon, gradient, shadow, loading, delay = 0, badge }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay }}
            style={{ flex: '1 1 210px', minWidth: 210 }}
        >
            <div
                style={{
                    background: gradient,
                    borderRadius: 16,
                    padding: '20px 22px',
                    boxShadow: `0 8px 32px ${shadow}`,
                    position: 'relative',
                    overflow: 'hidden',
                    color: '#fff',
                    minHeight: 128,
                }}
            >
                <div style={{ position: 'absolute', right: -12, bottom: -12, fontSize: 96, opacity: 0.12 }}>{icon}</div>
                {badge !== undefined && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 14,
                            fontSize: 12,
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.25)',
                            borderRadius: 20,
                            padding: '2px 10px',
                        }}
                    >
                        {badge >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(badge)}%
                    </div>
                )}
                <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
                <div style={{ opacity: 0.88, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{title}</div>
                {loading ? (
                    <Skeleton.Button
                        active
                        style={{ width: 90, background: 'rgba(255,255,255,0.3)', borderRadius: 8 }}
                    />
                ) : (
                    <>
                        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
                        {subtext && <div style={{ opacity: 0.72, fontSize: 11, marginTop: 4 }}>{subtext}</div>}
                    </>
                )}
            </div>
        </motion.div>
    );
}

/* ── KPI Mini Card ── */
function KpiCard({ label, value, icon, color, loading, sub }) {
    return (
        <div
            style={{
                flex: '1 1 160px',
                background: '#fff',
                borderRadius: 14,
                padding: '16px 18px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: color + '1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        color,
                    }}
                >
                    {icon}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {label}
                </Text>
            </div>
            {loading ? (
                <Skeleton.Button active style={{ width: 70, height: 28 }} />
            ) : (
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{value}</div>
            )}
            {sub && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                    {sub}
                </Text>
            )}
        </div>
    );
}

/* ── Section wrapper ── */
function Section({ children, delay = 0, style = {} }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay }}
            style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                padding: '20px 24px',
                border: '1px solid #f1f5f9',
                ...style,
            }}
        >
            {children}
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        orderApi
            .adminGetDashboardStats()
            .then((res) => setData(res.data?.metadata || res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const orderStatusData = (data?.orderStatusCounts || []).map((s) => ({
        name: STATUS_CONFIG[s._id]?.label || s._id,
        value: s.count,
        color: STATUS_CONFIG[s._id]?.color || '#94a3b8',
    }));
    const paymentData = (data?.paymentMethodCounts || []).map((p) => ({
        name: PAYMENT_LABELS[p._id] || p._id,
        count: p.count,
        revenue: p.revenue,
        color: PAYMENT_COLORS[p._id] || '#94a3b8',
    }));

    /* ── Top stat cards ── */
    const statCards = [
        {
            title: 'Tổng người dùng',
            icon: <UserOutlined />,
            value: loading ? '—' : fmt(data?.userStats?.total),
            subtext: loading
                ? null
                : `${fmt(data?.userStats?.sellers)} người bán  •  +${fmt(data?.userStats?.newToday)} hôm nay`,
            gradient: 'linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%)',
            shadow: 'rgba(124,58,237,0.25)',
            delay: 0,
        },
        {
            title: 'Tổng đơn hàng',
            icon: <ShoppingCartOutlined />,
            value: loading ? '—' : fmt(data?.totalOrders),
            subtext: loading ? null : `Tháng này: ${fmt(data?.thisMonthOrders)}`,
            badge: data?.ordersGrowth,
            gradient: 'linear-gradient(135deg,#f59e0b 0%,#fcd34d 100%)',
            shadow: 'rgba(245,158,11,0.25)',
            delay: 0.07,
        },
        {
            title: 'Tổng doanh thu',
            icon: <RiseOutlined />,
            value: loading ? '—' : fmtS(data?.totalRevenue) + ' ₫',
            subtext: loading ? null : `Tháng này: ${fmtS(data?.thisMonthRevenue)}₫`,
            badge: data?.revenueGrowth,
            gradient: 'linear-gradient(135deg,#10b981 0%,#6ee7b7 100%)',
            shadow: 'rgba(16,185,129,0.25)',
            delay: 0.14,
        },
        {
            title: 'Gian hàng',
            icon: <ShopOutlined />,
            value: loading ? '—' : fmt(data?.storeStats?.total),
            subtext: loading
                ? null
                : `${fmt(data?.storeStats?.active)} đang hoạt động  •  ${fmt(data?.storeStats?.pending)} chờ duyệt`,
            gradient: 'linear-gradient(135deg,#0ea5e9 0%,#7dd3fc 100%)',
            shadow: 'rgba(14,165,233,0.25)',
            delay: 0.21,
        },
    ];

    /* ── KPI cards row ── */
    const kpiCards = [
        {
            label: 'Sản phẩm đang bán',
            value: loading ? '—' : fmt(data?.totalProducts),
            icon: <AppstoreOutlined />,
            color: '#7c3aed',
        },
        {
            label: 'Giá trị đơn TB',
            value: loading ? '—' : fmtS(data?.avgOrderValue) + ' ₫',
            icon: <RiseOutlined />,
            color: '#10b981',
        },
        {
            label: 'Tỉ lệ hoàn thành',
            value: loading ? '—' : data?.completionRate + '%',
            icon: <CheckCircleOutlined />,
            color: '#3b82f6',
        },
        {
            label: 'Chờ xác nhận',
            value: loading ? '—' : fmt(data?.pendingOrders),
            icon: <ClockCircleOutlined />,
            color: '#f59e0b',
            sub: 'đơn hàng',
        },
        {
            label: 'Đã hủy',
            value: loading ? '—' : fmt(data?.cancelledCount),
            icon: <WarningOutlined />,
            color: '#ef4444',
        },
    ];

    /* ── Recent orders columns ── */
    const orderColumns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderCode',
            key: 'code',
            render: (c) => (
                <Text strong style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: 13 }}>
                    {c || '—'}
                </Text>
            ),
        },
        {
            title: 'Khách hàng',
            key: 'user',
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar size={30} style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 13 }}>
                        {r.user?.fullName?.[0] || 'U'}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.user?.fullName || 'Người dùng'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.user?.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Tổng tiền',
            key: 'price',
            align: 'right',
            render: (_, r) => (
                <Text strong style={{ color: '#10b981' }}>
                    {fmt(r.finalPrice || r.totalPrice)} ₫
                </Text>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            align: 'center',
            render: (_, r) => {
                const cfg = STATUS_CONFIG[r.orderStatus] || { label: r.orderStatus, tagColor: 'default' };
                return <Tag color={cfg.tagColor}>{cfg.label}</Tag>;
            },
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'date',
            align: 'right',
            render: (d) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(d).format('DD/MM/YYYY HH:mm')}
                </Text>
            ),
        },
    ];

    /* ── Top products columns ── */
    const productColumns = [
        {
            title: '#',
            key: 'rank',
            width: 36,
            render: (_, __, i) => (
                <div
                    style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        background: i < 3 ? ['#f59e0b', '#94a3b8', '#b45309'][i] : '#e2e8f0',
                        color: i < 3 ? '#fff' : '#64748b',
                    }}
                >
                    {i + 1}
                </div>
            ),
        },
        {
            title: 'Sản phẩm',
            key: 'product',
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {r.images?.[0] && (
                        <img
                            src={r.images[0]}
                            alt={r.name}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 8,
                                objectFit: 'cover',
                                border: '1px solid #e2e8f0',
                            }}
                        />
                    )}
                    <div>
                        <Tooltip title={r.name}>
                            <div
                                style={{
                                    fontWeight: 600,
                                    fontSize: 13,
                                    maxWidth: 180,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {r.name}
                            </div>
                        </Tooltip>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.store?.name}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Đã bán',
            dataIndex: 'sold',
            key: 'sold',
            align: 'center',
            render: (v) => <Tag color="blue">{fmt(v)}</Tag>,
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (v) => <Text style={{ color: '#ea580c', fontWeight: 600 }}>{fmt(v)} ₫</Text>,
        },
    ];

    /* ── Low stock columns ── */
    const lowStockColumns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {r.images?.[0] && (
                        <img
                            src={r.images[0]}
                            alt={r.name}
                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }}
                        />
                    )}
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.store?.name}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Tồn kho',
            dataIndex: 'stock',
            key: 'stock',
            align: 'center',
            render: (v) => (
                <Tag color={v === 0 ? 'error' : v <= 2 ? 'warning' : 'orange'} style={{ fontWeight: 700 }}>
                    {v === 0 ? 'Hết hàng' : v + ' còn lại'}
                </Tag>
            ),
        },
    ];

    /* ════════════════════════════════════ RENDER ════════════════════════════════════ */
    return (
        <div style={{ paddingBottom: 48 }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginBottom: 28 }}
            >
                <Title level={4} style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                    Tổng quan hệ thống
                </Title>
                <Text type="secondary">Dữ liệu thực từ cơ sở dữ liệu — {loading ? '...' : `Năm ${data?.year}`}</Text>
            </motion.div>

            {/* ── Row 1: Main Stat Cards ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
                {statCards.map((c) => (
                    <StatCard key={c.title} loading={loading} {...c} />
                ))}
            </div>

            {/* ── Row 2: KPI Mini Cards ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28 }}
                style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}
            >
                {kpiCards.map((k) => (
                    <KpiCard key={k.label} loading={loading} {...k} />
                ))}
            </motion.div>

            {/* ── Row 3: Revenue+Orders Combo Chart + Order Status Pie ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <Section delay={0.32} style={{ flex: '2 1 520px' }}>
                    <div style={{ marginBottom: 14 }}>
                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                            Doanh thu & số đơn theo tháng
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Không tính đơn hủy — Năm {data?.year}
                        </Text>
                    </div>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 8 }} />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart
                                data={data?.revenueByMonth || []}
                                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="rev"
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={fmtS}
                                    width={50}
                                />
                                <YAxis
                                    yAxisId="ord"
                                    orientation="right"
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={32}
                                />
                                <ReTooltip content={<DarkTooltip />} />
                                <Area
                                    yAxisId="rev"
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Doanh thu"
                                    stroke="#7c3aed"
                                    strokeWidth={2.5}
                                    fill="url(#gRev)"
                                />
                                <Bar
                                    yAxisId="ord"
                                    dataKey="orders"
                                    name="Số đơn"
                                    fill="#0ea5e9"
                                    opacity={0.7}
                                    radius={[4, 4, 0, 0]}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                    <div style={{ display: 'flex', gap: 20, marginTop: 10, justifyContent: 'center' }}>
                        {[
                            { color: '#7c3aed', label: 'Doanh thu' },
                            { color: '#0ea5e9', label: 'Số đơn' },
                        ].map((l) => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 12, height: 3, borderRadius: 2, background: l.color }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {l.label}
                                </Text>
                            </div>
                        ))}
                    </div>
                </Section>

                <Section delay={0.38} style={{ flex: '1 1 270px' }}>
                    <Title level={5} style={{ margin: '0 0 4px', fontWeight: 700 }}>
                        Trạng thái đơn hàng
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Phân bố theo trạng thái hiện tại
                    </Text>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 16 }} />
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={195}>
                                <PieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {orderStatusData.map((d, i) => (
                                            <Cell key={i} fill={d.color} />
                                        ))}
                                    </Pie>
                                    <ReTooltip formatter={(v, n) => [v + ' đơn', n]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '5px 12px',
                                    justifyContent: 'center',
                                    marginTop: 6,
                                }}
                            >
                                {orderStatusData.map((d) => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <div
                                            style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }}
                                        />
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {d.name} ({d.value})
                                        </Text>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Section>
            </div>

            {/* ── Row 4: User Growth by month + Store Stats ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <Section delay={0.42} style={{ flex: '2 1 460px' }}>
                    <div style={{ marginBottom: 14 }}>
                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                            Người dùng đăng ký theo tháng
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Tổng số tài khoản mới theo từng tháng năm {data?.year}
                        </Text>
                    </div>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 6 }} />
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={data?.revenueByMonth || []}
                                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={32}
                                />
                                <ReTooltip
                                    formatter={(v) => [v + ' người', 'Đăng ký mới']}
                                    contentStyle={{
                                        borderRadius: 10,
                                        border: 'none',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                    }}
                                />
                                <Bar
                                    dataKey="newUsers"
                                    name="Người dùng mới"
                                    fill="#7c3aed"
                                    opacity={0.85}
                                    radius={[5, 5, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Section>

                {/* Store Stats */}
                <Section delay={0.46} style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Title level={5} style={{ margin: '0 0 6px', fontWeight: 700 }}>
                        Thống kê gian hàng
                    </Title>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                    ) : (
                        <>
                            {[
                                {
                                    label: 'Đang hoạt động',
                                    value: data?.storeStats?.active,
                                    color: '#10b981',
                                    pct:
                                        data?.storeStats?.total > 0
                                            ? Math.round((data.storeStats.active / data.storeStats.total) * 100)
                                            : 0,
                                },
                                {
                                    label: 'Chờ duyệt',
                                    value: data?.storeStats?.pending,
                                    color: '#f59e0b',
                                    pct:
                                        data?.storeStats?.total > 0
                                            ? Math.round((data.storeStats.pending / data.storeStats.total) * 100)
                                            : 0,
                                },
                                {
                                    label: 'Bị cấm',
                                    value: data?.storeStats?.banned,
                                    color: '#ef4444',
                                    pct:
                                        data?.storeStats?.total > 0
                                            ? Math.round((data.storeStats.banned / data.storeStats.total) * 100)
                                            : 0,
                                },
                            ].map((s) => (
                                <div key={s.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</Text>
                                        <Text strong style={{ color: s.color }}>
                                            {fmt(s.value)}
                                        </Text>
                                    </div>
                                    <Progress
                                        percent={s.pct}
                                        strokeColor={s.color}
                                        trailColor="#f1f5f9"
                                        size="small"
                                        showInfo={false}
                                    />
                                </div>
                            ))}
                            <div
                                style={{
                                    background: '#f8fafc',
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    marginTop: 6,
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Tổng gian hàng</div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                                    {fmt(data?.storeStats?.total)}
                                </div>
                            </div>
                        </>
                    )}
                </Section>
            </div>

            {/* ── Row 5: Payment Bar + Low Stock ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <Section delay={0.5} style={{ flex: '1 1 300px' }}>
                    <Title level={5} style={{ margin: '0 0 4px', fontWeight: 700 }}>
                        Phương thức thanh toán
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Số lượng đơn theo hình thức
                    </Text>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 5 }} style={{ marginTop: 16 }} />
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={190}>
                                <BarChart data={paymentData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={32}
                                    />
                                    <ReTooltip
                                        formatter={(v, n) => [v + ' đơn', 'Số đơn']}
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: 'none',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                        }}
                                    />
                                    <Bar dataKey="count" name="count" radius={[6, 6, 0, 0]}>
                                        {paymentData.map((d, i) => (
                                            <Cell key={i} fill={d.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                {paymentData.map((d) => (
                                    <div
                                        key={d.name}
                                        style={{
                                            flex: 1,
                                            background: '#f8fafc',
                                            borderRadius: 10,
                                            padding: '10px 8px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{d.name}</div>
                                        <div style={{ fontWeight: 700, fontSize: 18, color: d.color }}>{d.count}</div>
                                        <div style={{ fontSize: 10, color: '#cbd5e1' }}>{fmtS(d.revenue)}₫</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Section>

                <Section delay={0.54} style={{ flex: '2 1 400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <WarningOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                            Sản phẩm sắp hết hàng
                        </Title>
                        <Tag color="warning" style={{ marginLeft: 'auto' }}>
                            {data?.lowStockProducts?.length || 0} sản phẩm
                        </Tag>
                    </div>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                    ) : data?.lowStockProducts?.length > 0 ? (
                        <Table
                            dataSource={data.lowStockProducts}
                            columns={lowStockColumns}
                            rowKey="_id"
                            pagination={false}
                            size="small"
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <CheckCircleOutlined style={{ fontSize: 32, color: '#10b981' }} />
                            <div style={{ marginTop: 8, color: '#64748b' }}>Tất cả sản phẩm đủ hàng</div>
                        </div>
                    )}
                </Section>
            </div>

            {/* ── Row 6: Top Products + Recent Orders ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 0, flexWrap: 'wrap' }}>
                <Section delay={0.58} style={{ flex: '1 1 380px' }}>
                    <Title level={5} style={{ margin: '0 0 14px', fontWeight: 700 }}>
                        Top sản phẩm bán chạy
                    </Title>
                    <Table
                        dataSource={data?.topProducts || []}
                        columns={productColumns}
                        rowKey="_id"
                        pagination={false}
                        loading={loading}
                        size="small"
                    />
                </Section>

                <Section delay={0.62} style={{ flex: '2 1 480px' }}>
                    <Title level={5} style={{ margin: '0 0 14px', fontWeight: 700 }}>
                        Đơn hàng gần đây
                    </Title>
                    <Table
                        dataSource={data?.recentOrders || []}
                        columns={orderColumns}
                        rowKey="_id"
                        pagination={false}
                        loading={loading}
                        size="small"
                    />
                </Section>
            </div>
        </div>
    );
}

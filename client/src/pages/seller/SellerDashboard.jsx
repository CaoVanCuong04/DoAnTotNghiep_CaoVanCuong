import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Skeleton, Progress, Badge } from 'antd';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    RiseOutlined,
    ShoppingCartOutlined,
    AppstoreOutlined,
    WalletOutlined,
    StarOutlined,
    TagOutlined,
    WarningOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { sellerGetAnalytics, sellerGetMyWallet } from '../../api/apiSeller';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const fmt = (n) => (n || 0).toLocaleString('vi-VN');
const fmtS = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
};

const ITEM_STATUS_CONFIG = {
    pending: { label: 'Chờ xác nhận', color: '#f59e0b' },
    confirmed: { label: 'Đã xác nhận', color: '#3b82f6' },
    shipping: { label: 'Đang giao', color: '#8b5cf6' },
    delivered: { label: 'Đã giao', color: '#10b981' },
    received: { label: 'Đã nhận', color: '#06b6d4' },
    cancelled: { label: 'Đã hủy', color: '#ef4444' },
    returned: { label: 'Hoàn trả', color: '#f97316' },
};

const DarkTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: 10,
                padding: '10px 15px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                fontSize: 13,
            }}
        >
            <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>{label ? `Ngày ${label}` : ''}</div>
            {payload.map((p, i) => (
                <div key={i}>
                    Doanh thu: <strong>{fmt(p.value)} ₫</strong>
                </div>
            ))}
        </div>
    );
};

/* ── Gradient Stat Card ── */
function StatCard({ title, value, sub, icon, gradient, shadow, loading, delay = 0, growth }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay }}
            style={{ flex: '1 1 180px', minWidth: 180 }}
        >
            <div
                style={{
                    background: gradient,
                    borderRadius: 16,
                    padding: '20px 22px',
                    color: '#fff',
                    boxShadow: `0 8px 28px ${shadow}`,
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 120,
                }}
            >
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 88, opacity: 0.1 }}>{icon}</div>
                {growth !== undefined && growth !== null && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 14,
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.22)',
                            borderRadius: 20,
                            padding: '2px 9px',
                        }}
                    >
                        {growth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(growth)}%
                    </div>
                )}
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85, marginBottom: 3 }}>{title}</div>
                {loading ? (
                    <Skeleton.Button
                        active
                        style={{ width: 90, background: 'rgba(255,255,255,0.3)', borderRadius: 8 }}
                    />
                ) : (
                    <>
                        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
                        {sub && <div style={{ fontSize: 11, opacity: 0.72, marginTop: 3 }}>{sub}</div>}
                    </>
                )}
            </div>
        </motion.div>
    );
}

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

export default function SellerDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [wallet, setWallet] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [sRes, wRes] = await Promise.all([sellerGetAnalytics(), sellerGetMyWallet()]);
                setStats(sRes.data?.metadata || sRes.data);
                setWallet(wRes.data?.metadata || wRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const chartData = [...(stats?.revenue || [])].reverse();

    const statusPieData = (stats?.orderStatusBreakdown || []).map((s) => ({
        name: ITEM_STATUS_CONFIG[s._id]?.label || s._id,
        value: s.count,
        color: ITEM_STATUS_CONFIG[s._id]?.color || '#94a3b8',
    }));

    const totalStatusCount = statusPieData.reduce((s, d) => s + d.value, 0);

    const statCards = [
        {
            title: 'Tổng doanh thu',
            icon: <RiseOutlined />,
            value: loading ? '—' : fmtS(stats?.totalRevenue) + ' ₫',
            sub: loading ? null : `Tháng này: ${fmtS(stats?.thisMonthRevenue)}₫`,
            growth: stats?.revenueGrowth,
            gradient: 'linear-gradient(135deg,#1e40af 0%,#3b82f6 100%)',
            shadow: 'rgba(30,64,175,0.28)',
            delay: 0,
        },
        {
            title: 'Tổng đơn hàng',
            icon: <ShoppingCartOutlined />,
            value: loading ? '—' : fmt(stats?.totalOrders),
            sub: loading ? null : `Tháng này: ${fmt(stats?.thisMonthOrders)}`,
            gradient: 'linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)',
            shadow: 'rgba(245,158,11,0.28)',
            delay: 0.07,
        },
        {
            title: 'Đánh giá TB',
            icon: <StarOutlined />,
            value: loading ? '—' : (stats?.reviewStats?.avgRating || 0) + ' / 5',
            sub: loading
                ? null
                : `${fmt(stats?.reviewStats?.total)} đánh giá  •  ${fmt(stats?.reviewStats?.unreplied)} chưa trả lời`,
            gradient: 'linear-gradient(135deg,#f43f5e 0%,#fb7185 100%)',
            shadow: 'rgba(244,63,94,0.28)',
            delay: 0.14,
        },
        {
            title: 'Mã giảm giá',
            icon: <TagOutlined />,
            value: loading ? '—' : fmt(stats?.couponsStats?.active),
            sub: loading ? null : `Đang hoạt động / Tổng: ${fmt(stats?.couponsStats?.total)}`,
            gradient: 'linear-gradient(135deg,#10b981 0%,#34d399 100%)',
            shadow: 'rgba(16,185,129,0.28)',
            delay: 0.21,
        },
        {
            title: 'Số dư ví',
            icon: <WalletOutlined />,
            value: loading ? '—' : wallet ? fmtS(wallet.balance) + ' ₫' : '—',
            sub: loading ? null : wallet ? `Tổng nhận: ${fmtS(wallet.totalReceived)}₫` : null,
            gradient: 'linear-gradient(135deg,#8b5cf6 0%,#a78bfa 100%)',
            shadow: 'rgba(139,92,246,0.28)',
            delay: 0.28,
        },
    ];

    const topProductColumns = [
        {
            title: '#',
            key: 'rank',
            width: 36,
            render: (_, __, i) => (
                <div
                    style={{
                        width: 24,
                        height: 24,
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
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                objectFit: 'cover',
                                border: '1px solid #e2e8f0',
                            }}
                        />
                    )}
                    <Text strong style={{ fontSize: 13 }}>
                        {r.name}
                    </Text>
                </div>
            ),
        },
        { title: 'Đã bán', dataIndex: 'sold', align: 'center', render: (v) => <Tag color="blue">{v || 0}</Tag> },
        {
            title: 'Tồn kho',
            dataIndex: 'stock',
            align: 'center',
            render: (v) => <Tag color={v <= 5 ? 'warning' : 'success'}>{v ?? '—'}</Tag>,
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            align: 'right',
            render: (v) => <Text style={{ color: '#ea580c', fontWeight: 600 }}>{fmt(v)} ₫</Text>,
        },
    ];

    return (
        <div style={{ paddingBottom: 48 }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{ marginBottom: 26 }}
            >
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                    Tổng quan gian hàng
                </Title>
                <Text type="secondary">Thống kê hoạt động kinh doanh theo thời gian thực</Text>
            </motion.div>

            {/* ── Row 1: Stat Cards ── */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                {statCards.map((c) => (
                    <StatCard key={c.title} loading={loading} {...c} />
                ))}
            </div>

            {/* ── Row 2: Revenue chart + Order status pie ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <Section delay={0.35} style={{ flex: '2 1 460px' }}>
                    <div style={{ marginBottom: 14 }}>
                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                            Doanh thu 30 ngày gần nhất
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Chỉ tính sản phẩm đã giao thành công
                        </Text>
                    </div>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 8 }} />
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="sellerGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.28} />
                                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="_id"
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={fmtS}
                                    width={48}
                                />
                                <ReTooltip content={<DarkTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#1e40af"
                                    strokeWidth={2.5}
                                    fill="url(#sellerGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Text type="secondary">Chưa có dữ liệu doanh thu</Text>
                        </div>
                    )}

                    {/* This month vs last month summary */}
                    {!loading && (
                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                marginTop: 14,
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: 14,
                            }}
                        >
                            {[
                                { label: 'Tháng này', value: stats?.thisMonthRevenue, color: '#1e40af' },
                                { label: 'Tháng trước', value: stats?.lastMonthRevenue, color: '#94a3b8' },
                            ].map((m) => (
                                <div
                                    key={m.label}
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        background: '#f8fafc',
                                        borderRadius: 10,
                                        padding: '10px 8px',
                                    }}
                                >
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{m.label}</div>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: m.color }}>
                                        {fmtS(m.value)} ₫
                                    </div>
                                </div>
                            ))}
                            <div
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    background: stats?.revenueGrowth >= 0 ? '#f0fdf4' : '#fef2f2',
                                    borderRadius: 10,
                                    padding: '10px 8px',
                                }}
                            >
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Tăng trưởng</div>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 16,
                                        color: stats?.revenueGrowth >= 0 ? '#10b981' : '#ef4444',
                                    }}
                                >
                                    {stats?.revenueGrowth !== null && stats?.revenueGrowth !== undefined
                                        ? (stats.revenueGrowth >= 0 ? '+' : '') + stats.revenueGrowth + '%'
                                        : '—'}
                                </div>
                            </div>
                        </div>
                    )}
                </Section>

                {/* Order status pie */}
                <Section delay={0.4} style={{ flex: '1 1 260px' }}>
                    <Title level={5} style={{ margin: '0 0 4px', fontWeight: 700 }}>
                        Phân bố đơn hàng
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Theo trạng thái sản phẩm
                    </Text>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 16 }} />
                    ) : statusPieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={195}>
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={78}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {statusPieData.map((d, i) => (
                                            <Cell key={i} fill={d.color} />
                                        ))}
                                    </Pie>
                                    <ReTooltip formatter={(v, n) => [v, n]} />
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
                                {statusPieData.map((d) => (
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
                    ) : (
                        <div style={{ height: 195, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Text type="secondary">Chưa có dữ liệu đơn hàng</Text>
                        </div>
                    )}
                </Section>
            </div>

            {/* ── Row 3: Top Products + Order status progress ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <Section delay={0.45} style={{ flex: '2 1 420px' }}>
                    <Title level={5} style={{ margin: '0 0 14px', fontWeight: 700 }}>
                        Top 5 sản phẩm bán chạy
                    </Title>
                    <Table
                        dataSource={stats?.topProducts || []}
                        columns={topProductColumns}
                        rowKey="_id"
                        pagination={false}
                        loading={loading}
                        size="small"
                        showHeader={false}
                    />
                </Section>

                {/* Order status progress bars */}
                <Section delay={0.5} style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                        }}
                    >
                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                            Chi tiết trạng thái
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Tổng: {fmt(totalStatusCount)}
                        </Text>
                    </div>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 6 }} />
                    ) : statusPieData.length > 0 ? (
                        statusPieData.map((s) => (
                            <div key={s.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</Text>
                                    <Text strong style={{ color: s.color }}>
                                        {s.value}
                                    </Text>
                                </div>
                                <Progress
                                    percent={totalStatusCount > 0 ? Math.round((s.value / totalStatusCount) * 100) : 0}
                                    strokeColor={s.color}
                                    trailColor="#f1f5f9"
                                    size="small"
                                    showInfo={false}
                                />
                            </div>
                        ))
                    ) : (
                        <Text type="secondary">Chưa có dữ liệu</Text>
                    )}
                    {!loading && stats?.lowStockCount > 0 && (
                        <div
                            style={{
                                marginTop: 8,
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: 10,
                                padding: '10px 14px',
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                            }}
                        >
                            <WarningOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>Tồn kho thấp</div>
                                <div style={{ fontSize: 12, color: '#b45309' }}>
                                    {stats.lowStockCount} sản phẩm &le; 5 còn lại
                                </div>
                            </div>
                        </div>
                    )}
                </Section>
            </div>

            {/* ── Row 4: Wallet transactions ── */}
            {wallet?.transactions?.length > 0 && (
                <Section delay={0.55}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                            Giao dịch ví gần đây
                        </Title>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {[
                                { label: 'Số dư', value: wallet.balance, color: '#7c3aed' },
                                { label: 'Tổng nhận', value: wallet.totalReceived, color: '#10b981' },
                                { label: 'Tổng rút', value: wallet.totalWithdrawn, color: '#ef4444' },
                            ].map((w) => (
                                <div
                                    key={w.label}
                                    style={{
                                        textAlign: 'center',
                                        background: '#f8fafc',
                                        borderRadius: 10,
                                        padding: '8px 14px',
                                    }}
                                >
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{w.label}</div>
                                    <div style={{ fontWeight: 700, color: w.color, fontSize: 14 }}>
                                        {fmtS(w.value)} ₫
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Table
                        dataSource={wallet.transactions.slice(0, 5)}
                        rowKey="_id"
                        pagination={false}
                        size="small"
                        columns={[
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                key: 'desc',
                                render: (t, r) => (
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                            {dayjs(r.createdAt).format('DD/MM/YYYY HH:mm')}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                title: 'Loại',
                                dataIndex: 'type',
                                key: 'type',
                                align: 'center',
                                render: (t) => (
                                    <Tag color={t === 'credit' ? 'success' : 'error'}>
                                        {t === 'credit' ? 'Nhận' : 'Rút'}
                                    </Tag>
                                ),
                            },
                            {
                                title: 'Số tiền',
                                dataIndex: 'amount',
                                key: 'amount',
                                align: 'right',
                                render: (v, r) => (
                                    <Text strong style={{ color: r.type === 'credit' ? '#10b981' : '#ef4444' }}>
                                        {r.type === 'credit' ? '+' : '-'}
                                        {fmt(v)} ₫
                                    </Text>
                                ),
                            },
                        ]}
                    />
                </Section>
            )}
        </div>
    );
}

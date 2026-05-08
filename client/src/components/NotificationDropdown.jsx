import { useState, useEffect, useCallback } from 'react';
import { Badge, Button, Popover, Spin } from 'antd';
import { BellOutlined, CheckOutlined, MessageOutlined, ShoppingOutlined, ShopOutlined, GiftOutlined, StarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/apiNotification';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');


const ICON_MAP = {
    new_message: { icon: <MessageOutlined />, color: '#2563eb', bg: '#eff6ff' },
    order_placed: { icon: <ShoppingOutlined />, color: '#16a34a', bg: '#f0fdf4' },
    order_status: { icon: <ShoppingOutlined />, color: '#ea580c', bg: '#fff7ed' },
    store_approved: { icon: <ShopOutlined />, color: '#8b5cf6', bg: '#f5f3ff' },
    store_banned: { icon: <ShopOutlined />, color: '#dc2626', bg: '#fef2f2' },
    coupon: { icon: <GiftOutlined />, color: '#ec4899', bg: '#fdf2f8' },
    review: { icon: <StarOutlined />, color: '#f59e0b', bg: '#fffbeb' },
    default: { icon: <InfoCircleOutlined />, color: '#64748b', bg: '#f8fafc' },
};

const getNotificationLink = (item) => {
    if (item.link) return item.link;
    if (item.type === 'new_message') return '/seller/chat';
    return null;
};


function NotificationItem({ item, onRead }) {
    const navigate = useNavigate();
    const iconConfig = ICON_MAP[item.type] || ICON_MAP.default;

    const handleClick = () => {
        if (!item.isRead) onRead(item._id);

        if (item.type === 'new_message') {
            window.dispatchEvent(
                new CustomEvent('OPEN_CHAT_WIDGET', {
                    detail: {
                        storeId: item.storeId,
                        sellerId: item.sellerId,
                        product: item.product,
                        conversationId: item.conversationId,
                    },
                }),
            );
            return;
        }

        const reportId = item.reportId || item.meta?.reportId || item.meta?.report?._id;
        if (reportId) {
            window.dispatchEvent(
                new CustomEvent('OPEN_USER_REPORT_MODAL', {
                    detail: { reportId },
                }),
            );
            return;
        }

        const link = getNotificationLink(item);
        if (link) navigate(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ backgroundColor: '#f8fafc' }}
            onClick={handleClick}
            style={{
                display: 'flex', gap: 12, padding: '12px 16px',
                cursor: 'pointer', borderRadius: 12,
                background: item.isRead ? 'transparent' : '#fefce8',
                transition: 'background 0.2s',
                position: 'relative',
            }}
        >
            {/* Icon */}
            <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: iconConfig.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: iconConfig.color, fontSize: 18,
            }}>
                {iconConfig.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 13, fontWeight: item.isRead ? 500 : 700,
                    color: '#0f172a', lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {item.title}
                </div>
                <div style={{
                    fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {item.body}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
                    {dayjs(item.createdAt).fromNow()}
                </div>
            </div>

            {/* Unread dot */}
            {!item.isRead && (
                <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#2563eb', flexShrink: 0, marginTop: 6,
                }} />
            )}
        </motion.div>
    );
}

export default function NotificationDropdown() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasNewPulse, setHasNewPulse] = useState(false);

    // Fetch unread count on mount & when socket connects
    useEffect(() => {
        if (!user) return;
        getUnreadCount()
            .then(res => setUnreadCount(res.data.metadata?.count || 0))
            .catch(() => {});
    }, [user, socket]); // re-fetch when socket connects (new socket instance = reconnect)

    // Listen for realtime notifications
    useEffect(() => {
        if (!socket) return;

        const handleNew = (notification) => {
            console.log('[Notification] Received realtime:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            setHasNewPulse(true);
            setTimeout(() => setHasNewPulse(false), 2000);
        };

        socket.on('new_notification', handleNew);

        // Also listen for reconnect to re-fetch
        const handleReconnect = () => {
            getUnreadCount()
                .then(res => setUnreadCount(res.data.metadata?.count || 0))
                .catch(() => {});
        };
        socket.on('connect', handleReconnect);

        return () => {
            socket.off('new_notification', handleNew);
            socket.off('connect', handleReconnect);
        };
    }, [socket]);

    // Fetch notifications when dropdown opens
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await getNotifications({ page: 1, limit: 20 });
            setNotifications(res.data.metadata?.notifications || []);
        } catch {}
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    const handleRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    const handleReadAll = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {}
    };

    if (!user) return (
        <Badge count={0}>
            <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 20 }} />} />
        </Badge>
    );

    const content = (
        <div style={{ width: 380, maxHeight: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9',
            }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                    Thông báo
                    {unreadCount > 0 && (
                        <span style={{
                            marginLeft: 8, fontSize: 12, fontWeight: 700,
                            background: '#fee2e2', color: '#ef4444',
                            padding: '2px 8px', borderRadius: 10,
                        }}>
                            {unreadCount} mới
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <Button
                        type="text" size="small"
                        icon={<CheckOutlined />}
                        onClick={handleReadAll}
                        style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}
                    >
                        Đọc tất cả
                    </Button>
                )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <Spin />
                    </div>
                ) : notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <BellOutlined style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 12 }} />
                        <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Chưa có thông báo nào</div>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((item, idx) => (
                            <NotificationItem key={item._id || idx} item={item} onRead={handleRead} />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomRight"
            overlayStyle={{ zIndex: 1300 }}
            overlayInnerStyle={{ padding: 0, borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
            arrow={false}
        >
            <motion.div
                animate={hasNewPulse ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4 }}
                style={{ position: 'relative' }}
            >
                <Badge count={unreadCount} size="small" offset={[-2, 2]} style={{ background: '#ef4444' }}>
                    <Button
                        type="text" shape="circle"
                        icon={<BellOutlined style={{ fontSize: 20 }} />}
                    />
                </Badge>
            </motion.div>
        </Popover>
    );
}

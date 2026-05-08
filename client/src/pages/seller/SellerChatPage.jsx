import { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Avatar, Badge, Spin, Empty, message as antMessage } from 'antd';
import { SendOutlined, UserOutlined, SearchOutlined, MessageOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getMyConversations, getConversationMessages, sendMessageHttp } from '../../api/apiChat';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export default function SellerChatPage() {
    const { user } = useAuth();
    const { socket, emitWithPromise } = useSocket();

    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [search, setSearch] = useState('');
    const [typing, setTyping] = useState(false);

    const messagesContainerRef = useRef(null);
    const activeConvRef = useRef(null);
    const inputRef = useRef(null);

    // Sync activeConv vào ref ngay lập tức
    const setActiveConvWithRef = (conv) => {
        activeConvRef.current = conv;
        setActiveConv(conv);
    };

    // ── Fetch conversations ──
    useEffect(() => { fetchConversations(); }, []);

    // ── Socket listeners ──
    useEffect(() => {
        if (!socket || !user) return;

        const handleNewMessage = (msg) => {
            const currentConv = activeConvRef.current;
            const msgConvId = (msg.conversation?._id || msg.conversation)?.toString();
            const senderId = (msg.sender?._id || msg.sender)?.toString();

            console.log('[Seller Socket] new_message:', { msgConvId, senderId, currentConvId: currentConv?._id, myId: user._id });

            // Bỏ qua tin của chính mình — đã xử lý qua optimistic
            if (senderId === user._id?.toString()) {
                fetchConversations();
                return;
            }

            if (currentConv && msgConvId === currentConv._id?.toString()) {
                console.log('[Seller Socket] ✔ Thêm tin nhắn vào state');
                setMessages(prev => {
                    if (prev.some(m => m._id?.toString() === msg._id?.toString())) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
                socket.emit('mark_read', { conversationId: currentConv._id });
            } else {
                console.log('[Seller Socket] ✘ ConvId không khớp hoặc chưa mở conversation');
            }
            fetchConversations();
        };

        const handleTyping = ({ userId: uid, isTyping }) => {
            const currentConv = activeConvRef.current;
            if (currentConv && uid !== user._id) setTyping(isTyping);
        };

        // Re-join conversation room sau khi socket reconnect
        const handleReconnect = () => {
            if (activeConvRef.current) {
                socket.emit('join_conversation', activeConvRef.current._id);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleTyping);
        socket.on('connect', handleReconnect);
        socket.on('conversation_updated', fetchConversations);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('user_typing', handleTyping);
            socket.off('connect', handleReconnect);
            socket.off('conversation_updated', fetchConversations);
        };
    }, [socket, user]);

    // ── Polling fallback: tải lại messages mỗi 5s khi đang mở conversation ──
    useEffect(() => {
        if (!activeConv) return;
        const interval = setInterval(async () => {
            try {
                const res = await getConversationMessages(activeConv._id, { limit: 100 });
                const newMsgs = res.data.metadata?.messages || [];
                setMessages(prev => {
                    // Chỉ update nếu có tin nhắn mới (so sánh độ dài hoặc ID mới nhất)
                    const lastPrev = prev[prev.length - 1]?._id;
                    const lastNew = newMsgs[newMsgs.length - 1]?._id;
                    if (lastNew && lastNew !== lastPrev) return newMsgs;
                    return prev;
                });
            } catch {}
        }, 5000);
        return () => clearInterval(interval);
    }, [activeConv?._id]);

    // Auto-scroll khi messages thay đổi — chạy SAU khi DOM đã render xong
    useEffect(() => {
        if (!messagesContainerRef.current || messages.length === 0) return;
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        }, 80);
    };

    const fetchConversations = async () => {
        try {
            const res = await getMyConversations();
            setConversations(res.data.metadata || []);
        } catch (err) {
            console.error('Lỗi tải danh sách chat', err);
        } finally {
            setLoadingConvs(false);
        }
    };

    const openConversation = async (conv) => {
        if (activeConvRef.current?._id === conv._id) return;
        if (activeConvRef.current && socket) {
            socket.emit('leave_conversation', activeConvRef.current._id);
        }
        setActiveConvWithRef(conv);
        setMessages([]);
        setLoadingMsgs(true);
        if (socket) {
            socket.emit('join_conversation', conv._id);
            socket.emit('mark_read', { conversationId: conv._id });
        }
        try {
            const res = await getConversationMessages(conv._id, { limit: 100 });
            const msgs = res.data.metadata?.messages || [];
            setMessages(msgs);
            setTimeout(scrollToBottom, 150);
            fetchConversations();
        } catch (err) {
            console.error('Lỗi lấy tin nhắn', err);
            antMessage.error('Không thể tải tin nhắn: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoadingMsgs(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !activeConv) return;
        const txt = inputText.trim();
        setInputText('');
        if (socket) socket.emit('typing', { conversationId: activeConv._id, isTyping: false });

        const optimisticMsg = {
            _id: `temp_${Date.now()}`,
            conversation: activeConv._id,
            sender: { _id: user._id, fullName: user.fullName },
            content: txt,
            type: 'text',
            createdAt: new Date().toISOString(),
            sending: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();
        inputRef.current?.focus();

        if (socket && socket.connected) {
            try {
                const res = await emitWithPromise('send_message', {
                    conversationId: activeConv._id,
                    content: txt,
                    type: 'text',
                });
                if (res?.message) {
                    setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? res.message : m));
                }
            } catch (err) {
                console.warn('Socket send thất bại, dùng HTTP:', err.message);
                try {
                    const res = await sendMessageHttp(activeConv._id, { content: txt, type: 'text' });
                    setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? res.data.metadata : m));
                } catch {
                    setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
                    antMessage.error('Gửi tin nhắn thất bại');
                }
            }
        } else {
            try {
                const res = await sendMessageHttp(activeConv._id, { content: txt, type: 'text' });
                setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? res.data.metadata : m));
            } catch {
                setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
            }
        }
    };

    // Lấy người còn lại trong cuộc hội thoại (không phải seller)
    const getOtherUser = (conv) => {
        if (!conv?.participants || !user?._id) return {};
        return conv.participants.find(p => {
            const pId = (p._id || p)?.toString();
            return pId !== user._id?.toString();
        }) || {};
    };

    const filteredConvs = conversations.filter(c => {
        const other = getOtherUser(c);
        return other?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            c.lastMessage?.toString().toLowerCase().includes(search.toLowerCase());
    });

    const activeOtherUser = activeConv ? getOtherUser(activeConv) : null;

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = dayjs(msg.createdAt).format('DD/MM/YYYY');
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    return (
        <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Hộp thư đến</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Phản hồi tin nhắn và hỗ trợ khách hàng nhanh chóng</p>
            </div>

            {/* Main chat container */}
            <div style={{
                flex: 1,
                display: 'flex',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                background: '#fff',
                minHeight: 0,
            }}>
                {/* ── CỘT TRÁI: Danh sách hội thoại ── */}
                <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    {/* Search */}
                    <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="Tìm khách hàng..."
                            style={{ borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13 }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Conversation list */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loadingConvs ? (
                            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                        ) : filteredConvs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                <MessageOutlined style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }} />
                                <div style={{ fontSize: 13 }}>Chưa có tin nhắn</div>
                            </div>
                        ) : filteredConvs.map((item, idx) => {
                            const other = getOtherUser(item);
                            const unread = item.unreadCount?.[user._id] || 0;
                            const isActive = activeConv?._id === item._id;
                            const lastTime = item.lastMessageAt
                                ? dayjs(item.lastMessageAt).format(dayjs().isSame(item.lastMessageAt, 'day') ? 'HH:mm' : 'DD/MM')
                                : '';

                            return (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => openConversation(item)}
                                    style={{
                                        display: 'flex',
                                        gap: 10,
                                        alignItems: 'center',
                                        padding: '12px 14px',
                                        cursor: 'pointer',
                                        background: isActive ? '#eff6ff' : 'transparent',
                                        borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                                        transition: 'all 0.15s',
                                        borderBottom: '1px solid #f8fafc',
                                    }}
                                    whileHover={{ background: isActive ? '#eff6ff' : '#f8fafc' }}
                                >
                                    <Badge count={unread} size="small" style={{ background: '#ef4444' }}>
                                        <Avatar
                                            src={other?.avatar}
                                            icon={<UserOutlined />}
                                            size={44}
                                            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', flexShrink: 0 }}
                                        />
                                    </Badge>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                            <span style={{ fontSize: 13, fontWeight: unread ? 700 : 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                                {other?.fullName || 'Khách hàng'}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, marginLeft: 4 }}>{lastTime}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: unread ? '#1e40af' : '#94a3b8', fontWeight: unread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* ── CỘT PHẢI: Khung chat ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', minWidth: 0, minHeight: 0 }}>
                    {activeConv ? (
                        <>
                            {/* Chat header */}
                            <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                <Avatar
                                    src={activeOtherUser?.avatar}
                                    icon={<UserOutlined />}
                                    size={40}
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
                                />
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                        {activeOtherUser?.fullName || 'Khách hàng'}
                                    </div>
                                    <div style={{ fontSize: 12, color: typing ? '#10b981' : '#94a3b8', marginTop: 1 }}>
                                        {typing ? '✏️ Đang gõ...' : 'Khách hàng'}
                                    </div>
                                </div>
                            </div>

                            {/* Messages area */}
                            <div
                                ref={messagesContainerRef}
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0,
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#cbd5e1 transparent',
                                    minHeight: 0,
                                }}
                            >
                                {loadingMsgs ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Spin size="large" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <MessageOutlined style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }} />
                                            <div style={{ fontSize: 13 }}>Chưa có tin nhắn nào</div>
                                        </div>
                                    </div>
                                ) : (
                                    Object.entries(groupedMessages).map(([date, msgs]) => (
                                        <div key={date}>
                                            {/* Date divider */}
                                            <div style={{ textAlign: 'center', margin: '10px 0' }}>
                                                <span style={{ background: 'rgba(0,0,0,0.07)', color: '#64748b', fontSize: 11, padding: '3px 12px', borderRadius: 10, fontWeight: 500 }}>
                                                    {date === dayjs().format('DD/MM/YYYY') ? 'Hôm nay' : date}
                                                </span>
                                            </div>

                                            {msgs.map((msg, idx) => {
                                                const senderId = (msg.sender?._id || msg.sender)?.toString();
                                                const isMe = senderId === user._id?.toString();
                                                const showAvatar = !isMe && (idx === 0 || (msgs[idx - 1] && (msgs[idx - 1].sender?._id || msgs[idx - 1].sender)?.toString() !== senderId));

                                                return (
                                                    <motion.div
                                                        key={msg._id || idx}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.15 }}
                                                        style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 6, alignItems: 'flex-end', gap: 8 }}
                                                    >
                                                        {/* Avatar người nhận */}
                                                        {!isMe && (
                                                            <Avatar
                                                                src={activeOtherUser?.avatar}
                                                                icon={<UserOutlined />}
                                                                size={28}
                                                                style={{ background: '#e2e8f0', flexShrink: 0, opacity: showAvatar ? 1 : 0 }}
                                                            />
                                                        )}

                                                        <div style={{ maxWidth: '65%' }}>
                                                            {/* Product card */}
                                                            {msg.product && msg.product.name && (
                                                                <div style={{ background: '#fff', border: '1px solid #dbeafe', borderRadius: 12, padding: '8px 10px', marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                    {msg.product.image && (
                                                                        <img src={msg.product.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                                                    )}
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.product.name}</div>
                                                                        <div style={{ fontSize: 13, color: '#ea580c', fontWeight: 700 }}>{msg.product.price?.toLocaleString('vi-VN')}₫</div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Message bubble */}
                                                            {msg.content && (
                                                                <div style={{
                                                                    padding: '10px 14px',
                                                                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                                    background: isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#fff',
                                                                    color: isMe ? '#fff' : '#1e293b',
                                                                    fontSize: 14,
                                                                    lineHeight: 1.5,
                                                                    boxShadow: isMe ? '0 2px 8px rgba(37,99,235,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                                                                    opacity: msg.sending ? 0.65 : 1,
                                                                    border: isMe ? 'none' : '1px solid #e2e8f0',
                                                                    wordBreak: 'break-word',
                                                                }}>
                                                                    {msg.content}
                                                                </div>
                                                            )}

                                                            {/* Timestamp */}
                                                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                                                                {dayjs(msg.createdAt).format('HH:mm')}
                                                                {isMe && msg.sending && <span style={{ marginLeft: 4 }}>• Đang gửi...</span>}
                                                                {isMe && !msg.sending && msg.readBy?.length > 1 && <span style={{ marginLeft: 4, color: '#3b82f6' }}>• Đã xem</span>}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input area */}
                            <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                                <Input
                                    ref={inputRef}
                                    size="large"
                                    placeholder="Nhập tin nhắn..."
                                    value={inputText}
                                    onChange={e => {
                                        setInputText(e.target.value);
                                        if (socket && activeConv) {
                                            socket.emit('typing', { conversationId: activeConv._id, isTyping: e.target.value.length > 0 });
                                        }
                                    }}
                                    onPressEnter={handleSend}
                                    style={{ borderRadius: 24, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 14 }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    style={{
                                        width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0,
                                        background: inputText.trim() ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#e2e8f0',
                                        cursor: inputText.trim() ? 'pointer' : 'default',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: inputText.trim() ? '0 4px 12px rgba(37,99,235,0.4)' : 'none',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <SendOutlined style={{ color: inputText.trim() ? '#fff' : '#94a3b8', fontSize: 16 }} />
                                </motion.button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <MessageOutlined style={{ fontSize: 32, color: '#3b82f6' }} />
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Chọn một hội thoại</div>
                                <div style={{ fontSize: 13 }}>Chọn một cuộc trò chuyện từ danh sách để bắt đầu hỗ trợ khách hàng</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

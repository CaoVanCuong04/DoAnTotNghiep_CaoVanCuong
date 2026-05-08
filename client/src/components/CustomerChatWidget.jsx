import { useState, useEffect, useRef } from 'react';
import { Input, Button, Avatar, Badge, Spin, Typography } from 'antd';
import { MessageOutlined, SendOutlined, CloseOutlined, ArrowLeftOutlined, ShopOutlined, UserOutlined, CheckOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getMyConversations, getConversationMessages, createConversation } from '../api/apiChat';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

export default function CustomerChatWidget() {
    const { user } = useAuth();
    const { socket, isConnected, emitWithPromise } = useSocket();

    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [typing, setTyping] = useState(false);
    const [pendingProduct, setPendingProduct] = useState(null);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const activeConvRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        activeConvRef.current = activeConv;
    }, [activeConv]);

    // Global OPEN_CHAT_WIDGET event
    useEffect(() => {
        const handleOpenChat = async (e) => {
            const { storeId, sellerId, product, conversationId } = e.detail;
            if (!user) return;
            setIsOpen(true);
            setLoading(true);
            try {
                let conv = null;
                if (conversationId) {
                    const found = conversations.find(c => c._id?.toString() === conversationId?.toString());
                    if (found) {
                        conv = found;
                    }
                }
                if (!conv) {
                    const res = await createConversation({ storeId, sellerId, product });
                    conv = res.data.metadata;
                }
                await fetchConversations();
                if (product) setPendingProduct(product);
                openConversation(conv);
            } catch (err) {
                console.error('Lỗi khi mở chat', err);
            } finally {
                setLoading(false);
            }
        };
        window.addEventListener('OPEN_CHAT_WIDGET', handleOpenChat);
        return () => window.removeEventListener('OPEN_CHAT_WIDGET', handleOpenChat);
    }, [user]);

    useEffect(() => {
        if (isOpen && user) fetchConversations();
    }, [isOpen, user]);

    // Socket listeners
    useEffect(() => {
        if (!socket || !user) return;

        const handleNewMessage = (msg) => {
            const msgConvId = (msg.conversation?._id || msg.conversation)?.toString();
            const currentConvId = activeConvRef.current?._id?.toString();

            console.log('[Customer Socket] new_message:', { msgConvId, currentConvId, senderId: (msg.sender?._id || msg.sender)?.toString(), myId: user._id });

            // Bỏ qua tin do chính mình gửi — đã xử lý qua optimistic update + ack
            const senderId = (msg.sender?._id || msg.sender)?.toString();
            if (senderId === user._id?.toString()) {
                fetchConversations();
                return;
            }

            if (currentConvId && msgConvId === currentConvId) {
                console.log('[Customer Socket] ✔ Thêm tin nhắn seller vào state');
                setMessages(prev => {
                    if (prev.some(m => m._id?.toString() === msg._id?.toString())) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
                socket.emit('mark_read', { conversationId: currentConvId });
            }
            fetchConversations();
        };

        const handleTyping = ({ userId: uid, isTyping }) => {
            if (uid !== user._id) setTyping(isTyping);
        };

        // Sau khi socket reconnect, join lại conversation room (nếu đang mở)
        const handleReconnect = () => {
            if (activeConvRef.current) {
                socket.emit('join_conversation', activeConvRef.current._id);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleTyping);
        socket.on('connect', handleReconnect);
        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('user_typing', handleTyping);
            socket.off('connect', handleReconnect);
        };
    }, [socket, user]);

    // Polling fallback: reload messages mỗi 5s khi đang mở conversation
    useEffect(() => {
        if (!activeConv) return;
        const interval = setInterval(async () => {
            try {
                const res = await getConversationMessages(activeConv._id, { limit: 50 });
                const newMsgs = res.data.metadata?.messages || [];
                setMessages(prev => {
                    const lastPrev = prev[prev.length - 1]?._id;
                    const lastNew = newMsgs[newMsgs.length - 1]?._id;
                    if (lastNew && lastNew?.toString() !== lastPrev?.toString()) {
                        setTimeout(scrollToBottom, 100);
                        return newMsgs;
                    }
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
        } catch {}
    };

    const openConversation = async (conv) => {
        // Cập nhật ref ngay lập tức (không chờ useEffect) để socket handler nhận được convId đúng
        activeConvRef.current = conv;
        setActiveConv(conv);
        setLoading(true);
        if (socket) {
            socket.emit('join_conversation', conv._id);
            socket.emit('mark_read', { conversationId: conv._id });
        }
        try {
            const res = await getConversationMessages(conv._id, { limit: 50 });
            setMessages(res.data.metadata?.messages || []);
            setTimeout(scrollToBottom, 100);
        } catch {}
        finally { setLoading(false); }
    };

    const closeConversation = () => {
        if (activeConv && socket) socket.emit('leave_conversation', activeConv._id);
        setActiveConv(null);
        setPendingProduct(null);
        fetchConversations();
    };

    const handleTypingChange = (val) => {
        setInputText(val);
        if (socket && activeConv) {
            socket.emit('typing', { conversationId: activeConv._id, isTyping: val.length > 0 });
        }
    };

    const handleSend = async () => {
        const txt = inputText.trim();
        if (!txt || !activeConv) return;
        setInputText('');
        if (socket && activeConv) {
            socket.emit('typing', { conversationId: activeConv._id, isTyping: false });
        }

        const productToSend = pendingProduct;
        setPendingProduct(null);
        
        const optimisticMsg = {
            _id: `temp_${Date.now()}`,
            conversation: activeConv._id,
            sender: user._id,
            content: txt,
            type: productToSend ? 'product_link' : 'text',
            product: productToSend,
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
                    type: productToSend ? 'product_link' : 'text',
                    product: productToSend,
                });
                if (res?.message) {
                    setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? res.message : m));
                }
            } catch (err) {
                console.warn('Socket send thất bại, dùng HTTP:', err.message);
                try {
                    const { sendMessageHttp } = await import('../api/apiChat');
                    const res = await sendMessageHttp(activeConv._id, {
                        content: txt,
                        type: productToSend ? 'product_link' : 'text',
                        product: productToSend,
                    });
                    setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? res.data.metadata : m));
                } catch {
                    setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
                }
            }
        } else {
            // Socket chưa kết nối — dùng HTTP trực tiếp
            try {
                const { sendMessageHttp } = await import('../api/apiChat');
                const res = await sendMessageHttp(activeConv._id, {
                    content: txt,
                    type: productToSend ? 'product_link' : 'text',
                    product: productToSend,
                });
                setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? res.data.metadata : m));
            } catch {
                setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
            }
        }
    };

    if (!user || user.role === 'seller') return null;

    const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount?.[user._id] || 0), 0);
    const otherParticipant = activeConv?.participants?.find(p => p._id !== user._id);

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = dayjs(msg.createdAt).format('DD/MM/YYYY');
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chat-panel"
                        initial={{ opacity: 0, y: 30, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{ marginBottom: 16 }}
                    >
                        <div style={{
                            width: 370,
                            height: 540,
                            background: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 20,
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                        }}>
                            {/* ── HEADER ── */}
                            <div style={{
                                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                                padding: '14px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                flexShrink: 0,
                            }}>
                                {activeConv ? (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        onClick={closeConversation}
                                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                                    >
                                        <ArrowLeftOutlined />
                                    </motion.button>
                                ) : (
                                    <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MessageOutlined style={{ color: '#fff', fontSize: 16 }} />
                                    </div>
                                )}

                                <div style={{ flex: 1 }}>
                                    {activeConv ? (
                                        <>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, lineHeight: 1.2 }}>
                                                {otherParticipant?.fullName || 'Shop'}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                                                {typing ? (
                                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                        Đang gõ...
                                                    </motion.span>
                                                ) : 'Online'}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Tin nhắn</div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
                                                {conversations.length} cuộc hội thoại
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    {activeConv && otherParticipant && (
                                        <Avatar
                                            src={otherParticipant.avatar}
                                            icon={<UserOutlined />}
                                            size={32}
                                            style={{ border: '2px solid rgba(255,255,255,0.4)' }}
                                        />
                                    )}
                                    <motion.button
                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsOpen(false)}
                                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                                    >
                                        <CloseOutlined style={{ fontSize: 12 }} />
                                    </motion.button>
                                </div>
                            </div>

                            {/* ── BODY ── */}
                            <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', background: '#f0f4ff', position: 'relative', scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe transparent' }}>
                                {loading && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                                        <Spin size="large" />
                                    </div>
                                )}

                                {/* Danh sách hội thoại */}
                                {!activeConv && !loading && (
                                    <div style={{ padding: '10px 8px' }}>
                                        {conversations.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                                                <MessageOutlined style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }} />
                                                <div style={{ fontSize: 14, fontWeight: 500 }}>Chưa có tin nhắn nào</div>
                                                <div style={{ fontSize: 12, marginTop: 4 }}>Hãy vào trang sản phẩm để nhắn tin với Shop!</div>
                                            </div>
                                        ) : (
                                            conversations.map((item, idx) => {
                                                const other = item.participants.find(p => p._id !== user._id) || {};
                                                const unread = item.unreadCount?.[user._id] || 0;
                                                return (
                                                    <motion.div
                                                        key={item._id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        whileHover={{ scale: 1.01, x: 4 }}
                                                        onClick={() => openConversation(item)}
                                                        style={{
                                                            display: 'flex', gap: 12, alignItems: 'center',
                                                            padding: '12px 14px', marginBottom: 6,
                                                            background: '#fff', borderRadius: 14,
                                                            cursor: 'pointer',
                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                                            border: unread ? '1.5px solid #bfdbfe' : '1px solid transparent',
                                                        }}
                                                    >
                                                        <Badge count={unread} size="small" style={{ background: '#1e40af' }}>
                                                            <Avatar
                                                                src={other.avatar}
                                                                icon={<ShopOutlined />}
                                                                size={46}
                                                                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', flexShrink: 0 }}
                                                            />
                                                        </Badge>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                                <Text strong style={{ fontSize: 14, color: '#1e293b' }} ellipsis>{other.fullName}</Text>
                                                                <Text style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                                                                    {dayjs(item.lastMessageAt).fromNow(true)}
                                                                </Text>
                                                            </div>
                                                            <Text style={{
                                                                fontSize: 12, display: 'block',
                                                                color: unread ? '#1e40af' : '#94a3b8',
                                                                fontWeight: unread ? 600 : 400,
                                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                            }}>
                                                                {item.lastMessage?.content || 'Sản phẩm được đính kèm'}
                                                            </Text>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {/* Chat messages */}
                                {activeConv && !loading && (
                                    <div style={{ padding: '12px 12px 8px' }}>
                                        {Object.entries(groupedMessages).map(([date, msgs]) => (
                                            <div key={date}>
                                                {/* Date divider */}
                                                <div style={{ textAlign: 'center', margin: '8px 0' }}>
                                                    <span style={{ background: 'rgba(0,0,0,0.08)', color: '#475569', fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
                                                        {date === dayjs().format('DD/MM/YYYY') ? 'Hôm nay' : date}
                                                    </span>
                                                </div>
                                                {msgs.map((msg, idx) => {
                                                    const isMe = msg.sender === user._id || msg.sender?._id === user._id;
                                                    const isLast = idx === msgs.length - 1;
                                                    return (
                                                        <motion.div
                                                            key={msg._id || idx}
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            transition={{ duration: 0.15 }}
                                                            style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 4 }}
                                                        >
                                                            <div style={{ maxWidth: '75%' }}>
                                                                {/* Product card */}
                                                                {msg.product && (
                                                                    <div style={{
                                                                        background: '#fff', border: '1px solid #dbeafe',
                                                                        padding: '8px 10px', borderRadius: 12, marginBottom: 6,
                                                                        display: 'flex', gap: 10, alignItems: 'center',
                                                                    }}>
                                                                        {msg.product.image && (
                                                                            <img src={msg.product.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                                                                        )}
                                                                        <div style={{ minWidth: 0 }}>
                                                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                                                                                {msg.product.name}
                                                                            </div>
                                                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', marginTop: 2 }}>
                                                                                {msg.product.price?.toLocaleString('vi-VN')}₫
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Bubble */}
                                                                {msg.content && (
                                                                    <div style={{
                                                                        padding: '9px 14px',
                                                                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                                        background: isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#fff',
                                                                        color: isMe ? '#fff' : '#1e293b',
                                                                        fontSize: 14,
                                                                        lineHeight: 1.45,
                                                                        boxShadow: isMe ? '0 2px 8px rgba(37,99,235,0.35)' : '0 1px 3px rgba(0,0,0,0.08)',
                                                                        opacity: msg.sending ? 0.7 : 1,
                                                                    }}>
                                                                        {msg.content}
                                                                    </div>
                                                                )}

                                                                {/* Time + status */}
                                                                {isLast && (
                                                                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginTop: 3, gap: 4, alignItems: 'center' }}>
                                                                        <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                                                            {dayjs(msg.createdAt).format('HH:mm')}
                                                                        </span>
                                                                        {isMe && !msg.sending && (
                                                                            <CheckOutlined style={{ fontSize: 10, color: '#93c5fd' }} />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ))}

                                        {/* Typing indicator */}
                                        <AnimatePresence>
                                            {typing && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                    style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#fff', borderRadius: '18px 18px 18px 4px', width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginTop: 4 }}
                                                >
                                                    {[0, 1, 2].map(i => (
                                                        <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}
                                                            animate={{ y: [0, -4, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* ── INPUT ── */}
                            {activeConv && (
                                <div style={{ background: '#fff', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                                    {pendingProduct && (
                                        <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center' }}>
                                            {pendingProduct.image && (
                                                <img src={pendingProduct.image} alt={pendingProduct.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Sản phẩm đính kèm</div>
                                                <div style={{ fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pendingProduct.name}</div>
                                            </div>
                                            <CloseOutlined style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer', padding: 4 }} onClick={() => setPendingProduct(null)} />
                                        </div>
                                    )}
                                    <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <Input
                                            ref={inputRef}
                                            value={inputText}
                                            onChange={e => handleTypingChange(e.target.value)}
                                            onPressEnter={handleSend}
                                            placeholder="Nhắn tin..."
                                            bordered={false}
                                            style={{ flex: 1, background: '#f1f5f9', borderRadius: 22, padding: '8px 16px', fontSize: 14 }}
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                            onClick={handleSend}
                                            disabled={!inputText.trim()}
                                            style={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                background: inputText.trim() ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#e2e8f0',
                                                border: 'none', cursor: inputText.trim() ? 'pointer' : 'default',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                                boxShadow: inputText.trim() ? '0 4px 12px rgba(37,99,235,0.4)' : 'none',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <SendOutlined style={{ color: inputText.trim() ? '#fff' : '#94a3b8', fontSize: 16 }} />
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FAB BUTTON ── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        key="fab"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                        <Badge count={totalUnread} size="small" offset={[-6, 6]} style={{ background: '#ef4444' }}>
                            <motion.button
                                whileHover={{ scale: 1.08, boxShadow: '0 12px 35px rgba(30,64,175,0.55)' }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setIsOpen(true)}
                                style={{
                                    width: 58, height: 58, borderRadius: '50%', border: 'none',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    boxShadow: '0 8px 24px rgba(30,64,175,0.45)',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <MessageOutlined style={{ color: '#fff', fontSize: 24 }} />
                            </motion.button>
                        </Badge>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { aiChat, aiGetHistory, aiClearHistory } from '../api/apiAI';

// ─── Tạo hoặc lấy sessionId từ localStorage (cho guest) ──────────────────────
function getSessionId() {
    let id = localStorage.getItem('ai_session_id');
    if (!id) {
        id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem('ai_session_id', id);
    }
    return id;
}

const SESSION_ID = getSessionId();

const GREETING = {
    role: 'assistant',
    content: 'Xin chào! Tôi là AI Copilot mua sắm. Tôi có thể giúp bạn tìm sản phẩm, so sánh giá, hoặc gợi ý phù hợp với ngân sách. Bạn cần gì?',
};

// ─── Parse AI response: **bold** và /product/... links ───────────────────────
function parseAIText(text) {
    if (!text) return null;
    const segments = [];
    const regex = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\((\/product\/[^\)]+)\))|((\/product\/\S+))/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        if (match[1]) segments.push({ type: 'bold', content: match[2] });
        else if (match[3]) segments.push({ type: 'link', label: match[4], href: match[5] });
        else if (match[6]) segments.push({ type: 'link', label: match[6].replace('/product/', '').replace(/-/g, ' '), href: match[6] });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) segments.push({ type: 'text', content: text.slice(lastIndex) });

    return segments.map((seg, i) => {
        if (seg.type === 'bold') return <strong key={i}>{seg.content}</strong>;
        if (seg.type === 'link') return (
            <Link key={i} to={seg.href} style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'underline' }}>
                {seg.label}
            </Link>
        );
        return <span key={i}>{seg.content}</span>;
    });
}

const QUICK_CHIPS = [
    'Laptop học tập dưới 15 triệu',
    'Điện thoại tốt dưới 10 triệu',
    'Tai nghe không dây tốt nhất',
    'So sánh iPhone và Samsung',
    'Sản phẩm bán chạy nhất',
];

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}
        >
            {!isUser && (
                <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginRight: 8, marginTop: 2,
                    boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                }}>
                    <span style={{ fontSize: 13 }}>✦</span>
                </div>
            )}
            <div style={{
                maxWidth: '82%',
                padding: '10px 14px',
                borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isUser ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f0f2f8',
                color: isUser ? '#fff' : '#1a1a2e',
                fontSize: 13.5, lineHeight: 1.55,
                boxShadow: isUser ? '0 4px 14px rgba(99,102,241,0.28)' : '0 2px 8px rgba(0,0,0,0.06)',
                wordBreak: 'break-word',
            }}>
                {isUser ? msg.content : parseAIText(msg.content)}
            </div>
        </motion.div>
    );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 10, gap: 8 }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <span style={{ fontSize: 13 }}>✦</span>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: '#f0f2f8', display: 'flex', gap: 5 }}>
                {[0, 0.18, 0.36].map((delay, i) => (
                    <motion.div key={i}
                        style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1' }}
                        animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay, ease: 'easeInOut' }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AICopilot() {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([GREETING]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasNewMsg, setHasNewMsg] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Ẩn trên trang admin / seller
    const isAdminOrSeller = location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller');
    if (isAdminOrSeller) return null;

    // Load lịch sử từ server khi mở lần đầu
    useEffect(() => {
        if (!open || historyLoaded) return;
        setHistoryLoaded(true);

        (async () => {
            try {
                const res = await aiGetHistory(SESSION_ID);
                const data = res.data?.metadata;
                if (data?.messages?.length > 0) {
                    // Thêm greeting ở đầu, rồi lịch sử cũ
                    setMessages([GREETING, ...data.messages]);
                }
                if (data?.userProfile) setUserProfile(data.userProfile);
            } catch {
                // Không có lịch sử hoặc lỗi mạng → giữ greeting
            }
        })();
    }, [open, historyLoaded]);

    // Auto-scroll khi có tin mới
    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setHasNewMsg(false);
        }
    }, [messages, open]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open]);

    const sendMessage = useCallback(async (text) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        const userMsg = { role: 'user', content: msg };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // Gửi history hiện tại (bỏ greeting đầu)
            const historyPayload = newMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));

            const res = await aiChat(msg, historyPayload, SESSION_ID);
            const reply = res.data?.metadata?.reply || 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!';
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
            if (!open) setHasNewMsg(true);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau!' }]);
        } finally {
            setLoading(false);
        }
    }, [input, messages, loading, open]);

    const handleClearHistory = async () => {
        try {
            await aiClearHistory(SESSION_ID);
            setMessages([GREETING]);
            setUserProfile(null);
            setConfirmClear(false);
        } catch {
            setConfirmClear(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // Số tin nhắn thực (bỏ greeting)
    const realMsgCount = messages.length - 1;

    return (
        <>
            {/* ── Panel chat ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="copilot"
                        initial={{ opacity: 0, scale: 0.88, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 24 }}
                        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                        style={{
                            position: 'fixed', bottom: 90, right: 24,
                            width: 375, height: 560, borderRadius: 20,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 24px rgba(99,102,241,0.18)',
                            background: '#fff', display: 'flex', flexDirection: 'column',
                            overflow: 'hidden', zIndex: 9999, border: '1px solid rgba(99,102,241,0.12)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                        }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                            }}>✦</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>AI Shopping Copilot</div>
                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {userProfile?.summary
                                        ? `Xin chào! ${userProfile.summary}`
                                        : <><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#34d399', marginRight: 5, verticalAlign: 'middle' }} />Trợ lý mua sắm thông minh</>
                                    }
                                </div>
                            </div>

                            {/* Nút xóa lịch sử */}
                            {realMsgCount > 0 && (
                                <div style={{ position: 'relative' }}>
                                    {confirmClear ? (
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={handleClearHistory} style={{ background: '#ef4444', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, cursor: 'pointer' }}>Xóa</button>
                                            <button onClick={() => setConfirmClear(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 10, padding: '3px 7px', borderRadius: 6, cursor: 'pointer' }}>Hủy</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmClear(true)} title="Xóa lịch sử" style={{
                                            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'rgba(255,255,255,0.8)',
                                            cursor: 'pointer', width: 26, height: 26, borderRadius: '50%', fontSize: 13,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>🗑</button>
                                    )}
                                </div>
                            )}

                            <button onClick={() => setOpen(false)} style={{
                                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                                cursor: 'pointer', width: 28, height: 28, borderRadius: '50%', fontSize: 18,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>×</button>
                        </div>

                        {/* Lịch sử badge */}
                        {realMsgCount > 0 && (
                            <div style={{ background: '#f5f3ff', padding: '5px 14px', fontSize: 11, color: '#6366f1', textAlign: 'center', borderBottom: '1px solid #ede9fe' }}>
                                Đã có {realMsgCount} tin nhắn trong lịch sử
                            </div>
                        )}

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', scrollbarWidth: 'thin', scrollbarColor: '#e0e7ff transparent' }}>
                            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                            {loading && <TypingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick chips — chỉ hiện khi ít tin nhắn */}
                        {realMsgCount <= 2 && (
                            <div style={{ padding: '6px 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {QUICK_CHIPS.map(chip => (
                                    <button key={chip} onClick={() => sendMessage(chip)} disabled={loading} style={{
                                        padding: '5px 11px', borderRadius: 20, border: '1.5px solid #e0e7ff',
                                        background: '#f5f3ff', color: '#4f46e5', fontSize: 11.5, fontWeight: 600,
                                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
                                        transition: 'all 0.18s',
                                    }}>{chip}</button>
                                ))}
                            </div>
                        )}

                        {/* User profile badge nếu đã có */}
                        {userProfile?.interests?.length > 0 && realMsgCount > 0 && (
                            <div style={{ padding: '4px 14px 6px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 10, color: '#9ca3af' }}>Sở thích của bạn:</span>
                                {userProfile.interests.slice(0, 3).map((int, i) => (
                                    <span key={i} style={{ fontSize: 10, background: '#ede9fe', color: '#6366f1', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>{int}</span>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f0f2f8', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu hỏi hoặc yêu cầu tìm sản phẩm..."
                                disabled={loading}
                                rows={1}
                                style={{
                                    flex: 1, padding: '10px 14px', borderRadius: 14,
                                    border: '1.5px solid #e0e7ff', outline: 'none',
                                    fontSize: 13.5, resize: 'none', fontFamily: 'inherit',
                                    background: '#fafbff', color: '#1a1a2e', lineHeight: 1.5,
                                    maxHeight: 96, overflowY: 'auto',
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                                onBlur={e => e.currentTarget.style.borderColor = '#e0e7ff'}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={loading || !input.trim()}
                                style={{
                                    width: 42, height: 42, borderRadius: 14, border: 'none', flexShrink: 0,
                                    background: loading || !input.trim() ? '#e0e7ff' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M22 2L11 13" stroke={loading || !input.trim() ? '#a5b4fc' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={loading || !input.trim() ? '#a5b4fc' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FAB Button ── */}
            <motion.button
                onClick={() => { setOpen(o => !o); setHasNewMsg(false); }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                style={{
                    position: 'fixed', bottom: 24, right: 24, width: 58, height: 58,
                    borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: open ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 6px 24px rgba(99,102,241,0.45), 0 2px 8px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10000, transition: 'background 0.2s',
                }}
                title="AI Shopping Copilot"
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} style={{ fontSize: 24, color: '#fff', lineHeight: 1, display: 'block' }}>×</motion.span>
                    ) : (
                        <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} style={{ fontSize: 24, lineHeight: 1, color: '#fff', display: 'block' }}>✦</motion.span>
                    )}
                </AnimatePresence>
                {hasNewMsg && !open && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />
                )}
            </motion.button>
        </>
    );
}

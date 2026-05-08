import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { message } from 'antd';

const SocketContext = createContext();

export function SocketProvider({ children }) {
    const { user, loading } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Chỉ kết nối socket khi đã load xong và có thông tin user
        if (loading) return;

        if (user && !socket) {
            // URL backend tuỳ thuộc vào biến môi trường hoặc chạy local.
            // Vì auth sử dụng cookie nên cần truyền withCredentials
            const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001', {
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket connected:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                setIsConnected(false);
            });

            // Lắng nghe sự kiện báo lỗi từ server nếu có
            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                if (err.message === 'Unauthorized') {
                    // Cookie không hợp lệ hoặc hết hạn
                    newSocket.disconnect();
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }

        // Trường hợp user logout (user = null) mà socket đang có thì disconnect
        if (!user && socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }

    }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

    // Hàm tiện ích emit với Promise
    // Dùng socket.connected (property real-time) thay vì isConnected state (có thể stale)
    const emitWithPromise = (eventName, data, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            if (!socket || !socket.connected) {
                return reject(new Error('Chưa kết nối tới máy chủ chat'));
            }
            const timer = setTimeout(() => {
                reject(new Error('Timeout: server không phản hồi'));
            }, timeout);
            socket.emit(eventName, data, (response) => {
                clearTimeout(timer);
                if (response?.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, emitWithPromise }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);

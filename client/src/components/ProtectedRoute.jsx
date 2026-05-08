import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';
import { useEffect } from 'react';
import { message } from 'antd';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (!loading && user) {
            const hasPermission = allowedRoles.includes(user.role) || (user.isAdmin && allowedRoles.includes('admin'));
            if (!hasPermission) {
                message.error('Bạn không có quyền truy cập vào khu vực này!');
            }
        }
    }, [loading, user, allowedRoles]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        // Chưa đăng nhập đẩy về Login, có lưu lại state location để login xong redirect về
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const hasPermission = allowedRoles.includes(user.role) || (user.isAdmin && allowedRoles.includes('admin'));

    if (!hasPermission) {
        // Về thẳng trang chủ, không cho lưu thông tin History
        return <Navigate to="/" replace />;
    }

    return children;
}

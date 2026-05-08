import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DomainRedirect() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading || !user) return; // Không can thiệp nếu chưa đăng nhập hoặc đang load

        const path = location.pathname;
        const isAdmin = user.role === 'admin' || user.isAdmin === true;
        const isSeller = user.role === 'seller';
        const isUser = !isAdmin && !isSeller;

        // 1. NGĂN CHẶN KHÔNG CHO QUAY LẠI LOGIN/REGISTER KHI ĐÃ ĐĂNG NHẬP
        if (path === '/login' || path === '/register') {
            if (isAdmin) navigate('/admin', { replace: true });
            else if (isSeller) navigate('/seller', { replace: true });
            else navigate('/', { replace: true });
            return;
        }

        // 2. KHÓA CHẶT ADMIN (Không được phép ra khỏi /admin)
        if (isAdmin && !path.startsWith('/admin')) {
            navigate('/admin', { replace: true });
            return;
        }

        // 3. KHÓA CHẶT SELLER (Không được phép ra khỏi /seller)
        if (isSeller && !path.startsWith('/seller')) {
            navigate('/seller', { replace: true });
            return;
        }

        // 4. KHÓA CHẶT USER (Không được phép vào /admin, /seller ngoại trừ việc đăng ký bán)
        if (isUser && (path.startsWith('/admin') || path.startsWith('/seller'))) {
            if (path !== '/seller/register') {
                navigate('/', { replace: true });
                return;
            }
        }

    }, [user, loading, location.pathname, navigate]);

    return null;
}

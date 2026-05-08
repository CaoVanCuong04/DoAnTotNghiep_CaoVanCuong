import { createContext, useContext, useState, useEffect } from 'react';
import { userApi } from '../api';
import CryptoJS from 'crypto-js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hàm load user profile
    const fetchProfile = async () => {
        try {
            // Chỉ lấy profile nếu có cookie logged (để chặn request không cần thiết nếu chưa login)
            const isLoggedIn = document.cookie.includes('logged=1');
            if (isLoggedIn) {
                const res = await userApi.getProfile();
                const encryptedData = res.data.metadata;
                const secretKey = import.meta.env.VITE_SECRET_CRYPTO || '123456';
                const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
                const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                setUser(decryptedData);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const loginAction = async (data) => {
        const res = await userApi.login(data);
        await fetchProfile(); // Load lại info sau khi login thành công có token
        return res.data;
    };

    const loginWithGoogleAction = async (data) => {
        const res = await userApi.loginGoogle(data);
        await fetchProfile(); // Load lại info sau khi login thành công có token
        return res.data;
    };

    const logoutAction = async () => {
        try {
            await userApi.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('accessToken'); // dự phòng
            setUser(null);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, loginAction, loginWithGoogleAction, logoutAction }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

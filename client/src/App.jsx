import { Routes, Route, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SearchPage from './pages/SearchPage';
import StoreProfilePage from './pages/StoreProfilePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import PartnerPage from './pages/public/PartnerPage';
import PromotionsPage from './pages/public/PromotionsPage';
import CareersPage from './pages/public/CareersPage';
import SupportPage from './pages/public/SupportPage';
import FAQPage from './pages/public/FAQPage';
import ShippingPolicyPage from './pages/public/ShippingPolicyPage';
import ReturnPolicyPage from './pages/public/ReturnPolicyPage';
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage';
import TermsPage from './pages/public/TermsPage';
import CookiePolicyPage from './pages/public/CookiePolicyPage';
import CustomerChatWidget from './components/CustomerChatWidget';
import UserReportNotificationModal from './components/UserReportNotificationModal';
import AICopilot from './components/AICopilot';
import ProtectedRoute from './components/ProtectedRoute';
import DomainRedirect from './components/DomainRedirect';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import ProductsPage from './pages/admin/ProductsPage';
import OrdersPage from './pages/admin/OrdersPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import ReportsPage from './pages/admin/ReportsPage';
import CouponsPage from './pages/admin/CouponsPage';
import StoresPage from './pages/admin/StoresPage';
import WithdrawalsPage from './pages/admin/WithdrawalsPage';
import BannersPage from './pages/admin/BannersPage';
import AdminProfile from './pages/admin/AdminProfile';

// Seller pages
import SellerLayout from './pages/seller/SellerLayout';
import SellerRegisterPage from './pages/seller/SellerRegisterPage';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerChatPage from './pages/seller/SellerChatPage';
import SellerOrders from './pages/seller/SellerOrders';
import SellerCoupons from './pages/seller/SellerCoupons';
import SellerReviews from './pages/seller/SellerReviews';
import SellerWallet from './pages/seller/SellerWallet';
import SellerSettings from './pages/seller/SellerSettings';
import SellerReturns from './pages/seller/SellerReturns';
import SellerProfile from './pages/seller/SellerProfile';

const authPaths = ['/login', '/register', '/forgot-password'];

export default function App() {
    const location = useLocation();
    const isAuthPage = authPaths.includes(location.pathname);
    const isAdminPage = location.pathname.startsWith('/admin');
    const isSellerPage = location.pathname.startsWith('/seller');

    return (
        <AuthProvider>
            <SocketProvider>
                <DomainRedirect />
                {isAdminPage ? (
                    /* Admin Panel — layout riêng, không dùng Header/Footer user */
                    <Routes>
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<DashboardPage />} />
                            <Route path="users" element={<UsersPage />} />
                            <Route path="stores" element={<StoresPage />} />
                            <Route path="withdrawals" element={<WithdrawalsPage />} />
                            <Route path="products" element={<ProductsPage />} />
                            <Route path="orders" element={<OrdersPage />} />
                            <Route path="categories" element={<CategoriesPage />} />
                            <Route path="banners" element={<BannersPage />} />
                            <Route path="coupons" element={<CouponsPage />} />
                            <Route path="reports" element={<ReportsPage />} />
                            <Route path="profile" element={<AdminProfile />} />
                        </Route>
                    </Routes>
                ) : isSellerPage ? (
                    /* Seller Panel — layout riêng, không dùng Header/Footer user */
                    <Routes>
                        <Route
                            path="/seller"
                            element={
                                <ProtectedRoute allowedRoles={['seller', 'customer']}>
                                    <SellerLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="register" element={<SellerRegisterPage />} />
                            <Route index element={<SellerDashboard />} />
                            <Route path="products" element={<SellerProducts />} />
                            <Route path="chat" element={<SellerChatPage />} />
                            <Route path="orders" element={<SellerOrders />} />
                            <Route path="coupons" element={<SellerCoupons />} />
                            <Route path="reviews" element={<SellerReviews />} />
                            <Route path="wallet" element={<SellerWallet />} />
                            <Route path="settings" element={<SellerSettings />} />
                            <Route path="returns" element={<SellerReturns />} />
                            <Route path="profile" element={<SellerProfile />} />
                        </Route>
                    </Routes>
                ) : (
                    /* User-facing pages */
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                        {!isAuthPage && <Header />}
                        <main style={{ flex: 1 }}>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/product/:slug" element={<ProductDetailPage />} />
                                <Route path="/store/:slug" element={<StoreProfilePage />} />

                                {/* Protected User Actions */}
                                <Route
                                    path="/cart"
                                    element={
                                        <ProtectedRoute allowedRoles={['customer', 'seller', 'admin']}>
                                            <CartPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/checkout"
                                    element={
                                        <ProtectedRoute allowedRoles={['customer', 'seller', 'admin']}>
                                            <CheckoutPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/checkout/success/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['customer', 'seller', 'admin']}>
                                            <OrderSuccessPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/orders/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['customer', 'seller', 'admin']}>
                                            <OrderDetailPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute allowedRoles={['customer', 'seller', 'admin']}>
                                            <ProfilePage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile/orders"
                                    element={
                                        <ProtectedRoute allowedRoles={['customer', 'seller', 'admin']}>
                                            <ProfilePage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                                {/* Public info pages */}
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/partner" element={<PartnerPage />} />
                                <Route path="/promotions" element={<PromotionsPage />} />
                                <Route path="/careers" element={<CareersPage />} />
                                <Route path="/support" element={<SupportPage />} />
                                <Route path="/faq" element={<FAQPage />} />
                                <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                                <Route path="/return-policy" element={<ReturnPolicyPage />} />
                                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                                <Route path="/terms" element={<TermsPage />} />
                                <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                            </Routes>
                        </main>
                        {!isAuthPage && <Footer />}
                        <CustomerChatWidget />
                        <UserReportNotificationModal />
                        <AICopilot />
                    </div>
                )}
            </SocketProvider>
        </AuthProvider>
    );
}

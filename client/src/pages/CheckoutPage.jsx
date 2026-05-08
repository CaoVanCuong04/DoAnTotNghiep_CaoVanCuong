import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Typography, Button, Input, Select, Radio, Divider, Steps, Row, Col, message, Skeleton, Tag } from 'antd';
import { motion } from 'framer-motion';
import { EnvironmentOutlined, CreditCardOutlined, ArrowLeftOutlined, SafetyCertificateOutlined, ReloadOutlined, SafetyOutlined, TagsOutlined } from '@ant-design/icons';

import { getProvinces, getDistricts, getWards, calculateShippingFee } from '../api/apiGhn';
import { getCart, updateShipping } from '../api/apiCart';
import { createOrder } from '../api/apiOrder';
import { getAvailableCoupons, applyCoupon, removeCoupon } from '../api/apiCoupon';
import { productApi, userApi } from '../api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function CheckoutPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();

    const [selectedItems, setSelectedItems] = useState([]);

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        address: '',
        note: '',
    });

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [addressLoading, setAddressLoading] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const hydratedRef = useRef(false);

    const [shippingFee, setShippingFee] = useState(0);
    const [calculatingFee, setCalculatingFee] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [submitting, setSubmitting] = useState(false);

    const [shopCoupons, setShopCoupons] = useState([]);
    const [systemCoupons, setSystemCoupons] = useState([]);
    const [appliedShopCode, setAppliedShopCode] = useState(null);
    const [appliedSystemCode, setAppliedSystemCode] = useState(null);
    const [shopDiscount, setShopDiscount] = useState(0);
    const [systemDiscount, setSystemDiscount] = useState(0);
    const [couponInput, setCouponInput] = useState('');

    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    useEffect(() => {
        const fetchSuggested = async () => {
            try {
                const res = await productApi.getAllProducts({ limit: 4, sort: '-sold' });
                const data = res.data.metadata?.products || res.data.metadata || res.data || [];
                const mapped = Array.isArray(data) ? data.map((p) => ({
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    originalPrice: p.originalPrice || 0,
                    discount: p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0,
                    rating: p.ratingAverage || p.averageRating || 0,
                    reviews: p.ratingCount || p.totalReviews || 0,
                    image: p.images?.[0] || 'https://placehold.co/300x300?text=No+Image',
                    category: p.category?.slug || '',
                    isFlashSale: p.isFlashSale || false,
                    isBestSeller: p.isFeatured || false,
                    slug: p.slug,
                })) : [];
                setSuggestedProducts(mapped);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingSuggestions(false);
            }
        };
        fetchSuggested();
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login', { state: { from: '/checkout' } });
                return;
            }

            const items = location.state?.selectedItems;
            if (!items || items.length === 0) {
                navigate('/cart');
                return;
            }
            setSelectedItems(items);

            loadInitialData();
        }
    }, [user, authLoading, location.state, navigate]);

    const loadInitialData = async () => {
        try {
            const [provRes, cartRes, couponRes, addressRes] = await Promise.all([
                getProvinces(),
                getCart(),
                getAvailableCoupons().catch(() => ({ data: { metadata: {} } })),
                userApi.getAddresses().catch(() => ({ data: { metadata: [] } })),
            ]);

            const provData = provRes.data?.data || provRes.data;
            if (provData) setProvinces(provData);

            const cartData = cartRes.data?.metadata || cartRes.data;
            if (cartData) {
                setFormData((prev) => ({
                    ...prev,
                    fullName: cartData.fullName || user?.fullName || '',
                    phoneNumber: cartData.phoneNumber || user?.phone || '',
                    address: cartData.address || '',
                }));
                setAppliedShopCode(cartData.shopVoucherCode || null);
                setAppliedSystemCode(cartData.systemVoucherCode || null);
                setShopDiscount(cartData.shopDiscount || 0);
                setSystemDiscount(cartData.systemDiscount || 0);
            }

            const couponData = couponRes.data?.metadata || couponRes.data;
            if (couponData) {
                setShopCoupons(couponData.shopCoupons || []);
                setSystemCoupons(couponData.systemCoupons || []);
            }

            const addressData = addressRes.data?.metadata || addressRes.data || [];
            const addresses = Array.isArray(addressData) ? addressData : [];
            setSavedAddresses(addresses);
            if (addresses.length > 0) {
                const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
                setSelectedAddressId(defaultAddress._id);
                if (defaultAddress) {
                    await hydrateAddressToSelects(defaultAddress, provData || provinces);
                    setFormData((prev) => ({
                        ...prev,
                        fullName: defaultAddress.fullName || prev.fullName,
                        phoneNumber: defaultAddress.phone || prev.phoneNumber,
                        address: defaultAddress.detail || prev.address,
                    }));
                }
            }
        } catch (error) {
            console.error('Lỗi lấy dữ liệu ban đầu', error);
        }
    };

    useEffect(() => {
        if (selectedProvince) {
            getDistricts({ province_id: selectedProvince })
                .then((res) => {
                    setDistricts(res.data?.data || res.data || []);
                    setSelectedDistrict(null);
                    setSelectedWard(null);
                    setWards([]);
                })
                .catch(console.error);
        }
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedDistrict) {
            getWards({ district_id: selectedDistrict })
                .then((res) => {
                    setWards(res.data?.data || res.data || []);
                    setSelectedWard(null);
                })
                .catch(console.error);
        }
    }, [selectedDistrict]);

    const hydrateAddressToSelects = async (address, provinceList = provinces) => {
        if (!address) return;
        const provinceId = Number(address.provinceId);
        const districtId = Number(address.districtId);
        const wardCode = String(address.wardCode || '');

        const matchedProvince = provinceList.find((p) => Number(p.ProvinceID) === provinceId);
        if (!matchedProvince) return;

        setSelectedProvince(matchedProvince.ProvinceID);

        try {
            const districtRes = await getDistricts({ province_id: matchedProvince.ProvinceID });
            const districtData = districtRes.data?.data || districtRes.data || [];
            setDistricts(districtData);

            const matchedDistrict = districtData.find((d) => Number(d.DistrictID) === districtId);
            if (!matchedDistrict) return;

            setSelectedDistrict(matchedDistrict.DistrictID);

            const wardRes = await getWards({ district_id: matchedDistrict.DistrictID });
            const wardData = wardRes.data?.data || wardRes.data || [];
            setWards(wardData);

            const matchedWard = wardData.find((w) => String(w.WardCode) === wardCode);
            if (matchedWard) {
                setSelectedWard(matchedWard.WardCode);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fillFromSavedAddress = async (addressId) => {
        const address = savedAddresses.find((item) => item._id === addressId);
        if (!address) return;

        setSelectedAddressId(addressId);
        setFormData((prev) => ({
            ...prev,
            fullName: address.fullName || prev.fullName,
            phoneNumber: address.phone || prev.phoneNumber,
            address: address.detail || prev.address,
        }));

        await hydrateAddressToSelects(address);
    };

    const handleCalculateFee = async () => {
        if (!formData.fullName || !formData.phoneNumber || !formData.address || !selectedDistrict || !selectedWard) {
            message.error('Vui lòng điền đầy đủ và chọn địa chỉ giao hàng');
            return;
        }

        setCalculatingFee(true);
        try {
            await updateShipping({
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                districtId: Number(selectedDistrict),
                wardCode: String(selectedWard),
            });

            const feeRes = await calculateShippingFee({
                to_district_id: Number(selectedDistrict),
                to_ward_code: String(selectedWard),
            });

            const feeData = feeRes.data?.metadata || feeRes.data;
            if (feeData && feeData.total !== undefined) {
                setShippingFee(feeData.total);
                message.success('Tính phí vận chuyển thành công!');
            } else if (feeData && feeData.total_fee !== undefined) {
                setShippingFee(feeData.total_fee);
                message.success('Tính phí vận chuyển thành công!');
            } else {
                setShippingFee(30000);
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tính phí vận chuyển';
            message.error(msg);
            setShippingFee(35000);
        } finally {
            setCalculatingFee(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!formData.fullName || !formData.phoneNumber || !formData.address || !selectedDistrict || !selectedWard) {
            message.error('Vui lòng điền và cập nhật địa chỉ giao hàng');
            return;
        }
        if (shippingFee === 0) {
            message.error('Vui lòng tính phí vận chuyển trước khi đặt hàng');
            return;
        }

        setSubmitting(true);
        try {
            const itemIds = selectedItems.map((item) => item._id || item.productId);

            const payload = {
                paymentMethod,
                itemIds,
                note: formData.note,
                shippingFee,
            };

            const res = await createOrder(payload);
            const metadata = res.data?.metadata || res.data;

            if (paymentMethod === 'cod') {
                message.success('Đặt hàng thành công!');
                setTimeout(() => navigate(`/checkout/success/${metadata._id || metadata.orderId || metadata.id}`), 1000);
            } else if (['momo', 'vnpay'].includes(paymentMethod)) {
                if (metadata.paymentUrl) {
                    window.location.href = metadata.paymentUrl;
                } else {
                    message.error('Lỗi: Không lấy được link thanh toán');
                    setSubmitting(false);
                }
            }
        } catch (error) {
            console.error('Create Order Error:', error);
            message.error(error.response?.data?.message || 'Lỗi đặt hàng');
            setSubmitting(false);
        }
    };

    const handleApplyCoupon = async (code) => {
        if (!code) return;
        setSubmitting(true);
        try {
            const res = await applyCoupon({ code });
            const data = res.data?.metadata || res.data;
            message.success(`Áp dụng mã ${code} thành công!`);

            if (data.type === 'system') {
                setAppliedSystemCode(code);
                setSystemDiscount(data.discountAmount);
            } else {
                setAppliedShopCode(code);
                setShopDiscount(data.discountAmount);
            }
            setCouponInput('');
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi áp dụng mã');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveCoupon = async (type) => {
        setSubmitting(true);
        try {
            await removeCoupon(type);
            message.success('Đã gỡ mã giảm giá');
            if (type === 'system') {
                setAppliedSystemCode(null);
                setSystemDiscount(0);
            } else {
                setAppliedShopCode(null);
                setShopDiscount(0);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || selectedItems.length === 0) {
        return (
            <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px 0' }}>
                <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto' }}>
                    <Skeleton active paragraph={{ rows: 10 }} />
                </div>
            </div>
        );
    }

    const totalPrice = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalDiscount = shopDiscount + systemDiscount;
    const finalPrice = Math.max(0, totalPrice - totalDiscount) + shippingFee;

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ background: '#fff', borderBottom: '1px solid #e8ecf3', padding: '16px 0' }}>
                <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CreditCardOutlined style={{ fontSize: 26, color: '#1a3c8f' }} />
                        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>Thanh toán an toàn</Title>
                    </div>
                    <div style={{ display: window.innerWidth < 768 ? 'none' : 'block', width: '40%' }}>
                        <Steps
                            current={1}
                            items={[
                                { title: 'Giỏ hàng' },
                                { title: 'Thanh toán' },
                                { title: 'Hoàn tất' }
                            ]}
                        />
                    </div>
                    <Link to="/cart">
                        <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#1a3c8f', fontWeight: 600 }}>Quay lại giỏ hàng</Button>
                    </Link>
                </div>
            </div>

            <div style={{ padding: '24px 0' }}>
                <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto' }}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e8ecf3', background: '#fff', marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                        <EnvironmentOutlined style={{ color: '#ff4500', fontSize: 24 }} />
                                        <Title level={5} style={{ margin: 0 }}>Thông tin nhận hàng</Title>
                                    </div>

                                    {savedAddresses.length > 0 && (
                                        <div style={{ marginBottom: 20 }}>
                                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Chọn địa chỉ đã lưu</Text>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {savedAddresses.map((addr) => (
                                                    <div
                                                        key={addr._id}
                                                        onClick={() => fillFromSavedAddress(addr._id)}
                                                        style={{
                                                            padding: '12px 14px',
                                                            borderRadius: 10,
                                                            border: selectedAddressId === addr._id ? '1.5px solid #1a3c8f' : '1px solid #e8ecf3',
                                                            background: selectedAddressId === addr._id ? '#eff6ff' : '#fff',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                            <div>
                                                                <Text strong>{addr.fullName}</Text>
                                                                {addr.isDefault && <Tag color="blue" style={{ marginLeft: 8 }}>Mặc định</Tag>}
                                                                <div style={{ marginTop: 4 }}>
                                                                    <Text type="secondary">{addr.phone}</Text>
                                                                </div>
                                                                <div style={{ marginTop: 4 }}>
                                                                    <Text type="secondary">{[addr.detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}</Text>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                        <Col xs={24} sm={12}>
                                            <Input size="large" placeholder="Họ và tên" value={formData.fullName} onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))} />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Input size="large" placeholder="Số điện thoại" value={formData.phoneNumber} onChange={(e) => setFormData(p => ({ ...p, phoneNumber: e.target.value }))} />
                                        </Col>
                                    </Row>

                                    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                        <Col xs={24} md={12}>
                                            <Select
                                                size="large"
                                                fullWidth
                                                style={{ width: '100%' }}
                                                placeholder="Tỉnh/Thành phố"
                                                value={selectedProvince}
                                                onChange={(v) => setSelectedProvince(v)}
                                                options={provinces.map(p => ({ label: p.ProvinceName, value: p.ProvinceID }))}
                                            />
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Select
                                                size="large"
                                                fullWidth
                                                style={{ width: '100%' }}
                                                placeholder="Quận/Huyện"
                                                value={selectedDistrict}
                                                onChange={(v) => setSelectedDistrict(v)}
                                                disabled={!selectedProvince}
                                                options={districts.map(d => ({ label: d.DistrictName, value: d.DistrictID }))}
                                            />
                                        </Col>
                                    </Row>

                                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                        <Col xs={24} md={12}>
                                            <Select
                                                size="large"
                                                fullWidth
                                                style={{ width: '100%' }}
                                                placeholder="Phường/Xã"
                                                value={selectedWard}
                                                onChange={(v) => setSelectedWard(v)}
                                                disabled={!selectedDistrict}
                                                options={wards.map(w => ({ label: w.WardName, value: w.WardCode }))}
                                            />
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Input size="large" placeholder="Địa chỉ cụ thể (Số nhà, tên đường...)" value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} />
                                        </Col>
                                    </Row>

                                    <Button
                                        size="large"
                                        block
                                        onClick={handleCalculateFee}
                                        loading={calculatingFee}
                                        disabled={!selectedWard || !formData.address}
                                        style={{ borderColor: '#1a3c8f', color: '#1a3c8f', fontWeight: 600 }}
                                    >
                                        Xác nhận địa chỉ & Cập nhật phí giao hàng GHN
                                    </Button>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                                <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e8ecf3', background: '#fff', marginBottom: 24 }}>
                                    <Title level={5} style={{ marginBottom: 16 }}>Phương thức thanh toán</Title>
                                    <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <Radio value="cod" style={{ padding: '12px 16px', border: `1.5px solid ${paymentMethod === 'cod' ? '#ff4500' : '#e8ecf3'}`, borderRadius: 8, background: paymentMethod === 'cod' ? 'rgba(255,69,0,0.04)' : '#fff' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img src="https://salt.tikicdn.com/ts/upload/92/b2/78/1b3b9cda5208b323eb9ec56b84c7eb87.png" alt="COD" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                                <Text strong>Thanh toán khi nhận hàng (COD)</Text>
                                            </div>
                                        </Radio>
                                        <Radio value="momo" style={{ padding: '12px 16px', border: `1.5px solid ${paymentMethod === 'momo' ? '#ff4500' : '#e8ecf3'}`, borderRadius: 8, background: paymentMethod === 'momo' ? 'rgba(255,69,0,0.04)' : '#fff' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img src="https://salt.tikicdn.com/ts/upload/ce/f6/e8/ea880ef285856f744e3ffb5d282d4b2d.jpg" alt="MoMo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                                <Text strong>Ví MoMo</Text>
                                            </div>
                                        </Radio>
                                        <Radio value="vnpay" style={{ padding: '12px 16px', border: `1.5px solid ${paymentMethod === 'vnpay' ? '#ff4500' : '#e8ecf3'}`, borderRadius: 8, background: paymentMethod === 'vnpay' ? 'rgba(255,69,0,0.04)' : '#fff' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img src="https://salt.tikicdn.com/ts/upload/77/6a/df/a35cb9c62b9215dbc6d334a77cda4327.png" alt="VNPay" style={{ height: 30, objectFit: 'contain', marginLeft: 5 }} />
                                                <Text strong>Thẻ ATM / VNPAY</Text>
                                            </div>
                                        </Radio>
                                    </Radio.Group>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                                <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e8ecf3', background: '#fff', marginBottom: 24 }}>
                                    <Input.TextArea
                                        rows={3}
                                        placeholder="Ví dụ: Giao ngoài giờ hành chính..."
                                        value={formData.note}
                                        onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))}
                                        maxLength={500}
                                    />
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={8}>
                                        <div style={{ padding: 16, borderRadius: 12, border: '1px dashed #93c5fd', background: '#eff6ff', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <SafetyOutlined style={{ color: '#3b82f6', fontSize: 28 }} />
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.85rem' }}>Cam kết chính hãng</div>
                                                <div style={{ color: '#3b82f6', fontSize: '0.75rem' }}>100% Authentic</div>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <div style={{ padding: 16, borderRadius: 12, border: '1px dashed #86efac', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <ReloadOutlined style={{ color: '#22c55e', fontSize: 28 }} />
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#14532d', fontSize: '0.85rem' }}>Đổi trả 7 ngày</div>
                                                <div style={{ color: '#22c55e', fontSize: '0.75rem' }}>Nếu có lỗi từ NSX</div>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <div style={{ padding: 16, borderRadius: 12, border: '1px dashed #fcd34d', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <SafetyCertificateOutlined style={{ color: '#f59e0b', fontSize: 28 }} />
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#78350f', fontSize: '0.85rem' }}>Thanh toán an toàn</div>
                                                <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>Mã hóa bảo mật cấp cao</div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </motion.div>
                        </Col>

                        <Col xs={24} lg={8}>
                            <div style={{ position: 'sticky', top: 80 }}>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                                    <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e8ecf3', background: '#fff' }}>
                                        <Title level={5} style={{ marginBottom: 16 }}>Đơn hàng của bạn</Title>

                                        <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 24 }}>
                                            {selectedItems.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                                    <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, border: '1px solid #f0f2f5' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <Text strong style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3, fontSize: '0.85rem', marginBottom: 4 }}>{item.name}</Text>
                                                        {item.variantLabel && <Text type="secondary" style={{ display: 'block', fontSize: '0.75rem', marginBottom: 4 }}>{item.variantLabel}</Text>}
                                                        <div>
                                                            <Text strong style={{ color: '#ff4500' }}>{item.price.toLocaleString('vi-VN')}₫</Text>
                                                            <Text type="secondary" style={{ marginLeft: 4 }}>x{item.quantity}</Text>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Divider style={{ margin: '16px 0' }} />

                                        <div style={{ marginBottom: 24 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <TagsOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                                                <Text strong>Mã giảm giá</Text>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                                <Input placeholder="Nhập mã..." value={couponInput} onChange={e => setCouponInput(e.target.value)} />
                                                <Button type="primary" style={{ background: '#1a1a2e', borderColor: '#1a1a2e' }} onClick={() => handleApplyCoupon(couponInput)} disabled={!couponInput || submitting} loading={submitting}>
                                                    Áp dụng
                                                </Button>
                                            </div>

                                            {appliedSystemCode && (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '8px 12px', borderRadius: 8, border: '1px dashed #22c55e', marginBottom: 8 }}>
                                                    <Text strong style={{ color: '#16a34a', fontSize: '0.85rem' }}>🎟️ Sàn: {appliedSystemCode} (-{systemDiscount.toLocaleString('vi-VN')}₫)</Text>
                                                    <Button size="small" danger type="text" onClick={() => handleRemoveCoupon('system')}>Bỏ</Button>
                                                </div>
                                            )}
                                            {appliedShopCode && (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fdf4ff', padding: '8px 12px', borderRadius: 8, border: '1px dashed #d946ef', marginBottom: 8 }}>
                                                    <Text strong style={{ color: '#c026d3', fontSize: '0.85rem' }}>🎟️ Shop: {appliedShopCode} (-{shopDiscount.toLocaleString('vi-VN')}₫)</Text>
                                                    <Button size="small" danger type="text" onClick={() => handleRemoveCoupon('shop')}>Bỏ</Button>
                                                </div>
                                            )}

                                            {(systemCoupons.length > 0 || shopCoupons.length > 0) && (
                                                <div style={{ marginTop: 16 }}>
                                                    <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem' }}>Mã có thể áp dụng cho bạn:</Text>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                        {systemCoupons.map(c => (
                                                            <div key={c._id} onClick={() => !submitting && handleApplyCoupon(c.code)} style={{ padding: '4px 8px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
                                                                {c.code} <span style={{ color: '#ef4444' }}>(-{c.discountType === 'percent' ? `${c.discountValue}%` : `${c.discountValue / 1000}k`})</span>
                                                            </div>
                                                        ))}
                                                        {shopCoupons.map(c => (
                                                            <div key={c._id} onClick={() => !submitting && handleApplyCoupon(c.code)} style={{ padding: '4px 8px', background: '#fff1f2', border: '1px dashed #fecdd3', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
                                                                Shop: {c.code} <span style={{ color: '#ef4444' }}>(-{c.discountType === 'percent' ? `${c.discountValue}%` : `${c.discountValue / 1000}k`})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Divider style={{ margin: '16px 0' }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <Text type="secondary">Tạm tính</Text>
                                            <Text strong>{totalPrice.toLocaleString('vi-VN')}₫</Text>
                                        </div>
                                        {totalDiscount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a' }}>
                                                    <TagsOutlined /> <Text style={{ color: 'inherit' }}>Giảm giá</Text>
                                                </div>
                                                <Text strong style={{ color: '#16a34a' }}>-{totalDiscount.toLocaleString('vi-VN')}₫</Text>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <Text type="secondary">Phí vận chuyển</Text>
                                            {shippingFee > 0 ? (
                                                <Text strong>{shippingFee.toLocaleString('vi-VN')}₫</Text>
                                            ) : (
                                                <Text type="secondary" italic>Chưa tính</Text>
                                            )}
                                        </div>

                                        <Divider style={{ margin: '16px 0' }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                                            <Title level={5} style={{ margin: 0 }}>Tổng cộng</Title>
                                            <div style={{ color: '#ff4500', fontSize: '1.5rem', fontWeight: 800 }}>{finalPrice.toLocaleString('vi-VN')}₫</div>
                                        </div>

                                        <Button
                                            type="primary"
                                            block
                                            size="large"
                                            loading={submitting}
                                            onClick={handlePlaceOrder}
                                            style={{ height: 48, fontWeight: 700, borderRadius: 8, background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c33 100%)', border: 'none' }}
                                        >
                                            Đặt hàng ngay
                                        </Button>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, color: '#16a34a' }}>
                                            <SafetyCertificateOutlined />
                                            <Text strong style={{ color: 'inherit', fontSize: '0.8rem' }}>Giao dịch An toàn 100%</Text>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
                <Title level={4} style={{ marginBottom: 24 }}>Sản phẩm bạn có thể thích</Title>
                {loadingSuggestions ? (
                    <Row gutter={[16, 16]}>
                        {[...Array(4)].map((_, i) => (
                            <Col xs={12} md={6} key={i}>
                                <Skeleton.Button active style={{ width: '100%', height: 280, borderRadius: 8, display: 'block' }} />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Row gutter={[16, 16]}>
                        {suggestedProducts.map((product, i) => (
                            <Col xs={12} md={6} key={product.id}>
                                <ProductCard product={product} index={i} />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
}

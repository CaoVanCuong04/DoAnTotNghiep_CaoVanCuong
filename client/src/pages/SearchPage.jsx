import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Row,
    Col,
    Typography,
    Input,
    InputNumber,
    Button,
    Select,
    Spin,
    Pagination,
    Empty,
    Tag,
    Drawer,
    Skeleton,
    Badge,
    Space,
} from 'antd';
import {
    FilterOutlined,
    FireFilled,
    AppstoreOutlined,
    SortAscendingOutlined,
    SortDescendingOutlined,
    ThunderboltFilled,
    StarFilled,
    DeleteOutlined,
    SearchOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllProducts } from '../api/apiProduct';
import { categoryApi, aiApi } from '../api';
import ProductCard from '../components/ProductCard';

const { Title, Text } = Typography;

const SORT_OPTIONS = [
    { value: 'sold', label: 'Bán chạy', icon: <FireFilled style={{ color: '#ea580c' }} /> },
    { value: 'newest', label: 'Mới nhất', icon: <ThunderboltFilled style={{ color: '#8b5cf6' }} /> },
    { value: 'price_asc', label: 'Giá tăng dần', icon: <SortAscendingOutlined /> },
    { value: 'price_desc', label: 'Giá giảm dần', icon: <SortDescendingOutlined /> },
    { value: 'rating', label: 'Đánh giá cao', icon: <StarFilled style={{ color: '#f59e0b' }} /> },
];

const PRICE_RANGES = [
    { label: 'Dưới 100K', min: 0, max: 100000 },
    { label: '100K - 500K', min: 100000, max: 500000 },
    { label: '500K - 1 Triệu', min: 500000, max: 1000000 },
    { label: '1 - 5 Triệu', min: 1000000, max: 5000000 },
    { label: 'Trên 5 Triệu', min: 5000000, max: '' },
];

const PAGE_SIZE = 12;

const normalizeText = (value = '') =>
    String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const getCategoryId = (category) => category?._id || category?.id || '';

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const keyword = searchParams.get('search') || '';
    const aiQuery = searchParams.get('ai_query') || '';
    const categoryParam = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sort = searchParams.get('sort') || 'sold';
    const page = Number(searchParams.get('page') || 1);

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState([]);
    const [priceInput, setPriceInput] = useState({ min: minPrice, max: maxPrice });
    const [searchInput, setSearchInput] = useState(keyword || aiQuery || '');

    useEffect(() => {
        setSearchInput(keyword || aiQuery || '');
    }, [keyword, aiQuery]);

    useEffect(() => {
        setPriceInput({ min: minPrice, max: maxPrice });
    }, [minPrice, maxPrice]);

    useEffect(() => {
        categoryApi.getAllCategories().then((res) => {
            const data = res.data?.metadata || res.data || [];
            setCategories(Array.isArray(data) ? data : []);
        }).catch(() => setCategories([]));
    }, []);

    const flatCategories = useMemo(() => {
        const list = [];
        const walk = (items, parentId = null, level = 0) => {
            items.forEach((item) => {
                const children = categories.filter((c) => String(c.parent?._id || c.parent) === String(item._id));
                list.push({ ...item, parentId, level, childrenCount: children.length });
                if (children.length) walk(children, item._id, level + 1);
            });
        };
        walk(categories.filter((c) => !c.parent));
        return list;
    }, [categories]);

    const findCategory = (value) => categories.find((c) => String(c._id) === String(value) || c.slug === value || normalizeText(c.name) === normalizeText(value));
    const activeCategory = findCategory(categoryParam);

    const childCategories = useMemo(() => {
        if (!activeCategory?._id) return [];
        return categories.filter((c) => String(c.parent?._id || c.parent) === String(activeCategory._id));
    }, [activeCategory, categories]);

    useEffect(() => {
        if (activeCategory?._id) setExpandedIds((prev) => (prev.includes(activeCategory._id) ? prev : [...prev, activeCategory._id]));
    }, [activeCategory]);

    const updateQuery = (changes) => {
        const current = Object.fromEntries([...searchParams]);
        const next = { ...current, ...changes, page: 1 };
        Object.keys(next).forEach((key) => {
            if (next[key] === '' || next[key] === null || next[key] === undefined) delete next[key];
        });
        setSearchParams(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setPriceInput({ min: '', max: '' });
        setSearchInput('');
        setSearchParams({});
    };

    const applySearch = () => {
        const value = searchInput.trim();
        if (value) updateQuery({ search: value });
        else updateQuery({ search: '' });
    };

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let rawProducts = [];
                let pagination = { total: 0 };

                if (aiQuery) {
                    const res = await aiApi.aiSearch(aiQuery);
                    rawProducts = res.data?.metadata?.products || [];
                    pagination = { total: res.data?.metadata?.total || 0 };
                } else {
                    const query = {
                        search: keyword,
                        category: categoryParam,
                        minPrice,
                        maxPrice,
                        sort,
                        page,
                        limit: PAGE_SIZE,
                    };
                    Object.keys(query).forEach((key) => !query[key] && delete query[key]);
                    const res = await getAllProducts(query);
                    rawProducts = res.data?.metadata?.products || [];
                    pagination = res.data?.metadata?.pagination || {};
                }

                const mapped = rawProducts.map((p) => ({
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    originalPrice: p.originalPrice || 0,
                    discount: p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0,
                    rating: p.ratingAverage || p.averageRating || 0,
                    reviews: p.ratingCount || p.totalReviews || 0,
                    image: p.images?.[0] || 'https://placehold.co/300x300?text=No+Image',
                    category: p.category?.slug || '',
                    categoryName: p.category?.name || '',
                    brand: p.brand || '',
                    isFlashSale: p.isFlashSale || false,
                    isBestSeller: p.isFeatured || false,
                    slug: p.slug,
                    sold: p.sold || 0,
                    store: p.store,
                }));

                setProducts(mapped);
                setTotal(pagination.total || 0);
            } catch (error) {
                console.error(error);
                setProducts([]);
                setTotal(0);
            } finally {
                setLoading(false);
                setInitialLoad(false);
            }
        };

        fetchProducts();
    }, [keyword, aiQuery, categoryParam, minPrice, maxPrice, sort, page]);

    const rankedProducts = useMemo(() => {
        const q = normalizeText([keyword, aiQuery, categoryParam].filter(Boolean).join(' '));
        const tokens = q.split(' ').filter(Boolean);
        return [...products].sort((a, b) => {
            const score = (p) => {
                const name = normalizeText(p.name);
                const brand = normalizeText(p.brand);
                const categoryName = normalizeText(p.categoryName);
                let s = 0;
                if (categoryParam) {
                    if (p.category === categoryParam) s += 120;
                    if (normalizeText(activeCategory?.name || '').split(' ').some((x) => x && name.includes(x))) s += 40;
                }
                if (keyword) {
                    const nk = normalizeText(keyword);
                    if (name === nk) s += 200;
                    if (name.startsWith(nk)) s += 120;
                    if (name.includes(nk)) s += 90;
                }
                tokens.forEach((t) => {
                    if (name.includes(t)) s += 20;
                    if (brand.includes(t)) s += 10;
                    if (categoryName.includes(t)) s += 8;
                });
                return s;
            };
            return score(b) - score(a);
        });
    }, [products, keyword, aiQuery, categoryParam, activeCategory]);

    const activeFiltersCount = [categoryParam, minPrice, maxPrice, keyword, aiQuery].filter(Boolean).length + (sort !== 'sold' ? 1 : 0);

    const rootCategories = useMemo(() => categories.filter((c) => !c.parent).sort((a, b) => (a.order || 0) - (b.order || 0)), [categories]);

    const toggleExpanded = (id) => {
        setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const renderCategoryTree = (items, level = 0) =>
        items.map((cat) => {
            const children = categories.filter((c) => String(c.parent?._id || c.parent) === String(cat._id));
            const expanded = expandedIds.includes(cat._id) || String(activeCategory?._id) === String(cat._id);
            const active = String(categoryParam) === String(cat._id) || categoryParam === cat.slug;
            return (
                <div key={cat._id} style={{ marginLeft: level ? 12 : 0 }}>
                    <motion.div
                        whileHover={{ x: 4 }}
                        onClick={() => (children.length ? toggleExpanded(cat._id) : updateQuery({ category: cat.slug || cat._id }))}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: '9px 12px',
                            borderRadius: 10,
                            marginBottom: 4,
                            background: active ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : 'transparent',
                            color: active ? '#1d4ed8' : '#475569',
                            fontWeight: active ? 700 : 500,
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {level === 0 ? <AppstoreOutlined /> : <span style={{ width: 12 }} />}
                            {cat.name}
                        </span>
                        {children.length > 0 && <span style={{ color: '#94a3b8' }}>{expanded ? '−' : '+'}</span>}
                    </motion.div>
                    <AnimatePresence initial={false}>
                        {expanded && children.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden', paddingLeft: 12, borderLeft: '2px solid #e2e8f0', marginLeft: 12 }}
                            >
                                {renderCategoryTree(children, level + 1)}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        });

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%)', padding: '36px 24px 40px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Tìm kiếm sản phẩm</div>
                    <Space.Compact style={{ width: '100%', maxWidth: 820 }}>
                        <Input
                            allowClear
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onPressEnter={applySearch}
                            placeholder="Tìm tên sản phẩm, thương hiệu, mẫu mã..."
                            size="large"
                        />
                        <Button type="primary" size="large" icon={<SearchOutlined />} onClick={applySearch}>
                            Tìm
                        </Button>
                    </Space.Compact>
                </div>
            </div>

            <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 64, zIndex: 30 }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button className="mobile-filter-btn" icon={<FilterOutlined />} onClick={() => setDrawerOpen(true)} style={{ display: 'none' }}>
                        <Badge count={activeFiltersCount} size="small" offset={[8, -4]}>Bộ lọc</Badge>
                    </Button>
                    <Text style={{ color: '#94a3b8', flexShrink: 0 }}>Sắp xếp:</Text>
                    <div style={{ display: 'flex', gap: 8, overflow: 'auto', flex: 1 }}>
                        {SORT_OPTIONS.map((opt) => (
                            <Button key={opt.value} type={sort === opt.value ? 'primary' : 'default'} onClick={() => updateQuery({ sort: opt.value })} icon={opt.icon}>
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                    <Text style={{ color: '#94a3b8' }}>Trang {page}</Text>
                </div>
            </div>

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 60px' }}>
                <Row gutter={24}>
                    <Col xs={0} lg={6}>
                        <div style={{ background: '#fff', padding: 20, borderRadius: 20, border: '1px solid #f1f5f9', position: 'sticky', top: 130 }}>
                            <Title level={5} style={{ marginTop: 0 }}>Danh mục</Title>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    onClick={() => updateQuery({ category: '' })}
                                    style={{ padding: '9px 12px', borderRadius: 10, cursor: 'pointer', background: !categoryParam ? '#eff6ff' : 'transparent', color: !categoryParam ? '#1d4ed8' : '#475569', fontWeight: !categoryParam ? 700 : 500 }}
                                >
                                    <AppstoreOutlined style={{ marginRight: 8 }} /> Tất cả sản phẩm
                                </motion.div>
                                {renderCategoryTree(rootCategories)}
                            </div>

                            <Title level={5} style={{ marginTop: 24 }}>Khoảng giá</Title>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                {PRICE_RANGES.map((range) => {
                                    const active = String(minPrice) === String(range.min) && String(maxPrice) === String(range.max);
                                    return (
                                        <Button key={range.label} size="small" type={active ? 'primary' : 'default'} onClick={() => updateQuery({ minPrice: range.min, maxPrice: range.max || '' })}>
                                            {range.label}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Space.Compact style={{ width: '100%' }}>
                                <InputNumber style={{ width: '50%' }} placeholder="Từ" value={priceInput.min} onChange={(v) => setPriceInput((p) => ({ ...p, min: v }))} />
                                <InputNumber style={{ width: '50%' }} placeholder="Đến" value={priceInput.max} onChange={(v) => setPriceInput((p) => ({ ...p, max: v }))} />
                            </Space.Compact>
                            <Button block style={{ marginTop: 10 }} onClick={() => updateQuery({ minPrice: priceInput.min, maxPrice: priceInput.max })}>
                                Áp dụng
                            </Button>

                            {activeFiltersCount > 0 && (
                                <Button danger block icon={<DeleteOutlined />} style={{ marginTop: 12 }} onClick={clearFilters}>
                                    Xóa bộ lọc
                                </Button>
                            )}
                        </div>
                    </Col>

                    <Col xs={24} lg={18}>
                        {activeCategory?.name && (
                            <div style={{ marginBottom: 12 }}>
                                <Tag color="blue">Danh mục: {activeCategory.name}</Tag>
                                {childCategories.length > 0 && <Tag color="geekblue">{childCategories.length} danh mục con</Tag>}
                            </div>
                        )}

                        {loading && initialLoad ? (
                            <Row gutter={[16, 16]}>
                                {[...Array(12)].map((_, i) => (
                                    <Col xs={12} sm={8} md={8} xl={6} key={i}>
                                        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                            <Skeleton.Image active style={{ width: '100%', height: 180, display: 'block' }} />
                                            <div style={{ padding: 16 }}>
                                                <Skeleton active paragraph={{ rows: 2 }} />
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        ) : loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                                <Spin size="large" />
                            </div>
                        ) : rankedProducts.length === 0 ? (
                            <Empty description="Không tìm thấy sản phẩm nào" />
                        ) : (
                            <>
                                <Row gutter={[16, 16]}>
                                    <AnimatePresence mode="wait">
                                        {rankedProducts.map((product, idx) => (
                                            <Col xs={12} sm={8} md={8} xl={6} key={product.id}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.25, delay: idx * 0.02 }}
                                                    style={{ height: '100%' }}
                                                >
                                                    <ProductCard product={product} index={idx} />
                                                </motion.div>
                                            </Col>
                                        ))}
                                    </AnimatePresence>
                                </Row>
                                {total > PAGE_SIZE && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                                        <Pagination current={page} pageSize={PAGE_SIZE} total={total} showSizeChanger={false} onChange={(p) => updateQuery({ page: p })} />
                                    </div>
                                )}
                            </>
                        )}
                    </Col>
                </Row>
            </div>

            <Drawer title={<Space><FilterOutlined /> Bộ lọc</Space>} placement="left" width={320} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <Text strong>Danh mục</Text>
                        <div style={{ marginTop: 8 }}>{renderCategoryTree(rootCategories)}</div>
                    </div>
                    <div>
                        <Text strong>Khoảng giá</Text>
                        <div style={{ marginTop: 8 }}>
                            <Space.Compact style={{ width: '100%' }}>
                                <InputNumber style={{ width: '50%' }} placeholder="Từ" value={priceInput.min} onChange={(v) => setPriceInput((p) => ({ ...p, min: v }))} />
                                <InputNumber style={{ width: '50%' }} placeholder="Đến" value={priceInput.max} onChange={(v) => setPriceInput((p) => ({ ...p, max: v }))} />
                            </Space.Compact>
                            <Button block style={{ marginTop: 10 }} onClick={() => { updateQuery({ minPrice: priceInput.min, maxPrice: priceInput.max }); setDrawerOpen(false); }}>
                                Áp dụng
                            </Button>
                        </div>
                    </div>
                    <Button danger icon={<DeleteOutlined />} onClick={() => { clearFilters(); setDrawerOpen(false); }}>
                        Xóa bộ lọc
                    </Button>
                </div>
            </Drawer>

            <style>{`
                @media (max-width: 991px) {
                    .mobile-filter-btn { display: inline-flex !important; }
                }
            `}</style>
        </div>
    );
}

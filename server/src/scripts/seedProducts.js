const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const cloudinary = require('../config/cloudDinary');

// Load env
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.CONNECT_DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const realisticData = {
    'điện thoại': [
        {
            name: 'iPhone 15 Pro Max 256GB',
            price: 34990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
        },
        {
            name: 'Samsung Galaxy S24 Ultra 5G',
            price: 33990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/319665/samsung-galaxy-s24-ultra-grey-thumb-600x600.jpg',
        },
        {
            name: 'OPPO Find N3 Flip',
            price: 22990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/313437/oppo-find-n3-flip-pink-thumb-600x600.jpg',
        },
        {
            name: 'Xiaomi 14 5G',
            price: 22990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/314207/xiaomi-14-black-thumb-1-600x600.jpg',
        },
    ],
    iphone: [
        {
            name: 'iPhone 15 Pro Max 256GB',
            price: 34990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
        },
        {
            name: 'iPhone 15 Plus 128GB',
            price: 25990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/303833/iphone-15-plus-hong-thumb-600x600.jpg',
        },
        {
            name: 'iPhone 14 Pro Max 256GB',
            price: 28990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/289700/iphone-14-pro-max-tim-thumb-600x600.jpg',
        },
        {
            name: 'iPhone 13 128GB',
            price: 15990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/251192/iphone-13-xanh-la-thumb-new-600x600.jpg',
        },
    ],
    samsung: [
        {
            name: 'Samsung Galaxy S24 Ultra 5G',
            price: 33990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/319665/samsung-galaxy-s24-ultra-grey-thumb-600x600.jpg',
        },
        {
            name: 'Samsung Galaxy Z Fold5 5G',
            price: 40990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/301608/samsung-galaxy-z-fold5-kem-thumb-600x600.jpg',
        },
        {
            name: 'Samsung Galaxy A55 5G',
            price: 9990000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/322096/samsung-galaxy-a55-5g-xanh-thumb-1-600x600.jpg',
        },
        {
            name: 'Samsung Galaxy S23 FE 5G',
            price: 14890000,
            img: 'https://cdn.tgdd.vn/Products/Images/42/306994/samsung-galaxy-s23-fe-mint-thumb-600x600.jpg',
        },
    ],
    laptop: [
        {
            name: 'MacBook Air 15 inch M2 2023',
            price: 32990000,
            img: 'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-air-15-inch-m2-2023-xam-thumb-600x600.jpg',
        },
        {
            name: 'Laptop ASUS ROG Strix G15',
            price: 25990000,
            img: 'https://cdn.tgdd.vn/Products/Images/44/307409/asus-rog-strix-g15-g513rc-r7-hn038w-thumb-600x600.jpg',
        },
        {
            name: 'Laptop HP Envy 14 cr0005TU M2',
            price: 21990000,
            img: 'https://cdn.tgdd.vn/Products/Images/44/320072/hp-14-ep0126tu-i3-8u248pa-thumb-600x600.jpg',
        },
        {
            name: 'Laptop Lenovo ThinhPad E14',
            price: 18990000,
            img: 'https://cdn.tgdd.vn/Products/Images/44/313333/lenovo-ideapad-slim-5-light-14abr8-r5-82xs002kvn-thumb-600x600.jpg',
        },
    ],
    macbook: [
        {
            name: 'MacBook Pro 14 inch M3 Pro 2023',
            price: 49990000,
            img: 'https://cdn.tgdd.vn/Products/Images/44/318356/macbook-pro-14-inch-m3-pro-2023-bac-thumb-600x600.jpg',
        },
        {
            name: 'MacBook Air 15 inch M2 2023',
            price: 32990000,
            img: 'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-air-15-inch-m2-2023-xam-thumb-600x600.jpg',
        },
        {
            name: 'MacBook Air 13 inch M1 2020',
            price: 18990000,
            img: 'https://cdn.tgdd.vn/Products/Images/44/231244/macbook-air-m1-2020-gold-600x600.jpg',
        },
    ],
    'phụ kiện': [
        {
            name: 'Củ sạc đôi Apple 35W',
            price: 1490000,
            img: 'https://cdn.tgdd.vn/Products/Images/58/282865/adapter-sac-type-c-35w-2-cong-apple-mnwp3-thumb-new-600x600.jpg',
        },
        {
            name: 'Pin sạc dự phòng 10000mAh',
            price: 590000,
            img: 'https://cdn.tgdd.vn/Products/Images/57/312061/pin-sac-du-phong-polymer-10000mah-15w-anker-313-a1229-thumb-1-600x600.jpg',
        },
        {
            name: 'Ốp lưng iPhone 15 Pro Max',
            price: 350000,
            img: 'https://cdn.tgdd.vn/Products/Images/60/314228/op-lung-magsafe-iphone-15-pro-max-nhua-trong-apple-mt233-thumb-600x600.jpg',
        },
    ],
    'tai nghe': [
        {
            name: 'AirPods Pro (Gen 2)',
            price: 6190000,
            img: 'https://cdn.tgdd.vn/Products/Images/54/289781/tai-nghe-bluetooth-airpods-pro-chong-on-macsafe-type-c-apple-mtjv3-thumb-600x600.jpg',
        },
        {
            name: 'Samsung Galaxy Buds2 Pro',
            price: 4990000,
            img: 'https://cdn.tgdd.vn/Products/Images/54/282885/samsung-galaxy-buds2-pro-den-thumb-1-600x600.jpg',
        },
        {
            name: 'Tai nghe Bluetooth Sony WF-1000XM5',
            price: 6990000,
            img: 'https://cdn.tgdd.vn/Products/Images/54/311956/tai-nghe-bluetooth-tws-sony-wf-1000xm5-thumb-600x600.jpg',
        },
    ],
};

// Default generic data if category not found
const genericData = [
    {
        name: 'Chuột không dây Logitech L1',
        price: 450000,
        img: 'https://cdn.tgdd.vn/Products/Images/86/303986/chuot-khong-day-logitech-m240-thumb-600x600.jpg',
    },
    {
        name: 'Bàn phím cơ DareU EK810',
        price: 650000,
        img: 'https://cdn.tgdd.vn/Products/Images/86/300486/ban-phim-co-co-day-dareu-a98-red-switch-thumb-600x600.jpg',
    },
    {
        name: 'Loa Bluetooth JBL Go 3',
        price: 990000,
        img: 'https://cdn.tgdd.vn/Products/Images/2162/228045/loa-bluetooth-jbl-go-3-thumb-1-600x600.jpg',
    },
    {
        name: 'Balo Laptop 15.6 inch',
        price: 350000,
        img: 'https://cdn.tgdd.vn/Products/Images/86/226177/balo-laptop-15-6-inch-targus-tbb565gl-71-den-1-1-600x600.jpg',
    },
];

const generateProductsForCategory = (categoryName) => {
    const key = categoryName.toLowerCase().trim();
    let sourceData = genericData;

    // Tìm kiếm tương đối
    for (const [k, v] of Object.entries(realisticData)) {
        if (key.includes(k) || k.includes(key)) {
            sourceData = v;
            break;
        }
    }

    const products = [];
    // Vòng lặp để tạo ra ~5-10 sản phẩm dựa trên mẫu (thêm suffix cho đa dạng nếu cần)
    const count = Math.max(sourceData.length, 5);
    for (let i = 0; i < count; i++) {
        const item = sourceData[i % sourceData.length];
        const variation = i >= sourceData.length ? ` - Phiên bản ${i + 1}` : '';

        products.push({
            name: `${item.name}${variation}`,
            slug: '', // Will be generated
            description: `Sản phẩm chính hãng ${item.name}${variation}. Thiết kế sang trọng, độ bền cao, bảo hành 12 tháng tại các trung tâm trên toàn quốc.`,
            shortDescription: `Hàng chính hãng, chất lượng đảm bảo.`,
            brand: 'SeedBrand', // To easily clean up later
            price: item.price,
            originalPrice: item.price * 1.2,
            stock: Math.floor(Math.random() * 50 + 10),
            sold: Math.floor(Math.random() * 20),
            weight: 500,
            length: 15,
            width: 15,
            height: 10,
            isActive: true,
            isFeatured: Math.random() > 0.7,
            status: 'active',
            _sourceImg: item.img,
        });
    }
    return products;
};

// Hàm chuyển text thành slug
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
};

const seedProducts = async () => {
    await connectDB();

    try {
        const categories = await Category.find();
        if (categories.length === 0) {
            console.log('Không có danh mục nào trong DB để tạo sản phẩm. Hãy tạo danh mục trước.');
            process.exit(0);
        }

        console.log(`Tìm thấy ${categories.length} danh mục. Bắt đầu tạo sản phẩm...`);

        for (const category of categories) {
            console.log(`\n--- Đang xử lý danh mục: ${category.name} ---`);
            const productsData = generateProductsForCategory(category.name);

            for (let i = 0; i < productsData.length; i++) {
                const p = productsData[i];
                p.category = category._id;

                // Tiếng Việt xó dấu hay bị lỗi slugify nguyên thủy nên ta dùng Date.now
                p.slug = slugify(p.name + '-' + Date.now() + Math.floor(Math.random() * 1000));

                console.log(`Đang tải lên Cloudinary cho sản phẩm: ${p.name}`);

                try {
                    // Upload trực tiếp ảnh thật từ mảng dữ liệu vào Cloudinary
                    const uploadRes = await cloudinary.uploader.upload(p._sourceImg, {
                        folder: 'products',
                        resource_type: 'image',
                    });

                    p.images = [uploadRes.secure_url];
                } catch (err) {
                    console.log('Lỗi upload Cloudinary, dùng ảnh mặc định.', err.message);
                    p.images = [p._sourceImg]; // Fallback dùng link gốc luôn nếu lỗi timeout của Cloudinary
                }

                delete p._sourceImg;

                // Lưu vào database
                await Product.create(p);
                console.log(`  -> Đã tạo sản phẩm: ${p.name}`);
            }
        }

        console.log('\n✅ Tạo sản phẩm hoàn tất!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi trong quá trình tạo model:', error);
        process.exit(1);
    }
};

seedProducts();

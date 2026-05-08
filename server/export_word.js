const fs = require('fs');
const path = require('path');

// ============================================================
// Định nghĩa thủ công toàn bộ schema với mô tả chi tiết
// ============================================================
const MODELS = [
    {
        name: 'User (Người dùng)',
        collection: 'users',
        description: 'Lưu thông tin tài khoản người dùng trong hệ thống.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'fullName', type: 'String', required: 'Có', desc: 'Họ và tên đầy đủ của người dùng' },
            {
                name: 'email',
                type: 'String',
                required: 'Có',
                desc: 'Địa chỉ email dùng để đăng nhập, phải là duy nhất',
            },
            { name: 'password', type: 'String', required: 'Có', desc: 'Mật khẩu đã được mã hoá (bcrypt)' },
            {
                name: 'role',
                type: 'String',
                required: 'Không',
                desc: 'Vai trò: admin | seller | customer. Mặc định: customer',
            },
            {
                name: 'isAdmin',
                type: 'Boolean',
                required: 'Không',
                desc: 'Cờ tương thích ngược (deprecated). Mặc định: false',
            },
            { name: 'address', type: 'String', required: 'Không', desc: 'Địa chỉ mặc định (văn bản). Mặc định: rỗng' },
            { name: 'phone', type: 'String', required: 'Không', desc: 'Số điện thoại. Mặc định: rỗng' },
            { name: 'birthDay', type: 'Date', required: 'Không', desc: 'Ngày sinh. Mặc định: null' },
            { name: 'typeLogin', type: 'String', required: 'Không', desc: 'Phương thức đăng nhập: email | google' },
            {
                name: 'avatar',
                type: 'String',
                required: 'Không',
                desc: 'URL ảnh đại diện (Cloudinary). Mặc định: rỗng',
            },
            {
                name: 'isActive',
                type: 'Boolean',
                required: 'Không',
                desc: 'Trạng thái hoạt động tài khoản. Mặc định: true',
            },
            { name: 'balance', type: 'Number', required: 'Không', desc: 'Số dư ví trong hệ thống (VNĐ). Mặc định: 0' },
            {
                name: 'addresses',
                type: 'Array[Object]',
                required: 'Không',
                desc: 'Danh sách địa chỉ giao hàng. Mỗi địa chỉ gồm: fullName, phone, province, district, ward, detail, provinceId, districtId, wardCode, isDefault',
            },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo tài khoản (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Product (Sản phẩm)',
        collection: 'products',
        description: 'Lưu thông tin sản phẩm bán trên sàn thương mại điện tử.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'name', type: 'String', required: 'Có', desc: 'Tên sản phẩm' },
            { name: 'slug', type: 'String', required: 'Có', desc: 'Slug URL duy nhất của sản phẩm' },
            { name: 'description', type: 'String', required: 'Không', desc: 'Mô tả chi tiết sản phẩm. Mặc định: rỗng' },
            {
                name: 'shortDescription',
                type: 'String',
                required: 'Không',
                desc: 'Mô tả ngắn hiển thị trong danh sách. Mặc định: rỗng',
            },
            { name: 'brand', type: 'String', required: 'Không', desc: 'Thương hiệu sản phẩm. Mặc định: rỗng' },
            {
                name: 'brandSlug',
                type: 'String',
                required: 'Không',
                desc: 'Slug của thương hiệu (dùng filter). Mặc định: rỗng',
            },
            {
                name: 'category',
                type: 'ObjectId → Category',
                required: 'Có',
                desc: 'Danh mục sản phẩm, tham chiếu tới collection Category',
            },
            {
                name: 'categoryPath',
                type: 'Array[String]',
                required: 'Không',
                desc: 'Đường dẫn danh mục từ gốc đến lá (dùng tìm kiếm theo cây). Mặc định: []',
            },
            {
                name: 'searchKeywords',
                type: 'Array[String]',
                required: 'Không',
                desc: 'Từ khoá tìm kiếm bổ sung. Mặc định: []',
            },
            {
                name: 'images',
                type: 'Array[String]',
                required: 'Không',
                desc: 'Danh sách URL ảnh sản phẩm (Cloudinary)',
            },
            { name: 'price', type: 'Number', required: 'Có', desc: 'Giá bán hiện tại (VNĐ)' },
            {
                name: 'originalPrice',
                type: 'Number',
                required: 'Không',
                desc: 'Giá gốc trước khi giảm giá. Mặc định: 0',
            },
            { name: 'stock', type: 'Number', required: 'Không', desc: 'Tổng tồn kho. Mặc định: 0' },
            { name: 'sold', type: 'Number', required: 'Không', desc: 'Số lượng đã bán. Mặc định: 0' },
            {
                name: 'ratingAverage',
                type: 'Number',
                required: 'Không',
                desc: 'Điểm đánh giá trung bình (0-5). Mặc định: 0',
            },
            { name: 'ratingCount', type: 'Number', required: 'Không', desc: 'Tổng số lượt đánh giá. Mặc định: 0' },
            { name: 'isFeatured', type: 'Boolean', required: 'Không', desc: 'Sản phẩm nổi bật. Mặc định: false' },
            {
                name: 'isFlashSale',
                type: 'Boolean',
                required: 'Không',
                desc: 'Đang trong chương trình flash sale. Mặc định: false',
            },
            { name: 'flashSalePrice', type: 'Number', required: 'Không', desc: 'Giá flash sale. Mặc định: 0' },
            {
                name: 'flashSaleEndTime',
                type: 'Date',
                required: 'Không',
                desc: 'Thời gian kết thúc flash sale. Mặc định: null',
            },
            { name: 'isActive', type: 'Boolean', required: 'Không', desc: 'Sản phẩm đang hoạt động. Mặc định: true' },
            {
                name: 'store',
                type: 'ObjectId → Store',
                required: 'Không',
                desc: 'Cửa hàng sở hữu sản phẩm. null = sản phẩm của Admin',
            },
            {
                name: 'status',
                type: 'String',
                required: 'Không',
                desc: 'Trạng thái duyệt: active | pending | rejected. Mặc định: active',
            },
            {
                name: 'averageRating',
                type: 'Number',
                required: 'Không',
                desc: 'Điểm đánh giá trung bình (field dự phòng). Mặc định: 0',
            },
            {
                name: 'totalReviews',
                type: 'Number',
                required: 'Không',
                desc: 'Tổng số đánh giá (field dự phòng). Mặc định: 0',
            },
            {
                name: 'variants',
                type: 'Array[Object]',
                required: 'Không',
                desc: 'Biến thể sản phẩm (màu sắc, kích cỡ...). Mỗi biến thể có: name, options[{label, price, stock, image, sku}]',
            },
            {
                name: 'attributes',
                type: 'Array[Object]',
                required: 'Không',
                desc: 'Thuộc tính đặc tính sản phẩm (name, value). VD: Chất liệu: Cotton',
            },
            {
                name: 'weight',
                type: 'Number',
                required: 'Không',
                desc: 'Khối lượng (gram) dùng tính phí ship GHN. Mặc định: 500',
            },
            {
                name: 'length',
                type: 'Number',
                required: 'Không',
                desc: 'Chiều dài (cm) dùng tính phí ship GHN. Mặc định: 15',
            },
            {
                name: 'width',
                type: 'Number',
                required: 'Không',
                desc: 'Chiều rộng (cm) dùng tính phí ship GHN. Mặc định: 15',
            },
            {
                name: 'height',
                type: 'Number',
                required: 'Không',
                desc: 'Chiều cao (cm) dùng tính phí ship GHN. Mặc định: 10',
            },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo sản phẩm (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Category (Danh mục)',
        collection: 'categories',
        description: 'Lưu danh mục sản phẩm theo cấu trúc cây phân cấp.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'name', type: 'String', required: 'Có', desc: 'Tên danh mục' },
            { name: 'slug', type: 'String', required: 'Có', desc: 'Slug URL duy nhất của danh mục' },
            {
                name: 'parent',
                type: 'ObjectId → Category',
                required: 'Không',
                desc: 'Danh mục cha (null nếu là cấp cao nhất)',
            },
            { name: 'icon', type: 'String', required: 'Không', desc: 'Icon hiển thị danh mục. Mặc định: folder' },
            { name: 'description', type: 'String', required: 'Không', desc: 'Mô tả danh mục. Mặc định: rỗng' },
            { name: 'isActive', type: 'Boolean', required: 'Không', desc: 'Danh mục đang hoạt động. Mặc định: true' },
            { name: 'order', type: 'Number', required: 'Không', desc: 'Thứ tự hiển thị sắp xếp. Mặc định: 0' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Order (Đơn hàng)',
        collection: 'orders',
        description: 'Lưu thông tin đơn hàng của khách hàng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Khách hàng đặt đơn' },
            {
                name: 'orderCode',
                type: 'String',
                required: 'Không',
                desc: 'Mã đơn hàng duy nhất, tự động sinh theo định dạng ORD-{ts}-{rand}',
            },
            {
                name: 'ghnOrderCode',
                type: 'String',
                required: 'Không',
                desc: 'Mã vận đơn GHN (Giao Hàng Nhanh). Mặc định: null',
            },
            {
                name: 'items',
                type: 'Array[Object]',
                required: 'Không',
                desc: 'Danh sách sản phẩm trong đơn. Mỗi item gồm: product, store, name, image, price, variantId, variantLabel, quantity, commissionRate, commissionAmount, sellerRevenue, itemStatus',
            },
            {
                name: 'shippingInfo',
                type: 'Object',
                required: 'Có',
                desc: 'Thông tin giao hàng. Gồm: fullName, phone, address, wardCode, districtId',
            },
            {
                name: 'paymentMethod',
                type: 'String',
                required: 'Có',
                desc: 'Phương thức thanh toán: cod | momo | vnpay',
            },
            {
                name: 'paymentStatus',
                type: 'String',
                required: 'Không',
                desc: 'Trạng thái thanh toán: pending | paid | failed | refunded. Mặc định: pending',
            },
            {
                name: 'orderStatus',
                type: 'String',
                required: 'Không',
                desc: 'Trạng thái đơn hàng: pending | confirmed | shipping | delivered | received | return_requested | returned | cancelled. Mặc định: pending',
            },
            {
                name: 'deliveredAt',
                type: 'Date',
                required: 'Không',
                desc: 'Thời điểm giao hàng thành công. Mặc định: null',
            },
            { name: 'shippingFee', type: 'Number', required: 'Không', desc: 'Phí vận chuyển (VNĐ). Mặc định: 0' },
            {
                name: 'totalPrice',
                type: 'Number',
                required: 'Không',
                desc: 'Tổng tiền hàng trước giảm giá (VNĐ). Mặc định: 0',
            },
            {
                name: 'finalPrice',
                type: 'Number',
                required: 'Không',
                desc: 'Số tiền khách thực trả sau giảm giá + phí ship (VNĐ). Mặc định: 0',
            },
            {
                name: 'shopDiscountAmount',
                type: 'Number',
                required: 'Không',
                desc: 'Số tiền giảm từ voucher cửa hàng (VNĐ). Mặc định: 0',
            },
            {
                name: 'shopVoucherCode',
                type: 'String',
                required: 'Không',
                desc: 'Mã voucher của cửa hàng đã áp dụng. Mặc định: null',
            },
            {
                name: 'systemDiscountAmount',
                type: 'Number',
                required: 'Không',
                desc: 'Số tiền giảm từ voucher hệ thống (sàn). Mặc định: 0',
            },
            {
                name: 'systemVoucherCode',
                type: 'String',
                required: 'Không',
                desc: 'Mã voucher hệ thống đã áp dụng. Mặc định: null',
            },
            { name: 'paymentRef', type: 'String', required: 'Không', desc: 'Mã tham chiếu giao dịch MoMo / VNPay' },
            { name: 'paymentUrl', type: 'String', required: 'Không', desc: 'URL thanh toán MoMo / VNPay' },
            { name: 'note', type: 'String', required: 'Không', desc: 'Ghi chú của khách hàng' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm đặt đơn (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Cart (Giỏ hàng)',
        collection: 'carts',
        description: 'Lưu giỏ hàng của từng người dùng (mỗi user chỉ có 1 cart).',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Người dùng sở hữu giỏ hàng (duy nhất)' },
            {
                name: 'items',
                type: 'Array[Object]',
                required: 'Không',
                desc: 'Danh sách sản phẩm trong giỏ. Mỗi item: product, variantId, variantLabel, name, image, price, quantity, stock (snapshot)',
            },
            { name: 'fullName', type: 'String', required: 'Không', desc: 'Họ tên người nhận hàng đã lưu trong giỏ' },
            {
                name: 'phoneNumber',
                type: 'String',
                required: 'Không',
                desc: 'Số điện thoại người nhận đã lưu trong giỏ',
            },
            { name: 'address', type: 'String', required: 'Không', desc: 'Địa chỉ giao hàng đã lưu trong giỏ' },
            { name: 'wardCode', type: 'String', required: 'Không', desc: 'Mã phường/xã GHN đã lưu trong giỏ' },
            { name: 'districtId', type: 'Number', required: 'Không', desc: 'ID quận/huyện GHN đã lưu trong giỏ' },
            {
                name: 'totalPrice',
                type: 'Number',
                required: 'Không',
                desc: 'Tổng tiền hàng trước giảm giá. Mặc định: 0',
            },
            {
                name: 'totalQuantity',
                type: 'Number',
                required: 'Không',
                desc: 'Tổng số lượng sản phẩm trong giỏ. Mặc định: 0',
            },
            {
                name: 'shopVoucherCode',
                type: 'String',
                required: 'Không',
                desc: 'Mã voucher cửa hàng đang áp dụng. Mặc định: null',
            },
            {
                name: 'shopDiscount',
                type: 'Number',
                required: 'Không',
                desc: 'Số tiền giảm từ voucher cửa hàng. Mặc định: 0',
            },
            {
                name: 'systemVoucherCode',
                type: 'String',
                required: 'Không',
                desc: 'Mã voucher hệ thống đang áp dụng. Mặc định: null',
            },
            {
                name: 'systemDiscount',
                type: 'Number',
                required: 'Không',
                desc: 'Số tiền giảm từ voucher hệ thống. Mặc định: 0',
            },
            {
                name: 'finalPrice',
                type: 'Number',
                required: 'Không',
                desc: 'Thành tiền sau khi trừ tất cả giảm giá. Mặc định: 0',
            },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo giỏ hàng (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Coupon (Mã giảm giá)',
        collection: 'coupons',
        description: 'Lưu các mã voucher/coupon giảm giá của hệ thống hoặc cửa hàng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            {
                name: 'code',
                type: 'String',
                required: 'Có',
                desc: 'Mã coupon, viết hoa, duy nhất (uppercase + unique)',
            },
            {
                name: 'store',
                type: 'ObjectId → Store',
                required: 'Không',
                desc: 'Cửa hàng phát hành. null = voucher của sàn áp dụng toàn bộ',
            },
            { name: 'description', type: 'String', required: 'Không', desc: 'Mô tả mã giảm giá. Mặc định: rỗng' },
            {
                name: 'discountType',
                type: 'String',
                required: 'Có',
                desc: 'Kiểu giảm giá: percent (%) | fixed (VNĐ cố định)',
            },
            {
                name: 'discountValue',
                type: 'Number',
                required: 'Có',
                desc: 'Giá trị giảm giá (% hoặc VNĐ tùy discountType)',
            },
            {
                name: 'maxDiscount',
                type: 'Number',
                required: 'Không',
                desc: 'Mức giảm tối đa áp dụng khi discountType = percent. Mặc định: null (không giới hạn)',
            },
            {
                name: 'minOrderAmount',
                type: 'Number',
                required: 'Không',
                desc: 'Giá trị đơn hàng tối thiểu để áp dụng coupon. Mặc định: 0',
            },
            {
                name: 'expiresAt',
                type: 'Date',
                required: 'Không',
                desc: 'Thời hạn sử dụng. Mặc định: null (không hết hạn)',
            },
            {
                name: 'usageLimit',
                type: 'Number',
                required: 'Không',
                desc: 'Số lần dùng tối đa. Mặc định: null (không giới hạn)',
            },
            { name: 'usedCount', type: 'Number', required: 'Không', desc: 'Số lần đã sử dụng. Mặc định: 0' },
            { name: 'isActive', type: 'Boolean', required: 'Không', desc: 'Coupon đang hoạt động. Mặc định: true' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Store (Cửa hàng)',
        collection: 'stores',
        description: 'Lưu thông tin cửa hàng của seller trên sàn.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'name', type: 'String', required: 'Có', desc: 'Tên cửa hàng' },
            { name: 'slug', type: 'String', required: 'Có', desc: 'Slug URL duy nhất của cửa hàng (lowercase)' },
            { name: 'logo', type: 'String', required: 'Không', desc: 'URL logo cửa hàng (Cloudinary). Mặc định: rỗng' },
            {
                name: 'banner',
                type: 'String',
                required: 'Không',
                desc: 'URL banner trang cửa hàng (Cloudinary). Mặc định: rỗng',
            },
            {
                name: 'description',
                type: 'String',
                required: 'Không',
                desc: 'Mô tả giới thiệu cửa hàng. Mặc định: rỗng',
            },
            {
                name: 'owner',
                type: 'ObjectId → User',
                required: 'Có',
                desc: 'Seller sở hữu cửa hàng (1 seller = 1 store, unique)',
            },
            {
                name: 'status',
                type: 'String',
                required: 'Không',
                desc: 'Trạng thái: pending | active | banned. Mặc định: pending',
            },
            { name: 'rating', type: 'Number', required: 'Không', desc: 'Điểm đánh giá cửa hàng. Mặc định: 0' },
            {
                name: 'totalProducts',
                type: 'Number',
                required: 'Không',
                desc: 'Tổng số sản phẩm trong cửa hàng. Mặc định: 0',
            },
            {
                name: 'totalFollowers',
                type: 'Number',
                required: 'Không',
                desc: 'Tổng số người theo dõi cửa hàng. Mặc định: 0',
            },
            { name: 'totalSales', type: 'Number', required: 'Không', desc: 'Tổng doanh số đã bán. Mặc định: 0' },
            {
                name: 'commissionRate',
                type: 'Number',
                required: 'Không',
                desc: 'Tỷ lệ hoa hồng sàn thu (%). Mặc định: 5',
            },
            {
                name: 'phone',
                type: 'String',
                required: 'Không',
                desc: 'Số điện thoại liên hệ cửa hàng. Mặc định: rỗng',
            },
            { name: 'address', type: 'String', required: 'Không', desc: 'Địa chỉ cửa hàng. Mặc định: rỗng' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo cửa hàng (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Review (Đánh giá)',
        collection: 'reviews',
        description: 'Lưu đánh giá sản phẩm của khách hàng sau khi mua hàng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'product', type: 'ObjectId → Product', required: 'Có', desc: 'Sản phẩm được đánh giá' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Người dùng viết đánh giá' },
            {
                name: 'order',
                type: 'ObjectId → Order',
                required: 'Có',
                desc: 'Đơn hàng liên quan (mỗi user chỉ đánh giá 1 lần / 1 đơn)',
            },
            { name: 'rating', type: 'Number', required: 'Có', desc: 'Điểm đánh giá từ 1 đến 5 sao' },
            {
                name: 'content',
                type: 'String',
                required: 'Không',
                desc: 'Nội dung nhận xét, tối đa 1000 ký tự. Mặc định: rỗng',
            },
            {
                name: 'images',
                type: 'Array[String]',
                required: 'Không',
                desc: 'Danh sách URL ảnh khách gửi kèm (Cloudinary)',
            },
            {
                name: 'reply.content',
                type: 'String',
                required: 'Không',
                desc: 'Nội dung phản hồi của người bán. Mặc định: null',
            },
            {
                name: 'reply.repliedAt',
                type: 'Date',
                required: 'Không',
                desc: 'Thời điểm người bán phản hồi. Mặc định: null',
            },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo đánh giá (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Banner (Quảng cáo)',
        collection: 'Banners',
        description: 'Lưu banner quảng cáo hiển thị trên trang chủ.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'title', type: 'String', required: 'Có', desc: 'Tiêu đề chính của banner' },
            { name: 'highlight', type: 'String', required: 'Không', desc: 'Đoạn chữ nổi bật trong tiêu đề' },
            { name: 'subtitle', type: 'String', required: 'Không', desc: 'Tiêu đề phụ / mô tả ngắn' },
            { name: 'date', type: 'String', required: 'Không', desc: 'Thời gian sự kiện hiển thị trên banner' },
            { name: 'cta', type: 'String', required: 'Không', desc: 'Nội dung nút Call-to-Action' },
            { name: 'imageUrl', type: 'String', required: 'Có', desc: 'URL ảnh banner (Cloudinary)' },
            { name: 'link', type: 'String', required: 'Không', desc: 'Đường dẫn khi click vào banner' },
            { name: 'lightGradient', type: 'String', required: 'Không', desc: 'Màu gradient chế độ sáng (CSS)' },
            { name: 'darkGradient', type: 'String', required: 'Không', desc: 'Màu gradient chế độ tối (CSS)' },
            {
                name: 'position',
                type: 'String',
                required: 'Không',
                desc: 'Vị trí hiển thị: home_main | home_sub. Mặc định: home_main',
            },
            { name: 'isActive', type: 'Boolean', required: 'Không', desc: 'Banner đang hoạt động. Mặc định: true' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Notification (Thông báo)',
        collection: 'notifications',
        description: 'Lưu thông báo gửi đến người dùng. Tự động xóa sau 60 ngày.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'recipient', type: 'ObjectId → User', required: 'Có', desc: 'Người dùng nhận thông báo' },
            {
                name: 'type',
                type: 'String',
                required: 'Có',
                desc: 'Loại thông báo: new_order | order_status | new_review | store_approved | store_banned | new_message',
            },
            { name: 'title', type: 'String', required: 'Có', desc: 'Tiêu đề thông báo' },
            { name: 'body', type: 'String', required: 'Có', desc: 'Nội dung thông báo' },
            { name: 'link', type: 'String', required: 'Không', desc: 'Đường dẫn khi click vào thông báo. Mặc định: /' },
            {
                name: 'isRead',
                type: 'Boolean',
                required: 'Không',
                desc: 'Người dùng đã đọc thông báo chưa. Mặc định: false',
            },
            {
                name: 'meta',
                type: 'Mixed',
                required: 'Không',
                desc: 'Dữ liệu bổ sung linh hoạt (orderId, ảnh...). Mặc định: {}',
            },
            {
                name: 'createdAt',
                type: 'Date',
                required: 'Không',
                desc: 'Thời điểm tạo, dùng TTL index tự xóa sau 60 ngày (tự động)',
            },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'WalletTransaction (Giao dịch ví)',
        collection: 'wallettransactions',
        description: 'Ghi lại lịch sử biến động số dư ví của người dùng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Người dùng sở hữu giao dịch' },
            {
                name: 'type',
                type: 'String',
                required: 'Có',
                desc: 'Loại giao dịch: credit (tiền vào) | debit (tiền ra) | withdrawal (rút tiền) | deposit (nạp tiền)',
            },
            { name: 'amount', type: 'Number', required: 'Có', desc: 'Số tiền giao dịch (VNĐ)' },
            {
                name: 'balanceAfter',
                type: 'Number',
                required: 'Không',
                desc: 'Số dư ví sau khi giao dịch. Mặc định: 0',
            },
            { name: 'description', type: 'String', required: 'Không', desc: 'Diễn giải giao dịch. Mặc định: rỗng' },
            {
                name: 'order',
                type: 'ObjectId → Order',
                required: 'Không',
                desc: 'Đơn hàng liên quan (nếu có). Mặc định: null',
            },
            {
                name: 'orderCode',
                type: 'String',
                required: 'Không',
                desc: 'Mã đơn hàng liên quan (snapshot). Mặc định: rỗng',
            },
            {
                name: 'status',
                type: 'String',
                required: 'Không',
                desc: 'Trạng thái: pending | completed | failed. Mặc định: completed',
            },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo giao dịch (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Withdrawal (Yêu cầu rút tiền)',
        collection: 'withdrawals',
        description: 'Lưu yêu cầu rút tiền từ ví của người dùng ra tài khoản ngân hàng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Người dùng yêu cầu rút tiền' },
            { name: 'amount', type: 'Number', required: 'Có', desc: 'Số tiền muốn rút (VNĐ), tối thiểu 10.000 VNĐ' },
            {
                name: 'status',
                type: 'String',
                required: 'Không',
                desc: 'Trạng thái: pending | completed | rejected. Mặc định: pending',
            },
            { name: 'note', type: 'String', required: 'Không', desc: 'Ghi chú xử lý từ admin. Mặc định: rỗng' },
            { name: 'bankName', type: 'String', required: 'Có', desc: 'Tên ngân hàng thụ hưởng (snapshot lúc rút)' },
            {
                name: 'accountNumber',
                type: 'String',
                required: 'Có',
                desc: 'Số tài khoản ngân hàng (snapshot lúc rút)',
            },
            {
                name: 'accountName',
                type: 'String',
                required: 'Có',
                desc: 'Tên chủ tài khoản ngân hàng (snapshot lúc rút)',
            },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo yêu cầu (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Report (Báo cáo vi phạm)',
        collection: 'reports',
        description: 'Lưu báo cáo vi phạm giữa khách hàng và cửa hàng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'reporter', type: 'ObjectId → User', required: 'Có', desc: 'Người gửi báo cáo' },
            { name: 'reporterRole', type: 'String', required: 'Có', desc: 'Vai trò người báo cáo: customer | seller' },
            {
                name: 'type',
                type: 'String',
                required: 'Có',
                desc: 'Loại báo cáo: customer_report_shop | shop_report_customer | order_dispute',
            },
            {
                name: 'targetUser',
                type: 'ObjectId → User',
                required: 'Không',
                desc: 'Người dùng bị báo cáo. Mặc định: null',
            },
            {
                name: 'targetStore',
                type: 'ObjectId → Store',
                required: 'Không',
                desc: 'Cửa hàng bị báo cáo. Mặc định: null',
            },
            {
                name: 'targetOrder',
                type: 'ObjectId → Order',
                required: 'Không',
                desc: 'Đơn hàng liên quan đến tranh chấp. Mặc định: null',
            },
            { name: 'reason', type: 'String', required: 'Có', desc: 'Lý do báo cáo' },
            { name: 'description', type: 'String', required: 'Không', desc: 'Mô tả chi tiết sự việc. Mặc định: rỗng' },
            {
                name: 'evidence',
                type: 'Array[String]',
                required: 'Không',
                desc: 'Danh sách URL ảnh bằng chứng (Cloudinary)',
            },
            {
                name: 'status',
                type: 'String',
                required: 'Không',
                desc: 'Trạng thái xử lý: pending | reviewing | resolved | rejected. Mặc định: pending',
            },
            {
                name: 'resolution',
                type: 'String',
                required: 'Không',
                desc: 'Kết quả xử lý: favor_reporter | favor_target | no_action | null',
            },
            {
                name: 'adminNote',
                type: 'String',
                required: 'Không',
                desc: 'Ghi chú của admin khi xử lý. Mặc định: rỗng',
            },
            {
                name: 'resolvedBy',
                type: 'ObjectId → User',
                required: 'Không',
                desc: 'Admin người xử lý báo cáo. Mặc định: null',
            },
            { name: 'resolvedAt', type: 'Date', required: 'Không', desc: 'Thời điểm xử lý xong. Mặc định: null' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo báo cáo (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'ReturnRequest (Yêu cầu hoàn trả)',
        collection: 'returnrequests',
        description: 'Lưu yêu cầu hoàn trả hàng / hoàn tiền từ khách hàng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'order', type: 'ObjectId → Order', required: 'Có', desc: 'Đơn hàng cần hoàn trả' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Khách hàng yêu cầu hoàn trả' },
            {
                name: 'store',
                type: 'ObjectId → Store',
                required: 'Không',
                desc: 'Cửa hàng xử lý. null = sản phẩm Admin',
            },
            { name: 'reason', type: 'String', required: 'Có', desc: 'Lý do hoàn trả' },
            {
                name: 'description',
                type: 'String',
                required: 'Không',
                desc: 'Mô tả chi tiết tình trạng hàng. Mặc định: rỗng',
            },
            {
                name: 'images',
                type: 'Array[String]',
                required: 'Không',
                desc: 'Ảnh bằng chứng sản phẩm lỗi (Cloudinary URLs)',
            },
            {
                name: 'status',
                type: 'String',
                required: 'Không',
                desc: 'Trạng thái: pending | approved | rejected. Mặc định: pending',
            },
            {
                name: 'sellerNote',
                type: 'String',
                required: 'Không',
                desc: 'Phản hồi / ghi chú của người bán. Mặc định: rỗng',
            },
            { name: 'refundAmount', type: 'Number', required: 'Có', desc: 'Số tiền hoàn lại cho khách (VNĐ)' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo yêu cầu (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'StoreFollow (Theo dõi cửa hàng)',
        collection: 'storefollows',
        description: 'Lưu quan hệ theo dõi giữa người dùng và cửa hàng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Người dùng theo dõi cửa hàng' },
            { name: 'store', type: 'ObjectId → Store', required: 'Có', desc: 'Cửa hàng được theo dõi' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm bắt đầu theo dõi (tự động)' },
        ],
    },
    {
        name: 'Wishlist (Yêu thích)',
        collection: 'wishlists',
        description: 'Lưu danh sách sản phẩm yêu thích của người dùng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Người dùng sở hữu danh sách yêu thích' },
            { name: 'product', type: 'ObjectId → Product', required: 'Có', desc: 'Sản phẩm được thêm vào yêu thích' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm thêm vào yêu thích (tự động)' },
        ],
    },
    {
        name: 'Conversation (Hội thoại chat)',
        collection: 'conversations',
        description: 'Lưu thông tin phòng chat giữa người dùng và cửa hàng.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            {
                name: 'participants',
                type: 'Array[ObjectId → User]',
                required: 'Có',
                desc: 'Danh sách người tham gia hội thoại',
            },
            {
                name: 'store',
                type: 'ObjectId → Store',
                required: 'Không',
                desc: 'Cửa hàng liên quan đến hội thoại. Mặc định: null',
            },
            {
                name: 'lastMessage',
                type: 'String',
                required: 'Không',
                desc: 'Nội dung tin nhắn cuối cùng. Mặc định: rỗng',
            },
            {
                name: 'lastMessageAt',
                type: 'Date',
                required: 'Không',
                desc: 'Thời điểm gửi tin nhắn cuối. Mặc định: null',
            },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo hội thoại (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'Message (Tin nhắn)',
        collection: 'messages',
        description: 'Lưu từng tin nhắn trong hội thoại.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            {
                name: 'conversation',
                type: 'ObjectId → Conversation',
                required: 'Có',
                desc: 'Hội thoại chứa tin nhắn này',
            },
            { name: 'sender', type: 'ObjectId → User', required: 'Có', desc: 'Người gửi tin nhắn' },
            { name: 'content', type: 'String', required: 'Có', desc: 'Nội dung tin nhắn' },
            { name: 'isRead', type: 'Boolean', required: 'Không', desc: 'Tin nhắn đã được đọc chưa. Mặc định: false' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm gửi tin nhắn (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'AICopilotHistory (Lịch sử AI)',
        collection: 'aicopilothistories',
        description: 'Lưu lịch sử hội thoại với AI Copilot trợ lý mua sắm.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'user', type: 'ObjectId → User', required: 'Có', desc: 'Người dùng sử dụng AI Copilot' },
            {
                name: 'messages',
                type: 'Array[Object]',
                required: 'Không',
                desc: 'Lịch sử tin nhắn. Mỗi message: role (user/assistant), content (String), createdAt',
            },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo lịch sử (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'ApiKey (Khoá API)',
        collection: 'apikeys',
        description: 'Lưu API key dùng để xác thực request từ client.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'key', type: 'String', required: 'Có', desc: 'Giá trị API key, duy nhất' },
            { name: 'status', type: 'Boolean', required: 'Không', desc: 'Key đang hoạt động. Mặc định: true' },
            { name: 'permissions', type: 'Array[String]', required: 'Không', desc: 'Danh sách quyền được cấp cho key' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo (tự động)' },
            { name: 'updatedAt', type: 'Date', required: 'Không', desc: 'Thời điểm cập nhật lần cuối (tự động)' },
        ],
    },
    {
        name: 'OTP (Mã xác thực)',
        collection: 'otps',
        description: 'Lưu mã OTP dùng để xác thực email / đặt lại mật khẩu.',
        fields: [
            { name: '_id', type: 'ObjectId', required: 'Có', desc: 'Khoá chính, tự động sinh' },
            { name: 'email', type: 'String', required: 'Có', desc: 'Email nhận mã OTP' },
            { name: 'otp', type: 'String', required: 'Có', desc: 'Mã OTP (thường 6 chữ số, đã mã hoá hoặc plain)' },
            { name: 'expiredAt', type: 'Date', required: 'Có', desc: 'Thời điểm OTP hết hạn (thường sau 5 phút)' },
            { name: 'createdAt', type: 'Date', required: 'Không', desc: 'Thời điểm tạo OTP (tự động)' },
        ],
    },
];

// ============================================================
// Render HTML → Word
// ============================================================
let modelIndex = 0;
let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<style>
  body  { font-family: "Times New Roman", serif; font-size: 13pt; margin: 40px; }
  h1    { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 12pt; margin-bottom: 30px; }
  h2    { font-size: 13pt; font-weight: bold; margin-top: 28px; margin-bottom: 4px; }
  .desc-text { font-size: 11pt; font-style: italic; margin-bottom: 6px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 24px; font-size: 11pt; }
  th    { border: 1px solid black; padding: 5px 8px; font-weight: bold; text-decoration: underline; text-align: left; background-color: white; }
  td    { border: 1px solid black; padding: 5px 8px; vertical-align: top; }
  .col-name { font-weight: bold; }
  .col-center { text-align: center; }
</style>
</head>
<body>
<h1>THIẾT KẾ CƠ SỞ DỮ LIỆU</h1>
<p class="subtitle">Hệ thống Thương Mại Điện Tử &mdash; Tài liệu mô tả các Collection MongoDB</p>
`;

for (const model of MODELS) {
    modelIndex++;
    html += `<h2>${modelIndex}. ${model.name}</h2>\n`;
    html += `<p class="desc-text">&#128196; ${model.description} &nbsp;|&nbsp; Collection: <b>${model.collection}</b></p>\n`;
    html += `<table>
  <thead>
    <tr>
      <th style="width:5%">STT</th>
      <th style="width:22%">Thuộc tính</th>
      <th style="width:18%">Kiểu dữ liệu</th>
      <th style="width:10%">Bắt buộc</th>
      <th style="width:45%">Mô tả</th>
    </tr>
  </thead>
  <tbody>\n`;

    model.fields.forEach((f, i) => {
        const reqSymbol = f.required === 'Có' ? '✓' : '✗';
        html += `    <tr>
      <td class="col-center">${i + 1}</td>
      <td class="col-name">${f.name}</td>
      <td>${f.type}</td>
      <td class="col-center">${reqSymbol}</td>
      <td>${f.desc}</td>
    </tr>\n`;
    });

    html += `  </tbody>\n</table>\n`;
}

html += `</body></html>`;

const outputPath = path.join(__dirname, '../database_models.doc');
fs.writeFileSync(outputPath, html, 'utf8');
console.log('✅ Xuất file thành công:', outputPath);
console.log(`   Tổng số model: ${MODELS.length}`);
console.log(`   Tổng số trường: ${MODELS.reduce((s, m) => s + m.fields.length, 0)}`);

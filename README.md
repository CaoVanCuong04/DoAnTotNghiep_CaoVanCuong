**Đồ án tốt nghiệp - Website thương mại điện tử**
**1. Giới thiệu đề tài**

Đây là đồ án tốt nghiệp xây dựng website thương mại điện tử, hỗ trợ người dùng tìm kiếm sản phẩm, xem thông tin chi tiết sản phẩm, thêm sản phẩm vào giỏ hàng, đặt hàng và theo dõi lịch sử mua hàng. Hệ thống hướng tới việc mô phỏng quy trình mua bán trực tuyến cơ bản, đồng thời cung cấp các chức năng quản trị để quản lý sản phẩm, danh mục, đơn hàng và người dùng.

Ứng dụng được phát triển với frontend sử dụng ReactJS, backend sử dụng Node.js và Express.js, cơ sở dữ liệu MongoDB. Ngoài các chức năng mua bán cơ bản, hệ thống còn tích hợp chatbot tư vấn tự động nhằm hỗ trợ người dùng trong quá trình lựa chọn sản phẩm.

**2. Công nghệ sử dụng**
Frontend
ReactJS
React Router
Context API
Axios
CSS / UI Components
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
RESTful API
Công cụ hỗ trợ
Visual Studio Code
Git & GitHub
Postman
MongoDB Compass
**3. Chức năng chính**
Đối với người dùng
Đăng ký, đăng nhập tài khoản
Xem danh sách sản phẩm
Tìm kiếm và lọc sản phẩm
Xem chi tiết sản phẩm
Thêm sản phẩm vào giỏ hàng
Đặt hàng
Theo dõi lịch sử đơn hàng
Đánh giá sản phẩm
Sử dụng chatbot tư vấn sản phẩm
Đối với quản trị viên
Quản lý sản phẩm
Quản lý danh mục sản phẩm
Quản lý người dùng
Quản lý đơn hàng
Quản lý banner
Quản lý đánh giá sản phẩm
Theo dõi thống kê, báo cáo hệ thống
**4. Cấu trúc thư mục**

DATN_CaoVanCuong
│
├── client: Frontend ReactJS
├── server: Backend Node.js/Express
├── DB TMDT: Dữ liệu hoặc tài liệu liên quan đến database
├── package.json: Cấu hình project
├── package-lock.json
├── .gitignore
└── .prettierrc

**5. API chính của hệ thống**

Backend cung cấp các nhóm API chính phục vụ cho website thương mại điện tử, bao gồm:

API xác thực người dùng: đăng ký, đăng nhập, phân quyền
API quản lý người dùng
API quản lý sản phẩm
API quản lý danh mục sản phẩm
API quản lý giỏ hàng
API quản lý đơn hàng
API quản lý banner
API quản lý đánh giá sản phẩm
API thống kê, báo cáo
API chatbot tư vấn sản phẩm

Các API được xây dựng theo kiến trúc RESTful, giúp frontend giao tiếp với backend thông qua các request HTTP.

**6. Cài đặt và chạy project**
Bước 1: Clone project

git clone https://github.com/CaoVanCuong04/DoAnTotNghiep_CaoVanCuong.git

Bước 2: Di chuyển vào thư mục project

cd DoAnTotNghiep_CaoVanCuong

Bước 3: Cài đặt thư viện

Cài đặt thư viện ở thư mục gốc:

npm install

Cài đặt thư viện cho frontend:

cd client
npm install

Cài đặt thư viện cho backend:

cd ../server
npm install

**Bước 4: Cấu hình môi trường**

Tạo file .env trong thư mục server và cấu hình các biến môi trường cần thiết, ví dụ:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

**Bước 5: Chạy project**

Chạy toàn bộ project từ thư mục gốc:

npm start

Hoặc chạy riêng từng phần:

Chạy backend:

cd server
npm start

Chạy frontend:

cd client
npm start

**7. Kết quả đạt được**

Đồ án đã xây dựng được website thương mại điện tử với các chức năng cơ bản phục vụ quá trình mua hàng trực tuyến. Người dùng có thể đăng ký, đăng nhập, xem sản phẩm, tìm kiếm sản phẩm, đặt hàng và theo dõi lịch sử mua hàng. Quản trị viên có thể quản lý sản phẩm, danh mục, đơn hàng, người dùng và các dữ liệu liên quan trong hệ thống.

Hệ thống có cấu trúc tương đối rõ ràng, tách biệt giữa frontend và backend, thuận tiện cho việc bảo trì, mở rộng và phát triển thêm các chức năng mới trong tương lai.

**8. Hướng phát triển**

Trong thời gian tới, hệ thống có thể được tiếp tục cải thiện theo các hướng sau:

Tối ưu giao diện và trải nghiệm người dùng
Tích hợp thêm các phương thức thanh toán trực tuyến
Nâng cấp chatbot tư vấn thông minh hơn
Bổ sung hệ thống gợi ý sản phẩm
Tối ưu hiệu năng xử lý dữ liệu
Triển khai hệ thống lên môi trường internet bằng VPS và tên miền riêng
**9. Thông tin sinh viên**
Họ và tên: Cao Văn Cường
Đề tài: Xây dựng website thương mại điện tử
Công nghệ sử dụng: ReactJS, Node.js, Express.js, MongoDB
GitHub: https://github.com/CaoVanCuong04

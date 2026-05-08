import PolicyPage from './PolicyPage'

const sections = [
  {
    title: 'Cookie Là Gì?',
    content: 'Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập website. Chúng giúp website ghi nhớ các tùy chọn và hoạt động của bạn để cải thiện trải nghiệm người dùng.',
  },
  {
    title: 'Các Loại Cookie Chúng Tôi Sử Dụng',
    content: [
      'Cookie thiết yếu: Cần thiết để website hoạt động, như ghi nhớ đăng nhập và giỏ hàng',
      'Cookie hiệu suất: Thu thập dữ liệu ẩn danh về cách người dùng tương tác với website',
      'Cookie chức năng: Ghi nhớ tùy chọn của bạn như ngôn ngữ, khu vực và cài đặt',
      'Cookie marketing: Hiển thị quảng cáo phù hợp dựa trên sở thích của bạn',
      'Cookie phân tích: Giúp chúng tôi hiểu cách cải thiện website (Google Analytics)',
    ],
  },
  {
    title: 'Thời Hạn Cookie',
    content: [
      'Cookie phiên (Session cookies): Bị xóa khi bạn đóng trình duyệt',
      'Cookie lâu dài (Persistent cookies): Lưu trữ trên thiết bị trong thời gian xác định (thường 30-365 ngày)',
      'Cookie đăng nhập: Lưu trữ 30 ngày nếu bạn chọn "Ghi nhớ đăng nhập"',
    ],
  },
  {
    title: 'Cookie Của Bên Thứ Ba',
    content: [
      'Google Analytics: Phân tích lưu lượng truy cập website',
      'Facebook Pixel: Đo lường hiệu quả quảng cáo trên Facebook',
      'Hotjar: Phân tích hành vi người dùng để cải thiện UX',
      'VNPay/MoMo: Cookie cần thiết cho quá trình thanh toán',
    ],
  },
  {
    title: 'Quản Lý Cookie',
    content: [
      'Chrome: Cài đặt > Quyền riêng tư và Bảo mật > Cookie và dữ liệu trang web khác',
      'Firefox: Tùy chọn > Quyền riêng tư & Bảo mật > Cookie và Dữ liệu Trang web',
      'Safari: Tùy chọn > Quyền riêng tư > Cookie',
      'Edge: Cài đặt > Cookie và Quyền trang web > Cookie và dữ liệu trang web',
      'Lưu ý: Tắt cookie có thể ảnh hưởng đến một số tính năng của GlobalMart',
    ],
  },
  {
    title: 'Cập Nhật Chính Sách',
    content: 'Chúng tôi có thể cập nhật chính sách cookie khi có thay đổi về công nghệ hoặc quy định pháp lý. Vui lòng kiểm tra trang này định kỳ. Mọi thay đổi quan trọng sẽ được thông báo qua email.',
  },
]

export default function CookiePolicyPage() {
  return (
    <PolicyPage
      title="Chính Sách Cookie"
      subtitle="Tìm hiểu cách chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn"
      icon="🍪"
      sections={sections}
    />
  )
}

import PolicyPage from './PolicyPage'

const sections = [
  {
    title: 'Thu Thập Thông Tin',
    content: [
      'Họ tên, địa chỉ email, số điện thoại khi bạn đăng ký tài khoản',
      'Địa chỉ giao hàng, thông tin thanh toán khi đặt hàng',
      'Dữ liệu hành vi duyệt web, lịch sử tìm kiếm và mua sắm',
      'Thông tin thiết bị, địa chỉ IP và dữ liệu cookie',
      'Đánh giá sản phẩm và nội dung bạn chia sẻ trên nền tảng',
    ],
  },
  {
    title: 'Mục Đích Sử Dụng',
    content: [
      'Xử lý đơn hàng, thanh toán và vận chuyển',
      'Cung cấp dịch vụ hỗ trợ khách hàng',
      'Gửi thông báo về đơn hàng, khuyến mãi và cập nhật dịch vụ',
      'Cải thiện trải nghiệm mua sắm và cá nhân hóa nội dung',
      'Phát hiện và ngăn chặn gian lận',
      'Tuân thủ các yêu cầu pháp lý',
    ],
  },
  {
    title: 'Chia Sẻ Thông Tin',
    content: [
      'Người bán hàng: để xử lý đơn hàng và giao hàng',
      'Đơn vị vận chuyển: để thực hiện giao hàng',
      'Đối tác thanh toán: để xử lý giao dịch tài chính',
      'Chúng tôi không bán thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại',
    ],
  },
  {
    title: 'Bảo Mật Dữ Liệu',
    content: 'Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn công nghiệp, bao gồm mã hóa SSL/TLS, xác thực 2 yếu tố và kiểm soát truy cập nghiêm ngặt để bảo vệ thông tin của bạn.',
  },
  {
    title: 'Quyền Của Bạn',
    content: [
      'Quyền truy cập: Xem thông tin cá nhân chúng tôi lưu trữ về bạn',
      'Quyền chỉnh sửa: Cập nhật thông tin không chính xác',
      'Quyền xóa: Yêu cầu xóa tài khoản và dữ liệu cá nhân',
      'Quyền phản đối: Từ chối nhận email marketing',
      'Quyền di chuyển dữ liệu: Nhận bản sao dữ liệu của bạn',
    ],
  },
  {
    title: 'Cookie',
    content: 'Chúng tôi sử dụng cookie để ghi nhớ thông tin đăng nhập, lưu giỏ hàng và cải thiện trải nghiệm người dùng. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến một số tính năng của website.',
  },
  {
    title: 'Liên Hệ',
    content: 'Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ: privacy@globalmart.com hoặc gọi hotline +82-388-0990.',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Chính Sách Bảo Mật"
      subtitle="Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn"
      icon="🔒"
      sections={sections}
    />
  )
}

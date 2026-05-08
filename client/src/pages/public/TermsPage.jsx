import PolicyPage from './PolicyPage'

const sections = [
  {
    title: 'Chấp Nhận Điều Khoản',
    content: 'Bằng cách truy cập và sử dụng nền tảng GlobalMart, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản dịch vụ này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ của chúng tôi.',
  },
  {
    title: 'Tài Khoản Người Dùng',
    content: [
      'Bạn phải từ 18 tuổi trở lên hoặc có sự cho phép của phụ huynh/người giám hộ để sử dụng dịch vụ',
      'Thông tin đăng ký phải chính xác, đầy đủ và cập nhật',
      'Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình',
      'Mỗi người chỉ được phép sở hữu một tài khoản',
      'GlobalMart có quyền tạm khóa hoặc xóa tài khoản vi phạm điều khoản',
    ],
  },
  {
    title: 'Quy Định Mua Bán',
    content: [
      'Người dùng không được đăng bán hàng hóa cấm, giả mạo hoặc vi phạm bản quyền',
      'Giá sản phẩm phải minh bạch, không được có phí ẩn',
      'Người bán phải giao hàng đúng mô tả, đúng hẹn',
      'Người mua phải thanh toán đầy đủ theo thỏa thuận',
      'Mọi tranh chấp sẽ được giải quyết theo quy trình khiếu nại của GlobalMart',
    ],
  },
  {
    title: 'Nội Dung Bị Cấm',
    content: [
      'Đăng tải thông tin sai lệch, gây hiểu nhầm hoặc lừa đảo',
      'Xúc phạm, quấy rối hoặc đe dọa người dùng khác',
      'Vi phạm quyền sở hữu trí tuệ của bên thứ ba',
      'Can thiệp vào hệ thống hoặc bảo mật của nền tảng',
      'Sử dụng bot, script hoặc phương tiện tự động để thao túng dữ liệu',
    ],
  },
  {
    title: 'Giới Hạn Trách Nhiệm',
    content: 'GlobalMart là nền tảng trung gian kết nối người mua và người bán. Chúng tôi không chịu trách nhiệm về chất lượng sản phẩm của nhà bán hàng. Tuy nhiên, chúng tôi cam kết hỗ trợ giải quyết tranh chấp và bảo vệ quyền lợi người tiêu dùng.',
  },
  {
    title: 'Thay Đổi Điều Khoản',
    content: 'GlobalMart có quyền thay đổi điều khoản dịch vụ bất kỳ lúc nào. Chúng tôi sẽ thông báo các thay đổi quan trọng qua email và thông báo trên website ít nhất 30 ngày trước khi có hiệu lực.',
  },
  {
    title: 'Luật Áp Dụng',
    content: 'Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại TP. Hồ Chí Minh.',
  },
]

export default function TermsPage() {
  return (
    <PolicyPage
      title="Điều Khoản Dịch Vụ"
      subtitle="Vui lòng đọc kỹ các điều khoản này trước khi sử dụng nền tảng GlobalMart"
      icon="📋"
      sections={sections}
    />
  )
}

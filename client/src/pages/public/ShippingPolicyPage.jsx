import PolicyPage from './PolicyPage'

const sections = [
  {
    title: 'Phạm Vi Áp Dụng',
    content: 'Chính sách vận chuyển này áp dụng cho tất cả các đơn hàng được đặt qua nền tảng GlobalMart trên toàn lãnh thổ Việt Nam. Chúng tôi hợp tác với các đơn vị vận chuyển uy tín để đảm bảo hàng hóa đến tay khách hàng an toàn và đúng hẹn.',
  },
  {
    title: 'Thời Gian Giao Hàng',
    content: [
      'Nội thành (TP. HCM, Hà Nội, Đà Nẵng): 1-2 ngày làm việc',
      'Liên tỉnh (các tỉnh thành khác): 3-5 ngày làm việc',
      'Vùng sâu, vùng xa, hải đảo: 5-10 ngày làm việc',
      'Thời gian giao hàng được tính từ lúc người bán xác nhận và chuyển hàng cho đơn vị vận chuyển',
      'Thời gian có thể thay đổi trong các dịp lễ, Tết hoặc thiên tai',
    ],
  },
  {
    title: 'Phí Vận Chuyển',
    content: [
      'Phí vận chuyển được tính dựa trên khối lượng, kích thước gói hàng và khoảng cách giao hàng',
      'Đơn hàng trên 500.000đ: Miễn phí vận chuyển nội thành (TP. HCM, Hà Nội, Đà Nẵng)',
      'Đơn hàng trên 1.000.000đ: Miễn phí vận chuyển toàn quốc',
      'Phí vận chuyển cụ thể sẽ được hiển thị tại trang thanh toán trước khi bạn xác nhận đơn hàng',
    ],
  },
  {
    title: 'Đơn Vị Vận Chuyển',
    content: [
      'GHN (Giao Hàng Nhanh) - đối tác vận chuyển chính',
      'GHTK (Giao Hàng Tiết Kiệm)',
      'J&T Express',
      'ViettelPost',
      'Khách hàng có thể chọn đơn vị vận chuyển trong quá trình thanh toán',
    ],
  },
  {
    title: 'Theo Dõi Đơn Hàng',
    content: 'Sau khi đơn hàng được giao cho đơn vị vận chuyển, bạn sẽ nhận được mã vận đơn qua email và SMS. Bạn có thể theo dõi đơn hàng tại Hồ sơ > Đơn hàng của tôi hoặc trực tiếp trên website của đơn vị vận chuyển.',
  },
  {
    title: 'Hàng Hóa Bị Hư Hỏng Hoặc Thất Lạc',
    content: 'Nếu hàng hóa bị hư hỏng hoặc thất lạc trong quá trình vận chuyển, vui lòng liên hệ chúng tôi trong vòng 24 giờ sau khi nhận hàng. GlobalMart sẽ phối hợp với đơn vị vận chuyển để giải quyết và hoàn tiền hoặc giao lại hàng cho bạn.',
  },
]

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Chính Sách Vận Chuyển"
      subtitle="Cam kết giao hàng nhanh chóng, an toàn và đúng hẹn đến tay bạn"
      icon="🚚"
      sections={sections}
    />
  )
}

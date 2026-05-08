import PolicyPage from './PolicyPage'

const sections = [
  {
    title: 'Điều Kiện Đổi Trả',
    content: [
      'Sản phẩm còn nguyên vẹn, chưa qua sử dụng, không bị hư hỏng do người dùng',
      'Còn đầy đủ bao bì, nhãn mác và phụ kiện đi kèm',
      'Có hóa đơn mua hàng hoặc ảnh chụp màn hình xác nhận đơn hàng',
      'Trong thời hạn đổi trả (7 ngày kể từ ngày nhận hàng)',
      'Sản phẩm không thuộc danh mục không được đổi trả',
    ],
  },
  {
    title: 'Sản Phẩm Không Được Đổi Trả',
    content: [
      'Đồ lót, quần áo bơi và các sản phẩm vệ sinh cá nhân',
      'Thực phẩm, đồ uống, thực phẩm chức năng đã mở seal',
      'Phần mềm, thẻ game, thẻ cào sau khi đã kích hoạt',
      'Sản phẩm được ghi rõ "Không đổi trả" trên trang sản phẩm',
      'Hàng hóa đặt riêng theo yêu cầu khách hàng',
    ],
  },
  {
    title: 'Quy Trình Đổi Trả',
    content: [
      'Bước 1: Truy cập Hồ sơ > Đơn hàng của tôi, chọn đơn hàng cần đổi trả',
      'Bước 2: Nhấn "Yêu cầu đổi trả" và điền đầy đủ lý do kèm hình ảnh minh chứng',
      'Bước 3: Chờ xác nhận từ người bán trong vòng 24-48 giờ',
      'Bước 4: Gửi hàng về địa chỉ người bán (GlobalMart hỗ trợ phí vận chuyển đổi trả nếu lỗi từ người bán)',
      'Bước 5: Nhận hàng mới hoặc hoàn tiền trong vòng 5-7 ngày làm việc',
    ],
  },
  {
    title: 'Chính Sách Hoàn Tiền',
    content: [
      'Hoàn vào ví GlobalMart: 1-3 ngày làm việc',
      'Hoàn về tài khoản ngân hàng: 5-7 ngày làm việc',
      'Hoàn về thẻ tín dụng/ghi nợ: 7-15 ngày làm việc (tùy ngân hàng)',
      'Số tiền hoàn = Giá trị đơn hàng - Phí vận chuyển (trừ trường hợp lỗi từ người bán)',
    ],
  },
  {
    title: 'Hỗ Trợ Đổi Trả',
    content: 'Nếu bạn gặp khó khăn trong quá trình đổi trả, vui lòng liên hệ chăm sóc khách hàng GlobalMart qua hotline +82-388-0990 hoặc email support@globalmart.com. Chúng tôi sẽ hỗ trợ bạn trong vòng 24 giờ.',
  },
]

export default function ReturnPolicyPage() {
  return (
    <PolicyPage
      title="Chính Sách Đổi Trả"
      subtitle="Mua sắm an tâm với chính sách đổi trả linh hoạt và minh bạch"
      icon="🔄"
      sections={sections}
    />
  )
}

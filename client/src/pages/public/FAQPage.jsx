import { useState } from 'react'
import { Input, Button, Tag, Collapse } from 'antd'
import { SearchOutlined, PhoneOutlined, MailOutlined, MessageOutlined, ShopOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const { Panel } = Collapse

const categories = [
  {
    label: '🛒 Đặt hàng & Thanh toán',
    faqs: [
      { q: 'Làm thế nào để đặt hàng trên GlobalMart?', a: 'Chọn sản phẩm → Thêm vào giỏ hàng → Tiến hành thanh toán → Chọn phương thức thanh toán và địa chỉ giao hàng → Xác nhận đơn hàng.' },
      { q: 'GlobalMart hỗ trợ những phương thức thanh toán nào?', a: 'Chúng tôi chấp nhận thanh toán qua: Ví GlobalMart, VNPay, MoMo, thẻ ngân hàng nội địa và quốc tế (Visa/Mastercard), và thanh toán khi nhận hàng (COD).' },
      { q: 'Tôi có thể hủy đơn hàng sau khi đặt không?', a: 'Bạn có thể hủy đơn hàng trong vòng 30 phút sau khi đặt nếu đơn chưa được người bán xác nhận. Vào Hồ sơ > Đơn hàng của tôi để thực hiện hủy.' },
    ],
  },
  {
    label: '🚚 Vận chuyển & Giao hàng',
    faqs: [
      { q: 'Thời gian giao hàng mất bao lâu?', a: 'Giao hàng nội thành: 1-2 ngày. Giao hàng liên tỉnh: 3-5 ngày. Giao hàng đến vùng sâu vùng xa: 5-10 ngày làm việc.' },
      { q: 'Phí vận chuyển được tính như thế nào?', a: 'Phí vận chuyển phụ thuộc vào trọng lượng, kích thước gói hàng và khoảng cách giao hàng. Đơn hàng trên 500.000đ được miễn phí vận chuyển nội thành.' },
      { q: 'Làm thế nào để theo dõi đơn hàng?', a: 'Vào Hồ sơ > Đơn hàng của tôi, chọn đơn hàng cần xem và nhấn "Theo dõi đơn hàng". Bạn cũng sẽ nhận thông báo qua email và SMS.' },
    ],
  },
  {
    label: '🔄 Đổi trả & Hoàn tiền',
    faqs: [
      { q: 'Chính sách đổi trả của GlobalMart là gì?', a: 'Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn, chưa qua sử dụng và có đầy đủ bao bì gốc.' },
      { q: 'Hoàn tiền mất bao lâu?', a: 'Sau khi yêu cầu đổi trả được xử lý, tiền sẽ được hoàn vào ví GlobalMart trong 1-3 ngày, hoặc 5-7 ngày nếu hoàn về tài khoản ngân hàng.' },
    ],
  },
  {
    label: '👤 Tài khoản & Bảo mật',
    faqs: [
      { q: 'Làm thế nào để đổi mật khẩu?', a: 'Vào Hồ sơ > Cài đặt bảo mật > Đổi mật khẩu. Nhập mật khẩu cũ và mật khẩu mới để xác nhận.' },
      { q: 'Tôi quên mật khẩu phải làm sao?', a: 'Nhấn "Quên mật khẩu" trên trang đăng nhập, nhập email và làm theo hướng dẫn được gửi đến email của bạn.' },
      { q: 'Làm thế nào để bảo vệ tài khoản khỏi bị hack?', a: 'Sử dụng mật khẩu mạnh, không chia sẻ thông tin đăng nhập, bật xác thực 2 bước và không đăng nhập trên thiết bị công cộng.' },
    ],
  },
]

export default function FAQPage() {
  const [search, setSearch] = useState('')

  const filtered = categories.map(c => ({
    ...c,
    faqs: c.faqs.filter(f =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(c => c.faqs.length > 0)

  return (
    <div style={{ background: '#f8f9fd', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 50%, #0a1840 100%)',
        color: '#fff',
        padding: '72px 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <ShopOutlined style={{ fontSize: 32, color: '#ff6b00' }} />
          <span style={{ fontSize: 22, fontWeight: 800 }}>GLOBALMART</span>
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, margin: '0 0 16px' }}>
          Câu Hỏi Thường Gặp
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 32 }}>
          Tìm câu trả lời cho thắc mắc của bạn một cách nhanh chóng
        </p>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Input
            size="large"
            placeholder="Tìm kiếm câu hỏi..."
            prefix={<SearchOutlined style={{ color: '#aaa' }} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ borderRadius: 14, height: 52, fontSize: 15 }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '52px 24px' }}>
        {filtered.length > 0 ? (
          filtered.map((cat) => (
            <div key={cat.label} style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f2260', marginBottom: 16 }}>{cat.label}</div>
              <Collapse
                bordered={false}
                expandIconPosition="end"
                style={{ background: 'transparent' }}
              >
                {cat.faqs.map((faq, i) => (
                  <Panel
                    key={i}
                    header={<span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 15 }}>{faq.q}</span>}
                    style={{
                      background: '#fff',
                      borderRadius: '16px !important',
                      marginBottom: 12,
                      border: '1px solid rgba(15,34,96,0.08)',
                      boxShadow: '0 2px 12px rgba(15,34,96,0.05)',
                      overflow: 'hidden',
                    }}
                  >
                    <p style={{ color: '#555', lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                  </Panel>
                ))}
              </Collapse>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            <SearchOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Không tìm thấy kết quả</div>
            <div>Hãy thử từ khóa khác hoặc liên hệ hỗ trợ bên dưới</div>
          </div>
        )}

        {/* Still need help? */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2260, #1a3a8f)',
          borderRadius: 24,
          padding: '40px 36px',
          color: '#fff',
          textAlign: 'center',
          marginTop: 20,
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>Vẫn cần hỗ trợ?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 28 }}>
            Đội ngũ chăm sóc khách hàng của chúng tôi luôn sẵn sàng giúp đỡ bạn.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <PhoneOutlined />, label: 'Gọi hotline', to: '/contact' },
              { icon: <MailOutlined />, label: 'Gửi email', to: '/contact' },
              { icon: <MessageOutlined />, label: 'Chat ngay', to: '/' },
            ].map((btn) => (
              <Link key={btn.label} to={btn.to} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.12)',
                color: '#fff', padding: '12px 24px', borderRadius: 12,
                fontWeight: 600, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                {btn.icon} {btn.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

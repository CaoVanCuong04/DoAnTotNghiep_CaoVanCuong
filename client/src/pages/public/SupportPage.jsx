import { PhoneOutlined, MailOutlined, MessageOutlined, QuestionCircleOutlined, FileTextOutlined, ShopOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const supportOptions = [
  {
    icon: <MessageOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Chat Trực Tuyến',
    desc: 'Nhận hỗ trợ ngay lập tức từ đội ngũ chăm sóc khách hàng của chúng tôi',
    badge: 'Nhanh nhất',
    badgeColor: '#52c41a',
    action: 'Chat ngay',
    to: '/',
  },
  {
    icon: <PhoneOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Gọi Hotline',
    desc: '+82-388-0990\nThứ 2 – Thứ 7: 8:00 – 18:00',
    badge: null,
    action: 'Gọi ngay',
    to: 'tel:+823880990',
  },
  {
    icon: <MailOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Gửi Email',
    desc: 'support@globalmart.com\nPhản hồi trong vòng 24 giờ',
    badge: null,
    action: 'Gửi email',
    to: '/contact',
  },
  {
    icon: <QuestionCircleOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Câu Hỏi Thường Gặp',
    desc: 'Tìm câu trả lời nhanh cho các thắc mắc phổ biến',
    badge: null,
    action: 'Xem FAQ',
    to: '/faq',
  },
]

const helpTopics = [
  { icon: '📦', title: 'Theo dõi đơn hàng', desc: 'Kiểm tra trạng thái và vị trí đơn hàng của bạn', to: '/profile/orders' },
  { icon: '🔄', title: 'Đổi trả hàng', desc: 'Hướng dẫn yêu cầu đổi trả sản phẩm', to: '/return-policy' },
  { icon: '💳', title: 'Vấn đề thanh toán', desc: 'Giải quyết các vấn đề về giao dịch', to: '/faq' },
  { icon: '👤', title: 'Quản lý tài khoản', desc: 'Cập nhật thông tin cá nhân và bảo mật', to: '/profile' },
  { icon: '🏪', title: 'Trở thành nhà bán hàng', desc: 'Hướng dẫn đăng ký và bán hàng', to: '/partner' },
  { icon: '🎟️', title: 'Sử dụng voucher', desc: 'Cách áp dụng mã giảm giá', to: '/faq' },
]

export default function SupportPage() {
  return (
    <div style={{ background: '#f8f9fd', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 50%, #0a1840 100%)',
        color: '#fff',
        padding: '72px 24px 48px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,107,0,0.15) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <ShopOutlined style={{ fontSize: 30, color: '#ff6b00' }} />
            <span style={{ fontSize: 22, fontWeight: 800 }}>GLOBALMART</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 44px)', fontWeight: 800, margin: '0 0 16px' }}>
            Trung Tâm Hỗ Trợ
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, margin: '0 0 12px' }}>
            Chúng tôi luôn ở đây để giúp bạn. Chọn phương thức hỗ trợ phù hợp nhất.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            <ClockCircleOutlined style={{ color: '#52c41a' }} />
            <span>Chat trực tuyến hoạt động 24/7</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
        {/* Support options */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
          marginBottom: 72,
        }}>
          {supportOptions.map((opt) => (
            <div key={opt.title} style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 28px',
              boxShadow: '0 4px 24px rgba(15,34,96,0.08)',
              border: '1px solid rgba(15,34,96,0.06)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {opt.badge && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: opt.badgeColor, color: '#fff',
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                }}>
                  {opt.badge}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>{opt.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#0f2260', marginBottom: 10 }}>{opt.title}</div>
              <div style={{ color: '#777', fontSize: 14, lineHeight: 1.7, flex: 1, whiteSpace: 'pre-line', marginBottom: 20 }}>{opt.desc}</div>
              <Link to={opt.to} style={{
                display: 'block', textAlign: 'center',
                background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                color: '#fff', padding: '10px', borderRadius: 10,
                fontWeight: 700, textDecoration: 'none', fontSize: 14,
              }}>
                {opt.action} →
              </Link>
            </div>
          ))}
        </div>

        {/* Help topics */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f2260', margin: '0 0 12px' }}>Chủ Đề Hỗ Trợ Phổ Biến</h2>
          <p style={{ color: '#888', fontSize: 15 }}>Tìm nhanh giải pháp cho các vấn đề thường gặp</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 60,
        }}>
          {helpTopics.map((topic) => (
            <Link key={topic.title} to={topic.to} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: '#fff',
              borderRadius: 16,
              padding: '20px 24px',
              textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(15,34,96,0.06)',
              border: '1px solid rgba(15,34,96,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(15,34,96,0.12)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,34,96,0.06)'
              }}
            >
              <div style={{ fontSize: 32, flexShrink: 0 }}>{topic.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f2260', fontSize: 15, marginBottom: 4 }}>{topic.title}</div>
                <div style={{ color: '#888', fontSize: 13 }}>{topic.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Contact CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2260, #1a3a8f)',
          borderRadius: 24,
          padding: '44px 36px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <FileTextOutlined style={{ fontSize: 40, color: '#ff6b00', marginBottom: 16, display: 'block' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Không tìm thấy câu trả lời?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontSize: 15 }}>
            Gửi yêu cầu hỗ trợ chi tiết và chúng tôi sẽ phản hồi trong vòng 24 giờ.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
            color: '#fff', padding: '13px 28px', borderRadius: 12,
            fontWeight: 700, textDecoration: 'none', fontSize: 15,
          }}>
            Liên hệ hỗ trợ →
          </Link>
        </div>
      </div>
    </div>
  )
}

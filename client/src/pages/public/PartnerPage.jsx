import { CheckCircleFilled, RocketOutlined, ShopOutlined, DollarOutlined, TeamOutlined, BarChartOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const benefits = [
  { icon: <DollarOutlined style={{ fontSize: 28, color: '#ff6b00' }} />, title: 'Thu nhập hấp dẫn', desc: 'Hoa hồng cạnh tranh, thanh toán đúng hạn mỗi tháng. Không giới hạn thu nhập.' },
  { icon: <BarChartOutlined style={{ fontSize: 28, color: '#ff6b00' }} />, title: 'Hệ thống quản lý mạnh mẽ', desc: 'Dashboard thông minh để theo dõi doanh thu, đơn hàng và hiệu suất kinh doanh.' },
  { icon: <TeamOutlined style={{ fontSize: 28, color: '#ff6b00' }} />, title: 'Cộng đồng đối tác lớn', desc: 'Tham gia cộng đồng hơn 10.000 nhà bán hàng và học hỏi từ những người thành công.' },
  { icon: <RocketOutlined style={{ fontSize: 28, color: '#ff6b00' }} />, title: 'Marketing miễn phí', desc: 'Sản phẩm của bạn được hiển thị trên homepage, banner quảng cáo và email marketing.' },
]

const steps = [
  { num: '01', title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản GlobalMart và điền đầy đủ thông tin cửa hàng của bạn.' },
  { num: '02', title: 'Xác minh danh tính', desc: 'Tải lên CCCD và giấy phép kinh doanh (nếu có) để được xác minh.' },
  { num: '03', title: 'Đăng sản phẩm', desc: 'Thêm sản phẩm đầu tiên với hình ảnh đẹp và mô tả chi tiết.' },
  { num: '04', title: 'Bắt đầu bán hàng', desc: 'Nhận đơn hàng và tận hưởng doanh thu mỗi ngày!' },
]

const plans = [
  {
    name: 'Cơ Bản',
    price: 'Miễn phí',
    color: '#0f2260',
    features: ['Đăng tối đa 50 sản phẩm', 'Hỗ trợ email', 'Dashboard cơ bản', 'Hoa hồng 5%'],
    cta: 'Bắt đầu miễn phí',
    highlight: false,
  },
  {
    name: 'Chuyên Nghiệp',
    price: '299.000đ/tháng',
    color: '#ff6b00',
    features: ['Sản phẩm không giới hạn', 'Hỗ trợ 24/7 ưu tiên', 'Dashboard nâng cao + Analytics', 'Hoa hồng 3%', 'Banner quảng cáo miễn phí', 'Badge "Nhà bán hàng Pro"'],
    cta: 'Đăng ký Pro',
    highlight: true,
  },
  {
    name: 'Doanh Nghiệp',
    price: 'Liên hệ',
    color: '#1a3a8f',
    features: ['Tất cả tính năng Pro', 'Tích hợp API', 'Account Manager riêng', 'Hoa hồng 1.5%', 'Quảng cáo trên homepage', 'SLA ưu tiên 99.9%'],
    cta: 'Liên hệ ngay',
    highlight: false,
  },
]

export default function PartnerPage() {
  return (
    <div style={{ background: '#f8f9fd', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 50%, #ff6b00 150%)',
        color: '#fff',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 10% 50%, rgba(255,107,0,0.2) 0%, transparent 40%), radial-gradient(circle at 90% 20%, rgba(26,58,143,0.3) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 24 }}>
            <ShopOutlined style={{ color: '#ff6b00' }} />
            <span style={{ color: '#ff9a40', fontSize: 13, fontWeight: 600 }}>Chương Trình Đối Tác</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.2 }}>
            Cùng GlobalMart<br />Phát Triển Kinh Doanh
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 36 }}>
            Tham gia cộng đồng hơn 10.000 nhà bán hàng uy tín. Mở rộng thị trường, tăng doanh thu và xây dựng thương hiệu của bạn cùng chúng tôi.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/seller/register" style={{
              background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
              color: '#fff', padding: '14px 36px', borderRadius: 14,
              fontWeight: 700, textDecoration: 'none', fontSize: 16,
              boxShadow: '0 6px 24px rgba(255,107,0,0.5)',
            }}>
              Đăng ký ngay — Miễn phí
            </Link>
            <Link to="/contact" style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff', padding: '14px 36px', borderRadius: 14,
              fontWeight: 700, textDecoration: 'none', fontSize: 16,
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        {/* Benefits */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f2260', margin: '0 0 12px' }}>Tại Sao Chọn GlobalMart?</h2>
          <p style={{ color: '#888', fontSize: 16 }}>Những lợi ích độc quyền dành cho đối tác của chúng tôi</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 80 }}>
          {benefits.map((b) => (
            <div key={b.title} style={{
              background: '#fff', borderRadius: 20, padding: 32,
              boxShadow: '0 4px 24px rgba(15,34,96,0.07)',
              border: '1px solid rgba(15,34,96,0.06)',
            }}>
              <div style={{ marginBottom: 16 }}>{b.icon}</div>
              <div style={{ fontWeight: 700, color: '#0f2260', fontSize: 17, marginBottom: 10 }}>{b.title}</div>
              <div style={{ color: '#666', lineHeight: 1.8, fontSize: 14 }}>{b.desc}</div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ background: 'linear-gradient(135deg, #0f2260, #1a3a8f)', borderRadius: 28, padding: '52px 40px', marginBottom: 80, color: '#fff' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>Bắt Đầu Chỉ Trong 4 Bước</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, margin: 0 }}>Quá trình đăng ký đơn giản và nhanh chóng</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {steps.map((s) => (
              <div key={s.num} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(255,107,0,0.2)', border: '2px solid #ff6b00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 22, fontWeight: 800, color: '#ff6b00',
                }}>
                  {s.num}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f2260', margin: '0 0 12px' }}>Gói Đối Tác</h2>
          <p style={{ color: '#888', fontSize: 16 }}>Chọn gói phù hợp với quy mô kinh doanh của bạn</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 60 }}>
          {plans.map((p) => (
            <div key={p.name} style={{
              background: p.highlight ? `linear-gradient(135deg, #ff6b00, #ff8c00)` : '#fff',
              borderRadius: 24, padding: 36,
              boxShadow: p.highlight ? '0 12px 48px rgba(255,107,0,0.35)' : '0 4px 24px rgba(15,34,96,0.07)',
              border: p.highlight ? 'none' : '1px solid rgba(15,34,96,0.06)',
              transform: p.highlight ? 'scale(1.03)' : 'scale(1)',
              color: p.highlight ? '#fff' : 'inherit',
            }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: p.highlight ? '#fff' : '#0f2260' }}>{p.name}</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 28, color: p.highlight ? '#fff' : '#ff6b00' }}>{p.price}</div>
              <div style={{ marginBottom: 32 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                    <CheckCircleFilled style={{ color: p.highlight ? 'rgba(255,255,255,0.9)' : '#ff6b00', fontSize: 15, marginTop: 2 }} />
                    <span style={{ fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.9)' : '#555', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to={p.cta === 'Liên hệ ngay' ? '/contact' : '/seller/register'} style={{
                display: 'block', textAlign: 'center',
                background: p.highlight ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                color: '#fff', padding: '13px', borderRadius: 12,
                fontWeight: 700, textDecoration: 'none', fontSize: 15,
                border: p.highlight ? '2px solid rgba(255,255,255,0.4)' : 'none',
              }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

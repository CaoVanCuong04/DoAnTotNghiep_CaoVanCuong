import { ShopOutlined, StarFilled, TeamOutlined, GlobalOutlined, SafetyCertificateOutlined, RocketOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const stats = [
  { value: '5M+', label: 'Khách hàng tin dùng' },
  { value: '50K+', label: 'Sản phẩm đa dạng' },
  { value: '10K+', label: 'Nhà bán hàng uy tín' },
  { value: '63', label: 'Tỉnh/thành phục vụ' },
]

const values = [
  {
    icon: <StarFilled style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Chất Lượng Hàng Đầu',
    desc: 'Chúng tôi cam kết mang đến những sản phẩm được kiểm duyệt kỹ lưỡng từ các nhà bán hàng uy tín.',
  },
  {
    icon: <SafetyCertificateOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'An Toàn & Bảo Mật',
    desc: 'Mọi giao dịch đều được bảo vệ bởi hệ thống mã hóa hiện đại, đảm bảo an toàn tuyệt đối.',
  },
  {
    icon: <RocketOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Giao Hàng Nhanh Chóng',
    desc: 'Mạng lưới logistics rộng khắp 63 tỉnh thành, giao hàng nhanh chóng và đúng hẹn.',
  },
  {
    icon: <GlobalOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Hàng Quốc Tế',
    desc: 'Cung cấp sản phẩm từ các thương hiệu quốc tế hàng đầu với giá cạnh tranh nhất.',
  },
  {
    icon: <TeamOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Đội Ngũ Tận Tâm',
    desc: 'Đội ngũ hỗ trợ 24/7, sẵn sàng giải quyết mọi thắc mắc và vấn đề của khách hàng.',
  },
  {
    icon: <ShopOutlined style={{ fontSize: 32, color: '#ff6b00' }} />,
    title: 'Đa Dạng Ngành Hàng',
    desc: 'Từ công nghệ, thời trang đến thực phẩm sạch — mọi nhu cầu đều có tại GlobalMart.',
  },
]

export default function AboutPage() {
  return (
    <div style={{ background: '#f8f9fd', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 50%, #0a1840 100%)',
        color: '#fff',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,107,0,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(26,58,143,0.3) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <ShopOutlined style={{ fontSize: 40, color: '#ff6b00' }} />
            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: 1 }}>GLOBALMART</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.2 }}>
            Về Chúng Tôi
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: 0 }}>
            GlobalMart là nền tảng thương mại điện tử hàng đầu Việt Nam, kết nối hàng triệu người mua và hàng chục nghìn nhà bán hàng uy tín trên toàn quốc.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 24,
          marginBottom: 80,
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(15,34,96,0.08)',
              border: '1px solid rgba(15,34,96,0.06)',
            }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#0f2260', marginBottom: 8 }}>{s.value}</div>
              <div style={{ color: '#666', fontSize: 14 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Story */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 48,
          marginBottom: 80,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#ff6b00', fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
              Câu Chuyện Của Chúng Tôi
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f2260', margin: '0 0 20px', lineHeight: 1.3 }}>
              Hành trình từ ý tưởng đến nền tảng triệu người dùng
            </h2>
            <p style={{ color: '#555', lineHeight: 1.9, marginBottom: 16 }}>
              Được thành lập năm 2020, GlobalMart bắt đầu với sứ mệnh đơn giản: tạo ra một nơi mua sắm trực tuyến đáng tin cậy, nơi người tiêu dùng Việt Nam có thể tìm thấy mọi thứ họ cần với giá tốt nhất.
            </p>
            <p style={{ color: '#555', lineHeight: 1.9, marginBottom: 24 }}>
              Ngày nay, chúng tôi tự hào là nền tảng kết nối hơn 5 triệu khách hàng với hàng nghìn nhà bán hàng uy tín, cung cấp đa dạng sản phẩm từ công nghệ, thời trang đến hàng tiêu dùng thiết yếu.
            </p>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
              color: '#fff', padding: '12px 28px', borderRadius: 12,
              fontWeight: 700, textDecoration: 'none', fontSize: 15,
              boxShadow: '0 4px 16px rgba(255,107,0,0.3)',
            }}>
              Liên hệ với chúng tôi →
            </Link>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 100%)',
            borderRadius: 24,
            padding: 40,
            color: '#fff',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Sứ Mệnh</div>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.9, marginBottom: 24 }}>
              Mang đến trải nghiệm mua sắm trực tuyến an toàn, tiện lợi và đáng tin cậy cho mọi người dân Việt Nam.
            </p>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Tầm Nhìn</div>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.9, margin: 0 }}>
              Trở thành nền tảng thương mại điện tử số 1 Đông Nam Á vào năm 2030, kết nối hàng triệu doanh nghiệp và người tiêu dùng.
            </p>
          </div>
        </div>

        {/* Values */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ color: '#ff6b00', fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            Giá Trị Cốt Lõi
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f2260', margin: 0 }}>
            Những gì chúng tôi cam kết
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 80,
        }}>
          {values.map((v) => (
            <div key={v.title} style={{
              background: '#fff',
              borderRadius: 20,
              padding: 32,
              boxShadow: '0 4px 24px rgba(15,34,96,0.06)',
              border: '1px solid rgba(15,34,96,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(15,34,96,0.12)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(15,34,96,0.06)'
              }}
            >
              <div style={{ marginBottom: 16 }}>{v.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f2260', marginBottom: 10 }}>{v.title}</div>
              <div style={{ color: '#666', lineHeight: 1.8, fontSize: 14 }}>{v.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 100%)',
          borderRadius: 24,
          padding: '48px 40px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px' }}>Bắt đầu mua sắm ngay hôm nay</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 28, fontSize: 16 }}>
            Khám phá hàng nghìn sản phẩm chất lượng với giá tốt nhất tại GlobalMart.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{
              background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
              color: '#fff', padding: '14px 32px', borderRadius: 12,
              fontWeight: 700, textDecoration: 'none', fontSize: 15,
              boxShadow: '0 4px 16px rgba(255,107,0,0.4)',
            }}>
              Mua sắm ngay
            </Link>
            <Link to="/partner" style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#fff', padding: '14px 32px', borderRadius: 12,
              fontWeight: 700, textDecoration: 'none', fontSize: 15,
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              Trở thành đối tác
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

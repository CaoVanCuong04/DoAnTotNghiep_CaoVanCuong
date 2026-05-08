import { Row, Col, Divider, Button } from 'antd'
import { Link } from 'react-router-dom'
import {
  FacebookFilled,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinFilled,
  PhoneOutlined,
  MailOutlined,
  ShopOutlined
} from '@ant-design/icons'

const footerSections = [
  {
    title: 'Về GlobalMart',
    links: [
      { label: 'Giới thiệu', to: '/about' },
      { label: 'Liên hệ chúng tôi', to: '/contact' },
      { label: 'Chương trình đối tác', to: '/partner' },
      { label: 'Khuyến mãi & ưu đãi', to: '/promotions' },
      { label: 'Tuyển dụng', to: '/careers' },
    ],
  },
  {
    title: 'Chăm Sóc Khách Hàng',
    links: [
      { label: 'Liên hệ hỗ trợ', to: '/support' },
      { label: 'Trung tâm trợ giúp', to: '/support' },
      { label: 'Dịch vụ khách hàng', to: '/support' },
      { label: 'Phản ánh vấn đề', to: '/contact' },
      { label: 'Hướng dẫn mua hàng', to: '/faq' },
    ],
  },
  {
    title: 'Chính Sách',
    links: [
      { label: 'Chính sách vận chuyển', to: '/shipping-policy' },
      { label: 'Chính sách đổi trả', to: '/return-policy' },
      { label: 'Câu hỏi thường gặp', to: '/faq' },
    ],
  },
]

const bottomLinks = [
  { label: 'Chính Sách Bảo Mật', to: '/privacy-policy' },
  { label: 'Điều Khoản Dịch Vụ', to: '/terms' },
  { label: 'Chính Sách Cookie', to: '/cookie-policy' },
]

const socialIcons = [
  { Icon: FacebookFilled, color: '#1877f2', href: 'https://facebook.com' },
  { Icon: InstagramOutlined, color: '#e4405f', href: 'https://instagram.com' },
  { Icon: TwitterOutlined, color: '#1da1f2', href: 'https://twitter.com' },
  { Icon: LinkedinFilled, color: '#0a66c2', href: 'https://linkedin.com' },
]

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(180deg, #0f2260 0%, #0a1840 100%)',
      color: '#fff',
      paddingTop: '48px',
      paddingBottom: '24px',
      marginTop: '48px',
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
        {/* Top Row */}
        <Row gutter={[32, 32]} style={{ marginBottom: '32px' }}>
          {/* Brand */}
          <Col xs={24} md={6}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', textDecoration: 'none' }}>
              <ShopOutlined style={{ color: '#ff6b00', fontSize: 28 }} />
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>
                GLOBALMART
              </div>
            </Link>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', lineHeight: 1.7, fontSize: '14px' }}>
              Điểm đến mua sắm một chặng cho công nghệ, thời trang và phong cách sống. Mua sắm thông minh hơn, sống tốt hơn.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {socialIcons.map(({ Icon, color, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<Icon style={{ fontSize: 18, color: '#fff' }} />}
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                    }}
                  />
                </a>
              ))}
            </div>
          </Col>

          {/* Links */}
          {footerSections.map((section) => (
            <Col xs={12} sm={8} md={4} key={section.title}>
              <div style={{
                fontWeight: 700,
                color: '#fff',
                marginBottom: '16px',
                textTransform: 'uppercase',
                fontSize: '12px',
                letterSpacing: 0.5
              }}>
                {section.title}
              </div>
              {section.links.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  style={{
                    display: 'block',
                    color: 'rgba(255,255,255,0.55)',
                    marginBottom: '8px',
                    fontSize: '13px',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#ff6b00'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                >
                  {link.label}
                </Link>
              ))}
            </Col>
          ))}

          {/* Contact */}
          <Col xs={24} sm={12} md={6}>
            <div style={{
              fontWeight: 700,
              color: '#fff',
              marginBottom: '16px',
              textTransform: 'uppercase',
              fontSize: '12px',
              letterSpacing: 0.5
            }}>
              Liên Hệ Với Chúng Tôi
            </div>
            <a href="tel:+823880990" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', textDecoration: 'none' }}>
              <PhoneOutlined style={{ color: '#ff6b00', fontSize: 18 }} />
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                +82-388-0990
              </div>
            </a>
            <a href="mailto:info@globalmart.com" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <MailOutlined style={{ color: '#ff6b00', fontSize: 18 }} />
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                info@globalmart.com
              </div>
            </a>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.12)', marginBottom: '24px' }} />

        {/* Bottom Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            © 2026 GlobalMart. Tất cả quyền được bảo lưu.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {bottomLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

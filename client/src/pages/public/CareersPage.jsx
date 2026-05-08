import { HeartOutlined, RocketOutlined, TeamOutlined, TrophyOutlined, ShopOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const perks = [
  { icon: '💰', title: 'Lương & Thưởng Hấp Dẫn', desc: 'Mức lương cạnh tranh, thưởng hiệu suất hàng quý và cổ phiếu ưu đãi cho nhân viên.' },
  { icon: '🏥', title: 'Bảo Hiểm Toàn Diện', desc: 'Bảo hiểm y tế, sức khỏe và tai nạn cho cả gia đình nhân viên.' },
  { icon: '📚', title: 'Phát Triển Sự Nghiệp', desc: 'Ngân sách đào tạo hàng năm, mentorship và cơ hội thăng tiến rõ ràng.' },
  { icon: '🏠', title: 'Làm Việc Linh Hoạt', desc: 'Hỗ trợ remote, hybrid và flexible hours để cân bằng cuộc sống – công việc.' },
  { icon: '🎯', title: 'Văn Hóa Đổi Mới', desc: 'Môi trường năng động, khuyến khích sáng tạo và không sợ thử nghiệm mới.' },
  { icon: '🎉', title: 'Team Building', desc: 'Du lịch công ty hàng năm, các hoạt động thể thao và sự kiện văn hóa thú vị.' },
]

const openings = [
  { title: 'Senior Frontend Developer', dept: 'Engineering', type: 'Full-time', location: 'TP. HCM / Remote' },
  { title: 'Backend Engineer (Node.js)', dept: 'Engineering', type: 'Full-time', location: 'TP. HCM' },
  { title: 'Product Manager', dept: 'Product', type: 'Full-time', location: 'TP. HCM' },
  { title: 'UX/UI Designer', dept: 'Design', type: 'Full-time', location: 'TP. HCM / Remote' },
  { title: 'Data Analyst', dept: 'Data', type: 'Full-time', location: 'Hà Nội / TP. HCM' },
  { title: 'Customer Success Specialist', dept: 'Operations', type: 'Full-time', location: 'TP. HCM' },
  { title: 'Digital Marketing Manager', dept: 'Marketing', type: 'Full-time', location: 'TP. HCM' },
  { title: 'Content Creator (Intern)', dept: 'Marketing', type: 'Internship', location: 'TP. HCM' },
]

const deptColors = {
  Engineering: '#1677ff',
  Product: '#722ed1',
  Design: '#eb2f96',
  Data: '#13c2c2',
  Operations: '#52c41a',
  Marketing: '#fa8c16',
}

export default function CareersPage() {
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
          backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,107,0,0.15) 0%, transparent 45%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <ShopOutlined style={{ fontSize: 32, color: '#ff6b00' }} />
            <span style={{ fontSize: 24, fontWeight: 800 }}>GLOBALMART</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 50px)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.2 }}>
            Gia Nhập Đội Ngũ GlobalMart
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 36 }}>
            Cùng chúng tôi xây dựng tương lai của thương mại điện tử Việt Nam. Chúng tôi tìm kiếm những tài năng đam mê, sáng tạo và muốn tạo ra tác động thực sự.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <TeamOutlined />, label: '500+ Nhân viên' },
              { icon: <RocketOutlined />, label: 'Tăng trưởng 300% mỗi năm' },
              { icon: <TrophyOutlined />, label: 'Top 10 Nơi làm việc tốt nhất' },
            ].map((stat) => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>
                <span style={{ color: '#ff6b00' }}>{stat.icon}</span>
                {stat.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        {/* Perks */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f2260', margin: '0 0 12px' }}>Tại Sao Chọn GlobalMart?</h2>
          <p style={{ color: '#888', fontSize: 16 }}>Chế độ đãi ngộ xứng đáng với công sức của bạn</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 80 }}>
          {perks.map((p) => (
            <div key={p.title} style={{
              background: '#fff', borderRadius: 20, padding: '28px 28px',
              boxShadow: '0 4px 20px rgba(15,34,96,0.07)',
              border: '1px solid rgba(15,34,96,0.06)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{p.icon}</div>
              <div style={{ fontWeight: 700, color: '#0f2260', fontSize: 16, marginBottom: 8 }}>{p.title}</div>
              <div style={{ color: '#666', fontSize: 14, lineHeight: 1.75 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Job openings */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f2260', margin: '0 0 12px' }}>Vị Trí Đang Tuyển Dụng</h2>
          <p style={{ color: '#888', fontSize: 16 }}>Tìm vị trí phù hợp với kỹ năng và đam mê của bạn</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 56 }}>
          {openings.map((job) => (
            <div key={job.title} style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              boxShadow: '0 2px 12px rgba(15,34,96,0.06)',
              border: '1px solid rgba(15,34,96,0.06)',
              transition: 'box-shadow 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,34,96,0.12)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,34,96,0.06)'}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f2260', marginBottom: 6 }}>{job.title}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    background: `${deptColors[job.dept]}15`,
                    color: deptColors[job.dept],
                    fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 100,
                  }}>
                    {job.dept}
                  </span>
                  <span style={{ color: '#888', fontSize: 13 }}>📍 {job.location}</span>
                  <span style={{ color: '#888', fontSize: 13 }}>⏱ {job.type}</span>
                </div>
              </div>
              <Link to="/contact" style={{
                background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                color: '#fff', padding: '9px 22px', borderRadius: 10,
                fontWeight: 700, textDecoration: 'none', fontSize: 14,
                whiteSpace: 'nowrap',
              }}>
                Ứng tuyển →
              </Link>
            </div>
          ))}
        </div>

        {/* Open application */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2260, #1a3a8f)',
          borderRadius: 24, padding: '44px 36px', textAlign: 'center', color: '#fff',
        }}>
          <HeartOutlined style={{ fontSize: 40, color: '#ff6b00', display: 'block', marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Không thấy vị trí phù hợp?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontSize: 15 }}>
            Gửi CV và portfolio của bạn cho chúng tôi. Chúng tôi luôn tìm kiếm tài năng xuất sắc.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
            color: '#fff', padding: '13px 28px', borderRadius: 12,
            fontWeight: 700, textDecoration: 'none', fontSize: 15,
          }}>
            Gửi hồ sơ tự do →
          </Link>
        </div>
      </div>
    </div>
  )
}

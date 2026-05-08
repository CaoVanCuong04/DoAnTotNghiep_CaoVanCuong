import { ShopOutlined } from '@ant-design/icons'

// Reusable policy page layout
export default function PolicyPage({ title, subtitle, sections, icon }) {
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
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,107,0,0.1) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <ShopOutlined style={{ fontSize: 28, color: '#ff6b00' }} />
            <span style={{ fontSize: 20, fontWeight: 800 }}>GLOBALMART</span>
          </div>
          <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 12px' }}>{title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, margin: 0 }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '52px 24px' }}>
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: '40px 44px',
          boxShadow: '0 4px 32px rgba(15,34,96,0.07)',
          border: '1px solid rgba(15,34,96,0.05)',
        }}>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: i < sections.length - 1 ? 40 : 0 }}>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#0f2260',
                margin: '0 0 14px',
                paddingBottom: 12,
                borderBottom: '2px solid rgba(255,107,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{
                  display: 'inline-flex',
                  width: 28,
                  height: 28,
                  background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: '#fff',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                {s.title}
              </h2>
              <div style={{ color: '#555', lineHeight: 1.9, fontSize: 15 }}>
                {Array.isArray(s.content) ? (
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {s.content.map((item, j) => (
                      <li key={j} style={{ marginBottom: 8 }}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0 }}>{s.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32, color: '#aaa', fontSize: 13 }}>
          Cập nhật lần cuối: 01/01/2026 · © 2026 GlobalMart. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </div>
  )
}

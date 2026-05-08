import { useState } from 'react'
import { Input, Button } from 'antd'
import { SearchOutlined, MailOutlined, BellOutlined, PercentageOutlined, ShopOutlined, FireOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const categories = [
  { label: 'Tất cả', value: '' },
  { label: 'Điện tử', value: 'dien-tu' },
  { label: 'Thời trang', value: 'thoi-trang' },
  { label: 'Nhà cửa', value: 'nha-cua' },
  { label: 'Làm đẹp', value: 'lam-dep' },
  { label: 'Thể thao', value: 'the-thao' },
]

const deals = [
  { label: 'Flash Sale', icon: <FireOutlined />, color: '#ff4d4f', bg: 'linear-gradient(135deg, #ff4d4f, #ff7875)', desc: 'Giảm đến 70% trong 24 giờ' },
  { label: 'Mua 1 Tặng 1', icon: <PercentageOutlined />, color: '#722ed1', bg: 'linear-gradient(135deg, #722ed1, #9254de)', desc: 'Chọn sản phẩm áp dụng ngay' },
  { label: 'Voucher hôm nay', icon: <BellOutlined />, color: '#fa8c16', bg: 'linear-gradient(135deg, #fa8c16, #ffa940)', desc: 'Mã giảm giá độc quyền' },
  { label: 'Hàng mới về', icon: <ShopOutlined />, color: '#13c2c2', bg: 'linear-gradient(135deg, #13c2c2, #36cfc9)', desc: 'Sản phẩm mới nhất hôm nay' },
]

export default function CareersPage() {
  return (
    <div style={{ background: '#f8f9fd', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 50%, #0a1840 100%)',
        color: '#fff',
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,107,0,0.2) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 24 }}>
            <FireOutlined style={{ color: '#ff6b00' }} />
            <span style={{ color: '#ff9a40', fontSize: 13, fontWeight: 600 }}>Khuyến Mãi & Ưu Đãi</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 16px' }}>
            Săn Deal Cực Chất Mỗi Ngày
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, margin: '0 0 32px' }}>
            Hàng nghìn sản phẩm giảm giá, voucher độc quyền và flash sale mỗi ngày tại GlobalMart.
          </p>
          <Link to="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
            color: '#fff', padding: '14px 32px', borderRadius: 14,
            fontWeight: 700, textDecoration: 'none', fontSize: 16,
            boxShadow: '0 6px 24px rgba(255,107,0,0.5)',
          }}>
            <SearchOutlined /> Tìm kiếm sản phẩm
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        {/* Deal categories */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f2260', margin: '0 0 12px' }}>Ưu Đãi Nổi Bật</h2>
          <p style={{ color: '#888' }}>Những chương trình khuyến mãi đang diễn ra</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 60 }}>
          {deals.map((d) => (
            <Link key={d.label} to="/search" style={{
              display: 'block',
              background: d.bg,
              borderRadius: 20,
              padding: '32px 28px',
              textDecoration: 'none',
              color: '#fff',
              boxShadow: `0 8px 32px ${d.color}40`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 32, marginBottom: 14 }}>{d.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{d.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{d.desc}</div>
            </Link>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f2260', margin: '0 0 24px' }}>Khám Phá Theo Danh Mục</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <Link key={c.label} to={`/search${c.value ? `?category=${c.value}` : ''}`} style={{
                padding: '8px 20px',
                background: '#fff',
                border: '1px solid rgba(15,34,96,0.12)',
                borderRadius: 100,
                color: '#0f2260',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(15,34,96,0.06)',
                transition: 'all 0.2s',
              }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#0f2260'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = '#fff'
                  e.currentTarget.style.color = '#0f2260'
                }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2260, #1a3a8f)',
          borderRadius: 28,
          padding: '48px 40px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <MailOutlined style={{ fontSize: 40, color: '#ff6b00', marginBottom: 20 }} />
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>Nhận Thông Báo Ưu Đãi</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 28, fontSize: 16 }}>
            Đăng ký email để nhận thông báo về flash sale và voucher độc quyền trước tiên.
          </p>
          <div style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Input
              placeholder="Nhập email của bạn..."
              size="large"
              style={{ flex: 1, minWidth: 260, borderRadius: 12, height: 50 }}
            />
            <Button
              type="primary"
              size="large"
              style={{
                background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                border: 'none',
                borderRadius: 12,
                fontWeight: 700,
                height: 50,
                paddingInline: 24,
              }}
            >
              Đăng ký
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

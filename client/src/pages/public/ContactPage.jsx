import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { PhoneOutlined, MailOutlined, EnvironmentOutlined, ClockCircleOutlined, SendOutlined, ShopOutlined } from '@ant-design/icons'

const { TextArea } = Input

const contactInfo = [
  {
    icon: <PhoneOutlined style={{ fontSize: 22, color: '#ff6b00' }} />,
    title: 'Điện Thoại',
    lines: ['+82-388-0990', 'Thứ 2 – Thứ 7, 8:00 – 18:00'],
  },
  {
    icon: <MailOutlined style={{ fontSize: 22, color: '#ff6b00' }} />,
    title: 'Email',
    lines: ['info@globalmart.com', 'support@globalmart.com'],
  },
  {
    icon: <EnvironmentOutlined style={{ fontSize: 22, color: '#ff6b00' }} />,
    title: 'Địa Chỉ',
    lines: ['123 Đường Nguyễn Văn Linh,', 'Quận 7, TP. Hồ Chí Minh'],
  },
  {
    icon: <ClockCircleOutlined style={{ fontSize: 22, color: '#ff6b00' }} />,
    title: 'Giờ Làm Việc',
    lines: ['Thứ 2 – Thứ 7: 8:00 – 18:00', 'Chủ Nhật: 9:00 – 12:00'],
  },
]

export default function ContactPage() {
  const [form] = Form.useForm()
  const [sending, setSending] = useState(false)

  const handleSubmit = async (values) => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      form.resetFields()
      message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong vòng 24 giờ.')
    }, 1500)
  }

  return (
    <div style={{ background: '#f8f9fd', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 50%, #0a1840 100%)',
        color: '#fff',
        padding: '72px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,107,0,0.15) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <ShopOutlined style={{ fontSize: 32, color: '#ff6b00' }} />
            <span style={{ fontSize: 24, fontWeight: 800 }}>GLOBALMART</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '0 0 16px' }}>
            Liên Hệ Với Chúng Tôi
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, margin: 0 }}>
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng lắng nghe và giúp đỡ bạn.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        {/* Contact cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 60,
        }}>
          {contactInfo.map((c) => (
            <div key={c.title} style={{
              background: '#fff',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 4px 20px rgba(15,34,96,0.07)',
              border: '1px solid rgba(15,34,96,0.06)',
            }}>
              <div style={{ marginBottom: 14 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: '#0f2260', fontSize: 16, marginBottom: 8 }}>{c.title}</div>
              {c.lines.map((l, i) => (
                <div key={i} style={{ color: '#666', fontSize: 14, lineHeight: 1.7 }}>{l}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Form + Map */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 40,
          alignItems: 'start',
        }}>
          {/* Form */}
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: '40px 36px',
            boxShadow: '0 4px 32px rgba(15,34,96,0.08)',
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2260', margin: '0 0 8px' }}>
              Gửi tin nhắn cho chúng tôi
            </h2>
            <p style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>
              Điền thông tin bên dưới và chúng tôi sẽ liên hệ lại sớm nhất có thể.
            </p>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                  <Input placeholder="Nguyễn Văn A" size="large" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                  <Input placeholder="example@email.com" size="large" style={{ borderRadius: 10 }} />
                </Form.Item>
              </div>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="0912 345 678" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>
              <Form.Item name="subject" label="Chủ đề" rules={[{ required: true, message: 'Vui lòng nhập chủ đề' }]}>
                <Input placeholder="Tôi cần hỗ trợ về..." size="large" style={{ borderRadius: 10 }} />
              </Form.Item>
              <Form.Item name="message" label="Nội dung" rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
                <TextArea rows={5} placeholder="Mô tả chi tiết vấn đề bạn gặp phải..." style={{ borderRadius: 10 }} />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={sending}
                icon={<SendOutlined />}
                size="large"
                block
                style={{
                  background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  height: 50,
                  fontSize: 16,
                  boxShadow: '0 4px 16px rgba(255,107,0,0.3)',
                }}
              >
                Gửi tin nhắn
              </Button>
            </Form>
          </div>

          {/* Info block */}
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #0f2260 0%, #1a3a8f 100%)',
              borderRadius: 24,
              padding: '36px 32px',
              color: '#fff',
              marginBottom: 24,
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>Hỗ Trợ Nhanh</h3>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 20 }}>
                Bạn có thể sử dụng tính năng chat trực tiếp ngay trên website hoặc gọi hotline để được hỗ trợ ngay lập tức.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: '📞 Hotline', value: '+82-388-0990' },
                  { label: '📧 Email hỗ trợ', value: 'support@globalmart.com' },
                  { label: '💬 Chat trực tuyến', value: 'Sẵn sàng 24/7' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{item.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: 24,
              padding: '28px 28px',
              boxShadow: '0 4px 20px rgba(15,34,96,0.07)',
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f2260', margin: '0 0 14px' }}>Câu Hỏi Thường Gặp</h3>
              <p style={{ color: '#888', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                Trước khi liên hệ, hãy thử tìm câu trả lời trong trung tâm trợ giúp của chúng tôi.
              </p>
              <a href="/faq" style={{
                display: 'inline-block',
                color: '#ff6b00', fontWeight: 600, fontSize: 14,
                textDecoration: 'none', borderBottom: '2px solid #ff6b00', paddingBottom: 2,
              }}>
                Xem câu hỏi thường gặp →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

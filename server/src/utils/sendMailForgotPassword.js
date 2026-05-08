const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const SendMailForgotPassword = async (email, otp) => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });

        const otpDigits = String(otp).split('').map(d => `
                        <td style="padding:0 5px;">
                            <div style="
                                width:48px;height:56px;
                                background:#f0f4ff;
                                border:2px solid #c7d4f8;
                                border-radius:10px;
                                display:block;
                                font-size:28px;
                                font-weight:800;
                                color:#1a3c8f;
                                font-family:'Courier New',monospace;
                                line-height:56px;
                                text-align:center;
                                margin:0 auto;
                            ">${d}</div>
                        </td>`).join('');

        const info = await transport.sendMail({
            from: `"GLOBALMART" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Mã OTP đặt lại mật khẩu GLOBALMART',
            text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`,
            html: `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt lại mật khẩu - GLOBALMART</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2fb;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2fb;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(26,60,143,0.12);">

                    <!-- HEADER -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1a3c8f 0%,#2b52c0 60%,#3b6de0 100%);padding:36px 40px;text-align:center;">
                            <!-- Logo -->
                            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                                <tr>
                                    <td style="vertical-align:middle;padding-right:10px;">
                                        <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;text-align:center;line-height:44px;font-size:22px;color:#ffffff;font-weight:bold;">G</div>
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <span style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">GLOBALMART</span>
                                    </td>
                                </tr>
                            </table>
                            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Đặt lại mật khẩu</h1>
                            <p style="color:rgba(255,255,255,0.82);margin:8px 0 0;font-size:14px;">Yêu cầu được gửi lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="padding:36px 40px;">
                            <p style="font-size:16px;color:#374151;margin:0 0 12px;line-height:1.7;">Xin chào,</p>
                            <p style="font-size:15px;color:#4b5563;margin:0 0 28px;line-height:1.7;">
                                Chúng tôi nhận được yêu cầu <strong>đặt lại mật khẩu</strong> cho tài khoản GLOBALMART liên kết với địa chỉ email này.
                                Vui lòng sử dụng mã OTP dưới đây để tiếp tục:
                            </p>

                            <!-- OTP BOX -->
                            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                                <tr>
                                    <td align="center">
                                        <div style="background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1.5px solid #c7d4f8;border-radius:14px;padding:28px 20px;display:inline-block;">
                                            <p style="margin:0 0 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6b7280;">Mã xác nhận của bạn</p>
                                            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                                <tr>${otpDigits}</tr>
                                            </table>
                                            <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                                                Mã có hiệu lực trong <strong style="color:#ef4444;">5 phút</strong>
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- STEPS -->
                            <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #1a3c8f;">
                                <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1a3c8f;">Hướng dẫn đặt lại mật khẩu:</p>
                                <ol style="margin:0;padding-left:18px;font-size:14px;color:#4b5563;line-height:2;">
                                    <li>Mở trang đặt lại mật khẩu trên GLOBALMART</li>
                                    <li>Nhập mã OTP <strong>${otp}</strong> vào ô xác nhận</li>
                                    <li>Tạo mật khẩu mới (ít nhất 6 ký tự)</li>
                                    <li>Đăng nhập với mật khẩu mới</li>
                                </ol>
                            </div>

                            <!-- WARNING -->
                            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                                    <strong>Lưu ý bảo mật:</strong> Nếu bạn <em>không</em> thực hiện yêu cầu này, hãy bỏ qua email này.
                                    Mật khẩu của bạn sẽ <strong>không thay đổi</strong> nếu bạn không sử dụng mã OTP.
                                </p>
                            </div>

                            <p style="font-size:14px;color:#9ca3af;margin:0;text-align:center;">
                                Cần hỗ trợ? Liên hệ chúng tôi qua email hoặc trung tâm trợ giúp.
                            </p>
                        </td>
                    </tr>

                    <!-- DIVIDER -->
                    <tr>
                        <td style="padding:0 40px;">
                            <hr style="border:none;border-top:1px solid #f1f5f9;margin:0;">
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="padding:24px 40px;background:#f8fafc;text-align:center;">
                            <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                                <tr>
                                    <td style="vertical-align:middle;padding-right:6px;">
                                        <div style="width:28px;height:28px;background:linear-gradient(135deg,#1a3c8f,#2b52c0);border-radius:6px;display:inline-block;text-align:center;line-height:28px;font-size:14px;color:#ffffff;font-weight:bold;">G</div>
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <span style="font-size:15px;font-weight:800;color:#1a3c8f;">GLOBALMART</span>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">Email này được gửi tự động, vui lòng không trả lời.</p>
                            <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} GLOBALMART. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        });

        console.log('Forgot password email sent:', info.messageId);
    } catch (error) {
        console.log('Error sending forgot password email:', error);
    }
};

module.exports = SendMailForgotPassword;

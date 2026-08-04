const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[email] SMTP not configured — OTP emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

async function sendOtpEmail(toEmail, toName, otpCode) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@glowexpert.com';
  const brandName = 'GlowExpert';

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#faf8f5;border:1px solid #e5e0d8;border-radius:12px;">
      <h2 style="margin:0 0 8px;font-size:22px;color:#0c0b09;">${brandName} Admin</h2>
      <p style="color:#555;margin:0 0 24px;">Your one-time verification code:</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;padding:20px;background:#0c0b09;color:#f6f3ec;border-radius:8px;margin:0 0 24px;">
        ${otpCode}
      </div>
      <p style="color:#888;font-size:13px;margin:0;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  const mailOptions = {
    from,
    to: toEmail,
    subject: `${brandName} — Your Admin Login Code`,
    html
  };

  if (!transporter) {
    console.log(`[email] OTP for ${toEmail}: ${otpCode}`);
    return;
  }

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };

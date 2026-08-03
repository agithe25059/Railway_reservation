const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (16 chars)
  },
});

/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email to the user
 */
const sendOTPEmail = async (toEmail, otp, fullName) => {
  const mailOptions = {
    from: `"RailConnect 🚂" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Your RailConnect Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; background: #0d1117; font-family: 'Segoe UI', Arial, sans-serif; }
          .container { max-width: 520px; margin: 40px auto; background: #161b22; border-radius: 16px; overflow: hidden; border: 1px solid #30363d; }
          .header { background: linear-gradient(135deg, #3b5bdb, #7048e8); padding: 32px 24px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
          .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
          .body { padding: 32px 24px; }
          .greeting { color: #e6edf3; font-size: 16px; margin-bottom: 16px; }
          .otp-box { background: #0d1117; border: 2px solid #3b5bdb; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
          .otp-label { color: #8d96a0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .otp-code { color: #7ec8e3; font-size: 42px; font-weight: 800; letter-spacing: 10px; }
          .timer { color: #f0883e; font-size: 13px; margin-top: 12px; }
          .note { color: #8d96a0; font-size: 13px; line-height: 1.6; margin-top: 16px; }
          .footer { background: #0d1117; padding: 20px 24px; text-align: center; border-top: 1px solid #30363d; }
          .footer p { color: #8d96a0; font-size: 12px; margin: 0; }
          .train { font-size: 32px; margin-bottom: 8px; display: block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="train">🚂</span>
            <h1>RailConnect</h1>
            <p>Railway Reservation System</p>
          </div>
          <div class="body">
            <p class="greeting">Hi <strong style="color:#e6edf3">${fullName || 'there'}</strong>,</p>
            <p style="color:#8d96a0;font-size:14px;">Use the verification code below to complete your registration. This code is valid for <strong style="color:#f0883e">5 minutes</strong>.</p>
            <div class="otp-box">
              <div class="otp-label">Your verification code</div>
              <div class="otp-code">${otp}</div>
              <div class="timer">⏱ Expires in 5 minutes</div>
            </div>
            <p class="note">If you didn't request this, you can safely ignore this email. Do not share this code with anyone.</p>
          </div>
          <div class="footer">
            <p>© 2024 RailConnect · Railway Reservation System</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTPEmail };

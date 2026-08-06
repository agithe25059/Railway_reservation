const nodemailer = require('nodemailer');

// Create reusable transporter (works for Gmail and Google Workspace accounts)
let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS &&
      !process.env.EMAIL_USER.includes('your.railconnect')) {
    // Use real Gmail SMTP
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Fallback: Ethereal test account (OTP logged to console)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('📧 Using Ethereal test email (dev mode)');
  }
  return transporter;
};

/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email to the user
 */
const sendOTPEmail = async (toEmail, otp, fullName, type = 'Registration') => {
  const t = await getTransporter();
  const mailOptions = {
    from: `"RailConnect 🚂" <${process.env.EMAIL_USER || 'noreply@railconnect.com'}>`,
    to: toEmail,
    subject: `🔐 Your RailConnect ${type} Verification Code: ${otp}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; background: #0d1117; font-family: 'Segoe UI', Arial, sans-serif; }
          .container { max-width: 520px; margin: 40px auto; background: #161b22; border-radius: 16px; overflow: hidden; border: 1px solid #30363d; }
          .header { background: linear-gradient(135deg, #f97415, #e63946); padding: 32px 24px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
          .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
          .body { padding: 32px 24px; }
          .greeting { color: #e6edf3; font-size: 16px; margin-bottom: 16px; }
          .otp-box { background: #0d1117; border: 2px solid #f97415; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
          .otp-label { color: #8d96a0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .otp-code { color: #f97415; font-size: 42px; font-weight: 800; letter-spacing: 10px; }
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
            <p>${type} OTP Verification</p>
          </div>
          <div class="body">
            <p class="greeting">Hi <strong style="color:#e6edf3">${fullName || 'User'}</strong>,</p>
            <p style="color:#8d96a0;font-size:14px;">Use the 6-digit verification code below for <strong>${type}</strong>. This code is valid for <strong style="color:#f0883e">5 minutes</strong>.</p>
            <div class="otp-box">
              <div class="otp-label">${type} Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div class="timer">⏱ Expires in 5 minutes</div>
            </div>
            <p class="note">Do not share this OTP code with anyone. RailConnect staff will never ask for your OTP.</p>
          </div>
          <div class="footer">
            <p>© 2026 RailConnect · Indian Railway Reservation System</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const info = await t.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`\n📧 ═══════════════════════════════════════`);
    console.log(`   ${type} OTP for ${toEmail}: ${otp}`);
    console.log(`   Preview email: ${previewUrl}`);
    console.log(`📧 ═══════════════════════════════════════\n`);
  } else {
    console.log(`✅ ${type} OTP email sent to ${toEmail}`);
  }
};

/**
 * Send Booking Status Confirmation Email
 */
const sendBookingConfirmationEmail = async (toEmail, booking) => {
  const t = await getTransporter();
  const passengerListHtml = booking.passengers.map((p, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #30363d; color: #e6edf3;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #30363d; color: #e6edf3;"><strong>${p.name}</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #30363d; color: #8d96a0;">${p.age} yrs / ${p.gender}</td>
      <td style="padding: 10px; border-bottom: 1px solid #30363d; color: #8d96a0;">${p.aadhaar_number ? 'XXXX-XXXX-' + p.aadhaar_number.slice(-4) : 'Verified'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #30363d; text-align: right;"><span style="background: rgba(249,116,21,0.2); color: #f97415; border: 1px solid rgba(249,116,21,0.4); padding: 4px 8px; border-radius: 6px; font-weight: 700;">${p.seat_number}</span></td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"RailConnect 🚂" <${process.env.EMAIL_USER || 'noreply@railconnect.com'}>`,
    to: toEmail,
    subject: `🎟 Booking CONFIRMED! PNR: ${booking.pnr} — ${booking.train_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; background: #0d1117; font-family: 'Segoe UI', Arial, sans-serif; }
          .container { max-width: 600px; margin: 30px auto; background: #161b22; border-radius: 16px; overflow: hidden; border: 1px solid #30363d; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 22px; }
          .pnr-box { background: #0d1117; border: 2px dashed #f97415; padding: 16px; margin: 20px; border-radius: 12px; text-align: center; }
          .pnr-lbl { color: #8d96a0; font-size: 12px; letter-spacing: 1px; }
          .pnr-val { color: #f97415; font-size: 32px; font-weight: 800; letter-spacing: 4px; }
          .details { padding: 0 20px 20px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
          .th { background: #0d1117; color: #f97415; text-align: left; padding: 10px; }
          .footer { background: #0d1117; padding: 16px; text-align: center; font-size: 12px; color: #8d96a0; border-top: 1px solid #30363d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Ticket Booking Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0;">Status: CONFIRMED · Aadhaar & Mobile Verified ✅</p>
          </div>

          <div class="pnr-box">
            <div class="pnr-lbl">PNR NUMBER</div>
            <div class="pnr-val">${booking.pnr}</div>
          </div>

          <div class="details">
            <h3 style="color:#e6edf3; margin-bottom: 8px;">Train Journey Details</h3>
            <p style="color:#8d96a0; font-size:14px; margin: 4px 0;"><strong>Train:</strong> ${booking.train_name} (#${booking.train_number})</p>
            <p style="color:#8d96a0; font-size:14px; margin: 4px 0;"><strong>Date of Journey:</strong> ${booking.travel_date}</p>
            <p style="color:#8d96a0; font-size:14px; margin: 4px 0;"><strong>Class:</strong> ${booking.class_code} · <strong>Mobile Contact:</strong> ${booking.contact_phone}</p>
            <p style="color:#8d96a0; font-size:14px; margin: 4px 0;"><strong>Total Fare Paid:</strong> <span style="color:#f97415; font-weight:700;">₹${Number(booking.total_fare).toLocaleString()}</span></p>

            <h3 style="color:#e6edf3; margin-top: 24px; margin-bottom: 8px;">Verified Passengers & Assigned Seats</h3>
            <table class="table">
              <thead>
                <tr>
                  <th class="th">#</th>
                  <th class="th">Name</th>
                  <th class="th">Age/Gender</th>
                  <th class="th">Aadhaar</th>
                  <th class="th" style="text-align:right;">Seat</th>
                </tr>
              </thead>
              <tbody>
                ${passengerListHtml}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>© 2026 RailConnect · Please carry a valid Govt ID during your journey.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const info = await t.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`\n📧 ═══════════════════════════════════════`);
    console.log(`   Booking Confirmation Email for ${toEmail}: PNR ${booking.pnr}`);
    console.log(`   Preview email: ${previewUrl}`);
    console.log(`📧 ═══════════════════════════════════════\n`);
  }
};

module.exports = { generateOTP, sendOTPEmail, sendBookingConfirmationEmail };

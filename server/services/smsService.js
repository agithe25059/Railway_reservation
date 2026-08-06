const https = require('https');

/**
 * Send SMS OTP to an Indian mobile number.
 * Supports real SMS via Fast2SMS if FAST2SMS_API_KEY is present in .env,
 * or logs SMS payload to backend console if in dev/demo mode.
 */
const sendSMS = async (phoneNumber, message) => {
  const formattedPhone = phoneNumber.replace(/\D/g, '');
  const otpCode = message.match(/\d{6}/)?.[0] || '123456';

  // 1. Fast2SMS API integration if API key is provided
  if (process.env.FAST2SMS_API_KEY) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        route: 'otp',
        variables_values: otpCode,
        numbers: formattedPhone,
      });

      const req = https.request({
        hostname: 'www.fast2sms.com',
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`📱 Real SMS sent to +91 ${formattedPhone} via Fast2SMS!`);
          resolve({ success: true, provider: 'Fast2SMS' });
        });
      });

      req.on('error', (err) => {
        console.error('Fast2SMS error:', err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(postData);
      req.end();
    });
  }

  // 2. Console SMS payload logger
  console.log(`\n📱 ═══════════════════════════════════════════════════════`);
  console.log(`   SMS SENT TO MOBILE: +91 ${formattedPhone}`);
  console.log(`   SMS BODY: "${message}"`);
  console.log(`📱 ═══════════════════════════════════════════════════════\n`);

  return { success: true, provider: 'Console' };
};

module.exports = { sendSMS };

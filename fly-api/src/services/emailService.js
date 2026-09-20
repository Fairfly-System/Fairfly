const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

/**
 * Initialize Nodemailer transport using Gmail SMTP or custom SMTP credentials
 */
const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER?.trim();
  // Strip any spaces from Google App Passwords (e.g. 'xxxx xxxx xxxx xxxx' -> 'xxxxxxxxxxxxxxxx')
  const pass = process.env.SMTP_PASS?.trim().replace(/\s+/g, '');

  if (user && pass) {
    const isGmail = user.endsWith('@gmail.com') || (process.env.SMTP_HOST || '').includes('gmail');
    
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: {
            user,
            pass
          }
        }
      : {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '465', 10),
          secure: process.env.SMTP_SECURE !== 'false',
          auth: {
            user,
            pass
          }
        };

    transporter = nodemailer.createTransport(transportConfig);
    console.log(`[EmailService] Nodemailer transporter initialized for ${user}`);
  }

  return transporter;
};

/**
 * Generate responsive branded HTML template for FairFly email verification
 */
const generateVerificationEmailHtml = ({ fullName, code, expiryMinutes = 10 }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your FairFly Registration</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F8FAFC;
      padding: 40px 0;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #5558E3;
      padding: 32px 32px 28px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      color: #E0E7FF;
      font-size: 14px;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0F172A;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 24px 0;
    }
    .code-box {
      background-color: #EEF2FF;
      border: 1.5px dashed #A5B4FC;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
    }
    .code-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #4338CA;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .code-value {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #312E81;
      font-family: 'Courier New', Courier, monospace;
      padding-left: 8px; /* Optical balance for letter-spacing */
    }
    .expiry-note {
      font-size: 13px;
      color: #64748B;
      background-color: #F1F5F9;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 24px 0 0 0;
      border-left: 4px solid #F59E0B;
    }
    .security-notice {
      font-size: 12px;
      color: #94A3B8;
      line-height: 1.5;
      margin-top: 24px;
      border-top: 1px solid #F1F5F9;
      padding-top: 20px;
    }
    .footer {
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>FairFly Portal</h1>
        <p>Direct Client &amp; Travel Partner Verification</p>
      </div>
      <div class="content">
        <div class="greeting">Hello ${fullName || 'Valued Traveler'},</div>
        <p class="text">
          Thank you for registering with FairFly. To complete your account setup and verify your identity, please enter the 6-digit confirmation code below on your verification screen:
        </p>

        <div class="code-box">
          <div class="code-label">Your Verification Code</div>
          <div class="code-value">${code}</div>
        </div>

        <div class="expiry-note">
          <strong>Security Notice:</strong> This code will expire in <strong>${expiryMinutes} minutes</strong>. Entering the code incorrectly multiple times will invalidate this request to prevent brute-force attacks.
        </div>

        <div class="security-notice">
          If you did not initiate this registration request, please disregard this email. No account will be activated without this verification code.
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} FairFly Travel &amp; Tours System. All rights reserved.<br>
        Standardized Cloud Platform • ISO 9001:2000 Ready Architecture
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send 6-character registration verification code via Email
 * @param {string} toEmail - Recipient email address
 * @param {string} fullName - Recipient full name
 * @param {string} code - 6-character verification code
 * @returns {Promise<{ sent: boolean, mode: string, error?: string }>}
 */
const sendVerificationCodeEmail = async (toEmail, fullName, code) => {
  const mailTransporter = getTransporter();
  const smtpUser = process.env.SMTP_USER?.trim();

  // If EMAIL_FROM contains a placeholder or unverified domain (e.g. no-reply@fairfly.com),
  // Gmail SMTP will either trigger SPF/DKIM failure (landing straight in Spam) or be rejected.
  // When using Gmail SMTP, always sender-align with the authenticated Gmail account.
  let fromAddress = process.env.EMAIL_FROM?.trim();
  if (!fromAddress || fromAddress.includes('no-reply@fairfly.com')) {
    fromAddress = smtpUser ? `"FairFly Verification" <${smtpUser}>` : '"FairFly Verification" <no-reply@fairfly.com>';
  }

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `${code} is your FairFly confirmation code`,
    text: `Hello ${fullName || 'User'},\n\nYour FairFly registration confirmation code is: ${code}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.\n\nFairFly Travel & Tours System`,
    html: generateVerificationEmailHtml({ fullName, code, expiryMinutes: 10 })
  };

  // If transporter is configured, attempt real email transmission
  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail(mailOptions);
      console.log(`[EmailService] Verification email successfully sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { sent: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Error sending email via SMTP to ${toEmail}:`, err.message);
      // Fallback to console log in dev environments so registration is never blocked
      console.log(`\n=============================================================`);
      console.log(`[FALLBACK DEV VERIFICATION CODE]`);
      console.log(`Recipient: ${toEmail} (${fullName})`);
      console.log(`Verification Code: [ ${code} ]`);
      console.log(`Expires In: 10 minutes`);
      console.log(`=============================================================\n`);
      return { sent: false, mode: 'fallback-logged', error: err.message };
    }
  } else {
    // If SMTP credentials not provided in .env yet, output prominent dev log
    console.log(`\n=============================================================`);
    console.log(`[EmailService: NO SMTP CREDENTIALS IN .ENV — DEV LOGGING MODE]`);
    console.log(`Recipient: ${toEmail} (${fullName})`);
    console.log(`Verification Code: [ ${code} ]`);
    console.log(`Expires In: 10 minutes`);
    console.log(`Configure SMTP_USER and SMTP_PASS in fly-api/.env to send real Gmail emails.`);
    console.log(`=============================================================\n`);
    return { sent: true, mode: 'dev-console' };
  }
};

module.exports = {
  sendVerificationCodeEmail,
  generateVerificationEmailHtml
};

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

/**
 * Generate responsive branded HTML template for FairFly password reset
 */
const generatePasswordResetEmailHtml = ({ fullName, resetLink, expiryMinutes = 60 }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your FairFly Password</title>
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
      margin: 0 0 20px 0;
    }
    .btn-wrap {
      text-align: center;
      margin: 32px 0;
    }
    .reset-btn {
      background-color: #5558E3;
      color: #FFFFFF !important;
      padding: 14px 32px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 8px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgba(85, 88, 227, 0.25);
    }
    .fallback-box {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px;
      margin-top: 24px;
      word-break: break-all;
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
    }
    .fallback-box a {
      color: #5558E3;
      text-decoration: underline;
    }
    .expiry-note {
      font-size: 13px;
      color: #64748B;
      background-color: #F1F5F9;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 24px 0 0 0;
      border-left: 4px solid #5558E3;
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
        <p>Client Account Security &amp; Password Recovery</p>
      </div>
      <div class="content">
        <div class="greeting">Hello ${fullName || 'Valued Traveler'},</div>
        <p class="text">
          We received a request to reset the password for your FairFly client account. Please click the button below to securely choose your new password:
        </p>

        <div class="btn-wrap">
          <a href="${resetLink}" class="reset-btn" target="_blank" rel="noopener noreferrer">Reset My Password</a>
        </div>

        <div class="expiry-note">
          <strong>Security Notice:</strong> This link is valid for <strong>${expiryMinutes} minutes</strong> and can only be used once.
        </div>

        <div class="fallback-box">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" target="_blank" rel="noopener noreferrer">${resetLink}</a>
        </div>

        <div class="security-notice">
          If you did not request a password reset, you can safely disregard this email. Your password will remain unchanged and your account is secure.
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
 * Send password reset link via Email
 * @param {string} toEmail - Recipient email address
 * @param {string} fullName - Recipient full name
 * @param {string} resetLink - Firebase Auth password reset URL
 * @returns {Promise<{ sent: boolean, mode: string, error?: string }>}
 */
const sendPasswordResetEmail = async (toEmail, fullName, resetLink) => {
  const mailTransporter = getTransporter();
  const smtpUser = process.env.SMTP_USER?.trim();

  let fromAddress = process.env.EMAIL_FROM?.trim();
  if (!fromAddress || fromAddress.includes('no-reply@fairfly.com')) {
    fromAddress = smtpUser ? `"FairFly Account Recovery" <${smtpUser}>` : '"FairFly Account Recovery" <no-reply@fairfly.com>';
  }

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `Reset your FairFly account password`,
    text: `Hello ${fullName || 'User'},\n\nWe received a request to reset the password for your FairFly client account. Click the following link to choose a new password:\n\n${resetLink}\n\nThis link is valid for 60 minutes. If you did not request this, please ignore this email.\n\nFairFly Travel & Tours System`,
    html: generatePasswordResetEmailHtml({ fullName, resetLink, expiryMinutes: 60 })
  };

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail(mailOptions);
      console.log(`[EmailService] Password reset email successfully sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { sent: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Error sending password reset email to ${toEmail}:`, err.message);
      console.log(`\n=============================================================`);
      console.log(`[FALLBACK DEV PASSWORD RESET LINK]`);
      console.log(`Recipient: ${toEmail} (${fullName})`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`Expires In: 60 minutes`);
      console.log(`=============================================================\n`);
      return { sent: false, mode: 'fallback-logged', error: err.message };
    }
  } else {
    console.log(`\n=============================================================`);
    console.log(`[EmailService: NO SMTP CREDENTIALS IN .ENV — DEV LOGGING MODE]`);
    console.log(`Recipient: ${toEmail} (${fullName})`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`Expires In: 60 minutes`);
    console.log(`=============================================================\n`);
    return { sent: true, mode: 'dev-console' };
  }
};

/**
 * Generate branded HTML template for account approval notification
 */
const generateAccountApprovedEmailHtml = ({ fullName, loginUrl }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your FairFly Account is Approved!</title>
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
      background-color: #16A34A;
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
      color: #DCFCE7;
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
      color: #334155;
      margin: 0 0 20px 0;
    }
    .badge-box {
      background-color: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: center;
    }
    .badge-text {
      color: #15803D;
      font-weight: 700;
      font-size: 15px;
    }
    .btn-wrap {
      text-align: center;
      margin: 28px 0;
    }
    .action-btn {
      display: inline-block;
      background-color: #16A34A;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.2px;
    }
    .footer {
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>FairFly Portal</h1>
        <p>Identity Verification &bull; Account Approved</p>
      </div>
      <div class="content">
        <div class="greeting">Hello ${fullName || 'Valued Traveler'},</div>
        <p class="text">
          Great news! Our administration team has reviewed and verified your uploaded government ID. Your FairFly client account is now <strong>fully approved and ready to use</strong>.
        </p>

        <div class="badge-box">
          <div class="badge-text">&#10004; Government ID Verified &bull; Account Active</div>
        </div>

        <p class="text">
          You can now sign in to book travel services, schedule consular filings, track passport renewals, and connect directly with authorized franchise branch operators across the Philippines.
        </p>

        <div class="btn-wrap">
          <a href="${loginUrl}" class="action-btn" target="_blank" rel="noopener noreferrer">Sign In to FairFly</a>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} FairFly Travel &amp; Tours System. All rights reserved.<br>
        Standardized Cloud Platform &bull; ISO 9001:2000 Ready Architecture
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send account approved email
 */
const sendAccountApprovedEmail = async (toEmail, fullName, loginUrl) => {
  const mailTransporter = getTransporter();
  const smtpUser = process.env.SMTP_USER?.trim();

  let fromAddress = process.env.EMAIL_FROM?.trim();
  if (!fromAddress || fromAddress.includes('no-reply@fairfly.com')) {
    fromAddress = smtpUser ? `"FairFly Account Services" <${smtpUser}>` : '"FairFly Account Services" <no-reply@fairfly.com>';
  }

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `Your FairFly Account is Approved! Ready to Sign In`,
    text: `Hello ${fullName || 'Valued Traveler'},\n\nGreat news! Our administration team has reviewed and verified your uploaded government ID. Your FairFly client account is now fully approved and ready to use.\n\nSign in here:\n${loginUrl}\n\nFairFly Travel & Tours System`,
    html: generateAccountApprovedEmailHtml({ fullName, loginUrl })
  };

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail(mailOptions);
      console.log(`[EmailService] Account approval email sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { sent: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Error sending approval email to ${toEmail}:`, err.message);
      return { sent: false, mode: 'fallback-logged', error: err.message };
    }
  } else {
    console.log(`\n=============================================================`);
    console.log(`[EmailService: DEV MODE — ACCOUNT APPROVED EMAIL]`);
    console.log(`Recipient: ${toEmail} (${fullName})`);
    console.log(`Login URL: ${loginUrl}`);
    console.log(`=============================================================\n`);
    return { sent: true, mode: 'dev-console' };
  }
};

/**
 * Generate branded HTML template for account rejection with re-upload link
 */
const generateAccountRejectedEmailHtml = ({ fullName, reason, reuploadUrl }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Action Required: FairFly ID Verification</title>
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
      background-color: #DC2626;
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
      color: #FEE2E2;
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
      color: #334155;
      margin: 0 0 20px 0;
    }
    .reason-box {
      background-color: #FEF2F2;
      border-left: 4px solid #DC2626;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
    }
    .reason-title {
      color: #991B1B;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .reason-desc {
      color: #7F1D1D;
      font-size: 14px;
      line-height: 1.5;
    }
    .btn-wrap {
      text-align: center;
      margin: 28px 0;
    }
    .action-btn {
      display: inline-block;
      background-color: #5558E3;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.2px;
    }
    .fallback-box {
      background-color: #F8FAFC;
      border: 1px dashed #CBD5E1;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      color: #64748B;
      word-break: break-all;
      margin-top: 20px;
    }
    .footer {
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>FairFly Portal</h1>
        <p>Identity Verification &bull; Re-upload Required</p>
      </div>
      <div class="content">
        <div class="greeting">Hello ${fullName || 'Valued Traveler'},</div>
        <p class="text">
          Thank you for registering with FairFly. Our administration team has reviewed the government ID document you submitted, but could not approve it due to the following reason:
        </p>

        <div class="reason-box">
          <div class="reason-title">Reviewer Feedback:</div>
          <div class="reason-desc">${reason || 'The submitted ID image was blurry, incomplete, or could not be clearly verified. Please submit a clear photo of the front and back of your valid government ID.'}</div>
        </div>

        <p class="text">
          Don't worry! You can easily re-upload a clear copy of the front and back of your valid government-issued ID by clicking the button below:
        </p>

        <div class="btn-wrap">
          <a href="${reuploadUrl}" class="action-btn" target="_blank" rel="noopener noreferrer">Re-upload Valid ID</a>
        </div>

        <div class="fallback-box">
          If the button above does not work, visit this secure link directly:<br>
          <a href="${reuploadUrl}" target="_blank" rel="noopener noreferrer">${reuploadUrl}</a>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} FairFly Travel &amp; Tours System. All rights reserved.<br>
        Standardized Cloud Platform &bull; ISO 9001:2000 Ready Architecture
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send account rejected email with re-upload link
 */
const sendAccountRejectedEmail = async (toEmail, fullName, reason, reuploadUrl) => {
  const mailTransporter = getTransporter();
  const smtpUser = process.env.SMTP_USER?.trim();

  let fromAddress = process.env.EMAIL_FROM?.trim();
  if (!fromAddress || fromAddress.includes('no-reply@fairfly.com')) {
    fromAddress = smtpUser ? `"FairFly Account Verification" <${smtpUser}>` : '"FairFly Account Verification" <no-reply@fairfly.com>';
  }

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `Action Required: Re-upload Government ID for FairFly Account`,
    text: `Hello ${fullName || 'Valued Traveler'},\n\nOur administration team reviewed your uploaded government ID, but could not approve it:\n\nReason: ${reason || 'ID image was blurry or could not be verified'}\n\nPlease visit the following link to re-upload a clear copy of your valid ID (front and back):\n${reuploadUrl}\n\nFairFly Travel & Tours System`,
    html: generateAccountRejectedEmailHtml({ fullName, reason, reuploadUrl })
  };

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail(mailOptions);
      console.log(`[EmailService] Rejection email sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { sent: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Error sending rejection email to ${toEmail}:`, err.message);
      return { sent: false, mode: 'fallback-logged', error: err.message };
    }
  } else {
    console.log(`\n=============================================================`);
    console.log(`[EmailService: DEV MODE — ACCOUNT REJECTED EMAIL]`);
    console.log(`Recipient: ${toEmail} (${fullName})`);
    console.log(`Reason: ${reason}`);
    console.log(`Re-upload URL: ${reuploadUrl}`);
    console.log(`=============================================================\n`);
    return { sent: true, mode: 'dev-console' };
  }
};

module.exports = {
  sendVerificationCodeEmail,
  generateVerificationEmailHtml,
  sendPasswordResetEmail,
  generatePasswordResetEmailHtml,
  sendAccountApprovedEmail,
  generateAccountApprovedEmailHtml,
  sendAccountRejectedEmail,
  generateAccountRejectedEmailHtml
};



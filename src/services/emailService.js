const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter;

// Initialize email transporter
const initializeEmailService = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  transporter = nodemailer.createTransporter(config);

  // Verify connection configuration
  transporter.verify((_error, _success) => {
    if (_error) {
      logger.error('Email service initialization failed:', _error);
    } else {
      logger.info('Email service initialized successfully');
    }
  });

  return transporter;
};

// Send email function
const sendEmail = async options => {
  if (!transporter) {
    initializeEmailService();
  }

  const mailOptions = {
    from: options.from || process.env.SMTP_USER,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`, {
      to: options.to,
      subject: options.subject
    });
    return info;
  } catch (error) {
    logger.error('Email sending failed:', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });
    throw error;
  }
};

// Send bulk emails
const sendBulkEmails = async emails => {
  const results = [];

  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ success: true, messageId: result.messageId, email: email.to });
    } catch (error) {
      results.push({ success: false, error: error.message, email: email.to });
    }
  }

  return results;
};

// Test email connection
const testEmailConnection = async () => {
  if (!transporter) {
    initializeEmailService();
  }

  try {
    await transporter.verify();
    return { success: true, message: 'Email service is working correctly' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeEmailService,
  sendEmail,
  sendBulkEmails,
  testEmailConnection
};

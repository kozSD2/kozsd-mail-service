const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/database');
const logger = require('../config/logger');
const { sendEmail } = require('../services/emailService');
const { asyncHandler, ValidationError, UnauthorizedError } = require('../middleware/errorHandler');
const { incrementEmailCounter } = require('../middleware/metrics');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Authentication middleware
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Email:
 *       type: object
 *       required:
 *         - to
 *         - subject
 *         - body
 *       properties:
 *         id:
 *           type: integer
 *           description: Email ID
 *         from:
 *           type: string
 *           format: email
 *           description: Sender email address
 *         to:
 *           type: string
 *           format: email
 *           description: Recipient email address
 *         cc:
 *           type: array
 *           items:
 *             type: string
 *             format: email
 *           description: CC recipients
 *         bcc:
 *           type: array
 *           items:
 *             type: string
 *             format: email
 *           description: BCC recipients
 *         subject:
 *           type: string
 *           description: Email subject
 *         body:
 *           type: string
 *           description: Email body (plain text)
 *         htmlBody:
 *           type: string
 *           description: Email body (HTML)
 *         status:
 *           type: string
 *           enum: [pending, sent, failed]
 *           description: Email status
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: When email was sent
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Email creation timestamp
 */

/**
 * @swagger
 * /api/mail/send:
 *   post:
 *     summary: Send an email
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - body
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address
 *               cc:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: CC recipients
 *               bcc:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: BCC recipients
 *               subject:
 *                 type: string
 *                 description: Email subject
 *               body:
 *                 type: string
 *                 description: Email body (plain text)
 *               htmlBody:
 *                 type: string
 *                 description: Email body (HTML)
 *               templateId:
 *                 type: integer
 *                 description: Email template ID (optional)
 *               templateData:
 *                 type: object
 *                 description: Data for template variables
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/send',
  authenticate,
  [
    body('to').isEmail().withMessage('Valid recipient email is required'),
    body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
    body('body').optional().trim(),
    body('htmlBody').optional().trim(),
    body('cc').optional().isArray().withMessage('CC must be an array'),
    body('cc.*').optional().isEmail().withMessage('CC must contain valid email addresses'),
    body('bcc').optional().isArray().withMessage('BCC must be an array'),
    body('bcc.*').optional().isEmail().withMessage('BCC must contain valid email addresses'),
    body('templateId').optional().isInt().withMessage('Template ID must be an integer'),
    body('templateData').optional().isObject().withMessage('Template data must be an object')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { to, cc, bcc, subject, body, htmlBody, templateId, templateData } = req.body;
    const pool = getPool();

    // Get user email from database
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const fromEmail = userResult.rows[0].email;
    let finalSubject = subject;
    let finalBody = body;
    let finalHtmlBody = htmlBody;

    // If template is specified, fetch and process it
    if (templateId) {
      const templateResult = await pool.query(
        'SELECT subject, body, html_body, variables FROM email_templates WHERE id = $1',
        [templateId]
      );

      if (templateResult.rows.length > 0) {
        const template = templateResult.rows[0];

        // Replace template variables
        if (templateData && template.variables) {
          finalSubject = replaceTemplateVariables(template.subject, templateData);
          finalBody = replaceTemplateVariables(template.body, templateData);
          finalHtmlBody = replaceTemplateVariables(template.html_body, templateData);
        } else {
          finalSubject = template.subject;
          finalBody = template.body;
          finalHtmlBody = template.html_body;
        }
      }
    }

    // Save email to database
    const emailResult = await pool.query(
      'INSERT INTO emails (user_id, from_email, to_email, cc_email, bcc_email, subject, body, html_body, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [
        req.user.userId,
        fromEmail,
        to,
        cc || [],
        bcc || [],
        finalSubject,
        finalBody,
        finalHtmlBody,
        'pending'
      ]
    );

    const emailId = emailResult.rows[0].id;

    try {
      // Send email
      const emailOptions = {
        from: fromEmail,
        to,
        cc,
        bcc,
        subject: finalSubject,
        text: finalBody,
        html: finalHtmlBody
      };

      await sendEmail(emailOptions);

      // Update email status to sent
      await pool.query('UPDATE emails SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2', [
        'sent',
        emailId
      ]);

      incrementEmailCounter('success');

      logger.info(`Email sent successfully: ${emailId}`, {
        from: fromEmail,
        to,
        subject: finalSubject
      });

      res.json({
        success: true,
        data: {
          emailId,
          message: 'Email sent successfully'
        }
      });
    } catch (error) {
      // Update email status to failed
      await pool.query('UPDATE emails SET status = $1 WHERE id = $2', ['failed', emailId]);

      incrementEmailCounter('failed');

      logger.error(`Email sending failed: ${emailId}`, error);

      throw error;
    }
  })
);

/**
 * @swagger
 * /api/mail/history:
 *   get:
 *     summary: Get email history for authenticated user
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed]
 *         description: Filter by email status
 *     responses:
 *       200:
 *         description: Email history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/history',
  authenticate,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status;

    const pool = getPool();

    let query =
      'SELECT id, from_email, to_email, cc_email, bcc_email, subject, status, sent_at, created_at FROM emails WHERE user_id = $1';
    const queryParams = [req.user.userId];

    if (status) {
      query += ' AND status = $2';
      queryParams.push(status);
    }

    query +=
      ' ORDER BY created_at DESC LIMIT $' +
      (queryParams.length + 1) +
      ' OFFSET $' +
      (queryParams.length + 2);
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM emails WHERE user_id = $1';
    const countParams = [req.user.userId];

    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        emails: result.rows.map(email => ({
          id: email.id,
          from: email.from_email,
          to: email.to_email,
          cc: email.cc_email,
          bcc: email.bcc_email,
          subject: email.subject,
          status: email.status,
          sentAt: email.sent_at,
          createdAt: email.created_at
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  })
);

/**
 * @swagger
 * /api/mail/templates:
 *   get:
 *     summary: Get available email templates
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email templates retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/templates',
  authenticate,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, name, subject, variables, created_at FROM email_templates ORDER BY name'
    );

    res.json({
      success: true,
      data: {
        templates: result.rows.map(template => ({
          id: template.id,
          name: template.name,
          subject: template.subject,
          variables: template.variables,
          createdAt: template.created_at
        }))
      }
    });
  })
);

// Helper function to replace template variables
const replaceTemplateVariables = (template, data) => {
  if (!template || !data) return template;

  let result = template;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, data[key]);
  });

  return result;
};

module.exports = router;

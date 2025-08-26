import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/crypto'
import logger from '../src/utils/logger'

const prisma = new PrismaClient()

async function main() {
  logger.info('Starting database seed...')

  // Create admin user
  const adminPassword = await hashPassword('admin123!')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kozsd.edu' },
    update: {},
    create: {
      email: 'admin@kozsd.edu',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      isEduDomain: true,
      isVerified: true,
      isActive: true,
      settings: {
        create: {
          theme: 'auto',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          autoSave: true,
          signatureEnabled: true,
          signature: 'Best regards,\nKozSD Mail Admin'
        }
      }
    },
    include: {
      settings: true
    }
  })

  // Create demo user
  const demoPassword = await hashPassword('demo123!')
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: demoPassword,
      firstName: 'Demo',
      lastName: 'User',
      isEduDomain: false,
      isVerified: true,
      isActive: true,
      settings: {
        create: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: false,
          autoSave: true,
          signatureEnabled: false
        }
      }
    },
    include: {
      settings: true
    }
  })

  // Create edu user
  const eduPassword = await hashPassword('edu123!')
  const eduUser = await prisma.user.upsert({
    where: { email: 'student@university.edu' },
    update: {},
    create: {
      email: 'student@university.edu',
      passwordHash: eduPassword,
      firstName: 'Student',
      lastName: 'User',
      isEduDomain: true,
      isVerified: true,
      isActive: true,
      settings: {
        create: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          autoSave: true,
          signatureEnabled: true,
          signature: 'Sent from KozSD Mail\n- Student at University'
        }
      }
    },
    include: {
      settings: true
    }
  })

  // Create sample emails
  const welcomeEmail = await prisma.email.create({
    data: {
      messageId: 'welcome-001',
      fromUserId: adminUser.id,
      subject: 'Welcome to KozSD Mail Service!',
      bodyText: `Dear ${demoUser.firstName},

Welcome to KozSD Mail Service! We're excited to have you join our community of users who value secure, modern email communication.

Your account has been successfully created and verified. Here are some key features you can explore:

🔒 Security First
- End-to-end encryption for sensitive emails
- Secure authentication with JWT tokens
- Rate limiting to prevent abuse

🎨 Modern Design
- Beautiful Frutiger Aero interface
- Dark/light mode support
- Responsive design for all devices

📧 Email Management
- Organized folders (Inbox, Sent, Drafts, Spam, Trash)
- File attachments up to 25MB
- Smart search and filtering

🎓 Educational Focus
- Enhanced features for .edu domain users
- Higher rate limits for educational institutions
- Priority support for academic users

To get started, try composing your first email or exploring the settings to customize your experience.

If you have any questions, don't hesitate to reach out to our support team.

Best regards,
The KozSD Mail Team`,
      bodyHtml: null,
      folder: 'sent',
      sentAt: new Date(),
      recipients: {
        create: {
          email: demoUser.email,
          name: `${demoUser.firstName} ${demoUser.lastName}`,
          type: 'to',
          userId: demoUser.id
        }
      }
    }
  })

  // Create a draft email
  const draftEmail = await prisma.email.create({
    data: {
      messageId: 'draft-001',
      fromUserId: demoUser.id,
      subject: 'Meeting Notes - Q4 Planning',
      bodyText: `Hi team,

Here are the notes from our Q4 planning meeting:

1. Feature priorities
2. Timeline adjustments
3. Resource allocation

[Notes in progress...]`,
      folder: 'drafts',
      sentAt: new Date(),
      recipients: {
        create: {
          email: 'team@example.com',
          name: 'Team',
          type: 'to'
        }
      }
    }
  })

  // Create sample email templates
  await prisma.emailTemplate.createMany({
    data: [
      {
        name: 'Welcome Email',
        subject: 'Welcome to KozSD Mail Service!',
        bodyText: 'Welcome to our email service. We hope you enjoy using it!',
        bodyHtml: '<h1>Welcome!</h1><p>Welcome to our email service. We hope you enjoy using it!</p>',
        isSystem: true
      },
      {
        name: 'Password Reset',
        subject: 'Password Reset Request',
        bodyText: 'You requested a password reset. Click the link below to reset your password.',
        bodyHtml: '<p>You requested a password reset. <a href="#">Click here</a> to reset your password.</p>',
        isSystem: true
      },
      {
        name: 'Account Verification',
        subject: 'Please verify your email address',
        bodyText: 'Please verify your email address by clicking the link below.',
        bodyHtml: '<p>Please <a href="#">verify your email address</a> to complete registration.</p>',
        isSystem: true
      }
    ]
  })

  logger.info('Database seed completed successfully!')
  logger.info(`Created users:`)
  logger.info(`- Admin: ${adminUser.email}`)
  logger.info(`- Demo: ${demoUser.email}`)
  logger.info(`- Edu: ${eduUser.email}`)
  logger.info(`Created ${1} welcome email and ${1} draft email`)
  logger.info(`Created ${3} email templates`)
}

main()
  .catch((e) => {
    logger.error('Error during database seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
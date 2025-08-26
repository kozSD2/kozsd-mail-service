# 📧 KozSD Mail Service

> Comprehensive Email Platform with Frutiger Aero Design, Educational Focus, and Advanced Security Features

[![CI/CD Pipeline](https://github.com/kozSD2/kozsd-mail-service/actions/workflows/ci.yml/badge.svg)](https://github.com/kozSD2/kozsd-mail-service/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-blue)](https://www.typescriptlang.org/)

## 🌟 Features

### 🔐 Security & Privacy
- **End-to-End Encryption**: AES-256 encryption for all email content
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Rate Limiting**: Smart rate limiting with higher limits for .edu domains
- **GDPR Compliance**: Privacy-focused logging and data handling
- **Field-Level Encryption**: Database-level encryption for sensitive data

### 🎨 Modern Design
- **Frutiger Aero Theme**: Nature-inspired design with glassmorphism effects
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Responsive Design**: Mobile-first approach with PWA capabilities
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions

### 📚 Educational Focus
- **Educational Domain Verification**: Special features for .edu domains
- **Higher Sending Limits**: 200 emails/hour for verified educational users
- **Academic Tools**: Calendar integration and research collaboration features
- **Student Verification**: Streamlined verification process for educational institutions

### ⚡ Performance & Reliability
- **PWA Support**: Offline capabilities and app-like experience
- **Real-time Updates**: Socket.io powered live notifications
- **Caching Strategy**: Redis-powered caching for optimal performance
- **Scalable Architecture**: Microservices-ready design

## 🏗️ Project Structure

```
kozsd-mail-service/
├── 📁 frontend/           # React.js PWA with TypeScript
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # State management
│   │   ├── styles/        # TailwindCSS configuration
│   │   └── utils/         # Helper functions
│   └── public/
│       └── manifest.json  # PWA manifest
├── 📁 backend/            # Node.js API with Express
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── entities/       # TypeORM entities
│   │   ├── middleware/     # Authentication, rate limiting
│   │   ├── routes/         # API route definitions
│   │   └── utils/          # Encryption & utilities
├── 📁 admin/              # Admin panel
├── 📁 shared/             # Shared types and utilities
├── 📁 docs/               # Documentation
├── 📁 deployment/         # AWS deployment configs
├── 🐳 docker-compose.yml  # Local development setup
└── 📁 .github/workflows/  # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** & **Docker Compose** (for local development)

### 1. Clone the Repository
```bash
git clone https://github.com/kozSD2/kozsd-mail-service.git
cd kozsd-mail-service
```

### 2. Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

### 3. Install Dependencies
```bash
# Install all dependencies
npm run install:all
```

### 4. Start Development Environment
```bash
# Start with Docker (recommended)
npm run docker:up

# Or start manually
npm run dev
```

### 5. Access the Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:3002
- **API Documentation**: http://localhost:3001/api-docs

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** with custom Frutiger Aero theme
- **Framer Motion** for animations
- **React Query** for state management
- **React Hook Form** with Yup validation
- **PWA** with service workers

### Backend
- **Node.js** with Express.js and TypeScript
- **TypeORM** with PostgreSQL
- **Redis** for caching and rate limiting
- **JWT** with RS256 algorithm
- **Socket.io** for real-time features
- **Winston** for structured logging

### Security
- **AES-256 encryption** for data at rest
- **bcrypt** for password hashing
- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** with Redis store

### DevOps
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **AWS** deployment ready
- **TypeORM** database migrations
- **ESLint** & **Prettier** for code quality

## 📖 API Documentation

### Authentication Endpoints
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/refresh     # Token refresh
POST /api/auth/logout      # User logout
```

### Email Endpoints
```
GET    /api/emails         # Get user emails
GET    /api/emails/:id     # Get specific email
POST   /api/emails         # Send email
PATCH  /api/emails/:id     # Update email (star/read)
DELETE /api/emails/:id     # Delete email
```

### User Endpoints
```
GET /api/users/profile     # Get user profile
GET /api/users/folders     # Get user folders
GET /api/users/stats       # Get user statistics
```

### Admin Endpoints
```
GET /api/admin/stats          # System statistics
GET /api/admin/users          # User management
GET /api/admin/activity       # Activity logs
GET /api/admin/login-attempts # Security monitoring
```

## 🔒 Security Features

### Data Encryption
- **Field-level encryption** for emails and sensitive data
- **AES-256-GCM** encryption algorithm
- **Key rotation** support
- **Encrypted file attachments**

### Authentication & Authorization
- **JWT tokens** with short expiration
- **Refresh token** rotation
- **Role-based access control**
- **Session management**

### Rate Limiting
- **50 emails/hour** for regular users
- **200 emails/hour** for verified .edu users
- **API rate limiting** per IP address
- **Authentication attempt limiting**

### Monitoring & Logging
- **Structured logging** with Winston
- **Activity tracking** for user actions
- **Security incident logging**
- **GDPR-compliant** data handling

## 🎨 Design System

### Frutiger Aero Theme
- **Primary Colors**: Green spectrum (#22c55e family)
- **Secondary Colors**: Yellow spectrum (#facc15 family)
- **Accent Colors**: Blue spectrum (#0ea5e9 family)

### Components
- **Glassmorphism** effects with backdrop blur
- **Smooth animations** with Framer Motion
- **Responsive design** with mobile-first approach
- **Accessibility** features throughout

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run with coverage
npm test -- --coverage
```

## 📦 Deployment

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### AWS Deployment
```bash
# Deploy to AWS
cd deployment/aws
terraform init
terraform apply
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Frutiger Aero** design inspiration
- **FreeBSD Beastie** color palette
- **Educational institutions** for feedback and requirements
- **Open source community** for amazing tools and libraries

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/kozSD2/kozsd-mail-service/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kozSD2/kozsd-mail-service/discussions)

---

<div align="center">
  <p>Made with ❤️ for the KozSD community</p>
  <p>🌱 Eco-friendly • 🔒 Secure • 🎓 Educational</p>
</div>

# KozSD Mail Service

> Comprehensive Email Platform with Frutiger Aero Design, Educational Focus, and Advanced Security Features

## 🚀 Features

### 📧 Core Email Features
- **Modern Email Management**: Full-featured inbox, sent, drafts, spam, and trash folders
- **Rich Text Editor**: Advanced compose interface with formatting options
- **File Attachments**: Support for multiple file types with MinIO storage
- **Email Encryption**: AES-256 encryption for sensitive communications
- **Real-time Updates**: Live email notifications and updates

### 🎨 Design & User Experience
- **Frutiger Aero Design**: Modern glassmorphism and aurora gradient aesthetics
- **Progressive Web App**: Offline support, push notifications, and mobile-first design
- **Dark/Light Mode**: Adaptive themes for optimal viewing experience
- **Responsive Design**: Seamless experience across all devices
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions

### 🔐 Security & Authentication
- **JWT Authentication**: Secure access and refresh token system
- **Educational Focus**: Enhanced features for .edu domain users
- **Rate Limiting**: Smart throttling (50/hr normal, 200/hr .edu domains)
- **Input Validation**: Comprehensive data sanitization and validation
- **Security Headers**: Helmet.js and CORS protection

### 🏗️ Architecture
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis for session management and performance
- **Storage**: MinIO for file attachments
- **Admin Panel**: Separate dashboard for system management

## 📁 Project Structure

```
kozsd-mail-service/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── app.ts           # Main application
│   ├── prisma/              # Database schema and migrations
│   └── package.json
├── frontend/                # React PWA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── styles/          # Global styles and themes
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main app component
│   ├── public/              # Static assets
│   └── package.json
├── admin/                   # Admin dashboard
│   ├── src/
│   │   ├── components/      # Admin components
│   │   ├── pages/           # Admin pages
│   │   └── App.tsx          # Admin app
│   └── package.json
├── shared/                  # Shared types and utilities
│   ├── src/
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Shared utilities
│   └── package.json
├── docker-compose.yml       # Docker orchestration
└── package.json             # Root package configuration
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Storage**: MinIO
- **Authentication**: JWT
- **Security**: bcrypt, Helmet.js, CORS
- **Validation**: Joi/Zod

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: Custom components with Frutiger Aero design
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **State Management**: Context API + useReducer
- **PWA**: Workbox
- **Styling**: CSS Modules + PostCSS

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Development**: Hot reload, ESLint, Prettier
- **Testing**: Jest, React Testing Library
- **Monitoring**: Custom logging and analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)
- MinIO (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kozSD2/kozsd-mail-service.git
   cd kozsd-mail-service
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker**
   ```bash
   npm run docker:up
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database**
   ```bash
   npm run db:seed
   ```

7. **Start development servers**
   ```bash
   npm run dev
   ```

### Access Points
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **Backend API**: http://localhost:3002
- **Database Studio**: http://localhost:5555
- **MinIO Console**: http://localhost:9001

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Email Endpoints
- `GET /api/emails` - Get emails (inbox, sent, drafts, etc.)
- `POST /api/emails` - Send new email
- `GET /api/emails/:id` - Get specific email
- `PUT /api/emails/:id` - Update email (mark as read, move to folder)
- `DELETE /api/emails/:id` - Delete email

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings

## 🎨 Design System

### Color Palette
- **Primary Green**: #22c55e (success, nature, growth)
- **Secondary Yellow**: #facc15 (energy, creativity, attention)
- **Accent Blue**: #0ea5e9 (trust, technology, communication)

### Frutiger Aero Elements
- **Glassmorphism**: Translucent panels with backdrop blur
- **Aurora Gradients**: Dynamic color transitions
- **Nature Motifs**: Organic shapes and patterns
- **Clean Typography**: Sans-serif fonts with optimal readability
- **Spatial Depth**: Layered interfaces with subtle shadows

## 🔧 Development

### Available Scripts
- `npm run dev` - Start all development servers
- `npm run build` - Build all projects for production
- `npm run test` - Run all tests
- `npm run lint` - Lint all projects
- `npm run lint:fix` - Fix linting issues
- `npm run docker:up` - Start Docker services
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Code Quality
- **ESLint**: Consistent code style and error detection
- **Prettier**: Automatic code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for quality assurance
- **Jest**: Unit and integration testing

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run docker:build
```

### Environment Configuration
- Development: `.env.development`
- Production: `.env.production`
- Testing: `.env.test`

### CI/CD Pipeline
- Automated testing on pull requests
- Docker image building and pushing
- Deployment to staging and production environments

## 📈 Performance Features

### Optimization
- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Image Optimization**: WebP format with fallbacks
- **Caching**: Redis for sessions and frequently accessed data
- **Database Indexing**: Optimized queries for email operations
- **CDN Ready**: Static asset optimization

### Monitoring
- **Real-time Analytics**: Email usage and performance metrics
- **Error Tracking**: Comprehensive error logging and reporting
- **Performance Monitoring**: Response times and resource usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Frutiger Aero design inspiration from early 2000s digital aesthetics
- Educational email platform concepts from modern university systems
- Security best practices from OWASP guidelines
- Performance optimization techniques from React and Node.js communities

---

**KozSD Mail Service** - Bridging the gap between modern email functionality and nostalgic design aesthetics while maintaining educational focus and enterprise-grade security.

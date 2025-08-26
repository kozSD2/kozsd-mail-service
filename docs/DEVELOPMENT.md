# 🚀 Development Guide

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose
- PostgreSQL (if running locally)
- Redis (if running locally)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kozSD2/kozsd-mail-service.git
   cd kozsd-mail-service
   ```

2. **Copy environment files**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**
   ```bash
   npm run install:all
   ```

### Running the Application

#### Option 1: Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option 2: Manual Setup
```bash
# Terminal 1: Start database services
docker-compose up postgres redis minio

# Terminal 2: Start backend
cd backend && npm run dev

# Terminal 3: Start frontend
cd frontend && npm start

# Terminal 4: Start admin panel
cd admin && npm start
```

## Development Workflow

### Code Quality
```bash
# Lint all projects
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
cd frontend && npm run format
```

### Database Management
```bash
# Generate Prisma client
cd backend && npx prisma generate

# Run migrations
cd backend && npx prisma migrate dev

# Reset database
cd backend && npx prisma migrate reset

# Open Prisma Studio
cd backend && npx prisma studio
```

### Testing
```bash
# Run all tests
npm test

# Run specific project tests
npm run test:backend
npm run test:frontend

# Watch mode
cd backend && npm run test:watch
```

## Project Structure Deep Dive

### Backend Architecture
```
backend/src/
├── app.ts              # Express app setup
├── controllers/        # Route handlers
├── middleware/         # Custom middleware
├── models/            # Prisma models
├── routes/            # API routes
├── services/          # Business logic
└── utils/             # Helper functions
```

### Frontend Architecture
```
frontend/src/
├── App.tsx            # Main app component
├── components/        # Reusable components
├── pages/             # Page components
├── hooks/             # Custom hooks
├── store/             # State management
├── styles/            # Styling
└── utils/             # Helper functions
```

## API Development

### Adding New Endpoints
1. Define route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add business logic in `backend/src/services/`
4. Update Prisma schema if needed
5. Write tests

### Authentication
- All protected routes use `authenticateToken` middleware
- Admin routes require `requireAdmin` middleware
- Rate limiting applied per endpoint

## Frontend Development

### Component Guidelines
- Use TypeScript for all components
- Follow the Frutiger Aero design system
- Implement responsive design
- Add animations with Framer Motion

### State Management
- Use React Context for global state
- React Query for server state
- Local state with useState/useReducer

### Styling
- TailwindCSS with custom Frutiger Aero theme
- Glassmorphism effects with `.glass` utilities
- Dark/light mode support
- Mobile-first responsive design

## Security Considerations

### Encryption
- All sensitive data encrypted with AES-256
- Passwords hashed with bcrypt
- JWT tokens with short expiration

### Rate Limiting
- API endpoints rate limited
- Email sending limits based on user type
- Authentication attempt limiting

### Input Validation
- Server-side validation with express-validator
- Client-side validation with React Hook Form + Yup
- SQL injection prevention with Prisma

## Deployment

### Environment Variables
Set these in production:
```bash
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# JWT Secrets (generate strong secrets)
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."

# Encryption (32-byte key)
AES_ENCRYPTION_KEY="..."

# AWS (for production)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Frontend: 3000
   - Backend: 3001
   - Admin: 3002
   - PostgreSQL: 5432
   - Redis: 6379

2. **Database connection issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Reset database
   cd backend && npx prisma migrate reset
   ```

3. **Node modules issues**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debugging

1. **Backend debugging**
   ```bash
   # Enable debug logs
   export LOG_LEVEL=debug
   cd backend && npm run dev
   ```

2. **Frontend debugging**
   - Use React Developer Tools
   - Check network tab for API calls
   - Use React Query DevTools

### Performance Monitoring

- Monitor API response times
- Check database query performance
- Use React Profiler for frontend performance

## Contributing Guidelines

1. Create feature branch from `develop`
2. Follow TypeScript strict mode
3. Write tests for new features
4. Update documentation
5. Ensure all checks pass in CI/CD
6. Create detailed pull request

### Code Style
- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for functions

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```
# KozSD Mail Service

**Comprehensive Email Platform with Production-Ready Features**

A modern, scalable email service platform built with Node.js, featuring comprehensive monitoring, testing, documentation, and deployment capabilities.

## 🚀 Features

### Core Functionality
- **RESTful API** for email operations (send, history, templates)
- **User Authentication** with JWT tokens
- **Email Templates** with variable substitution
- **Bulk Email** sending capabilities
- **Email History** tracking and status monitoring

### Production-Ready Enhancements
- **Comprehensive Monitoring** with Prometheus metrics
- **Structured Logging** with Winston
- **Health Check Endpoints** for Kubernetes deployments
- **Redis Caching** for performance optimization
- **Database Connection Pooling** with PostgreSQL
- **Rate Limiting** and security middleware
- **Graceful Shutdown** handling

### Development & Testing
- **Jest Testing Framework** with >80% coverage target
- **ESLint & Prettier** for code quality
- **API Documentation** with Swagger/OpenAPI
- **Docker & Docker Compose** for local development
- **GitHub Actions** CI/CD pipeline

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 12.x or higher
- Redis 6.x or higher
- Docker & Docker Compose (for containerized setup)

## 🛠️ Installation

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/kozSD2/kozsd-mail-service.git
   cd kozsd-mail-service
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the services**
   - API: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)

### Manual Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE kozsd_mail_db;
   CREATE USER kozsd_user WITH PASSWORD 'kozsd_password';
   GRANT ALL PRIVILEGES ON DATABASE kozsd_mail_db TO kozsd_user;
   ```

3. **Set up Redis**
   ```bash
   redis-server
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and email credentials
   ```

5. **Start the application**
   ```bash
   npm start
   ```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Linting and Code Quality
```bash
npm run lint
npm run lint:fix
```

## 📖 API Documentation

### Interactive API Explorer
Visit `http://localhost:3000/api-docs` for the Swagger UI interface.

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Email Endpoints

#### Send Email
```http
POST /api/mail/send
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "body": "Hello World!",
  "htmlBody": "<h1>Hello World!</h1>"
}
```

#### Get Email History
```http
GET /api/mail/history?page=1&limit=20&status=sent
Authorization: Bearer <jwt_token>
```

### Health Check Endpoints

#### General Health Check
```http
GET /api/health
```

#### Kubernetes Liveness Probe
```http
GET /api/health/liveness
```

#### Kubernetes Readiness Probe
```http
GET /api/health/readiness
```

## 📊 Monitoring & Metrics

### Prometheus Metrics
Access metrics at `http://localhost:3000/metrics`

**Available Metrics:**
- `kozsd_mail_service_http_requests_total` - Total HTTP requests
- `kozsd_mail_service_http_request_duration_seconds` - Request duration histogram
- `kozsd_mail_service_emails_sent_total` - Total emails sent
- `kozsd_mail_service_active_connections` - Active connections
- `kozsd_mail_service_database_connections` - Database connections
- `kozsd_mail_service_redis_operations_total` - Redis operations

### Grafana Dashboard
1. Access Grafana at `http://localhost:3001`
2. Login with `admin/admin`
3. Import dashboards from the `/monitoring` directory

### Logging
Structured logs are available in:
- Console output (development)
- `./logs/app-YYYY-MM-DD.log` (production)
- `./logs/exceptions.log` (unhandled exceptions)
- `./logs/rejections.log` (unhandled promise rejections)

## 🐳 Docker Deployment

### Production Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
EXPOSE 3000
CMD ["node", "src/server.js"]
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `LOG_LEVEL` | Logging level | `info` |

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **CORS** configuration
- **JWT authentication** with secure tokens
- **Password hashing** with bcrypt
- **Input validation** with Joi and express-validator
- **SQL injection protection** with parameterized queries

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build
```

## 📈 Performance Optimization

- **Database connection pooling** with configurable limits
- **Redis caching** for frequently accessed data
- **Compression middleware** for response optimization
- **Graceful shutdown** for zero-downtime deployments
- **Health checks** for load balancer integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Maintain >80% test coverage
- Follow ESLint and Prettier configurations
- Add appropriate logging for new features
- Update API documentation for new endpoints

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@kozsd.com or create an issue in the GitHub repository.

## 🔗 Links

- [API Documentation](http://localhost:3000/api-docs)
- [Prometheus Metrics](http://localhost:3000/metrics)
- [Health Status](http://localhost:3000/api/health)
- [GitHub Repository](https://github.com/kozSD2/kozsd-mail-service)

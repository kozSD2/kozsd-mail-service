#!/bin/bash

# Local development setup script for KozSD Mail Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛠️  KozSD Mail Service - Local Development Setup${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📄 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env file with your SMTP credentials${NC}"
fi

# Create logs directory
mkdir -p logs

# Build and start services
echo -e "${YELLOW}🏗️  Building and starting services...${NC}"
docker-compose up -d --build

echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 15

# Check if services are running
echo -e "${YELLOW}📊 Checking service status...${NC}"
docker-compose ps

# Test database connection
echo -e "${YELLOW}🐘 Testing PostgreSQL connection...${NC}"
if docker-compose exec -T postgres pg_isready -U kozsd_user -d kozsd_mail_db; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
fi

# Test Redis connection
echo -e "${YELLOW}📦 Testing Redis connection...${NC}"
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${RED}❌ Redis is not ready${NC}"
fi

# Wait a bit more for the app to start
sleep 10

# Test application health
echo -e "${YELLOW}🏥 Testing application health...${NC}"
if curl -f http://localhost:3000/api/health/liveness &> /dev/null; then
    echo -e "${GREEN}✅ Application is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Application may still be starting...${NC}"
fi

echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo -e "${BLUE}Available services:${NC}"
echo -e "  - Mail Service API: http://localhost:3000"
echo -e "  - API Documentation: http://localhost:3000/api-docs"
echo -e "  - Prometheus Metrics: http://localhost:3000/metrics"
echo -e "  - Prometheus UI: http://localhost:9090"
echo -e "  - Grafana: http://localhost:3001 (admin/admin)"

echo -e "${BLUE}Useful commands:${NC}"
echo -e "  - View logs: docker-compose logs -f"
echo -e "  - Stop services: docker-compose down"
echo -e "  - Restart app: docker-compose restart app"
echo -e "  - Run tests: npm test"
echo -e "  - Check coverage: npm run test:coverage"

echo -e "${YELLOW}📝 Don't forget to update your .env file with real SMTP credentials!${NC}"
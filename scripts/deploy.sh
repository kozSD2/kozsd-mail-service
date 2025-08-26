#!/bin/bash

# KozSD Mail Service Deployment Script
# This script deploys the mail service to a Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="kozsd-mail-service"
IMAGE_NAME="ghcr.io/kozsd2/kozsd-mail-service"
IMAGE_TAG="${1:-latest}"
KUBE_CONTEXT="${KUBE_CONTEXT:-default}"

echo -e "${BLUE}🚀 KozSD Mail Service Deployment Script${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if we can connect to the cluster
echo -e "${YELLOW}📡 Checking Kubernetes cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    echo -e "${YELLOW}Please check your kubeconfig and cluster connection${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected to Kubernetes cluster${NC}"
kubectl cluster-info

# Function to wait for deployment
wait_for_deployment() {
    local deployment_name=$1
    local namespace=$2
    
    echo -e "${YELLOW}⏳ Waiting for deployment ${deployment_name} to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment/${deployment_name} -n ${namespace}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment ${deployment_name} is ready${NC}"
    else
        echo -e "${RED}❌ Deployment ${deployment_name} failed to become ready${NC}"
        exit 1
    fi
}

# Create namespace if it doesn't exist
echo -e "${YELLOW}🏗️  Creating namespace ${NAMESPACE}...${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Deploy PostgreSQL
echo -e "${YELLOW}🐘 Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/postgres.yaml
wait_for_deployment "postgres" ${NAMESPACE}

# Deploy Redis
echo -e "${YELLOW}📦 Deploying Redis...${NC}"
kubectl apply -f k8s/redis.yaml
wait_for_deployment "redis" ${NAMESPACE}

# Update image tag in deployment
echo -e "${YELLOW}🔄 Updating image tag to ${IMAGE_TAG}...${NC}"
sed "s|image: ${IMAGE_NAME}:latest|image: ${IMAGE_NAME}:${IMAGE_TAG}|g" k8s/deployment.yaml | kubectl apply -f -

# Wait for main application deployment
wait_for_deployment "kozsd-mail-service" ${NAMESPACE}

# Apply monitoring configuration
echo -e "${YELLOW}📊 Deploying monitoring configuration...${NC}"
kubectl apply -f k8s/monitoring.yaml

# Get service information
echo -e "${YELLOW}📋 Service Information:${NC}"
kubectl get services -n ${NAMESPACE}

# Get pod status
echo -e "${YELLOW}📦 Pod Status:${NC}"
kubectl get pods -n ${NAMESPACE}

# Check application health
echo -e "${YELLOW}🏥 Checking application health...${NC}"
sleep 10

# Port forward to test health check (in background)
kubectl port-forward service/kozsd-mail-service 8080:3000 -n ${NAMESPACE} &
PORT_FORWARD_PID=$!
sleep 5

# Test health endpoint
if curl -f http://localhost:8080/api/health/liveness &> /dev/null; then
    echo -e "${GREEN}✅ Application health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed, but deployment may still be starting${NC}"
fi

# Kill port forward
kill $PORT_FORWARD_PID 2>/dev/null || true

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}Application endpoints:${NC}"
echo -e "  - Health: /api/health"
echo -e "  - API Docs: /api-docs"
echo -e "  - Metrics: /metrics"

echo -e "${BLUE}To access the application:${NC}"
echo -e "  kubectl port-forward service/kozsd-mail-service 3000:3000 -n ${NAMESPACE}"

echo -e "${BLUE}To check logs:${NC}"
echo -e "  kubectl logs -f deployment/kozsd-mail-service -n ${NAMESPACE}"

echo -e "${BLUE}To monitor the application:${NC}"
echo -e "  kubectl get pods -n ${NAMESPACE} --watch"
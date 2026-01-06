#!/bin/bash

# RadioCalico Production Deployment Script
# This script builds and deploys the RadioCalico application in production mode

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}RadioCalico Production Deployment${NC}"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not available${NC}"
    echo "Please install Docker Compose or update Docker to a version that includes it"
    exit 1
fi

# Change to project directory
cd "$PROJECT_DIR"

echo "Step 1: Stopping existing containers..."
docker compose -f docker-compose.production.yml down || true

echo ""
echo "Step 2: Building production image..."
docker compose -f docker-compose.production.yml build --no-cache

echo ""
echo "Step 3: Starting production container..."
docker compose -f docker-compose.production.yml up -d

echo ""
echo "Step 4: Waiting for container to be healthy..."
sleep 5

# Wait for health check (max 60 seconds)
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if docker inspect --format='{{.State.Health.Status}}' radiocalico-production 2>/dev/null | grep -q "healthy"; then
        echo -e "${GREEN}Container is healthy!${NC}"
        break
    elif docker inspect --format='{{.State.Health.Status}}' radiocalico-production 2>/dev/null | grep -q "unhealthy"; then
        echo -e "${RED}Container is unhealthy!${NC}"
        echo "Logs:"
        docker compose -f docker-compose.production.yml logs --tail=50
        exit 1
    fi

    if [ $((ELAPSED % 5)) -eq 0 ]; then
        echo "Waiting for health check... (${ELAPSED}s/${TIMEOUT}s)"
    fi

    sleep 1
    ELAPSED=$((ELAPSED + 1))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "${YELLOW}Warning: Health check timeout. Container may still be starting.${NC}"
    echo "Check status with: docker compose -f docker-compose.production.yml logs -f"
fi

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Container Status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "Application is running at: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f docker-compose.production.yml logs -f"
echo "  Stop app:      docker compose -f docker-compose.production.yml down"
echo "  Restart app:   docker compose -f docker-compose.production.yml restart"
echo "  Check status:  docker compose -f docker-compose.production.yml ps"
echo ""

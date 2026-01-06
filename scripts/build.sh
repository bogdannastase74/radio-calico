#!/bin/bash

# RadioCalico Production Build Script
# This script builds the production Docker image

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
IMAGE_NAME="radiocalico"
IMAGE_TAG="latest"
NO_CACHE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --tag TAG        Set image tag (default: latest)"
            echo "  --no-cache       Build without using cache"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}RadioCalico Production Image Build${NC}"
echo "======================================"
echo ""
echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Change to project directory
cd "$PROJECT_DIR"

echo "Building production image..."
echo ""

# Build the image
docker build \
    -f Dockerfile.production \
    -t "${IMAGE_NAME}:${IMAGE_TAG}" \
    $NO_CACHE \
    .

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo ""

# Show image details
echo "Image details:"
docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo "To run this image:"
echo "  docker run -d -p 3000:3000 -v radiocalico-data:/app/data ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "Or use docker-compose:"
echo "  docker compose -f docker-compose.production.yml up -d"
echo ""

#!/bin/bash

# Production deployment script
set -e

IMAGE_NAME="vkhangstack-blog-backoffice"
CONTAINER_NAME="vkhangstack-blog-backoffice-prod"
PORT=${1:-80}

echo "Deploying production environment..."

# Stop and remove existing container
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Build production image
echo "Building production image..."
docker build --target production -t $IMAGE_NAME:latest .

# Run production container
echo "Starting production container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:80 \
  --restart unless-stopped \
  $IMAGE_NAME:latest

echo "Production environment deployed!"
echo "Access the application at: http://localhost:$PORT"
echo "To see logs: docker logs -f $CONTAINER_NAME"
echo "To stop: docker stop $CONTAINER_NAME"

# Health check
echo "Performing health check..."
sleep 5
if curl -f http://localhost:$PORT/health >/dev/null 2>&1; then
  echo "✅ Health check passed!"
else
  echo "❌ Health check failed!"
  exit 1
fi

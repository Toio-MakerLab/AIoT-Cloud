#!/bin/bash

# Development script
set -e

IMAGE_NAME="shadcn-admin"
CONTAINER_NAME="shadcn-admin-dev"

echo "Starting development environment..."

# Stop and remove existing container
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Build development image
echo "Building development image..."
docker build --target development -t $IMAGE_NAME:dev .

# Run development container
echo "Starting development container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p 5173:5173 \
  -v "$(pwd)":/app \
  -v /app/node_modules \
  -e NODE_ENV=development \
  $IMAGE_NAME:dev

echo "Development environment started!"
echo "Access the application at: http://localhost:5173"
echo "To see logs: docker logs -f $CONTAINER_NAME"
echo "To stop: docker stop $CONTAINER_NAME"

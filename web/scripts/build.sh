#!/bin/bash

# Build and push Docker images
set -e

# Configuration
IMAGE_NAME="vkhangstack/vkhangstack-blog-backoffice"
REGISTRY="docker.io"  # Replace with your registry
TAG=${1:-latest}

echo "Building Docker images for $IMAGE_NAME:$TAG"

# Build production image
echo "Building production image..."
docker build --target production -t $IMAGE_NAME:$TAG .
docker build --target production -t $IMAGE_NAME:latest .

# Build development image
echo "Building development image..."
docker build --target development -t $IMAGE_NAME:dev .

echo "Images built successfully!"


# Optionally push to registry (uncomment if needed)
echo "Pushing to registry..."
docker login
docker tag $IMAGE_NAME:$TAG $REGISTRY/$IMAGE_NAME:$TAG
docker tag $IMAGE_NAME:latest $REGISTRY/$IMAGE_NAME:latest
# docker tag $IMAGE_NAME:dev $REGISTRY/$IMAGE_NAME:dev

docker push $REGISTRY/$IMAGE_NAME:$TAG
docker push $REGISTRY/$IMAGE_NAME:latest
# docker push $REGISTRY/$IMAGE_NAME:dev

echo "Images pushed to registry!"

echo "Done!"

# Multi-stage build for React application
# Stage 1: Build stage
FROM node:24-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10

# Set working directory
WORKDIR /app

# Copy package files (.npmrc contains pnpm 11 build-script and release-age settings)
COPY package.json pnpm-lock.yaml .npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# Stage 2: Production stage with Nginx
FROM nginx:alpine AS production

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy index.html and non-hashed files (always overwritten on deploy)
COPY --from=builder /app/dist/index.html /usr/share/nginx/html/index.html
COPY --from=builder /app/dist/assets /usr/share/nginx/html/assets
COPY --from=builder /app/dist/images /usr/share/nginx/html/images

# Stage new hashed assets separately — entrypoint merges them into the persistent volume
COPY --from=builder /app/dist/assets /app/assets-staging

# Copy custom nginx configuration and entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]

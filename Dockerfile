ARG NODE_VERSION=22-alpine

# ---- backend deps ----------------------------------------------------------
FROM node:${NODE_VERSION} AS backend-deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- backend build ----------------------------------------------------------
FROM backend-deps AS backend-build
COPY tsconfig.json tsconfig.build.json nest-cli.json ormconfig.ts .swcrc ./
COPY src ./src
RUN pnpm build:prod



# ---- frontend build ----------------------------------------------------------
FROM node:${NODE_VERSION} AS frontend-build
WORKDIR /app/web

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./

ARG VITE_APP_VERSION
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

RUN pnpm install --frozen-lockfile
COPY web/ ./
# Frontend and backend share an origin in the final image, so the API is reachable
# at a relative path. Overridable at runtime via dist-client/domain.json (see docker-entrypoint.sh).
ENV VITE_API_URL=/api
RUN pnpm build

# ---- production deps (backend, no devDependencies) --------------------------
FROM node:${NODE_VERSION} AS backend-prod-deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm pkg delete scripts.prepare
RUN pnpm install --frozen-lockfile --prod

# ---- runtime ------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=backend-prod-deps /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/dist-client ./dist-client
COPY package.json ./
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]

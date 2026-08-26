# Deployment Guide

## Docker image

The `Dockerfile` builds a single image containing both the NestJS backend and the
built React frontend. The backend serves the API (under `/api`) and the static
frontend from the same process, on a single port (`3000`).

Stages:

1. `backend-deps` / `backend-build` — installs backend deps, runs `nest build` → `dist/src/main.js` + `dist/i18n/`.
2. `frontend-build` — installs `web/` deps, runs `vite build` → `dist-client/`. `VITE_API_URL` is baked to the relative path `/api` so the bundle always calls same-origin, regardless of host/port.
3. `backend-prod-deps` — production-only backend deps (no devDependencies).
4. `runtime` — copies `node_modules`, `dist`, `dist-client` into a minimal image, sets `ENTRYPOINT docker-entrypoint.sh`, `EXPOSE 3000`.

### Build

```bash
docker build -t aiot-lab-service:latest .
```

### Build and push to Docker Hub

```bash
pnpm docker:build-push
# or: ./scripts/docker-build-push.sh
```

Builds and pushes `docker.io/vkhangstack/aiot-lab-service` for `linux/amd64`
and `linux/arm64`, tagged with the `package.json` version and `latest`.
Uses a dedicated `docker buildx` builder (created automatically on first run)
since multi-platform images require `buildx build --push` rather than a plain
`docker build` + `docker push`. Platforms are built one at a time and merged
into a single manifest afterward — building both concurrently runs the
non-native platform under QEMU emulation, and Vite/esbuild's memory use there
is high enough to exhaust the builder ("cannot allocate memory"). Reuses an
existing `docker login` session; for non-interactive/CI use, export
`DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (a Docker Hub access token) first.

### Run

The app reads its configuration strictly from environment variables (see
`.env.example` — every var must be set or `ApiConfigService` throws at startup).
Mount your local `.env` file read-only into the container rather than baking
secrets into the image:

```bash
docker run -d --name aiot-lab-service -p 3000:3000 \
  -v "$(pwd)/.env:/app/.env:ro" \
  -e DB_HOST=host.docker.internal \
  --add-host=host.docker.internal:host-gateway \
  aiot-lab-service:latest
```

Notes:
- `DB_HOST=host.docker.internal` + `--add-host` is only needed when Postgres runs on
  the host machine (e.g. local testing on macOS/Windows Docker Desktop). Point
  `DB_HOST` at your real database host in other environments.
- `.env` is read via `@nestjs/config`'s `ConfigModule` (`envFilePath: '.env'`), so the
  file must exist at `/app/.env` inside the container — hence the mount. Docker's own
  `-e`/`--env-file` flags also work since they populate `process.env` directly, but
  mounting keeps a single source of truth with local dev.
- At container start, `docker-entrypoint.sh` regenerates `dist-client/domain.json`
  from the current environment (`VITE_LOGTO_*` vars) before starting the server — this
  lets the same built frontend bundle be redeployed against different Logto configs
  without a rebuild. `VITE_API_URL` is intentionally left empty here so the frontend
  falls back to its build-time default (`/api`, same-origin).

### Verify

```bash
curl http://localhost:3000/api/health   # API
curl http://localhost:3000/             # frontend
curl http://localhost:3000/devices      # SPA deep-link fallback (client-side route)
```

## Required environment variables

Every variable read via `ApiConfigService`'s strict `get()`/`getString()`/`getBoolean()`
helpers must be present or the process crashes on boot. See `.env.example` for the
full list, including the MQTT (`MQTT_ENABLED`, `MQTT_URL`, ...) and Kafka
(`KAFKA_ENABLED`, `KAFKA_BROKERS`, ...) blocks — set `*_ENABLED=false` for any
transport you don't need, but the surrounding vars must still be defined.

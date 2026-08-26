#!/usr/bin/env bash
# Builds a multi-platform (linux/amd64, linux/arm64) API image and pushes it to
# Docker Hub, tagged with the package.json version and `latest`.
#
# Usage:
#   ./scripts/docker-build-push.sh
#
# Auth: if already `docker login`-ed, that session is reused. To log in
# non-interactively (e.g. CI), export DOCKERHUB_USERNAME and DOCKERHUB_TOKEN
# (a Docker Hub access token, not your password) before running this script.
#
# Multi-platform images can only be assembled by `docker buildx build --push`
# in one step (a plain `docker build` + `docker push` only produces a
# single-arch image for the host's own platform), so this uses a dedicated
# buildx builder with the `docker-container` driver.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

IMAGE="docker.io/vkhangstack/aiot-lab-service"
VERSION="$(node -p "require('./package.json').version")"
PLATFORMS="linux/amd64,linux/arm64"
BUILDER_NAME="aiot-lab-service-builder"

if [[ -n "${DOCKERHUB_USERNAME:-}" && -n "${DOCKERHUB_TOKEN:-}" ]]; then
  echo "${DOCKERHUB_TOKEN}" | docker login docker.io -u "${DOCKERHUB_USERNAME}" --password-stdin
fi

if ! docker buildx inspect "${BUILDER_NAME}" >/dev/null 2>&1; then
  docker buildx create --name "${BUILDER_NAME}" --driver docker-container --bootstrap
fi

echo "Building and pushing ${IMAGE}:${VERSION} for ${PLATFORMS}"
docker buildx build \
  --builder "${BUILDER_NAME}" \
  --platform "${PLATFORMS}" \
  -t "${IMAGE}:${VERSION}" \
  -t "${IMAGE}:latest" \
  --push \
  .

echo "Done: ${IMAGE}:${VERSION} and ${IMAGE}:latest for ${PLATFORMS}"

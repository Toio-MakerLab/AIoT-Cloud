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
# Platforms are built ONE AT A TIME rather than via a single
# `buildx build --platform amd64,arm64 --push` call: buildx builds all
# requested platforms concurrently, and the non-native platform runs under
# QEMU emulation. Vite/esbuild's memory use under emulation is high enough
# that building both at once can exhaust the builder's memory ("cannot
# allocate memory" / ResourceExhausted). Building sequentially keeps peak
# memory the same as a normal single-arch build; the two arch-specific images
# are then combined into one multi-arch manifest with `buildx imagetools`
# (no rebuild, just a manifest list referencing the already-pushed digests).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

IMAGE="vkhangstack/aiot-lab-service"
VERSION="$(node -p "require('./package.json').version")"
PLATFORMS=(linux/amd64)

if [[ -n "${DOCKERHUB_USERNAME:-}" && -n "${DOCKERHUB_TOKEN:-}" ]]; then
  echo "${DOCKERHUB_TOKEN}" | docker login docker.io -u "${DOCKERHUB_USERNAME}" --password-stdin
fi

docker build --platform "${PLATFORMS[*]}" \
  --build-arg VITE_APP_VERSION=${VERSION} \
  -t "${IMAGE}:${VERSION}" \
  -t "${IMAGE}:latest" \
  --push \
  .

echo "Done: ${IMAGE}:${VERSION} and ${IMAGE}:latest for ${PLATFORMS[*]}"

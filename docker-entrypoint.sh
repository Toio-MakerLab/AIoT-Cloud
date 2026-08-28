#!/bin/sh
set -e

# Generate dist-client/domain.json from runtime environment variables.
# The frontend fetches this file on startup so config can change between
# deployments without rebuilding the image. Empty values fall back to the
# build-time defaults baked into the bundle (see web/src/lib/domain-config.ts).
cat > /app/dist-client/domain.json << EOF
{
  "VITE_API_URL": "${VITE_API_URL:-}",
  "VITE_LOGTO_ENDPOINT": "${VITE_LOGTO_ENDPOINT:-}",
  "VITE_LOGTO_APP_ID": "${VITE_LOGTO_APP_ID:-}",
  "VITE_LOGTO_REDIRECT_URI": "${VITE_LOGTO_REDIRECT_URI:-}",
  "VITE_LOGTO_POST_LOGOUT_REDIRECT_URI": "${VITE_LOGTO_POST_LOGOUT_REDIRECT_URI:-}",
  "VITE_FIREBASE_API_KEY": "${VITE_FIREBASE_API_KEY:-}",
  "VITE_FIREBASE_AUTH_DOMAIN": "${VITE_FIREBASE_AUTH_DOMAIN:-}",
  "VITE_FIREBASE_PROJECT_ID": "${VITE_FIREBASE_PROJECT_ID:-}",
  "VITE_FIREBASE_STORAGE_BUCKET": "${VITE_FIREBASE_STORAGE_BUCKET:-}",
  "VITE_FIREBASE_MESSAGING_SENDER_ID": "${VITE_FIREBASE_MESSAGING_SENDER_ID:-}",
  "VITE_FIREBASE_APP_ID": "${VITE_FIREBASE_APP_ID:-}",
  "VITE_FIREBASE_VAPID_KEY": "${VITE_FIREBASE_VAPID_KEY:-}"
}
EOF

exec node dist/src/main.js

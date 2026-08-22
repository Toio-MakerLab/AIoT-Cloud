#!/bin/sh
set -e

# Merge new hashed assets into the persistent volume.
# Old chunks are never deleted — in-flight sessions can still load them.
# New index.html always references the latest chunks.
if [ -d /app/assets-staging ]; then
  cp -rn /app/assets-staging/. /usr/share/nginx/html/assets/
fi

# Generate /domain.json from runtime environment variables.
# The app fetches this file on startup so config can change between deployments
# without rebuilding the image. Empty values fall back to build-time defaults.
cat > /usr/share/nginx/html/domain.json << EOF
{
  "VITE_API_URL": "${VITE_API_URL:-}",
  "VITE_LOGTO_ENDPOINT": "${VITE_LOGTO_ENDPOINT:-}",
  "VITE_LOGTO_APP_ID": "${VITE_LOGTO_APP_ID:-}",
  "VITE_LOGTO_REDIRECT_URI": "${VITE_LOGTO_REDIRECT_URI:-}",
  "VITE_LOGTO_POST_LOGOUT_REDIRECT_URI": "${VITE_LOGTO_POST_LOGOUT_REDIRECT_URI:-}"
}
EOF

exec nginx -g "daemon off;"

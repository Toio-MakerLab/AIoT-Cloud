#!/bin/sh
# Removes stale hashed assets from the persistent volume.
# Keeps any file still referenced by the current index.html
# and any file newer than GRACE_HOURS (protect in-flight sessions).

ASSETS_DIR=${ASSETS_DIR:-/assets}
NGINX_URL=${NGINX_URL:-http://web-prod}
GRACE_HOURS=${GRACE_HOURS:-24}
GRACE_MINS=$((GRACE_HOURS * 60))

echo "[$(date)] Starting asset cleanup (grace=${GRACE_HOURS}h, url=${NGINX_URL})"

index_html=$(wget -qO- "${NGINX_URL}/index.html" 2>/dev/null)
if [ -z "$index_html" ]; then
  echo "[$(date)] ERROR: could not fetch ${NGINX_URL}/index.html — aborting"
  exit 1
fi

# Extract all asset basenames referenced in index.html (any file under /assets/)
referenced=$(printf '%s' "$index_html" | grep -oE '/assets/[^"'"'"'> ]+' | while read -r path; do basename "$path"; done | sort -u)

total=0
deleted=0
skipped_referenced=0
skipped_new=0

for file in "${ASSETS_DIR}"/*; do
  [ -f "$file" ] || continue
  total=$((total + 1))
  name=$(basename "$file")

  if printf '%s\n' "$referenced" | grep -qF "$name"; then
    skipped_referenced=$((skipped_referenced + 1))
    continue
  fi

  if find "$file" -mmin "-${GRACE_MINS}" | grep -q .; then
    skipped_new=$((skipped_new + 1))
    continue
  fi

  rm -f "$file"
  echo "  deleted: $name"
  deleted=$((deleted + 1))
done

echo "[$(date)] Done — total=${total} deleted=${deleted} kept_referenced=${skipped_referenced} kept_new=${skipped_new}"

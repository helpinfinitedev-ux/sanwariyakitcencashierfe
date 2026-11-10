#!/bin/sh
# Generates /env-config.js at container startup from the runtime environment,
# so the API URL can be set via the Cloud Run "Variables & Secrets" UI
# without rebuilding the image. Runs automatically via the nginx image's
# /docker-entrypoint.d mechanism before nginx starts.
set -eu

API_URL="${VITE_PUBLIC_API_URL:-${APP_API_URL:-}}"
OUT="/usr/share/nginx/html/env-config.js"

cat > "$OUT" <<EOF
window.__APP_CONFIG__ = { apiUrl: "${API_URL}" };
EOF

echo "env-config: apiUrl=\"${API_URL:-<empty, app will use fallback>}\""

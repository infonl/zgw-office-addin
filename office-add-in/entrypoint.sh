#!/bin/sh
#
# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
#
####
# This script is used to set up the environment for the Office Add-in.
# It will ensure that the manifest file and the useHttp.ts file are correctly configured
# for the environment they are deployed in.
#
# To test this script locally, you can use the entrypoint.test.sh script.

# Application version for metrics. This can be set via environment variable or defaults to 'unknown'.
# The dockerfile sets this variable during build time, and the CI build pipeline sets it to the determined version.
APP_VERSION="${APP_VERSION:-unknown}"
echo "Starting ZGW Office Add-in version $APP_VERSION"

####
# Optionally set the location to the NGINX public HTML directory, defaults to /usr/share/nginx/html.
NGINX_PUBLIC_HTML="${NGINX_PUBLIC_HTML:-/usr/share/nginx/html}"
# For testing purposes, you can set the NGINX config directory and templates directory.
NGINX_TEMPLATES_DIR="${NGINX_TEMPLATES_DIR:-/etc/nginx}"
NGINX_CONFIG_FILE="${NGINX_CONFIG_FILE:-/etc/nginx/conf.d/default.conf}"

####
# To ensure the manifest for the Office Add-in is correctly configured,
# we need to rewrite the URLs in the manifests manifest-office.xml and manifest-outlook.xml.

# Optionally set the frontend URL to use, defaults to https://localhost:3000.
FRONTEND_URL="${FRONTEND_URL:-https://localhost:3000}"
FRONTEND_API=$(echo "$FRONTEND_URL" | sed 's/https/api/' | sed 's/http/api/')
MANIFEST_OFFICE_FILE="$NGINX_PUBLIC_HTML/manifest-office.xml"
MANIFEST_OUTLOOK_FILE="$NGINX_PUBLIC_HTML/manifest-outlook.xml"

echo "Frontend URL is set to ${FRONTEND_URL}. Rewriting manifests."
for MANIFEST_FILE in "$MANIFEST_OFFICE_FILE" "$MANIFEST_OUTLOOK_FILE"; do
  [ -f "$MANIFEST_FILE" ] || continue
  sed -i -e "s|http://localhost:3000|$FRONTEND_URL|g" -e "s|http://www.contoso.com|$FRONTEND_URL|g" "$MANIFEST_FILE"
  sed -i -e "s|https://localhost:3000|$FRONTEND_URL|g" -e "s|https://www.contoso.com|$FRONTEND_URL|g" "$MANIFEST_FILE"
  sed -i -e "s|api://localhost:3000|$FRONTEND_API|g" "$MANIFEST_FILE"
done

####
# To ensure the Office Add-in frontend can communicate with the backend,
# we need to rewrite the URL in the useHttp.ts file to point to the correct
# backend service.

# Optionally set the backend public URL to use, defaults to /proxy on frontend host.
BACKEND_PUBLIC_URL="${FRONTEND_URL}/proxy"
ENABLE_HTTPS="${ENABLE_HTTPS:-false}"

echo "Backend URL is set to ${BACKEND_PUBLIC_URL}. Rewriting references."
find "$NGINX_PUBLIC_HTML" -type f -exec sed -i \
  -e "s|https\?://localhost:3003|$BACKEND_PUBLIC_URL|g" {} +

###
BACKEND_URL="${BACKEND_URL%/}"
# Create main NGINX config from template
echo "Creating NGINX config file at '$NGINX_CONFIG_FILE' from '$NGINX_TEMPLATES_DIR/nginx.conf.template'."
echo "Using backend URL: '$BACKEND_URL' to connect to backend service."
sed "s|__BACKEND_URL__|$BACKEND_URL|g" "$NGINX_TEMPLATES_DIR/nginx.conf.template" > "$NGINX_CONFIG_FILE"

# Optionally append HTTPS config (ie. for local testing)
if [ "$ENABLE_HTTPS" = "true" ]; then
  echo "Creating NGINX config file at '$NGINX_CONFIG_FILE' from '$NGINX_TEMPLATES_DIR/nginx.https.template'."
  sed "s|__BACKEND_URL__|$BACKEND_URL|g" "$NGINX_TEMPLATES_DIR/nginx.https.template" >> "$NGINX_CONFIG_FILE"
fi

# Set the maximum upload size to provided value or default to 80M
MAX_BODY_SIZE="${MAX_BODY_SIZE:-80M}"
echo "Setting maximum upload size to $MAX_BODY_SIZE."
sed -i -e "s|__MAX_BODY_SIZE__|$MAX_BODY_SIZE|g" "$NGINX_CONFIG_FILE"

###
# Create a static metrics.txt file to expose the current version of the application for prometheus scraping.
cat <<EOF > "$NGINX_PUBLIC_HTML/metrics.txt"
# HELP app_version Application version
# TYPE app_version gauge
app_version{version="$APP_VERSION"} 1
EOF

###
# Generate runtime environment configuration for frontend
# This allows the React app to read environment variables at runtime
FRONTEND_CONFIG_JSON="$NGINX_PUBLIC_HTML/config/env.json"
echo "Generating runtime environment configuration at '$FRONTEND_CONFIG_JSON'"
mkdir -p "$(dirname "$FRONTEND_CONFIG_JSON")"

cat <<EOF > "$FRONTEND_CONFIG_JSON"
{
  "APP_ENV": "${APP_ENV:-}",
  "MAX_BODY_SIZE": "${MAX_BODY_SIZE:-80M}",
  "MSAL_CLIENT_ID": "${MSAL_CLIENT_ID:-}",
  "MSAL_AUTHORITY": "${MSAL_AUTHORITY:-}",
  "MSAL_REDIRECT_URI": "${MSAL_REDIRECT_URI:-}",
  "MSAL_SCOPES": "${MSAL_SCOPES:-}"
}
EOF

echo "Runtime environment configuration generated successfully"
cat "$FRONTEND_CONFIG_JSON"

# Start nginx
exec nginx -g 'daemon off;'
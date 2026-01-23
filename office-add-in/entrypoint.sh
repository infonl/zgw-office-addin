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
# Application environment. The default is 'development', but can be overridden via environment variable.
APP_ENV="${APP_ENV:-development}"
echo "Starting $APP_ENV ZGW Office Add-in version $APP_VERSION"

####
# Optionally set the location to the NGINX public HTML directory, defaults to /usr/share/nginx/html.
NGINX_PUBLIC_HTML="${NGINX_PUBLIC_HTML:-/usr/share/nginx/html}"
# For testing purposes, you can set the NGINX config directory and templates directory.
NGINX_TEMPLATES_DIR="${NGINX_TEMPLATES_DIR:-/etc/nginx}"
NGINX_CONFIG_FILE="${NGINX_CONFIG_FILE:-/etc/nginx/conf.d/default.conf}"

####
# To ensure the manifest for the Office Add-in is correctly configured,
# we need to rewrite the URLs in the manifests manifest-office.xml and manifest-outlook.xml.

# These have to match exactly with the used values in the manifest files!
TO_REPLACE_CLIENT_ID="10000000-0001-1001-1001-100000000001"
TO_REPLACE_URL="localhost:3000"
TO_REPLACE_BACKEND_URL="localhost:3003"

# Validate that MSAL_OFFICE_CLIENT_ID is properly configured and not using the placeholder.
if [ -z "$MSAL_OFFICE_CLIENT_ID" ] || [ "$MSAL_OFFICE_CLIENT_ID" = "your-client-id" ]; then
  echo "Error: MSAL_OFFICE_CLIENT_ID environment variable must be set to a valid Azure AD application (client) ID." >&2
  exit 1
fi

# Validate that MSAL_OUTLOOK_CLIENT_ID is properly configured and not using the placeholder.
if [ -z "$MSAL_OUTLOOK_CLIENT_ID" ] || [ "$MSAL_OUTLOOK_CLIENT_ID" = "your-client-id" ]; then
  echo "Error: MSAL_OUTLOOK_CLIENT_ID environment variable must be set to a valid Azure AD application (client) ID." >&2
  exit 1
fi

# Optionally set the frontend URL to use, defaults to https://localhost:3000.
FRONTEND_URL="${FRONTEND_URL:-https://localhost:3000}"

## Office Add-in manifest replacements
MANIFEST_FILE="${NGINX_PUBLIC_HTML}/manifest-office.xml"
MSAL_CLIENT_ID="${MSAL_OFFICE_CLIENT_ID:-your-office-client-id}"
FRONTEND_API="$(echo "$FRONTEND_URL" | sed 's/https/api/' | sed 's/http/api/')/${MSAL_CLIENT_ID}"
echo "Update office manifest..."
sed -i -e "s|http://${TO_REPLACE_URL}|${FRONTEND_URL}|g" \
  -e "s|https://${TO_REPLACE_URL}|${FRONTEND_URL}|g" \
  -e "s|api://${TO_REPLACE_URL}/${TO_REPLACE_CLIENT_ID}|$FRONTEND_API|g" \
  -e "s|<Id>${TO_REPLACE_CLIENT_ID}</Id>|<Id>${MSAL_CLIENT_ID}</Id>|g" \
  "$MANIFEST_FILE"

# Outlook Add-in manifest replacements
MANIFEST_FILE="${NGINX_PUBLIC_HTML}/manifest-outlook.xml"
MSAL_CLIENT_ID="${MSAL_OUTLOOK_CLIENT_ID:-your-outlook-client-id}"
FRONTEND_API="$(echo "$FRONTEND_URL" | sed 's/https/api/' | sed 's/http/api/')/${MSAL_CLIENT_ID}"
echo "Update outlook manifest..."
sed -i -e "s|http://${TO_REPLACE_URL}|${FRONTEND_URL}|g" \
  -e "s|https://${TO_REPLACE_URL}|${FRONTEND_URL}|g" \
  -e "s|api://${TO_REPLACE_URL}/${TO_REPLACE_CLIENT_ID}|$FRONTEND_API|g" \
  -e "s|<Id>${TO_REPLACE_CLIENT_ID}</Id>|<Id>${MSAL_CLIENT_ID}</Id>|g" \
  "$MANIFEST_FILE"

####
# To ensure the Office Add-in frontend can communicate with the backend,
# we need to rewrite the URL in the useHttp.ts file to point to the correct
# backend service.

# The backend proxy URL is set to /proxy on frontend NGINX server.
BACKEND_PROXY_URL="${FRONTEND_URL}/proxy"
ENABLE_HTTPS="${ENABLE_HTTPS:-false}"

echo "Backend proxy URL is set to ${BACKEND_PROXY_URL} in files:"
FILES=$(find "$NGINX_PUBLIC_HTML" -type f -exec grep -l -E "$TO_REPLACE_BACKEND_URL" {} +)
for file in $FILES; do
  sed -i -e "s|http://${TO_REPLACE_BACKEND_URL}|${BACKEND_PROXY_URL}|g" \
    -e "s|https://${TO_REPLACE_BACKEND_URL}|${BACKEND_PROXY_URL}|g" \
    "$file"
  echo "$file"
done

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

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
# To test this script locally, you can run it with the following command (in the current directory):
# FRONTEND_URL="https://myfrontend.com" BACKEND_URL="https://mybackend.com" NGINX_PUBLIC_HTML="." ./entrypoint.sh
#
# Note that for testing on a Mac, you will have to replace `sed -i` with `sed -i ''`, per comment below.

####
# Optionally set the location to the NGINX public HTML directory, defaults to /usr/share/nginx/html.
NGINX_PUBLIC_HTML="${NGINX_PUBLIC_HTML:-/usr/share/nginx/html}"

####
# To ensure the manifest for the Office Add-in is correctly configured,
# we need to rewrite the URLs in the manifest.xml to align with the location
# that this file is available on.

# Optionally set the frontend URL to use, defaults to https://localhost:3000.
FRONTEND_URL="${FRONTEND_URL:-https://localhost:3000}"
FRONTEND_API=$(echo "$FRONTEND_URL" | sed 's/https/api/')
MANIFEST_FILE="$NGINX_PUBLIC_HTML/manifest.xml"

echo "Frontend URL is set to ${FRONTEND_URL}. Rewriting '$MANIFEST_FILE'."

# To test this command on a Mac, you will have to replace `sed -i` with `sed -i ''`.
sed -i -e "s|https://localhost:3000|$FRONTEND_URL|g" -e "s|api://localhost:3000|$FRONTEND_API|g" "$MANIFEST_FILE"

####
# To ensure the Office Add-in frontend can communicate with the backend,
# we need to rewrite the URL in the useHttp.ts file to point to the correct
# backend service.

# Optionally set the backend public URL to use, defaults to /proxy on frontend host.
BACKEND_PUBLIC_URL="${BACKEND_PUBLIC_URL:-${FRONTEND_URL}/proxy}"
ENABLE_HTTPS="${ENABLE_HTTPS:-false}"

echo "Backend URL is set to ${BACKEND_PUBLIC_URL}. Rewriting useHttp.ts."
find "$NGINX_PUBLIC_HTML" -type f \( -name "useHttp.ts" \) -exec sed -i \
  -e "s|http://localhost:3003|$BACKEND_PUBLIC_URL|g" {} +

# Create main config from template
sed "s|__BACKEND_URL__|$BACKEND_URL|g" /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Optionally append HTTPS config
if [ "$ENABLE_HTTPS" = "true" ]; then
  sed "s|__BACKEND_URL__|$BACKEND_URL|g" /etc/nginx/nginx.https.template >> /etc/nginx/conf.d/default.conf
fi

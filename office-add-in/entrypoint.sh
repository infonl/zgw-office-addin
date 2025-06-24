#!/bin/sh
#
# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
#

# Default to localhost if not set
FRONTEND_URL="${FRONTEND_URL:-https://localhost:3000}"

# Ensure the location is set correctly for the files being served
find /usr/share/nginx/html -type f -exec sed -i "s|https://localhost:3000|$FRONTEND_URL|g" {} +

# Start NGINX using regular entrypoint to not break available defaults and configuration 
/docker-entrypoint.sh nginx

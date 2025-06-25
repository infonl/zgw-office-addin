#!/bin/sh
#
# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
#

# Default to localhost if not set
FRONTEND_URL="${FRONTEND_URL:-https://localhost:3000}"

echo "Frontend URL is set to ${FRONTEND_URL}. Rewriting manifest"

# Ensure the location is set correctly for the files being served
find /usr/share/nginx/html -type f -exec sed -i -e "s|://localhost:3000|$FRONTEND_URL|g" -e "s|https://www.contoso.com|$FRONTEND_URL|g" {} +

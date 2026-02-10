# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

FROM nginx:1.29.5-alpine@sha256:1d13701a5f9f3fb01aaa88cef2344d65b6b5bf6b7d9fa4cf0dca557a8d7702ba

# Environment variable for application version, this should be supplied during build
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION:-unknown}

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the built frontend files
COPY ./dist/ /usr/share/nginx/html/
COPY --chmod=755 ./entrypoint.sh /docker-entrypoint.d/entrypoint.sh

# Copy nginx configuration
COPY ./nginx.conf.template /etc/nginx/
COPY ./nginx.https.template /etc/nginx/

EXPOSE 80

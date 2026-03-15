# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

FROM nginx:1.29.6-alpine@sha256:9a4a85e7006ced27ca077d759ffed671b8a094856703b0af15e2c28902800b1d

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

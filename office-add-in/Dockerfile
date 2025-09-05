# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

FROM nginx:1.29.3-alpine@sha256:b3c656d55d7ad751196f21b7fd2e8d4da9cb430e32f646adcf92441b72f82b14

# Environment variable for application version, this should be supplied during build
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION:-unknown}

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the built frontend files
COPY ./office-add-in/dist/ /usr/share/nginx/html/
COPY --chmod=755 ./office-add-in/entrypoint.sh /docker-entrypoint.d/entrypoint.sh

# Copy nginx configuration
COPY ./office-add-in/nginx.conf.template /etc/nginx/
COPY ./office-add-in/nginx.https.template /etc/nginx/

# Copy optional SSL certificates if they exist (likely for local development)
COPY ./office-add-in/ssl-certs/cert.pem /etc/nginx/cert.pem
COPY ./office-add-in/ssl-certs/key.pem /etc/nginx/key.pem

EXPOSE 80

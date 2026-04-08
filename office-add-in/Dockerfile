# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

FROM nginx:1.29.8-alpine@sha256:2c4de29ca0588f9b56ced6691e0c605c2fd00501478e2e12949ba062304bc1ca

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

EXPOSE 80

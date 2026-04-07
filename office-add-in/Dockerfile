# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

FROM nginx:1.29.7-alpine@sha256:e7257f1ef28ba17cf7c248cb8ccf6f0c6e0228ab9c315c152f9c203cd34cf6d1

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

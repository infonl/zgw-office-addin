# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

FROM nginx:1.29.1-alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the built frontend files
COPY ./office-add-in/dist/ /usr/share/nginx/html/
COPY --chmod=755 ./office-add-in/entrypoint.sh /docker-entrypoint.d/entrypoint.sh

# Copy nginx configuration
COPY ./office-add-in/nginx.conf.template /etc/nginx/
COPY ./office-add-in/nginx.https.template /etc/nginx/

EXPOSE 80

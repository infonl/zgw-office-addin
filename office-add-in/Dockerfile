# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

FROM nginxinc/nginx-unprivileged:1.30.4-alpine@sha256:44e36330f74d4f3a1d4e222acca9e23b401fb87811a7597024502bb759c4dd49

# Environment variable for application version, this should be supplied during build
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION:-unknown}

# Stage static files in /app/html; entrypoint.sh copies them to the writable
# /usr/share/nginx/html emptyDir volume at container startup
COPY ./dist/ /app/html/

# Copy entrypoint and nginx config templates
COPY --chmod=755 ./entrypoint.sh /docker-entrypoint.d/entrypoint.sh
COPY ./nginx.conf.template /etc/nginx/
COPY ./nginx.https.template /etc/nginx/

# Switch to UID > 10000 to avoid clashing with typical host UIDs (Snyk K8S-11)
USER root
RUN addgroup --system --gid 10001 nginxapp && \
    adduser --system --uid 10001 --ingroup nginxapp --no-create-home nginxapp && \
    # Remove nginx default pages so the server never serves branded content
    rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html && \
    chown -R nginxapp:nginxapp /app && \
    chown -R nginxapp:nginxapp /usr/share/nginx/html && \
    chown -R nginxapp:nginxapp /etc/nginx/conf.d
USER 10001

EXPOSE 8080

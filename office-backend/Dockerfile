# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
FROM node:24.19.0-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43

# Set the working directory
WORKDIR /app

# Copy bundled application
COPY dist/app.js ./

# Copy generated types (needed at runtime)
COPY dist/generated ./generated

# Copy entrypoint script and make it executable
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Create non-root user with UID > 10000 to avoid host UID clash (Snyk K8S-11)
RUN addgroup --system --gid 10001 app && \
    adduser --system --uid 10001 --ingroup app --no-create-home app && \
    chown -R app:app /app

USER 10001

# Expose ports
EXPOSE 3003

# Set the entry point to the startup script
ENTRYPOINT ["./entrypoint.sh"]

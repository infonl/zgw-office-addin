# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
FROM node:22.21.1-alpine@sha256:b2358485e3e33bc3a33114d2b1bdb18cdbe4df01bd2b257198eb51beb1f026c5

# Set the working directory
WORKDIR /app

# Copy bundled application
COPY dist/app.js ./

# Copy generated types (needed at runtime)
COPY dist/generated ./generated

# Copy entrypoint script and make it executable
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Expose ports
EXPOSE 3003

# Set the entry point to the startup script
ENTRYPOINT ["./entrypoint.sh"]

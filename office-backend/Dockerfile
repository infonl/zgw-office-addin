# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
FROM node:22.18.0-alpine@sha256:1b2479dd35a99687d6638f5976fd235e26c5b37e8122f786fcd5fe231d63de5b

# Set the working directory
WORKDIR /app

# Copy root code to workdir
COPY . .

# Install dependencies
RUN npm ci

# Generate the types
RUN npm run types

# Set the working directory to the office-backend directory
WORKDIR /app/office-backend

RUN npm run build
RUN chmod +x entrypoint.sh

# Expose ports
EXPOSE 3003

# Set the entry point to the startup script
ENTRYPOINT ["./entrypoint.sh"]

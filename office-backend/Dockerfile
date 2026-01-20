# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
FROM node:22.22.0-alpine@sha256:a9cd9bac76cf2396abf14ff0d1c3671a8175fe577ce350e62ab0fc1678050176

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

# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
FROM node:22.16.0-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e

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

# Expose ports
EXPOSE 3003

# Set the entry point to the startup script
ENTRYPOINT ["node", "dist/src/app.js"]

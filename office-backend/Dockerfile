# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
FROM node:20.19.0-alpine@sha256:8bda036ddd59ea51a23bc1a1035d3b5c614e72c01366d989f4120e8adca196d4

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the built dist directory
COPY dist ./dist

# Expose ports
EXPOSE 3003

# Set the entry point to the startup script
ENTRYPOINT ["node", "dist/app.js"]

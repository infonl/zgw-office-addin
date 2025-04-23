# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
FROM node:22.15.0-alpine@sha256:4b1d9657f0aa674c0d9d07ce83386cb968027ee59db5cf894359c7e21d2e0078

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

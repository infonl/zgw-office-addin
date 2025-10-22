# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
FROM node:22.21.0-alpine@sha256:bd26af08779f746650d95a2e4d653b0fd3c8030c44284b6b98d701c9b5eb66b9

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

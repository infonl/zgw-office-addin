# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the built frontend files
COPY ./dist/ /usr/share/nginx/html/

# Expose port 80 inside the container (we map this to 3000 when running)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

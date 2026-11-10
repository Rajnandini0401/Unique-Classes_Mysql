# ==========================================
# Unique Classes - Frontend React Vite SPA Dockerfile
# Stage 1: Build production static files
# Stage 2: Serve via high-performance Nginx Alpine
# ==========================================

# Stage 1: Build React SPA
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci || npm install

# Copy source code and build config
COPY . .

# Build argument for API URL (defaults to /api so Nginx handles reverse proxying)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build Vite production bundle
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ > /dev/null || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

# ==========================================
# Unique Classes - Backend API Dockerfile
# Node.js 20 LTS Alpine (Fast, Secure & Small)
# ==========================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install curl / wget for container healthchecks
RUN apk add --no-cache wget

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY . .

# Create required upload and session directories
RUN mkdir -p uploads/students \
             uploads/teachers \
             uploads/staff \
             uploads/assignments \
             whatsapp_session_data

# Set production environment defaults
ENV NODE_ENV=production \
    PORT=5000

# Expose backend REST API port
EXPOSE 5000

# Healthcheck to verify Express API is active
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health > /dev/null || exit 1

# Start Node.js Express server
CMD ["node", "index.js"]

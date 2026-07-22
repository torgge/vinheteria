# Vinheria Digital Frontend - Docker Configuration
# Multi-stage build for production and development

# ==============================================================================
# Stage 1: Development
# ==============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Pre-create Angular cache dirs with correct ownership so UID 1000 can write at runtime
# (compose mounts tmpfs on these paths with uid=1000; this is a fallback for non-tmpfs runs)
RUN mkdir -p /app/.angular/cache /app/node_modules/.cache /app/dist && chown -R 1000:1000 /app

# Drop root
USER 1000:1000

# Expose port for dev server
EXPOSE 4200

# Healthcheck — Angular dev server responds on /
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD ["wget", "--spider", "--quiet", "http://127.0.0.1:4200/"]

# Start development server with hot reload
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]

# ==============================================================================
# Stage 2: Build
# ==============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build production bundle (runs as root in build stage; final image drops privileges)
RUN npm run build

# ==============================================================================
# Stage 3: Production (nginx)
# ==============================================================================
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from build stage
COPY --from=build /app/dist/vinheria-web/browser /usr/share/nginx/html

# Expose port
EXPOSE 80

# Healthcheck — nginx serving SPA
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD ["wget", "--spider", "--quiet", "http://127.0.0.1:80/"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

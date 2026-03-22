# Vinheria Digital Frontend - Docker Configuration
# Multi-stage build for production and development

# ==============================================================================
# Stage 1: Development
# ==============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port for dev server
EXPOSE 4200

# Start development server with hot reload
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]

# ==============================================================================
# Stage 2: Build
# ==============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
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

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

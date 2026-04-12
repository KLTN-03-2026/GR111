# ================================================================
# CLIENT (Frontend) - Production Dockerfile
# ================================================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production image with Nginx
FROM nginx:stable-alpine AS runner
# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx config if exists, otherwise use default
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
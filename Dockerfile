# Use Node.js LTS version
FROM node:20-alpine

# Install build dependencies for native modules and curl for healthcheck
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (skip optional deps like canvas that fail to compile)
RUN npm install --no-optional || npm install --no-optional --force

# Copy source files
COPY . .

# Use the container version of simple-server with all routes
RUN cp simple-server-from-container.js simple-server.js

# Build Vite frontend
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Create data directories
RUN mkdir -p /app/data/thumbnails /app/data/covers /app/data/models /app/data/videos /app/data/geometry /app/library /app/sessions

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "simple-server.js"]

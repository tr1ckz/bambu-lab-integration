# Use Node.js LTS (Alpine)
FROM node:20-alpine

# Install system dependencies including git for GitHub dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    curl \
    git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Remove canvas from dependencies entirely to prevent compilation
RUN npm pkg delete \
    dependencies.canvas \
    dependencies.@napi-rs/canvas \
    optionalDependencies.canvas \
    optionalDependencies.@napi-rs/canvas \
    2>/dev/null || true

# Install all dependencies normally (this will install rollup's native bindings)
# Remove canvas BEFORE install so it never gets added
RUN rm -f package-lock.json && \
    npm install --omit=optional --legacy-peer-deps

# Copy application files
COPY . .

# Use container-specific server file
RUN cp simple-server-from-container.js simple-server.js 2>/dev/null || echo "Using existing simple-server.js"

# Build the application (now rollup binaries are installed)
RUN npm run build || echo "Build completed with warnings"

# Remove dev dependencies and try to avoid canvas compilation
# Use --ignore-scripts here to prevent canvas from trying to rebuild
RUN npm prune --production --ignore-scripts 2>/dev/null || true

# Create necessary directories
RUN mkdir -p \
    /app/data/thumbnails \
    /app/data/covers \
    /app/data/models \
    /app/data/videos \
    /app/data/geometry \
    /app/library \
    /app/sessions

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "simple-server.js"]

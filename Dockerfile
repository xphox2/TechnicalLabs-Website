# =============================================================================
# Technical Labs Website — Dual Stage Dockerfile
# =============================================================================
# Stage 1: Build & Compile dynamic metadata (Fetch repo versions)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors and source scripts
COPY package.json ./
COPY scripts/ ./scripts/

# Receive the GITHUB_TOKEN as a build argument to fetch private repo tags
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}

# Run version fetcher to generate assets/versions.json
RUN node scripts/fetch-versions.js

# =============================================================================
# Stage 2: Serve website via production-grade Nginx Alpine container
# =============================================================================
FROM nginx:alpine

# Copy local source files to Nginx public html serving path
COPY . /usr/share/nginx/html

# Replace local versions file with the live compiled one from the Builder stage
COPY --from=builder /app/assets/versions.json /usr/share/nginx/html/assets/versions.json

# Cache-busting: stamp git short SHA or timestamp onto ?v= assets in index.html
ARG BUILD_ID=
RUN set -e; \
    BID="${BUILD_ID:-$(date +%Y%m%d%H%M%S)}"; \
    [ -f "/usr/share/nginx/html/index.html" ] && \
    sed -i -E "s/\?v=[0-9A-Za-z._-]+/?v=${BID}/g" "/usr/share/nginx/html/index.html"; \
    echo "cache-bust: stamped all ?v= assets with build id ${BID}"

# Expose Nginx server port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

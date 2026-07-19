# =============================================================================
# Technical Labs Website — Booking Mail Relay
# =============================================================================
FROM node:20-alpine

WORKDIR /app

# Install production dependencies (nodemailer) with a reproducible, lean install
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy the service source
COPY index.js ./

ENV PORT=3001
EXPOSE 3001

# Container-level liveness probe against the health endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:3001/health || exit 1

CMD ["node", "index.js"]

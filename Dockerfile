# Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend dependencies: better-sqlite3 compiles a native module with
# node-gyp (python3, make, g++). The toolchain stays in this stage only:
# shipped in the runtime image, build-essential pulled linux-libc-dev and
# ~450 HIGH/CRITICAL CVEs into production.
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Production: use Debian (glibc) so better-sqlite3 native module works on Swarm nodes
# Alpine (musl) can cause "fcntl64: symbol not found" on some hosts
FROM node:22-bookworm-slim
WORKDIR /app

# apt-get upgrade: Debian security fixes newer than the base tag. wget is
# only for the healthcheck. npm is refreshed because the copy bundled with
# node ships stale tar/brace-expansion.
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm@latest && npm cache clean --force

COPY --from=backend-build /app/node_modules ./node_modules
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "src/index.js"]

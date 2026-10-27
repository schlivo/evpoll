FROM node:22-bookworm

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# pnpm (version pinned by "packageManager" in package.json)
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Set working directory
WORKDIR /workspace

# Create non-root user (already exists in node image as 'node')
USER node

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install SQLite3 build dependencies
RUN apk add --no-cache python3 make g++ sqlite sqlite-dev

# Copy package files
COPY package*.json ./

# Install dependencies with rebuild of SQLite3
RUN npm ci && npm rebuild sqlite3

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install SQLite3 runtime and build essentials
RUN apk add --no-cache sqlite python3 make g++ sqlite-dev

# Copy built assets from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Rebuild sqlite3 for production environment
RUN npm rebuild sqlite3

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user
USER node

# Expose port 3000
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]

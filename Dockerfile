FROM node:20-slim AS builder
WORKDIR /app

# 1. Build root frontend
COPY package.json package-lock.json* ./
RUN npm install
COPY . ./
RUN npm run build

# 2. Build MCP server
WORKDIR /app/mcp-server
COPY mcp-server/package.json mcp-server/package-lock.json* ./
RUN npm install
COPY mcp-server/ ./
RUN npm run build

# Production runtime image
FROM node:20-slim

# Copy built frontend
WORKDIR /app
COPY --from=builder /app/dist ./dist

# Set up MCP server
WORKDIR /app/mcp-server
COPY mcp-server/package.json mcp-server/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=builder /app/mcp-server/dist ./dist

ENV MCP_TRANSPORT=sse
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "dist/index.js"]

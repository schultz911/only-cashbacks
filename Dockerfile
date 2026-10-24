FROM node:20-slim AS builder
WORKDIR /app

# 1. Build root frontend
COPY package.json package-lock.json* ./
RUN npm install
COPY . ./
RUN npm run build

# 2. Build MCP server
WORKDIR /app/mcp-server
RUN npm install
RUN npm run build

# Production runtime image
FROM node:20-slim
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY mcp-server/package.json mcp-server/package-lock.json* ./mcp-server/
RUN cd mcp-server && npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/mcp-server/dist ./mcp-server/dist

ENV MCP_TRANSPORT=sse
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "mcp-server/dist/index.js"]

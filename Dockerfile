FROM node:20-slim AS builder
WORKDIR /app

# 1. Build root frontend
COPY package.json package-lock.json* ./
RUN npm install
COPY . ./
ENV VITE_FIREBASE_API_KEY=AIzaSyCHALzi5TDkpVQrUqobauyciLZurzjQsX4
ENV VITE_FIREBASE_PROJECT_ID=gen-lang-client-0447512961
ENV VITE_FIREBASE_APP_ID=1:343088435457:web:14d0c083a241a00a86cb00
ENV VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0447512961.firebaseapp.com
ENV VITE_FIREBASE_DATABASE_ID=ai-studio-onlycashbacks-9dfa3f2d-5762-4049-a6c8-583bd3c24948
ENV VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0447512961.firebasestorage.app
ENV VITE_FIREBASE_SENDER_ID=343088435457
ENV VITE_RECAPTCHA_SITE_KEY=6LdvmgotAAAAAL2cVPtKL1HIwAds1d7eB5MgxVPu
RUN npm run build

# 2. Build MCP server
WORKDIR /app/mcp-server
COPY mcp-server/package.json mcp-server/package-lock.json* ./
RUN npm install
COPY mcp-server/ ./
RUN npm run build

# Production runtime image
FROM node:20-slim
WORKDIR /app

# Copy and install production dependencies for MCP server
COPY mcp-server/package.json mcp-server/package-lock.json* ./
RUN npm install --omit=dev

# Copy MCP server compiled code
COPY --from=builder /app/mcp-server/dist ./dist

# Copy built frontend web app into /app/web
COPY --from=builder /app/dist ./web

ENV MCP_TRANSPORT=sse
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "dist/index.js"]

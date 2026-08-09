FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY backend/src ./src
COPY backend/package*.json ./
USER node
EXPOSE 4000
CMD ["node","src/server.js"]

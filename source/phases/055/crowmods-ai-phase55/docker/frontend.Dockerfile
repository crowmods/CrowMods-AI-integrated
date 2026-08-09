FROM node:22-alpine AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["npm","start"]

# Production Dockerfile for Section Store
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the app
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remix

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env ./.env

USER remix

EXPOSE 3001

ENV PORT=3001

CMD ["npm", "start"]

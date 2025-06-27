# Stage 1: Build
FROM node:18-slim as build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm install

# Copy prisma schema & generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy app source
COPY . .

# Clean & build app
RUN npm run prebuild
RUN npm run build

# Stage 2: Runtime image (lean)
FROM node:18-slim as runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy only needed files from build stage
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/.env.production .env.production
# COPY --from=build /usr/src/app/.env .env

# Set env
ENV NODE_ENV production
# ENV NODE_ENV dev

# Expose app port
EXPOSE 3000

# Use dumb-init for better signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start app
CMD ["node", "dist/main.js"]

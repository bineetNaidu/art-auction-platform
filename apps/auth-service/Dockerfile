# Lift the build argument to the absolute top of the file to scope it across all stages
ARG APP_NAME

# Stage 1: Build compilation layer using lightweight Node Alpine base
FROM node:20-alpine AS builder
# Re-declare the argument inside this specific build stage scope
ARG APP_NAME
WORKDIR /app

# Copy root configurations and workspace manifest locks
COPY package*.json tsconfig.base.json ./
COPY packages/ ./packages/

# Pluck ONLY the targeted microservice to keep 'apps/web' out of the build matrix
COPY apps/${APP_NAME}/ ./apps/${APP_NAME}/

# Clean install dependencies and compile the isolated workspace matrix
RUN npm ci
RUN npm run build

# Stage 2: Clean runtime target allocation layer
FROM node:20-alpine AS runner

# Dynamic build-time variable defining which microservice targeting pipeline to trigger
ARG APP_NAME
ENV APP_TARGET=${APP_NAME}
WORKDIR /app

# Copy workspace state manifests and the global node_modules
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy the entire packages folder to preserve the symlink directory structure
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/${APP_TARGET}/dist ./apps/${APP_TARGET}/dist
COPY --from=builder /app/apps/${APP_TARGET}/package.json ./apps/${APP_TARGET}/package.json

# Establish production run targets and bind port boundaries
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Execute the entry-point relative to the preserved workspace paths
CMD node apps/${APP_TARGET}/dist/index.js
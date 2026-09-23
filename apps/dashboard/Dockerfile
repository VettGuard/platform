# syntax=docker.io/docker/dockerfile:1
# Build context: monorepo root. `docker build -f apps/dashboard/Dockerfile .`
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/landing/package.json     apps/landing/
COPY apps/dashboard/package.json   apps/dashboard/
COPY apps/admin/package.json       apps/admin/
COPY apps/extension/package.json   apps/extension/
COPY packages/config/package.json  packages/config/
COPY packages/i18n/package.json    packages/i18n/
COPY packages/proto/package.json   packages/proto/
COPY packages/sdk/package.json     packages/sdk/
COPY packages/ui/package.json      packages/ui/
RUN pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @vettguard/dashboard build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /repo/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/dashboard/.next/static     ./apps/dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/dashboard/public           ./apps/dashboard/public
USER nextjs
EXPOSE 3001
CMD ["node", "apps/dashboard/server.js"]

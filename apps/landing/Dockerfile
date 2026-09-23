# syntax=docker.io/docker/dockerfile:1
#
# Multi-stage build for apps/landing. Build context is the monorepo root
# (`docker build -f apps/landing/Dockerfile .`) so we can resolve the
# pnpm workspace + shared packages.

ARG NODE_VERSION=22-alpine

# ── deps: install the full workspace ─────────────────────────────────
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

# ── build: produce the standalone output ─────────────────────────────
FROM node:${NODE_VERSION} AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @vettguard/landing build

# ── runner: tiny node image with only the standalone bundle ──────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/.next/static     ./apps/landing/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/public           ./apps/landing/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/landing/server.js"]

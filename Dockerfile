# ---- build stage --------------------------------------------------------------
FROM node:26-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# NEXT_PUBLIC_* values are baked into the browser bundle at build time
RUN npm run build && npm prune --omit=dev

# ---- run stage ----------------------------------------------------------------
FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# run as an unprivileged user
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/package.json ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/next.config.ts ./
COPY --from=builder --chown=app:app /app/server.js ./
COPY --from=builder --chown=app:app /app/lib ./lib

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/keepalive >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]

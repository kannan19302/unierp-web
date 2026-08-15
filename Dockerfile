# unierp-web — L4, the Tenant Admin Portal and Application Layer.
#
# Built from THIS repository alone; `@unerp/*` comes from the registry.
#
#   docker build -t unierp-web .

# ── build ───────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./

# See unierp-api's Dockerfile for why the registry is written into a
# project-level .npmrc and why the lockfile's tarball host is rewritten: npm's
# precedence puts the project file above the user config, and a lockfile written
# against `localhost` only installs on the machine that wrote it.
ARG UNIERP_REGISTRY=http://host.docker.internal:4873/
RUN printf '@kannan19302:registry=%s\nregistry=https://registry.npmjs.org/\n' "$UNIERP_REGISTRY" > .npmrc \
 && rm -f package-lock.json \
 && npm install --no-audit --no-fund

COPY tsconfig.json next.config.mjs next-env.d.ts middleware.ts ./
COPY src ./src
COPY app ./app
COPY public ./public

# ── dev ─────────────────────────────────────────────────────────────────────
FROM builder AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=8192
EXPOSE 3000
CMD ["npx", "next", "dev", "-p", "3000", "-H", "0.0.0.0"]

# ── build ───────────────────────────────────────────────────────────────────
FROM dev AS prod-builder
# Server-side only. The browser must call the web origin so next.config's
# rewrite can send /api/v1/auth/* to the IdP and everything else to the API —
# setting NEXT_PUBLIC_API_URL to a bare origin makes the browser bypass its own
# proxy and aim auth at the service that does not own it.
# Both of these are BUILD args, not just runtime env.
#
# next.config.mjs resolves its rewrite destinations when the config is
# evaluated, and `next build` bakes them into the routes manifest. Setting
# IDP_URL only at runtime left the built manifest pointing at the localhost
# default, so every /api/v1/auth/* call proxied to the container itself and
# died with ECONNREFUSED — while the IdP beside it was perfectly healthy and
# answering. API_URL was already a build arg, which is why the API half worked
# and the auth half did not.
ARG API_URL=http://api:3001
ARG IDP_URL=http://idp:3005
ENV API_URL=$API_URL
ENV IDP_URL=$IDP_URL
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_TELEMETRY_DISABLED=1
# Next.js holds the whole route graph in memory and this app has ~470 routes.
# The container default heap is well under what that needs, and V8 aborts with
# SIGABRT rather than anything Next reports, so it reads as a mystery crash.
# The monorepo raised this globally in NODE_OPTIONS for the same reason.
ENV NODE_OPTIONS=--max-old-space-size=8192
RUN npm run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=prod-builder /app/node_modules ./node_modules
COPY --from=prod-builder /app/.next ./.next
COPY --from=prod-builder /app/public ./public
COPY --from=prod-builder /app/package.json ./package.json
COPY --from=prod-builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "start", "-p", "3000"]

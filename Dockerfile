# syntax=docker/dockerfile:1

# One image definition for all five apps. Pick which one with --build-arg APP=<name>.
# Valid APP values: backend | engine | db-poller | price-feed | web-socket-server

FROM oven/bun:1.3.14 AS deps
WORKDIR /app

# Manifests only, so a source-only change does not invalidate the install layer.
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/db-poller/package.json apps/db-poller/
COPY apps/engine/package.json apps/engine/
COPY apps/price-feed/package.json apps/price-feed/
COPY apps/test/package.json apps/test/
COPY apps/web-socket-server/package.json apps/web-socket-server/
COPY packages/db/package.json packages/db/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/types/package.json packages/types/

RUN bun install --frozen-lockfile


FROM oven/bun:1.3.14 AS runtime
WORKDIR /app

# Copying the whole /app tree (not just /app/node_modules) matters: bun places
# per-workspace devDependency binaries (e.g. prisma) inside that workspace's
# own node_modules/.bin, not only at the root.
COPY --from=deps /app /app
COPY . .

# prisma.config.ts resolves env("DATABASE_URL") at load time; generate never opens a
# connection, so a placeholder is enough. The real URL is supplied at runtime.
# `bunx prisma` (with or without --bun) re-resolves "prisma" from the registry
# instead of using the workspace's pinned devDependency, and fetches an
# incompatible version -- confirmed by testing both forms. Run the actually
# installed binary directly instead.
RUN cd packages/db \
    && DATABASE_URL="postgresql://postgres:1234@localhost:5432/postgres" \
       ./node_modules/.bin/prisma generate

RUN mkdir -p /app/apps/engine/src/snapshots \
    && chown -R bun:bun /app/apps /app/packages

USER bun

ARG APP
# Engine snapshots resolve against process.cwd(), so WORKDIR must be the app directory.
WORKDIR /app/apps/${APP}

CMD ["bun", "run", "src/index.ts"]


# One-shot migration runner: `prisma migrate deploy` against packages/db.
# Built with --target migrator, run once per deploy before the app containers.
FROM oven/bun:1.3.14 AS migrator
WORKDIR /app

COPY --from=deps /app /app
COPY . .

RUN chown -R bun:bun /app
USER bun
WORKDIR /app/packages/db

CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

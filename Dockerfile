FROM oven/bun:1.3.14 AS pruner
WORKDIR /app
COPY . .
ARG APP
RUN test -n "$APP" || (echo "APP build-arg is required" >&2 && exit 1)
RUN bunx turbo prune ${APP} --docker


FROM oven/bun:1.3.14 AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile


FROM oven/bun:1.3.14 AS runtime
WORKDIR /app
ARG APP

COPY --from=deps --chown=bun:bun /app /app
COPY --from=pruner --chown=bun:bun /app/out/full/ .


RUN if [ -d packages/db ]; then \
      cd packages/db \
      && DATABASE_URL="postgresql://postgres:1234@localhost:5432/postgres" \
         ./node_modules/.bin/prisma generate; \
    fi


RUN if [ "$APP" = "engine" ]; then mkdir -p apps/engine/src/snapshots && chown bun:bun apps/engine/src/snapshots; fi

USER bun
WORKDIR /app/apps/${APP}

CMD ["bun", "run", "src/index.ts"]


FROM oven/bun:1.3.14 AS pruner-db
WORKDIR /app
COPY . .
RUN bunx turbo prune db --docker


FROM oven/bun:1.3.14 AS migrator-deps
WORKDIR /app
COPY --from=pruner-db /app/out/json/ .
COPY --from=pruner-db /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile


FROM oven/bun:1.3.14 AS migrator
WORKDIR /app

COPY --from=migrator-deps --chown=bun:bun /app /app
COPY --from=pruner-db --chown=bun:bun /app/out/full/ .

USER bun
WORKDIR /app/packages/db

CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

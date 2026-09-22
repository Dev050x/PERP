# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PERP is a low-latency, event-driven perpetual futures trading engine (Bun + TypeScript monorepo, Turborepo). In-memory order book (B-Tree + doubly-linked lists), async persistence via Redis Streams + PostgreSQL/Prisma.

## Commands

Run from repo root (Bun/Turborepo workspace, `bun@1.3.14`):

```bash
bun install          # install all workspace deps
bun dev               # turbo run dev — runs all apps' watch mode in parallel
bun run build         # turbo run build
bun run lint          # turbo run lint
bun run check-types   # turbo run check-types
bun run format        # prettier --write "**/*.{ts,tsx,md}"
```

Per-app dev (each app has its own `dev` script, `bun --watch src/index.ts`): `cd apps/<app> && bun dev`.

Tests live only in `apps/test` (uses `bun test`, not a per-app test runner):

```bash
cd apps/test && bun test                          # all tests
cd apps/test && bun test unit/orderbook-manager.test.ts   # single file
cd apps/test && bun test -t "test name"            # by name
```

Test suite imports engine internals directly (`apps/engine/src/...`) rather than hitting it over Redis, so engine logic changes should be verified against `apps/test/unit/*` and `apps/test/integration/*` (matching-engine, liquidation, position-management, orderbook-manager, user-manager, get-balance, get-position, onramp, withdraw, serialize, validation, calculation, conversion).

Prisma (in `packages/db`): schema at `packages/db/prisma/schema.prisma`, generated client output at `packages/db/generated/prisma`. Regenerate after schema changes with `bunx prisma generate` from `packages/db`.

## Architecture

Five independent long-running apps under `apps/*` communicate exclusively through **Redis Streams** — there is no direct RPC between them. Shared types live in `packages/types` (imported as `types`, `types/publisher`, `types/receiver`, `types/auth`, `types/exchange`), and the Prisma client/db access lives in `packages/db` (imported as `db`).

- **`apps/backend`** — Express REST API gateway (JWT auth, Zod validation). Routes writes (orders, deposits, withdrawals, cancels) onto `REQUEST_STREAM` as `EngineRequest` messages tagged with a `correlationID`, then awaits the matching response on `RESPONSE_STREAM` (see `src/utils/engine-client.ts`). Reads (candles, trades, historical orders) go straight to Postgres via `db`, bypassing the engine.
- **`apps/engine`** — the matching/risk engine. Single-threaded loop in `src/index.ts` reads `EngineRequest` off the stream, dispatches by `msg` type (`OnRamp`, `Withdraw`, `CreateOrder`, `CancelOrder`, `GetPosition`, `GetFills`, `MarkPrice`, `GetDepth`, ...) to `src/controllers/*`, and publishes results back to `RESPONSE_STREAM`. State is in-memory singletons (`OrderBookManager`, `UserManager`, `LiquidationManager` — all `getInstance()` pattern) under `src/store/`. On boot it replays missed stream messages (`utils/replay-message.ts`) and restores from periodic snapshots (`utils/snanpshot.ts`, `src/snapshots/`) for crash recovery — treat engine state as append-only/replayable, not just an in-memory cache. All monetary/qty values are `bigint` internally (converted via `toBigInt`/`PRECISION`), even though wire types (`UserOrder`, `CreateOrderData`) carry them as `string`.
- **`apps/db-poller`** — background worker consuming `RESPONSE_STREAM`, batch-persisting orders/fills/candles to Postgres via `db` (`controllers/create-order.ts`, `controllers/cancel-order.ts`, `controllers/create-candle.ts`). Keeps the engine's hot path free of DB latency.
- **`apps/web-socket-server`** — consumes `RESPONSE_STREAM`, maintains per-market depth state, and pushes `depth.<market>` / `trade.<market>` updates to subscribed clients over `ws`.
- **`apps/price-feed`** — connects to an external price source (Binance stream via `STREAM_URL`) and publishes `MarkPrice` `EngineRequest`s onto the request stream for the engine to consume.

Order matching (`apps/engine/src/store/orderbook-manager.ts`, `OrderBookManager`): each market's `orderbook` has `bids`/`asks` as `Map<bigint price, RestingOrders>` where `RestingOrders.orders` is a FIFO `LinkedList`, plus a `SortedPrices` (`sorted-btree` `BTree`) per side for O(log n) best-price lookup. `matchOrder` dispatches to `matchLongOrder`/`matchShortOrder` by side, walks best-priced resting orders price-time priority, produces `Fill`s, updates resting order status/qty, and opens/updates `Position`s via `UserManager`. Cancel path (`cancelOrder` → `cancelBid`/`cancelAsk`) removes from both the BTree best-price index and the linked list.

Each app's `RedisManager` (`src/store/redis-manager.ts` or similar per app) wraps stream read/write and consumer-group offset tracking — check that file first when touching how an app talks to Redis (stream names, consumer group, offset persistence).

## Conventions to know

- Workspace package imports use bare names (`types`, `db`) via each `package.json`'s `exports` map, not relative paths across app boundaries — e.g. `import type { Order } from "types"`, `import type { EngineRequest } from "types/publisher"`, `import type { EngineResponse } from "types/receiver"`.
- Env vars are read directly from `process.env` (see `.env.example`: `DATABASE_URL`, `REDIS_URL`, `PORT`, `JWT_SECRET`, `ENGINE_TIMEOUT_MS`, `STREAM_URL`, `WS_PORT`). Each app expects its own `.env`.
- `apps/test` is a standalone workspace app whose `dependencies` mirror `apps/engine`'s (`dbly-linked-list`, `sorted-btree`) so it can import engine modules directly — keep it in sync if engine deps change.

## Validation and Checking

- After doing every change, run `bun run build` to ensure there is no errors.

<!-- rtk-instructions v2 -->

# Command output

Command output here is condensed to save tokens, keeping every signal and
dropping costly noise. Treat it as the complete result: run commands
normally, and batch related commands into one call to avoid extra turns.
Truncated results state their recovery path in their own output. Re-run a
command as `rtk proxy <cmd>` only when its result is unusable: empty when
output was clearly expected, contradicting its exit code, or garbled.

<!-- /rtk-instructions -->

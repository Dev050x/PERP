# PERP — High-Performance Perpetual Futures Exchange Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-ef4444.svg?logo=turborepo)](https://turbo.build/)
[![Bun](https://img.shields.io/badge/Bun-1.3-black.svg?logo=bun)](https://bun.sh/)
[![Redis](https://img.shields.io/badge/Redis-Streams-red.svg?logo=redis)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma%20ORM-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Frontend UI](https://img.shields.io/badge/Frontend-PERP--UI-10b981.svg?logo=github)](https://github.com/Dev050x/PERP-UI)

**PERP** is an event-driven, high-frequency **Perpetual Derivatives & Futures Trading Engine** built with TypeScript, Node.js/Bun, Redis Streams, and PostgreSQL. It provides the core backend architecture and real-time order matching engine for the [PERP-UI](https://github.com/Dev050x/PERP-UI) frontend application.

---

## Key Features

- **In-Memory Matching Engine**: Orderbook architecture utilizing **B-Trees** (`sorted-btree`) for fast sorted price lookup and **Doubly-Linked Lists** (`LinkedList`) for FIFO queueing of user resting orders at each price level.
- **Event-Driven Microservices**: Decoupled REST Gateway, Matching Engine, WebSocket Server, DB Poller, and Price Feed connected asynchronously via **Redis Streams**.
- **Risk & Liquidation Engine**: Dynamic margin checks, leverage validation, mark price calculation, dynamic funding rate engine, and automated liquidation of undercollateralized positions.
- **Fault-Tolerant State Recovery**: Engine state snapshots paired with offset-tracked Redis Stream replay for zero-loss recovery after system restart/crash.
- **Decoupled Asynchronous Persistence**: Background **DB-Poller** worker consumes events from Redis Streams and batch persists orders, fills, trades, and candlestick data to **PostgreSQL** via **Prisma ORM** without blocking matching engine execution.
- **Real-Time WebSocket Streaming**: Instant orderbook depth and price ticker updates pushed to connected clients via WebSocket server (`ws://localhost:3001`).
- **Automated Market Maker (AMM) Bot**: Included CLI simulator (`market-maker.js`) that auto-registers traders, funds test balances, and populates live market depth & trading activity.

---

## Repository Structure

Monorepo architecture powered by **Turborepo** & **Bun**:

```
PERP/
├── apps/
│   ├── backend/             # Express.js REST API Gateway (Auth, Orders, Balance)
│   ├── engine/              # In-memory Matching Engine & Risk Management
│   ├── db-poller/           # Background worker batch persisting events to PostgreSQL
│   ├── web-socket-server/   # Real-time WebSocket broadcasting server
│   ├── price-feed/          # Oracle mark price stream connector (Binance Stream)
│   └── test/                # Integration tests & load benchmark suites
├── packages/
│   ├── db/                  # Prisma ORM schema & client definitions
│   ├── types/               # Shared TypeScript interfaces, types & Zod schemas
│   └── eslint-config/       # Shared ESLint configuration
├── market-maker.js          # Automated Market Maker & liquidity simulator
├── package.json             # Monorepo configuration
├── turbo.json               # Turborepo task pipeline
└── bun.lock                 # Bun lockfile
```

---

## Technology Stack & Web Client

| Domain | Technologies / Repositories |
| :--- | :--- |
| **Frontend Web App** | [PERP-UI Repository](https://github.com/Dev050x/PERP-UI) |
| **Language & Runtime** | TypeScript, Bun / Node.js |
| **Monorepo Tooling** | Turborepo, Bun Workspaces |
| **Matching Engine** | In-Memory Orderbook (B-Tree for price levels, Doubly-Linked List for resting orders) |
| **Messaging & Queues** | Redis Streams |
| **API Gateway** | Express.js, JWT, Zod Validation, CORS |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Real-time Comms** | WebSockets (`ws`), Binance Oracle Stream |

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18+) or **Bun** (v1.3+)
- **Redis Server** running locally on default port `6379`
- **PostgreSQL Database** running on port `5432`

### 1. Installation

Clone the repository and install workspace dependencies:

```bash
git clone https://github.com/Dev050x/PERP.git
cd PERP
bun install
# or
npm install
```

### 2. Environment Setup

Create `.env` files for the respective microservices:

#### Database Package (`packages/db/.env`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/perp_db?schema=public"
```

#### Backend API (`apps/backend/.env`)
```env
PORT=8080
JWT_SECRET=your_jwt_secret_key_here
REDIS_URL=redis://localhost:6379
```

#### Engine & DB Poller (`apps/engine/.env`, `apps/db-poller/.env`)
```env
REDIS_URL=redis://localhost:6379
```

#### Price Feed (`apps/price-feed/.env`)
```env
STREAM_URL=wss://fstream.binance.com/ws/solusdt@markPrice@1s
```

### 3. Database Migration

Initialize the PostgreSQL database schema with Prisma:

```bash
cd packages/db
npx prisma db push
# Generate Prisma Client
npx prisma generate
```

### 4. Running the Development Services

Run all services concurrently using Turborepo:

```bash
bun dev
# or
npm run dev
```

Alternatively, you can run individual services:

```bash
# Start Engine
bun dev --filter=engine

# Start REST Backend Gateway
bun dev --filter=backend

# Start Database Poller
bun dev --filter=db-poller

# Start WebSocket Server
bun dev --filter=web-socket-server
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/sign-up` | Register a new trader account |
| `POST` | `/api/v1/sign-in` | Authenticate trader and receive JWT |

### Account & Balance

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/onramp` | Yes | Deposit test balance (e.g. USDC) |
| `POST` | `/api/v1/withdraw` | Yes | Withdraw collateral balance |
| `GET` | `/api/v1/balance` | Yes | Get current user token & locked balances |

### Trading & Orders

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/order` | Yes | Submit new `LONG` or `SHORT` order (limit/market) |
| `DELETE`| `/api/v1/order` | Yes | Cancel an open limit order |
| `GET` | `/api/v1/orders/:marketId` | Yes | Fetch user orders for a market |
| `GET` | `/api/v1/orders/open/:marketId` | Yes | Fetch open user orders |
| `GET` | `/api/v1/position/open` | Yes | Get all open leveraged positions |
| `GET` | `/api/v1/position/open/:marketId` | Yes | Get position for specific market |
| `GET` | `/api/v1/fills` | Yes | Get user trade execution fills |

### Market Data (Public)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/depth/:marketId` | Retrieve live orderbook depth (bids & asks) |
| `GET` | `/api/v1/trades/:marketId` | Retrieve recent executed market trades |
| `GET` | `/api/v1/candles/:marketId` | Retrieve OHLC candlestick data |

---

## Automated Market Maker (AMM) Simulator

A built-in market maker script is included to simulate market activity and test execution engine performance under live quote pressure.

To run the market maker:

```bash
node market-maker.js
```

**What it does:**
- Automatically registers two test market maker accounts (`mm_trader_1` and `mm_trader_2`).
- Funds accounts with $100,000 USDC test balance via `/onramp`.
- Continuously posts active two-sided limit quotes (bids/asks) and aggressive taker orders across `SOL` and `ETH` markets.

---

## Related Repositories

- **Frontend Web UI**: [https://github.com/Dev050x/PERP-UI](https://github.com/Dev050x/PERP-UI)

---

## License

This project is licensed under the MIT License.

/**
 * ============================================================
 *  PERP Exchange Automated Market Maker Simulator
 *  Autosigns up/logs in two traders, funds their balances with USDC,
 *  and places live quotes + market trades across SOL & ETH.
 * ============================================================
 */

const BASE_URL = process.env.API_URL || "http://localhost:8080/api/v1";

const MARKETS = {
  SOL: { min: 130, max: 160, mid: 145, qtyMin: 0.5, qtyMax: 5.0, priceDec: 2, qtyDec: 2 },
  ETH: { min: 2400, max: 2800, mid: 2600, qtyMin: 0.05, qtyMax: 0.5, priceDec: 2, qtyDec: 3 },
};

const LEVERAGE = 10;
const SLEEP_MIN_MS = 100;
const SLEEP_MAX_MS = 500;

let orderCount = 0;

function randFloat(min, max) {
  return min + (max - min) * Math.random();
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function walkMid(mid, min, max) {
  const range = max - min;
  const step = range * 0.004;
  const delta = randFloat(-step, step);
  return clamp(mid + delta, min, max);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getOrRegisterUser(username, password) {
  console.log(`\x1b[36m[MM Setup]\x1b[0m Registering/Logging in \x1b[1m${username}\x1b[0m...`);
  
  // Try register first
  await request("/sign-up", "POST", { username, password });
  
  // Sign in
  const loginRes = await request("/sign-in", "POST", { username, password });
  if (!loginRes || !loginRes.token) {
    throw new Error(`Failed to obtain JWT token for ${username}: ${JSON.stringify(loginRes)}`);
  }

  const token = loginRes.token;

  // Onramp test balance
  console.log(`\x1b[36m[MM Setup]\x1b[0m Funding \x1b[1m${username}\x1b[0m with 100,000 USDC...`);
  await request("/onramp", "POST", { amount: "100000" }, token);

  return token;
}

function printTicker(market, side, price, qty, label, isCross) {
  const ts = new Date().toLocaleTimeString();
  const sideColor = side === "LONG" || side === "BUY" ? "\x1b[32m" : "\x1b[31m";
  const tagStr = isCross ? "\x1b[35m⚡ taker\x1b[0m" : "\x1b[90m  maker\x1b[0m";
  const formattedMarket = market.padEnd(4);
  const formattedSide = side.padEnd(5);
  const formattedQty = qty.toString().padEnd(8);
  const formattedPrice = `$${price}`.padEnd(9);

  console.log(
    `\x1b[90m[${ts}]\x1b[0m \x1b[1m${formattedMarket}\x1b[0m ${sideColor}${formattedSide}\x1b[0m qty \x1b[33m${formattedQty}\x1b[0m @ \x1b[36m${formattedPrice}\x1b[0m (${label}) ${tagStr}`
  );
}

async function placeOrder(token, market, side, type, price, qty) {
  orderCount++;
  const priceNum = parseFloat(price);
  const qtyNum = parseFloat(qty);
  const marginNum = (priceNum * qtyNum) / LEVERAGE;
  const margin = marginNum.toFixed(2);

  const payload = {
    market,
    side: side === "BUY" ? "LONG" : side === "SELL" ? "SHORT" : side,
    type,
    price,
    qty,
    margin,
  };

  request("/order", "POST", payload, token).catch(() => {});
}

async function startMarketMaker() {
  console.log(`
\x1b[1m\x1b[36m╔══════════════════════════════════════════════╗
║         P E R P   M A R K E T   M A K E R    ║
╚══════════════════════════════════════════════╝\x1b[0m
  Target API : \x1b[33m${BASE_URL}\x1b[0m
  Markets    : \x1b[32mSOL ($130-$160)\x1b[0m, \x1b[32mETH ($2400-$2800)\x1b[0m
  Makers     : \x1b[35mmaker-1\x1b[0m, \x1b[35mmaker-2\x1b[0m
  Press Ctrl+C to stop
`);

  const token1 = await getOrRegisterUser("mm_trader_1", "password123");
  const token2 = await getOrRegisterUser("mm_trader_2", "password123");

  console.log("\x1b[32m✔ Market Maker Initialization Complete. Starting order flow...\x1b[0m\n");

  const keys = Object.keys(MARKETS);

  process.on("SIGINT", () => {
    console.log(`\n\x1b[33m──────────────────────────────────────────\x1b[0m`);
    console.log(`  Market Maker stopped. Total orders placed: \x1b[1m${orderCount}\x1b[0m`);
    console.log(`\x1b[33m──────────────────────────────────────────\x1b[0m`);
    process.exit(0);
  });

  while (true) {
    const marketKey = keys[Math.floor(Math.random() * keys.length)];
    const config = MARKETS[marketKey];

    // Drift mid price
    config.mid = walkMid(config.mid, config.min, config.max);

    const roll = Math.floor(Math.random() * 100);

    if (roll < 70) {
      // 70% passive two-sided quote
      const spreadPct = randFloat(0.04, 0.25);
      const spread = (config.mid * spreadPct) / 100;

      const bidMult = randFloat(0.4, 1.0);
      const askMult = randFloat(0.4, 1.0);

      const bidPrice = (config.mid - spread * bidMult).toFixed(config.priceDec);
      const askPrice = (config.mid + spread * askMult).toFixed(config.priceDec);

      const bidQty = randFloat(config.qtyMin, config.qtyMax).toFixed(config.qtyDec);
      const askQty = randFloat(config.qtyMin, config.qtyMax).toFixed(config.qtyDec);

      const t1 = Math.random() < 0.5 ? token1 : token2;
      const t2 = Math.random() < 0.5 ? token1 : token2;

      placeOrder(t1, marketKey, "LONG", "limit", bidPrice, bidQty);
      printTicker(marketKey, "LONG", bidPrice, bidQty, t1 === token1 ? "maker-1" : "maker-2", false);

      placeOrder(t2, marketKey, "SHORT", "limit", askPrice, askQty);
      printTicker(marketKey, "SHORT", askPrice, askQty, t2 === token1 ? "maker-1" : "maker-2", false);
    } else {
      // 30% aggressive crossing order
      const side = Math.random() < 0.5 ? "LONG" : "SHORT";
      const crossPct = randFloat(0.05, 0.3);
      const cross = (config.mid * crossPct) / 100;

      const price = (side === "LONG" ? config.mid + cross : config.mid - cross).toFixed(config.priceDec);
      const qty = randFloat(config.qtyMin, config.qtyMax).toFixed(config.qtyDec);
      const t = Math.random() < 0.5 ? token1 : token2;

      placeOrder(t, marketKey, side, "limit", price, qty);
      printTicker(marketKey, side, price, qty, t === token1 ? "maker-1" : "maker-2", true);
    }

    const sleepMs = randFloat(SLEEP_MIN_MS, SLEEP_MAX_MS);
    await sleep(sleepMs);
  }
}

startMarketMaker();

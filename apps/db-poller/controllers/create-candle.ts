import { prisma } from "db";

interface CandleData {
    open: number;
    close: number;
    highest: number;
    lowest: number;
    volume: number;
    timestamp: Date;
}

const supported_asset = ["SOL", "ETH"];
const candles = new Map<string, CandleData>();

function initializeEmptyCandles() {
    for (const asset of supported_asset) {
        candles.set(asset, {
            open: 0,
            close: 0,
            highest: 0,
            lowest: Number.MAX_SAFE_INTEGER,
            volume: 0,
            timestamp: new Date(),
        });
    }
}

async function resetCandles() {
    const completedCandles = Array.from(candles.entries());

    candles.clear();
    initializeEmptyCandles();

    for (const [asset, candleData] of completedCandles) {
        console.log(`Creating candle for ${asset}`);

        if (candleData.lowest === Number.MAX_SAFE_INTEGER) {
            candleData.lowest = 0;
        }

        await prisma.candle.create({
            data: {
                market: asset,
                timestamp: candleData.timestamp,
                open: candleData.open.toString(),
                high: candleData.highest.toString(),
                low: candleData.lowest.toString(),
                close: candleData.close.toString(),
                volume: candleData.volume.toString(),
            },
        });
    }
}

export function updateCandles(
    asset: string,
    price: number,
    quantity: number
) {
    const candle = candles.get(asset);
    if (!candle) return;

    if (candle.open === 0) {
        candle.open = price;
        candle.highest = price;
        candle.lowest = price;
    }

    candle.close = price;

    if (price > candle.highest) {
        candle.highest = price;
    }

    if (price < candle.lowest) {
        candle.lowest = price;
    }

    candle.volume += quantity;
}

export function createCandle() {
    initializeEmptyCandles();

    setInterval(async () => {
        await resetCandles();
    }, 60 * 1000);
}
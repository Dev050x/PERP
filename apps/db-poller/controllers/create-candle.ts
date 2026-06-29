import { prisma } from "db";

interface CandleData {
    open: number;
    close: number;
    highest: number;
    lowest: number;
    timestamp: number;
}

const supported_asset = ["SOL", "ETH"];
const candles = new Map<string, CandleData>();

function initializeEmptyCandles() {
    for (const asset of supported_asset) {
        candles.set(asset, {
            open: 0,
            close: 0,
            highest: 0,
            lowest: 9999999,
            timestamp: Date.now(),
        });
    }
};

async function resetCandles() {
    const completedCandles = Array.from(candles.entries());
    candles.clear();
    for (const [asset, candleData] of completedCandles) {
        console.log(`creating candle for this ${asset}`);
        if (candleData.lowest === 9999999) {
            candleData.lowest = 0;
        }
        await prisma.candle.create({
            data: {
                open: candleData.open.toString(),
                close: candleData.close.toString(),
                high: candleData.highest.toString(),
                low: candleData.lowest.toString(),
                timestamp: candleData.timestamp.toString(),
                market: asset,
            },
        });
    }
}

export function updateCandles(asset: string, price: number) {
    const candle_data = candles.get(asset);
    if (!candle_data) return;

    if (candle_data.open === 0) {
        candle_data.open = price;
        candle_data.highest = price;
        candle_data.lowest = price;
        console.log(`opening price changed for this ${asset} price: ${candle_data.open}`);
    }
    candle_data.close = price;
    if (price > candle_data.highest) {
        candle_data.highest = price;
        console.log(`highest price changed for this ${asset} price: ${candle_data.highest}`);
    }

    if (price < candle_data.lowest) {
        candle_data.lowest = price;
        console.log(`lowest price changed for this ${asset} price: ${candle_data.lowest}`);
    }
}

export async function createCandle() {
    initializeEmptyCandles();
    setInterval(async () => {
        await resetCandles();
    }, 1000 * 60);
}

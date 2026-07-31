export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

const INTERVAL_IN_SECONDS: Record<CandleInterval, number> = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400,
};

export interface DbCandle {
    market: string;
    timestamp: Date;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}

export interface FormattedCandle {
    timestamp: number; // Unix timestamp in seconds
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}

export function aggregateCandles(
    candles: DbCandle[],
    interval: CandleInterval = "1m"
): FormattedCandle[] {
    const bucketSizeSec = INTERVAL_IN_SECONDS[interval] || 60;

    if (interval === "1m") {
        return candles.map((c) => ({
            timestamp: Math.floor(new Date(c.timestamp).getTime() / 1000),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
        }));
    }

    const bucketMap = new Map<
        number,
        {
            timestamp: number;
            open: string;
            high: number;
            low: number;
            close: string;
            volume: number;
        }
    >();

    for (const c of candles) {
        const timeSec = Math.floor(new Date(c.timestamp).getTime() / 1000);
        const bucketTime = Math.floor(timeSec / bucketSizeSec) * bucketSizeSec;

        const highPrice = Number(c.high);
        const lowPrice = Number(c.low);
        const vol = Number(c.volume);

        const existing = bucketMap.get(bucketTime);
        if (!existing) {
            bucketMap.set(bucketTime, {
                timestamp: bucketTime,
                open: c.open,
                high: highPrice,
                low: lowPrice,
                close: c.close,
                volume: vol,
            });
        } else {
            if (highPrice > existing.high) existing.high = highPrice;
            if (lowPrice < existing.low) existing.low = lowPrice;
            existing.close = c.close;
            existing.volume += vol;
        }
    }

    return Array.from(bucketMap.values()).map((b) => ({
        timestamp: b.timestamp,
        open: b.open,
        high: b.high.toString(),
        low: b.low.toString(),
        close: b.close,
        volume: b.volume.toString(),
    }));
}

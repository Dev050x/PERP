export const PRECISION = 8;

export function toBigInt(value: string, precision: number): bigint {
    const [whole, fraction = ""] = value.split(".");

    if (fraction.length > precision) {
        throw new Error("Precison is to high");
    }

    const padded = fraction.padEnd(precision, "0");

    return BigInt(whole + padded);
}

export function toString(input: bigint): string {
    return (input / 1_000_000n).toString();
}
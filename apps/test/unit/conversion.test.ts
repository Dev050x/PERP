import { describe, expect, test } from "bun:test";
import { toBigInt, toString } from "../../engine/src/utils/conversion";

describe("toBigInt", () => {
    test("converts decimal string with full precision", () => {
        expect(toBigInt("123.456", 8)).toBe(12345600000n);
    });

    test("converts integer string with padded precision", () => {
        expect(toBigInt("100", 8)).toBe(10000000000n);
    });

    test("handles maximum precision correctly", () => {
        expect(toBigInt("0.00000001", 8)).toBe(1n);
    });

    test("handles zero fractional part", () => {
        expect(toBigInt("100.00000000", 8)).toBe(10000000000n);
    });

    test("handles whole number without decimal point", () => {
        expect(toBigInt("42", 8)).toBe(4200000000n);
    });

    test("throws when fraction exceeds precision", () => {
        expect(() => toBigInt("1.123456789", 6)).toThrow("Precison is to high");
    });
});

describe("toString", () => {
    test("converts bigint to decimal string with correct precision", () => {

        const result = toString(12345600000n);
        const expected = "123.45600000";
        expect(result).toBe(expected);
    });

    test("converts one unit correctly", () => {
        const result = toString(1n);
        const expected = "0.00000001";
        expect(result).toBe(expected);
    });

    test("handles zero", () => {
        expect(toString(0n)).toBe("0.00000000");
    });

    test("handles large integer values", () => {
        expect(toString(100000000000n)).toBe("1000.00000000");
    });
});

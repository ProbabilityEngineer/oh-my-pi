import { describe, expect, it } from "bun:test";
import type { HashMismatchRange } from "../src/patch/types";

describe("Partial Re-Read", () => {
	it("should have HashMismatchRange interface", () => {
		const range: HashMismatchRange = { start: 1, end: 5 };
		expect(range.start).toBe(1);
		expect(range.end).toBe(5);
	});
});

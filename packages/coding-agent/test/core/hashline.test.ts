import { describe, expect, it } from "bun:test";
import {
	applyHashlineEdits,
	computeLineHash,
	formatHashLines,
	HashlineMismatchError,
	parseTag,
	streamHashLinesFromLines,
	streamHashLinesFromUtf8,
	validateLineRef,
} from "@oh-my-pi/pi-coding-agent/patch";
import { formatLineTag, type HashlineEdit, type LineTag } from "@oh-my-pi/pi-coding-agent/patch/hashline";

function makeTag(line: number, content: string): LineTag {
	return parseTag(formatLineTag(line, content));
}

// ═══════════════════════════════════════════════════════════════════════════
// computeLineHash
// ═══════════════════════════════════════════════════════════════════════════

describe("computeLineHash", () => {
	it("returns 6 character lowercase hex hash string", () => {
		const hash = computeLineHash(1, "hello");
		expect(hash).toMatch(/^[0-9a-f]{6}$/);
	});

	it("same content at same line produces same hash", () => {
		const a = computeLineHash(1, "hello");
		const b = computeLineHash(1, "hello");
		expect(a).toBe(b);
	});

	it("different content produces different hash", () => {
		const a = computeLineHash(1, "hello");
		const b = computeLineHash(1, "world");
		expect(a).not.toBe(b);
	});

	it("empty line produces valid hash", () => {
		const hash = computeLineHash(1, "");
		expect(hash).toMatch(/^[0-9a-f]{6}$/);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// formatHashLines
// ═══════════════════════════════════════════════════════════════════════════

describe("formatHashLines", () => {
	it("formats single line", () => {
		const result = formatHashLines("hello");
		const hash = computeLineHash(1, "hello");
		expect(result).toBe(`1#${hash}|hello`);
	});

	it("formats multiple lines with 1-indexed numbers", () => {
		const result = formatHashLines("foo\nbar\nbaz");
		const lines = result.split("\n");
		expect(lines).toHaveLength(3);
		expect(lines[0]).toStartWith("1#");
		expect(lines[1]).toStartWith("2#");
		expect(lines[2]).toStartWith("3#");
	});

	it("respects custom startLine", () => {
		const result = formatHashLines("foo\nbar", 10);
		const lines = result.split("\n");
		expect(lines[0]).toStartWith("10#");
		expect(lines[1]).toStartWith("11#");
	});

	it("handles empty lines in content", () => {
		const result = formatHashLines("foo\n\nbar");
		const lines = result.split("\n");
		expect(lines).toHaveLength(3);
		expect(lines[1]).toMatch(/^2#[0-9a-f]{6}\|$/);
	});

	it("round-trips with computeLineHash", () => {
		const content = "function hello() {\n  return 42;\n}";
		const formatted = formatHashLines(content);
		const lines = formatted.split("\n");

		for (let i = 0; i < lines.length; i++) {
			const match = lines[i].match(/^(\d+)#([0-9a-f]{6})\|(.*)$/);
			expect(match).not.toBeNull();
			const lineNum = Number.parseInt(match![1], 10);
			const hash = match![2];
			const lineContent = match![3];
			expect(computeLineHash(lineNum, lineContent)).toBe(hash);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// streamHashLinesFromUtf8 / streamHashLinesFromLines
// ═══════════════════════════════════════════════════════════════════════════

describe("streamHashLinesFrom*", () => {
	async function collectText(gen: AsyncIterable<string>): Promise<string> {
		const parts: string[] = [];
		for await (const part of gen) {
			parts.push(part);
		}
		return parts.join("\n");
	}

	async function* utf8Chunks(text: string, chunkSize: number): AsyncGenerator<Uint8Array> {
		const bytes = new TextEncoder().encode(text);
		for (let i = 0; i < bytes.length; i += chunkSize) {
			yield bytes.slice(i, i + chunkSize);
		}
	}

	it("streamHashLinesFromUtf8 matches formatHashLines", async () => {
		const content = "foo\nbar\nbaz";
		const streamed = await collectText(streamHashLinesFromUtf8(utf8Chunks(content, 2), { maxChunkLines: 1 }));
		expect(streamed).toBe(formatHashLines(content));
	});

	it("streamHashLinesFromUtf8 handles empty content", async () => {
		const content = "";
		const streamed = await collectText(streamHashLinesFromUtf8(utf8Chunks(content, 2), { maxChunkLines: 1 }));
		expect(streamed).toBe(formatHashLines(content));
	});

	it("streamHashLinesFromLines matches formatHashLines (including trailing newline)", async () => {
		const content = "foo\nbar\n";
		const lines = ["foo", "bar", ""]; // match `content.split("\\n")`
		const streamed = await collectText(streamHashLinesFromLines(lines, { maxChunkLines: 2 }));
		expect(streamed).toBe(formatHashLines(content));
	});

	it("chunking respects maxChunkLines", async () => {
		const content = "a\nb\nc";
		const parts: string[] = [];
		for await (const part of streamHashLinesFromUtf8(utf8Chunks(content, 1), {
			maxChunkLines: 1,
			maxChunkBytes: 1024,
		})) {
			parts.push(part);
		}
		expect(parts).toHaveLength(3);
		expect(parts.join("\n")).toBe(formatHashLines(content));
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// parseTag
// ═══════════════════════════════════════════════════════════════════════════

describe("parseTag", () => {
	it("parses valid reference", () => {
		const ref = parseTag("5#0077f9");
		expect(ref).toEqual({ line: 5, hash: "0077f9" });
	});

	it("rejects single-character hash", () => {
		expect(() => parseTag("1#Q")).toThrow(/Invalid line reference/);
	});

	it("parses long hash by taking strict 6-char", () => {
		const ref = parseTag("100#0077f9");
		expect(ref).toEqual({ line: 100, hash: "0077f9" });
	});

	it("rejects missing separator", () => {
		expect(() => parseTag("5QQ")).toThrow(/Invalid line reference/);
	});

	it("rejects non-numeric line", () => {
		expect(() => parseTag("abc#Q")).toThrow(/Invalid line reference/);
	});

	it("rejects non-alphanumeric hash", () => {
		expect(() => parseTag("5#$$$$")).toThrow(/Invalid line reference/);
	});

	it("rejects line number 0", () => {
		expect(() => parseTag("0#000000")).toThrow(/Line number must be >= 1/);
	});

	it("rejects empty string", () => {
		expect(() => parseTag("")).toThrow(/Invalid line reference/);
	});

	it("rejects empty hash", () => {
		expect(() => parseTag("5#")).toThrow(/Invalid line reference/);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// validateLineRef
// ═══════════════════════════════════════════════════════════════════════════

describe("validateLineRef", () => {
	it("accepts valid ref with matching hash", () => {
		const lines = ["hello", "world"];
		const hash = computeLineHash(1, "hello");
		expect(() => validateLineRef({ line: 1, hash }, lines)).not.toThrow();
	});

	it("rejects line out of range (too high)", () => {
		const lines = ["hello"];
		const hash = computeLineHash(1, "hello");
		expect(() => validateLineRef({ line: 2, hash }, lines)).toThrow(/does not exist/);
	});

	it("rejects line out of range (zero)", () => {
		const lines = ["hello"];
		expect(() => validateLineRef({ line: 0, hash: "aaaa" }, lines)).toThrow(/does not exist/);
	});

	it("rejects mismatched hash", () => {
		const lines = ["hello", "world"];
		expect(() => validateLineRef({ line: 1, hash: "0000" }, lines)).toThrow(/has changed since last read/);
	});

	it("validates last line correctly", () => {
		const lines = ["a", "b", "c"];
		const hash = computeLineHash(3, "c");
		expect(() => validateLineRef({ line: 3, hash }, lines)).not.toThrow();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// applyHashlineEdits — replace
// ═══════════════════════════════════════════════════════════════════════════

describe("applyHashlineEdits — replace", () => {
	it("replaces single line", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [{ op: "replace", tag: makeTag(2, "bbb"), content: ["BBB"] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nBBB\nccc");
		expect(result.firstChangedLine).toBe(2);
	});

	it("range replace (shrink)", () => {
		const content = "aaa\nbbb\nccc\nddd";
		const edits: HashlineEdit[] = [
			{ op: "replace", first: makeTag(2, "bbb"), last: makeTag(3, "ccc"), content: ["ONE"] },
		];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nONE\nddd");
	});

	it("range replace (same count)", () => {
		const content = "aaa\nbbb\nccc\nddd";
		const edits: HashlineEdit[] = [
			{ op: "replace", first: makeTag(2, "bbb"), last: makeTag(3, "ccc"), content: ["XXX", "YYY"] },
		];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nXXX\nYYY\nddd");
		expect(result.firstChangedLine).toBe(2);
	});

	it("replaces first line", () => {
		const content = "first\nsecond\nthird";
		const edits: HashlineEdit[] = [{ op: "replace", tag: makeTag(1, "first"), content: ["FIRST"] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("FIRST\nsecond\nthird");
		expect(result.firstChangedLine).toBe(1);
	});

	it("replaces last line", () => {
		const content = "first\nsecond\nthird";
		const edits: HashlineEdit[] = [{ op: "replace", tag: makeTag(3, "third"), content: ["THIRD"] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("first\nsecond\nTHIRD");
		expect(result.firstChangedLine).toBe(3);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// applyHashlineEdits — delete
// ═══════════════════════════════════════════════════════════════════════════

describe("applyHashlineEdits — delete", () => {
	it("deletes single line", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [{ op: "replace", tag: makeTag(2, "bbb"), content: [] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nccc");
		expect(result.firstChangedLine).toBe(2);
	});

	it("deletes range of lines", () => {
		const content = "aaa\nbbb\nccc\nddd";
		const edits: HashlineEdit[] = [{ op: "replace", first: makeTag(2, "bbb"), last: makeTag(3, "ccc"), content: [] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nddd");
	});

	it("deletes first line", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [{ op: "replace", tag: makeTag(1, "aaa"), content: [] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("bbb\nccc");
	});

	it("deletes last line", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [{ op: "replace", tag: makeTag(3, "ccc"), content: [] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nbbb");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// applyHashlineEdits — insert
// ═══════════════════════════════════════════════════════════════════════════

describe("applyHashlineEdits — insert", () => {
	it("inserts after a line", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [{ op: "append", after: makeTag(1, "aaa"), content: ["NEW"] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nNEW\nbbb\nccc");
		expect(result.firstChangedLine).toBe(2);
	});

	it("inserts multiple lines", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "append", after: makeTag(1, "aaa"), content: ["x", "y", "z"] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nx\ny\nz\nbbb");
	});

	it("inserts after last line", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "append", after: makeTag(2, "bbb"), content: ["NEW"] }];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nbbb\nNEW");
	});

	it("insert with empty dst throws", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "append", after: makeTag(1, "aaa"), content: [] }];

		expect(() => applyHashlineEdits(content, edits)).toThrow();
	});

	it("inserts at EOF without anchors", () => {
		const content = "aaa\nbbb";
		const edits = [{ op: "append", content: ["NEW"] }] as unknown as HashlineEdit[];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nbbb\nNEW");
		expect(result.firstChangedLine).toBe(3);
	});

	it("inserts at EOF into empty file without anchors", () => {
		const content = "";
		const edits = [{ op: "append", content: ["NEW"] }] as unknown as HashlineEdit[];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("NEW");
		expect(result.firstChangedLine).toBe(1);
	});

	it("insert at EOF with empty dst throws", () => {
		const content = "aaa\nbbb";
		const edits = [{ op: "append", content: [] }] as unknown as HashlineEdit[];

		expect(() => applyHashlineEdits(content, edits)).toThrow();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// applyHashlineEdits — insert (before)
// ═══════════════════════════════════════════════════════════════════════════

describe("applyHashlineEdits — insert (before)", () => {
	it("inserts before a line", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [{ op: "prepend", before: makeTag(2, "bbb"), content: ["NEW"] }];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nNEW\nbbb\nccc");
		expect(result.firstChangedLine).toBe(2);
	});

	it("inserts multiple lines before", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "prepend", before: makeTag(2, "bbb"), content: ["x", "y", "z"] }];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nx\ny\nz\nbbb");
	});

	it("inserts before first line", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "prepend", before: makeTag(1, "aaa"), content: ["NEW"] }];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("NEW\naaa\nbbb");
	});

	it("prepends at BOF without anchor", () => {
		const content = "aaa\nbbb";
		const edits = [{ op: "prepend", content: ["NEW"] }] as unknown as HashlineEdit[];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("NEW\naaa\nbbb");
		expect(result.firstChangedLine).toBe(1);
	});

	it("insert with before and empty text throws", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "prepend", before: makeTag(1, "aaa"), content: [] }];
		expect(() => applyHashlineEdits(content, edits)).toThrow();
	});

	it("insert before and insert after at same line produce correct order", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [
			{ op: "prepend", before: makeTag(2, "bbb"), content: ["BEFORE"] },
			{ op: "append", after: makeTag(2, "bbb"), content: ["AFTER"] },
		];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nBEFORE\nbbb\nAFTER\nccc");
	});

	it("insert before with set at same line", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [
			{ op: "prepend", before: makeTag(2, "bbb"), content: ["BEFORE"] },
			{ op: "replace", tag: makeTag(2, "bbb"), content: ["BBB"] },
		];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nBEFORE\nBBB\nccc");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// applyHashlineEdits — insert (between)
// ═══════════════════════════════════════════════════════════════════════════

describe("applyHashlineEdits — insert (between)", () => {
	it("inserts between adjacent anchors", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [
			{ op: "insert", after: makeTag(1, "aaa"), before: makeTag(2, "bbb"), content: ["NEW"] },
		];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nNEW\nbbb\nccc");
		expect(result.firstChangedLine).toBe(2);
	});

	it("inserts multiple lines between anchors", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [
			{
				op: "insert",
				after: makeTag(1, "aaa"),
				before: makeTag(2, "bbb"),
				content: ["x", "y", "z"],
			},
		];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nx\ny\nz\nbbb\nccc");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// applyHashlineEdits — heuristics
// ═══════════════════════════════════════════════════════════════════════════

describe("applyHashlineEdits — heuristics", () => {
	it("accepts polluted src that starts with LINE#ID but includes trailing content", () => {
		const content = "aaa\nbbb\nccc";
		const srcHash = computeLineHash(2, "bbb");
		const edits: HashlineEdit[] = [
			{
				op: "replace",
				tag: parseTag(`2#${srcHash}export function foo(a, b) {}`), // comma in trailing content
				content: ["BBB"],
			},
		];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nBBB\nccc");
	});

	it("does not override model whitespace choices in replacement content", () => {
		const content = ["import { foo } from 'x';", "import { bar } from 'y';", "const x = 1;"].join("\n");
		const edits: HashlineEdit[] = [
			{
				op: "replace",
				first: makeTag(1, "import { foo } from 'x';"),
				last: makeTag(2, "import { bar } from 'y';"),
				content: ["import {foo} from 'x';", "import { bar } from 'y';", "// added"],
			},
		];
		const result = applyHashlineEdits(content, edits);
		const outLines = result.content.split("\n");
		// Model's whitespace choice is respected -- no longer overridden
		expect(outLines[0]).toBe("import {foo} from 'x';");
		expect(outLines[1]).toBe("import { bar } from 'y';");
		expect(outLines[2]).toBe("// added");
		expect(outLines[3]).toBe("const x = 1;");
	});

	it("treats same-line ranges as single-line replacements", () => {
		const content = "aaa\nbbb\nccc";
		const good = makeTag(2, "bbb");
		const edits: HashlineEdit[] = [{ op: "replace", first: good, last: good, content: ["BBB"] }];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nBBB\nccc");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// applyHashlineEdits — multiple edits
// ═══════════════════════════════════════════════════════════════════════════

describe("applyHashlineEdits — multiple edits", () => {
	it("applies two non-overlapping replaces (bottom-up safe)", () => {
		const content = "aaa\nbbb\nccc\nddd\neee";
		const edits: HashlineEdit[] = [
			{ op: "replace", tag: makeTag(2, "bbb"), content: ["BBB"] },
			{ op: "replace", tag: makeTag(4, "ddd"), content: ["DDD"] },
		];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nBBB\nccc\nDDD\neee");
		expect(result.firstChangedLine).toBe(2);
	});

	it("applies replace + delete in one call", () => {
		const content = "aaa\nbbb\nccc\nddd";
		const edits: HashlineEdit[] = [
			{ op: "replace", tag: makeTag(2, "bbb"), content: ["BBB"] },
			{ op: "replace", tag: makeTag(4, "ddd"), content: [] },
		];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nBBB\nccc");
	});

	it("applies replace + insert in one call", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [
			{ op: "replace", tag: makeTag(3, "ccc"), content: ["CCC"] },
			{ op: "append", after: makeTag(1, "aaa"), content: ["INSERTED"] },
		];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nINSERTED\nbbb\nCCC");
	});

	it("applies non-overlapping edits against original anchors when line counts change", () => {
		const content = "one\ntwo\nthree\nfour\nfive\nsix";
		const edits: HashlineEdit[] = [
			{
				op: "replace",
				first: makeTag(2, "two"),
				last: makeTag(3, "three"),
				content: ["TWO_THREE"],
			},
			{ op: "replace", tag: makeTag(6, "six"), content: ["SIX"] },
		];

		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("one\nTWO_THREE\nfour\nfive\nSIX");
	});

	it("empty edits array is a no-op", () => {
		const content = "aaa\nbbb";
		const result = applyHashlineEdits(content, []);
		expect(result.content).toBe(content);
		expect(result.firstChangedLine).toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// applyHashlineEdits — error cases
// ═══════════════════════════════════════════════════════════════════════════

describe("applyHashlineEdits — errors", () => {
	it("rejects stale hash", () => {
		const content = "aaa\nbbb\nccc";
		// Use a hash that doesn't match line 2
		const edits: HashlineEdit[] = [{ op: "replace", tag: parseTag("2#000000"), content: ["BBB"] }];
		expect(() => applyHashlineEdits(content, edits)).toThrow(HashlineMismatchError);
	});

	it("stale hash error shows >>> markers with correct hashes", () => {
		const content = "aaa\nbbb\nccc\nddd\neee";
		const edits: HashlineEdit[] = [{ op: "replace", tag: parseTag("2#000000"), content: ["BBB"] }];

		try {
			applyHashlineEdits(content, edits);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(HashlineMismatchError);
			const msg = (err as HashlineMismatchError).message;
			// Should contain >>> marker on the mismatched line
			expect(msg).toContain(">>>");
			// Should show the correct hash for line 2
			const correctHash = computeLineHash(2, "bbb");
			expect(msg).toContain(`2#${correctHash}|bbb`);
			// Context lines should NOT have >>> markers
			const lines = msg.split("\n");
			const contextLines = lines.filter(l => l.startsWith("    ") && !l.startsWith("    ...") && l.includes("#"));
			expect(contextLines.length).toBeGreaterThan(0);
		}
	});

	it("stale hash error collects all mismatches", () => {
		const content = "aaa\nbbb\nccc\nddd\neee";
		// Use hashes that don't match any line
		const edits: HashlineEdit[] = [
			{ op: "replace", tag: parseTag("2#000001"), content: ["BBB"] },
			{ op: "replace", tag: parseTag("4#000002"), content: ["DDD"] },
		];

		try {
			applyHashlineEdits(content, edits);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(HashlineMismatchError);
			const e = err as HashlineMismatchError;
			expect(e.mismatches).toHaveLength(2);
			expect(e.mismatches[0].line).toBe(2);
			expect(e.mismatches[1].line).toBe(4);
			// Both lines should have >>> markers
			const markerLines = e.message.split("\n").filter(l => l.startsWith(">>>"));
			expect(markerLines).toHaveLength(2);
		}
	});

	it("does not relocate stale line refs even when hash uniquely matches another line", () => {
		const content = "aaa\nbbb\nccc";
		const staleButUnique = parseTag(`2#${computeLineHash(1, "ccc")}`);
		const edits: HashlineEdit[] = [{ op: "replace", tag: staleButUnique, content: ["CCC"] }];
		try {
			applyHashlineEdits(content, edits);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(HashlineMismatchError);
			const e = err as HashlineMismatchError;
			expect(e.mismatches[0].line).toBe(2);
		}
	});

	it("does not relocate when expected hash is non-unique", () => {
		const content = "dup\nmid\ndup";
		const staleDuplicate = parseTag(`2#${computeLineHash(1, "dup")}`);
		const edits: HashlineEdit[] = [{ op: "replace", tag: staleDuplicate, content: ["DUP"] }];

		expect(() => applyHashlineEdits(content, edits)).toThrow(HashlineMismatchError);
	});

	it("rejects out-of-range line", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "replace", tag: parseTag("10#000000"), content: ["X"] }];

		expect(() => applyHashlineEdits(content, edits)).toThrow(/does not exist/);
	});

	it("rejects range with start > end", () => {
		const content = "aaa\nbbb\nccc\nddd\neee";
		const edits: HashlineEdit[] = [
			{ op: "replace", first: makeTag(5, "eee"), last: makeTag(2, "bbb"), content: ["X"] },
		];

		expect(() => applyHashlineEdits(content, edits)).toThrow();
	});

	it("rejects insert with after and empty text", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "append", after: makeTag(1, "aaa"), content: [] }];

		expect(() => applyHashlineEdits(content, edits)).toThrow();
	});

	it("rejects insert with before and empty text", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [{ op: "prepend", before: makeTag(1, "aaa"), content: [] }];
		expect(() => applyHashlineEdits(content, edits)).toThrow();
	});

	it("rejects insert with both anchors and empty text", () => {
		const content = "aaa\nbbb";
		const edits: HashlineEdit[] = [
			{ op: "insert", after: makeTag(1, "aaa"), before: makeTag(2, "bbb"), content: [] },
		];
		expect(() => applyHashlineEdits(content, edits)).toThrow();
	});

	it("inserts with non-adjacent anchors (before the 'before' anchor)", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [
			{ op: "insert", after: makeTag(1, "aaa"), before: makeTag(3, "ccc"), content: ["NEW"] },
		];
		const result = applyHashlineEdits(content, edits);
		expect(result.content).toBe("aaa\nbbb\nNEW\nccc");
	});
	it("rejects insert with reversed anchors (before <= after)", () => {
		const content = "aaa\nbbb\nccc";
		const edits: HashlineEdit[] = [
			{ op: "insert", after: makeTag(3, "ccc"), before: makeTag(1, "aaa"), content: ["NEW"] },
		];
		expect(() => applyHashlineEdits(content, edits)).toThrow(/after.*<.*before/);
	});
});
// ═══════════════════════════════════════════════════════════════════════════
// Scenario Tests for Hashline Improvements (oh-my-pi-sjw)
// ═══════════════════════════════════════════════════════════════════════════

describe("Scenario: 6-char hash collision resistance", () => {
	it("demonstrates 6-char hash space is significantly larger than 2-char", () => {
		// 2-char hex: 16^2 = 256 combinations
		// 6-char hex: 16^6 = 16,777,216 combinations
		// This test verifies the hash length is actually 6 chars
		const hash = computeLineHash(1, "test");
		expect(hash).toHaveLength(6);
		expect(hash).toMatch(/^[0-9a-f]{6}$/);
	});

	it("produces unique hashes for similar but different content", () => {
		// Test that small changes produce different 6-char hashes
		const lines = ["const x = 1;", "const x = 2;", "const x = 10;", "const y = 1;"];
		const hashes = lines.map((line, i) => computeLineHash(i + 1, line));

		// All hashes should be unique
		const uniqueHashes = new Set(hashes);
		expect(uniqueHashes.size).toBe(hashes.length);
	});

	it("handles realistic code collision scenarios", () => {
		// Simulate common code patterns that might collide
		const patterns = [
			"import { foo } from './foo';",
			"import { bar } from './bar';",
			"import { baz } from './baz';",
			"export function test() {}",
			"export function test2() {}",
			"export function testing() {}",
			"if (condition) {",
			"if (conditions) {",
			"if (conditioned) {",
		];

		const hashes = patterns.map((line, i) => computeLineHash(i + 1, line));
		const uniqueHashes = new Set(hashes);

		// With 6-char hashes, collision probability is extremely low
		// Even with similar content, all should be unique
		expect(uniqueHashes.size).toBe(patterns.length);
	});

	it("maintains hash stability across multiple invocations", () => {
		const content = "function calculateTotal(items: Item[]): number {";
		const lineNum = 42;

		// Hash should be deterministic
		const hash1 = computeLineHash(lineNum, content);
		const hash2 = computeLineHash(lineNum, content);
		const hash3 = computeLineHash(lineNum, content);

		expect(hash1).toBe(hash2);
		expect(hash2).toBe(hash3);
		expect(hash1).toHaveLength(6);
	});
});

describe("Scenario: Pipe separator parsing", () => {
	it("formatHashLines uses pipe separator correctly", () => {
		const content = "hello\nworld";
		const formatted = formatHashLines(content);
		const lines = formatted.split("\n");

		// Each line should have format: LINENUM#HASH|CONTENT
		lines.forEach((line, i) => {
			const parts = line.split("|");
			expect(parts).toHaveLength(2);
			const [tag, content] = parts;
			expect(tag).toMatch(/^\d+#[0-9a-f]{6}$/);
			expect(content).toBe(i === 0 ? "hello" : "world");
		});
	});

	it("handles content with pipe characters", () => {
		// Content containing pipes should still parse correctly
		const content = "const regex = /a|b/;";
		const formatted = formatHashLines(content);
		const lines = formatted.split("\n");

		// First pipe after hash is the separator
		const firstPipe = lines[0].indexOf("|");
		expect(firstPipe).toBeGreaterThan(0);

		// Everything after first pipe is content
		const tag = lines[0].substring(0, firstPipe);
		const contentPart = lines[0].substring(firstPipe + 1);

		expect(tag).toMatch(/^\d+#[0-9a-f]{6}$/);
		expect(contentPart).toBe("const regex = /a|b/;");
	});

	it("handles empty lines with pipe separator", () => {
		const content = "line1\n\nline3";
		const formatted = formatHashLines(content);
		const lines = formatted.split("\n");

		expect(lines).toHaveLength(3);
		expect(lines[0]).toMatch(/^1#[0-9a-f]{6}\|line1$/);
		expect(lines[1]).toMatch(/^2#[0-9a-f]{6}\|$/); // Empty content
		expect(lines[2]).toMatch(/^3#[0-9a-f]{6}\|line3$/);
	});

	it("handles lines with multiple pipes", () => {
		const content = "a|b|c|d";
		const formatted = formatHashLines(content);
		const lines = formatted.split("\n");

		// Split on first pipe only
		const firstPipe = lines[0].indexOf("|");
		const tag = lines[0].substring(0, firstPipe);
		const contentPart = lines[0].substring(firstPipe + 1);

		expect(tag).toMatch(/^\d+#[0-9a-f]{6}$/);
		expect(contentPart).toBe("a|b|c|d");
	});

	it("streamHashLinesFromLines preserves pipe separator format", async () => {
		const lines = ["foo", "bar", "baz"];
		const chunks: string[] = [];

		for await (const chunk of streamHashLinesFromLines(lines, { maxChunkLines: 2 })) {
			chunks.push(chunk);
		}

		const result = chunks.join("\n");
		const resultLines = result.split("\n");

		expect(resultLines).toHaveLength(3);
		resultLines.forEach(line => {
			expect(line).toContain("|");
			const [tag] = line.split("|");
			expect(tag).toMatch(/^\d+#[0-9a-f]{6}$/);
		});
	});
});

describe("Scenario: Partial re-read on hash mismatch", () => {
	it("HashlineMismatchError contains affectedRanges", () => {
		const content = "line1\nline2\nline3\nline4\nline5";
		const edits = [
			{ op: "replace" as const, tag: parseTag("2#000000"), content: ["NEW2"] },
			{ op: "replace" as const, tag: parseTag("4#000000"), content: ["NEW4"] },
		];

		try {
			applyHashlineEdits(content, edits);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(HashlineMismatchError);
			const e = err as HashlineMismatchError;

			// Should have 2 mismatches
			expect(e.mismatches).toHaveLength(2);
			expect(e.mismatches[0].line).toBe(2);
			expect(e.mismatches[1].line).toBe(4);

			// Should compute affected ranges (non-contiguous)
			expect(e.affectedRanges).toHaveLength(2);
			expect(e.affectedRanges[0]).toEqual({ start: 2, end: 2 });
			expect(e.affectedRanges[1]).toEqual({ start: 4, end: 4 });
		}
	});

	it("compacts contiguous mismatch lines into ranges", () => {
		const content = "line1\nline2\nline3\nline4\nline5";
		// Create mismatches on contiguous lines 2, 3, 4
		const edits = [
			{ op: "replace" as const, tag: parseTag("2#000000"), content: ["NEW2"] },
			{ op: "replace" as const, tag: parseTag("3#000000"), content: ["NEW3"] },
			{ op: "replace" as const, tag: parseTag("4#000000"), content: ["NEW4"] },
		];

		try {
			applyHashlineEdits(content, edits);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(HashlineMismatchError);
			const e = err as HashlineMismatchError;

			// 3 mismatches but only 1 contiguous range
			expect(e.mismatches).toHaveLength(3);
			expect(e.affectedRanges).toHaveLength(1);
			expect(e.affectedRanges[0]).toEqual({ start: 2, end: 4 });
		}
	});

	it("compacts mixed contiguous and non-contiguous lines", () => {
		const content = "line1\nline2\nline3\nline4\nline5\nline6\nline7";
		// Mismatches on 2, 3 (contiguous) and 5, 7 (non-contiguous)
		const edits = [
			{ op: "replace" as const, tag: parseTag("2#000000"), content: ["NEW2"] },
			{ op: "replace" as const, tag: parseTag("3#000000"), content: ["NEW3"] },
			{ op: "replace" as const, tag: parseTag("5#000000"), content: ["NEW5"] },
			{ op: "replace" as const, tag: parseTag("7#000000"), content: ["NEW7"] },
		];

		try {
			applyHashlineEdits(content, edits);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(HashlineMismatchError);
			const e = err as HashlineMismatchError;

			expect(e.mismatches).toHaveLength(4);
			// Should compact to: [2-3], [5], [7]
			expect(e.affectedRanges).toHaveLength(3);
			expect(e.affectedRanges[0]).toEqual({ start: 2, end: 3 });
			expect(e.affectedRanges[1]).toEqual({ start: 5, end: 5 });
			expect(e.affectedRanges[2]).toEqual({ start: 7, end: 7 });
		}
	});

	it("provides remaps for automatic retry", () => {
		const content = "aaa\nbbb\nccc";
		const staleTag = parseTag("2#000000");
		const edits = [{ op: "replace" as const, tag: staleTag, content: ["BBB"] }];

		try {
			applyHashlineEdits(content, edits);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(HashlineMismatchError);
			const e = err as HashlineMismatchError;

			// remaps should contain the correct hash
			const correctHash = computeLineHash(2, "bbb");
			const staleKey = `2#000000`;
			const correctTag = `2#${correctHash}`;

			expect(e.remaps.has(staleKey)).toBe(true);
			expect(e.remaps.get(staleKey)).toBe(correctTag);
		}
	});

	it("error message shows context lines with correct format", () => {
		const content = "line1\nline2\nline3\nline4\nline5";
		const edits = [{ op: "replace" as const, tag: parseTag("3#000000"), content: ["NEW3"] }];

		try {
			applyHashlineEdits(content, edits);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(HashlineMismatchError);
			const e = err as HashlineMismatchError;
			const msg = e.message;

			// Should show mismatch line with >>> marker
			const correctHash = computeLineHash(3, "line3");
			expect(msg).toContain(`>>> 3#${correctHash}|line3`);

			// Should show context lines without >>> marker
			const contextHash2 = computeLineHash(2, "line2");
			const contextHash4 = computeLineHash(4, "line4");
			expect(msg).toContain(`2#${contextHash2}|line2`);
			expect(msg).toContain(`4#${contextHash4}|line4`);
		}
	});
});

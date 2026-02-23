# Partial Re-Read Implementation Analysis

**Date:** 2026-02-23  
**Status:** Not Implemented - Requires New Functionality

---

## Current State

### What Exists (Data Structures Only)

| Feature | Location | Status |
|---------|----------|--------|
| `HashlineMismatchError` | `patch/hashline.ts:477` | ✅ Exists |
| `affectedRanges: HashMismatchRange[]` | `patch/hashline.ts:480` | ✅ Exists |
| `compactLineRanges()` | `patch/hashline.ts:967` | ✅ Exists |

### What's Missing (Implementation)

| Feature | Expected | Actual | Status |
|---------|----------|--------|--------|
| `ranges` param in read tool | `ranges: HashMismatchRange[]` | Only `offset`/`limit` | ❌ Missing |
| Edit tool error with `affectedRanges` | Exposed in `EditToolDetails` | Not exposed | ❌ Missing |
| Agent auto-re-read on mismatch | Detect error + auto-trigger | Not implemented | ❌ Missing |
| Depth-first search pattern | Use LSP first, ast-grep fallback | Hardcoded flow | ⚠️ Not guiding |

---

## What Needs to Be Implemented

### 1. Read Tool Schema Extension

**Current:**
```typescript
const readSchema = Type.Object({
  path: Type.String({ description: "Path to the file to read (relative or absolute)" }),
  offset: Type.Optional(Type.Number({ description: "Line number to start reading from (1-indexed)" })),
  limit: Type.Optional(Type.Number({ description: "Maximum number of lines to read" })),
});
```

**Required:**
```typescript
const readSchema = Type.Object({
  path: Type.String({ description: "Path to the file to read (relative or absolute)" }),
  offset: Type.Optional(Type.Number({ description: "Line number to start reading from (1-indexed)" })),
  limit: Type.Optional(Type.Number({ description: "Maximum number of lines to read" })),
  ranges: Type.Optional(
    Type.Array(
      Type.Object({
        start: Type.Number({ description: "1-indexed start line (inclusive)" }),
        end: Type.Number({ description: "1-indexed end line (inclusive)" }),
      }),
      { description: "Ranges of lines to read (overrides offset/limit when provided)" },
    ),
  ),
});
```

### 2. Edit Tool Details Extension

**Current:**
```typescript
export interface EditToolDetails {
  diff: string;
  firstChangedLine?: number;
  diagnostics?: FileDiagnosticsResult;
  op?: Operation;
  rename?: string;
  meta?: OutputMeta;
}
```

**Required:**
```typescript
import type { HashMismatchRange } from "./types";

export interface EditToolDetails {
  diff: string;
  firstChangedLine?: number;
  diagnostics?: FileDiagnosticsResult;
  op?: Operation;
  rename?: string;
  meta?: OutputMeta;
  affectedRanges?: HashMismatchRange[]; // New field
}
```

### 3. HashlineMismatchError Update

**Current:**
```typescript
export class HashlineMismatchError extends Error {
  readonly remaps: ReadonlyMap<string, string>;
  readonly affectedRanges: HashMismatchRange[];

  constructor(
    public readonly mismatches: HashMismatch[],
    public readonly fileLines: string[],
  ) {
    super(HashlineMismatchError.formatMessage(mismatches, fileLines));
    this.name = "HashlineMismatchError";
    const remaps = new Map<string, string>();
    for (const m of mismatches) {
      const actual = computeLineHash(m.line, fileLines[m.line - 1]);
      remaps.set(`${m.line}#${m.expected}`, `${m.line}#${actual}`);
    }
    this.remaps = remaps;
    this.affectedRanges = compactLineRanges(mismatches.map(m => m.line));
  }
}
```

**Update needed:** Store mismatch details alongside ranges for better error reporting.

### 4. Agent Session Integration

**Required:**
```typescript
// In agent-session.ts after tool execution
if (toolName === "edit" && result.details?.affectedRanges) {
  // Auto-trigger read with affected ranges
  const readResult = await executeTool("read", {
    path: editPath,
    ranges: result.details.affectedRanges,
  });
  
  // Update context with new hashlines
  updateContextWithNewHashlines(readResult.content);
  
  // Retry edit with fresh hashlines
  await executeTool("edit", freshEditParams);
}
```

### 5. Partial Read Implementation

```typescript
// In tools/read.ts - modify execute() to handle ranges
async execute(params, signal) {
  const { path, offset, limit, ranges } = params;
  
  if (ranges && ranges.length > 0) {
    // Read specific ranges
    const content = await readRanges(path, ranges, signal);
    return { content, ok: true };
  }
  
  // Default offset/limit behavior
  // ... existing code
}
```

---

## Implementation Dependencies

```
Partial Re-Read
│
├── 1. Update Read Tool Schema (ranges parameter)
│   └── read.ts:532-536
│
├── 2. Update Edit Tool Details (affectedRanges field)
│   └── patch/shared.ts:51-64
│
├── 3. Implement ranges Reading in Read Tool
│   ├── patch/shared.ts: Add readRanges helper
│   └── tools/read.ts:575-800 (execute method)
│
├── 4. Capture affectedRanges in Hashline Mode Edit
│   ├── patch/index.ts: collect ranges into EditToolDetails
│   └── patch/index.ts:513-800 (executeHashline method)
│
├── 5. Agent Session Auto-Re-Read Logic
│   └── agent-session.ts: after tool execution hook
│
└── 6. Update Context With New Hashlines
    ├── agent-session.ts: context update method
    └── tools/read.ts: new hashline update flow
```

---

## Commit Slice Breakdown

### Slice 1: Schema & Types
- `tools/read.ts` - Add `ranges` parameter to schema
- `patch/shared.ts` - Add `affectedRanges` to `EditToolDetails`
- `patch/types.ts` - Import `HashMismatchRange` type

### Slice 2: Read Tool Implementation
- `tools/read.ts` - Implement `readRanges()` helper
- `tools/read.ts` - Update `execute()` to handle ranges
- `test/tools/read.test.ts` - Add ranges test

### Slice 3: Edit Tool Capture
- `patch/index.ts` - Extract `affectedRanges` from `HashlineMismatchError`
- `patch/index.ts` - Include in `EditToolDetails` result
- `test/patch/index.test.ts` - Add hashline mismatch test

### Slice 4: Agent Session Integration
- `agent-session.ts` - Detect edit error with `affectedRanges`
- `agent-session.ts` - Auto-trigger read with ranges
- `agent-session.ts` - Update context with new hashlines
- `test/agent-session.test.ts` - Add auto-re-read test

---

## Testing Strategy

### Unit Tests

```typescript
// test/tools/read-ranges.test.ts
describe("read with ranges", () => {
  it("reads specific line ranges", async () => {
    const content = await readFileRanges(filepath, [{ start: 10, end: 20 }]);
    expect(content).toMatch("lines 10-20");
  });
  
  it("handles multiple non-contiguous ranges", async () => {
    const content = await readFileRanges(filepath, [
      { start: 1, end: 5 },
      { start: 10, end: 15 },
    ]);
    expect(content).toMatch("lines 1-5");
    expect(content).toMatch("lines 10-15");
  });
});

// test/patch/edit-hashline.test.ts
describe("hashline edit with mismatch", () => {
  it("captures affectedRanges in error", async () => {
    const result = await executeHashlineEdit WithMismatch();
    expect(result.details.affectedRanges).toHaveLength(1);
    expect(result.details.affectedRanges[0]).toEqual({ start: 5, end: 7 });
  });
});
```

### Integration Tests

```typescript
// test/agent-session-hashline.test.ts
describe("agent with hashline mismatch", () => {
  it("auto-reads affected ranges on edit failure", async () => {
    // Setup: File changed externally
    // Action: Agent tries hashline edit with stale hashes
    // Assert: Read with ranges is called
    // Assert: Edit retried successfully
  });
});
```

---

## Risk Mitigation

### Risk: Breaking existing read tool behavior
**Mitigation:** `ranges` is optional, preserve `offset`/`limit` behavior for existing calls

### Risk: Complex line merging logic
**Mitigation:** Use `compactLineRanges()` for simple range handling, avoid complex overlap logic

### Risk: Agent session complexity
**Mitigation:** Isolate auto-re-read in single hook, keep changes minimal

---

## Estimated Effort

| Task | Time |
|------|------|
| Schema & Types | 0.5 day |
| Read Tool Implementation | 1 day |
| Edit Tool Capture | 0.5 day |
| Agent Session Integration | 1 day |
| Testing | 1 day |
| Documentation | 0.5 day |
| **Total** | **4.5 days** |

---

## Recommendation

**Proceed with implementation** as P0. The data structures exist, only implementation is missing. This is a focused, well-defined change that completes the hashline editing workflow.

**Next:** Begin Slice 1 - Update Read Tool Schema + Edit Tool Details

# Next Agent Handoff: Partial Re-Read Auto-Retry

## Mission

Complete the automatic partial re-read and retry feature for hashline mismatches in the edit tool.

## Read These First

1. `ISSUES.json` - Audit findings and requirements
2. `IMPLEMENTATION_PROMPT.md` - Detailed implementation guide
3. Beads: `oh-my-pi-16s`, `oh-my-pi-l5l`, `oh-my-pi-vmk`

## What's Done ✓

- `HashlineMismatchError` with `affectedRanges` (hashline.ts:329)
- `ranges` parameter in read tool schema
- `#readRanges()` method (read.ts:1066-1134)
- `affectedRanges` extraction from errors (agent-session.ts:671)

## What's Broken ✗

Current code at `agent-session.ts:671-681` only steers a user message:
```typescript
this.agent.steer({
    role: "user",
    content: "Please re-read the file..."  // User must manually re-read and retry
});
```

## What You Must Build

### Task 1 (oh-my-pi-l5l): Auto-Trigger Read
Replace steer message with actual read tool call:
```typescript
// Call read tool with affected ranges
const readResult = await this.tools.execute("read", {
    path,
    ranges: details.affectedRanges
}, signal);
```

### Task 2 (oh-my-pi-vmk): Auto-Retry Edit
After re-read completes:
1. Update context with fresh hashlines
2. Automatically re-execute the failed edit
3. Implement max retry count (3)
4. Handle different error types

## Files to Modify

- `packages/coding-agent/src/session/agent-session.ts` (lines 671-681 + retry state)
- `packages/coding-agent/test/partial-re-read-auto.test.ts` (new test file)

## Acceptance Criteria

- Hash mismatch → auto read tool call (no user message)
- Fresh hashlines → auto edit retry (no user intervention)
- Max 3 retries prevents infinite loops
- All existing tests pass
- New tests cover auto-retry scenarios

## Verify Before Done

```bash
bun check:ts
bun test test/core/hashline.test.ts
bun test test/partial-re-read-auto.test.ts
```

## Commit Strategy

Slice commits:
1. `feat(session): auto-trigger read tool on hashline mismatch`
2. `feat(session): implement automatic edit retry after re-read`
3. `test(session): add partial re-read auto-retry scenarios`

Push to `epic/partial-re-read-auto` branch when complete.

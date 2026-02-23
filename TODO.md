# Partial Re-Read Auto-Retry Implementation Plan

## Current Status
The partial re-read feature has infrastructure but is not fully functional:
- ✅ `affectedRanges` returned in edit tool errors on hash mismatch
- ✅ `ranges` parameter defined in read tool schema  
- ❌ Read tool doesn't implement ranges functionality
- ❌ Agent session only steers user message instead of auto-triggering
- ❌ No automatic retry mechanism

## Beads Structure

### Epic: oh-my-pi-wip-partial-re-read
**Task List:**
| Task ID | Content | Type | Status |
|---------|---------|------|--------|
| oh-my-pi-wip-audit | Audit: Verify current partial re-read state | audit | pending |
| oh-my-pi-wip-design | Design: Auto-retry architecture | design | pending |
| oh-my-pi-wip-impl-read | Implementation: Add ranges support to read tool | implementation | pending |
| oh-my-pi-wip-impl-agent | Implementation: Add auto-trigger to agent session | implementation | pending |
| oh-my-pi-wip-wiring | Wiring: Connect edit errors to auto re-read | wiring | pending |
| oh-my-pi-wip-test | Tests: Auto re-read scenario tests | testing | pending |
| oh-my-pi-wip-docs | Documentation: Update partial re-read docs | docs | pending |

## Branch Strategy
- **Branch**: `epic/wip-partial-re-read`
- **Lifecycle**: Merge after completion
- **Protection**: PR required, CI must pass

## Commit Slice Strategy

### Commit 1: Audit & Design
```typescript
commit("audit(patch): verify partial re-read current state")
// - Document current gaps
// - Define auto-retry requirements

commit("design(patch): define auto-retry architecture")  
// - Agent session error handling flow
// - Read tool ranges implementation plan
```

### Commit 2: Read Tool Ranges Implementation
```typescript
commit("feat(tools): implement ranges parameter in read tool")
// - Handle ranges array in execute method
// - Convert ranges to offset/limit for streaming
// - Support multiple non-contiguous ranges
// - Add validation and error handling
```

### Commit 3: Agent Session Auto-Trigger
```typescript
commit("feat(session): add auto-re-read trigger for hash mismatches")
// - Replace steering message with actual read tool call
// - Handle read tool response and context update
// - Add retry logic with fresh hashlines
```

### Commit 4: Wiring & Integration
```typescript
commit("wiring(patch): connect edit errors to auto re-read")
// - Integrate read tool ranges with agent session
// - Handle edge cases (concurrent edits, failures)
// - Update context with fresh hashlines
```

### Commit 5: Testing
```typescript
commit("test(patch): add auto re-read scenario tests")
// - Hash mismatch triggers auto re-read
// - Multiple ranges handled correctly  
// - Retry succeeds with fresh hashlines
// - Edge cases covered
```

### Commit 6: Documentation
```typescript
commit("docs(patch): update partial re-read documentation")
// - Update partial-re-read-complete.md
// - Add auto-retry section
// - Document new behavior
```

## Acceptance Criteria
- [ ] Edit tool hash mismatch automatically triggers read with affected ranges
- [ ] Read tool accepts and processes ranges parameter correctly
- [ ] Agent session updates context with fresh hashlines
- [ ] Edit automatically retries with updated hashlines
- [ ] All existing tests continue to pass
- [ ] New scenario tests cover auto-retry flow
- [ ] Documentation updated

## Implementation Files
**Modified:**
- `packages/coding-agent/src/tools/read.ts` - Add ranges implementation
- `packages/coding-agent/src/session/agent-session.ts` - Add auto-trigger logic
- `packages/coding-agent/src/patch/index.ts` - Ensure proper error propagation

**New Tests:**
- `packages/coding-agent/test/partial-re-read-auto.test.ts` - Auto-retry scenarios

## Timeline Estimate
- **Total**: 3-5 days
- **Phase 1** (Days 1-2): Read tool ranges implementation
- **Phase 2** (Days 2-3): Agent session auto-trigger  
- **Phase 3** (Days 3-4): Wiring and integration
- **Phase 4** (Days 4-5): Testing and documentation
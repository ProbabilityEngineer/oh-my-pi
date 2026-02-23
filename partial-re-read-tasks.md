# Partial Re-Read Epic - Task Plan

**Branch:** `epic/partial-re-read`  
**Epic ID:** `oh-my-pi-dpr`  
**Priority:** P0  
**Estimated Time:** 4.5 days

---

## Dependency Graph

```
oh-my-pi-dpr-1 (audit) ──────┐
                             ├─→ oh-my-pi-dpr-2 (schema)
oh-my-pi-dpr-2 (schema) ─────┤
                             ├─→ oh-my-pi-dpr-3 (read-impl)
oh-my-pi-dpr-3 (read-impl) ──┤
                             ├─→ oh-my-pi-dpr-4 (edit-capture)
oh-my-pi-dpr-4 (edit-capture)┤
                             ├─→ oh-my-pi-dpr-5 (agent)
oh-my-pi-dpr-5 (agent) ──────┤
                             └─→ oh-my-pi-dpr-6 (test)
oh-my-pi-dpr-6 (test) ───────┘
                             └─→ oh-my-pi-dpr-7 (docs)
oh-my-pi-dpr-7 (docs) ───────┘
```

---

## Tasks

### oh-my-pi-dpr-1: Audit

**Type:** Audit  
**Dependencies:** None  
**Duration:** 0.5 day

**Description:** Verify partial re-read requirements from backport guide

**Acceptance:**
- [ ] Confirm `HashlineMismatchError.affectedRanges` exists
- [ ] Confirm `compactLineRanges()` implementation
- [ ] Confirm `read` tool schema (offset/limit only, no ranges)
- [ ] Confirm `EditToolDetails` has no affectedRanges field
- [ ] Document missing pieces from backport guide

**Files to Check:**
- `packages/coding-agent/src/patch/hashline.ts`
- `packages/coding-agent/src/patch/shared.ts`
- `packages/coding-agent/src/tools/read.ts`
- `packages/coding-agent/src/tools/edit.ts`

---

### oh-my-pi-dpr-2: Schema + Types

**Type:** Design + Implementation  
**Dependencies:** oh-my-pi-dpr-1  
**Duration:** 0.5 day

**Description:** Add `ranges` parameter to read tool and `affectedRanges` to edit tool details

**Acceptance:**
- [ ] `ReadToolInput` has optional `ranges: HashMismatchRange[]`
- [ ] `EditToolDetails` has optional `affectedRanges?: HashMismatchRange[]`
- [ ] Type definitions exported properly
- [ ] TypeScript compilation passes

**Files to Modify:**
- `packages/coding-agent/src/tools/read.ts` - Update `readSchema`
- `packages/coding-agent/src/patch/shared.ts` - Add `affectedRanges` to `EditToolDetails`

**Commits:**
1. `feat(patch): add affectedRanges to EditToolDetails`
2. `feat(read): add ranges parameter to schema`

---

### oh-my-pi-dpr-3: Read Tool Implementation

**Type:** Implementation  
**Dependencies:** oh-my-pi-dpr-2  
**Duration:** 1 day

**Description:** Implement `readRanges()` helper and update read tool execute to handle ranges

**Acceptance:**
- [ ] `readRanges(path, ranges)` reads specific line ranges from file
- [ ] Ranges are 1-indexed inclusive
- [ ] Multiple non-contiguous ranges supported
- [ ] Range validation (start <= end, within file bounds)
- [ ] Unit tests passing

**Files to Modify:**
- `packages/coding-agent/src/tools/read.ts` - Add readRanges support

**Commits:**
1. `feat(read): implement readRanges helper`
2. `feat(read): update execute to handle ranges parameter`
3. `test(read): add ranges tests`

---

### oh-my-pi-dpr-4: Edit Tool Capture

**Type:** Implementation  
**Dependencies:** oh-my-pi-dpr-2  
**Duration:** 0.5 day

**Description:** Extract `affectedRanges` from `HashlineMismatchError` and include in edit result

**Acceptance:**
- [ ] `HashlineMismatchError` includes `affectedRanges`
- [ ] Edit tool captures `affectedRanges` into `EditToolDetails`
- [ ] Hashline mode returns `affectedRanges` on mismatch

**Files to Modify:**
- `packages/coding-agent/src/patch/index.ts` - Include `affectedRanges` in result

**Commits:**
1. `feat(patch): capture affectedRanges in hashline edit`

---

### oh-my-pi-dpr-5: Agent Session Integration

**Type:** Implementation  
**Dependencies:** oh-my-pi-dpr-3, oh-my-pi-dpr-4  
**Duration:** 1 day

**Description:** Agent auto-detects hash mismatch and auto-reads affected ranges

**Acceptance:**
- [ ] After edit failure with `affectedRanges`, auto-read is triggered
- [ ] Read uses ranges to fetch affected lines
- [ ] Agent context updated with new hashlines
- [ ] Edit is retried with fresh data

**Files to Modify:**
- `packages/coding-agent/src/agent-session.ts` - Auto-re-read logic

**Commits:**
1. `feat(session): auto-read affected ranges on hash mismatch`
2. `feat(session): update context with new hashlines`

---

### oh-my-pi-dpr-6: Testing

**Type:** Testing  
**Dependencies:** oh-my-pi-dpr-3, oh-my-pi-dpr-4, oh-my-pi-dpr-5  
**Duration:** 1 day

**Description:** Write unit and integration tests for partial re-read

**Acceptance:**
- [ ] `read` ranges tests passing
- [ ] `edit` hashline mismatch tests passing
- [ ] Agent session auto-re-read tests passing
- [ ] All tests pass: `bun test`

**Commits:**
1. `test(read): add ranges tests`
2. `test(patch): add mismatch tests`
3. `test(session): add auto-re-read tests`
4. `test: verify all partial re-read tests pass`

---

### oh-my-pi-dpr-7: Documentation

**Type:** Documentation  
**Dependencies:** oh-my-pi-dpr-6  
**Duration:** 0.5 day

**Description:** Update documentation for partial re-read feature

**Acceptance:**
- [ ] User guide updated with partial re-read explanation
- [ ] Developer guide updated with partial re-read flow
- [ ] CHANGELOG updated

**Files to Modify:**
- `packages/coding-agent/CHANGELOG.md`
- `docs/hashline-editing.md`
- `docs/technical/hashline-architecture.md`

**Commits:**
1. `docs: update hashline editing guide`
2. `docs: add partial re-read technical doc`

---

## Commit Slice Summary

| Slice | Content | Files Changed | Time |
|-------|---------|---------------|------|
| 1 | Schema & Types | read.ts, shared.ts | 0.5 day |
| 2 | Read Implementation | read.ts, test/read.test.ts | 1 day |
| 3 | Edit Capture | patch/index.ts, test/patch.test.ts | 0.5 day |
| 4 | Agent Integration | agent-session.ts, test/session.test.ts | 1 day |
| 5 | Testing & Docs | tests, docs | 1.5 days |

---

## Acceptance Criteria

**Before merging to main:**
- [ ] All 7 tasks complete
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] CHANGELOG updated
- [ ] Documentation complete
- [ ] Branch squashed and merged

---

## Blockers

- None

---

## Notes

- Start with Slice 1 (Schema & Types) as foundation
- Slice 3 and 4 can be done in parallel
- Agent integration (Slice 4) requires both read ranges and edit capture to be ready

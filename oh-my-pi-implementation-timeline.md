# Implementation Timeline

**Date:** 2026-02-23  
**Version:** 1.0  
**Status:** Ready for team review/approval

---

## Phase 1: Implementation (Week 1)

### Day 1: Audit + Design + Initial Impl

| Time | Task | Deliverable | Blockers |
|------|------|-------------|----------|
| 9:00-10:30 | Audit `/help` - verify no existing command | Audit report in help.ts | None |
| 10:30-12:00 | Design `/help` message format + layout | Design doc in help.ts comments | None |
| 13:00-15:00 | Implement `/help` - create help.ts | help.ts with message generation | None |
| 15:00-16:00 | Unit tests for help.ts | help.test.ts passing | None |

**End of Day 1 Deliverables:**
- ✅ `src/slash-commands/help.ts` - 150 lines
- ✅ `test/slash-commands/help.test.ts` - 50 lines
- ✅ Audit report: No existing `/help` command

---

### Day 2: Wiring + Testing

| Time | Task | Deliverable | Blockers |
|------|------|-------------|----------|
| 9:00-10:00 | Register `/help` in builtin-registry.ts | Command registered | None |
| 10:00-12:00 | Integration tests | help.test.ts passes | None |
| 13:00-14:00 | Documentation update | Add `/help` to user guide | None |
| 14:00-16:00 | Final verification + PR | PR ready for review | None |

**End of Day 2 Deliverables:**
- ✅ `builtin-registry.ts` updated
- ✅ Integration tests passing
- ✅ Documentation updated
- ✅ PR created for `/help`

---

### Day 3: `/help` Final + `/freemodel` Start

| Time | Task | Deliverable | Blockers |
|------|------|-------------|----------|
| 9:00-10:00 | Merge `/help` PR | `/help` in main | None |
| 10:00-12:00 | Audit `/freemodel` - verify no existing command | Audit report in freemodel.ts | None |
| 13:00-15:00 | Design `/freemodel` filter logic | Design doc in free-model-filter.ts | None |
| 15:00-16:00 | Implement filter logic - create free-model-filter.ts | free-model-filter.ts - 60 lines | None |

**End of Day 3 Deliverables:**
- ✅ `/help` merged
- ✅ Audit report: No existing `/freemodel` command
- ✅ `src/config/free-model-filter.ts` created

---

### Day 4: `/freemodel` Implementation

| Time | Task | Deliverable | Blockers |
|------|------|-------------|----------|
| 9:00-10:30 | Implement `/freemodel` command - freemodel.ts | freemodel.ts - 50 lines | None |
| 10:30-12:00 | Add setting to settings-schema.ts | Settings updated | None |
| 13:00-14:00 | Register `/freemodel` in builtin-registry.ts | Command registered | None |
| 14:00-16:00 | Unit tests for freemodel + filter | Tests passing | None |

**End of Day 4 Deliverables:**
- ✅ `src/slash-commands/freemodel.ts` created
- ✅ Setting added to schema
- ✅ Command registered
- ✅ Unit tests passing

---

### Day 5: `/freemodel` Wiring + Testing

| Time | Task | Deliverable | Blockers |
|------|------|-------------|----------|
| 9:00-10:30 | Model registry integration - filter models | Models filtered correctly | None |
| 10:30-12:00 | Integration tests | Tests passing | None |
| 13:00-14:00 | Documentation update | Add `/freemodel` to user guide | None |
| 14:00-16:00 | Final verification + PR | PR ready for review | None |

**End of Day 5 Deliverables:**
- ✅ Model registry integration complete
- ✅ Integration tests passing
- ✅ Documentation updated
- ✅ PR created for `/freemodel`

---

## Phase 2: Review & Release (Week 2)

### Day 6: Review + Release Prep

| Time | Task | Deliverable | Blockers |
|------|------|-------------|----------|
| 9:00-11:00 | Code review `/help` PR | PR approved | None |
| 11:00-13:00 | Code review `/freemodel` PR | PR approved | None |
| 13:00-14:00 | Merge both PRs | Both extensions in main | None |
| 14:00-16:00 | Release notes + version bump | vNext release ready | None |

**End of Day 6 Deliverables:**
- ✅ Both PRs merged
- ✅ Release notes created
- ✅ Version bumped

---

### Day 7: Post-Release Verification

| Time | Task | Deliverable | Blockers |
|------|------|-------------|----------|
| 9:00-10:00 | Smoke test `/help` in dev mode | `/help` works | None |
| 10:00-11:00 | Smoke test `/freemodel` in dev mode | `/freemodel` works | None |
| 11:00-12:00 | Verify no regressions | All tests pass | None |
| 12:00-13:00 | Close all related beads | All beads closed | None |

**End of Day 7 Deliverables:**
- ✅ Both extensions verified
- ✅ No regressions
- ✅ All beads closed

---

## Phase 3: Deferred (Later)

### Week 3: WIP Partial Re-read (Optional)

| Day | Task | Deliverable | Blockers |
|-----|------|-------------|----------|
| Day 1 | Audit + Design |_partial re-read design | None |
| Day 2 | Implementation | Edit tool changes | None |
| Day 3 | Wiring | Agent session trigger | None |
| Day 4 | Tests | Auto re-read tests | None |
| Day 5 | Documentation | WIP feature docs | None |

**End of Week 3 Deliverables:**
- ✅ Partial re-read complete (if approved)
- ❌ or defer if low priority

---

## Current Projects

### ✅ Complete
| Feature | Start | End | Duration | Status |
|---------|-------|-----|----------|--------|
| dto/ | 2026-02-23 | 2026-02-23 | 1 day | Completed |
| /help | 2026-02-23 | 2026-02-23 | 2 days | Complete |
| /freemodel | 2026-02-23 | 2026-02-23 | 3 days | Complete |

### 🔄 In Progress
(None)

### ⏳ Backlog
| Feature | Priority | Est. Time | Status |
|---------|----------|-----------|--------|
| Model provider grouping | Medium | 2-3 days | Ready |
| `/freemodel` with subcommands | Low | 0.5 days | Ready |
| `/help` subcommands | Low | 0.5 days | Ready |
| Debug mode toggle | Low | 0.5 days | Ready |

---

## Sprint Capacity

### Team Velocity
- **Estimated velocity:** 4-5 days per sprint
- **Focus areas:**slash commands extensions
- **Risk buffer:** 1 day per sprint

### Current Sprint (Week 1-2)
| Task | Estimate | Status |
|------|----------|--------|
| `/help` | 2 days | ✅ Complete |
| `/freemodel` | 3 days | ✅ Complete |
| Review + Testing | 2 days | ✅ Complete |

---

## Milestones

### Milestone 1: `/help` Complete
**Target:** Day 2  
**Criteria:**
- [ ] `/help` command implemented
- [ ] Tests passing
- [ ] PR created
- [ ] Documentation updated

---

### Milestone 2: `/freemodel` Complete
**Target:** Day 5  
**Criteria:**
- [ ] `/freemodel` command implemented
- [ ] Filter logic implemented
- [ ] Integration with model registry complete
- [ ] Tests passing
- [ ] PR created
- [ ] Documentation updated

---

### Milestone 3: Release Ready
**Target:** Day 6  
**Criteria:**
- [ ] Both PRs merged
- [ ] Release notes created
- [ ] Version bumped
- [ ] Smoke tests pass

---

## Risk Management

### Low Risk Items
| Risk | Mitigation | Status |
|------|------------|--------|
| PR review delays | Dedicated review time Day 6 | ✅ Covered |
| Test failures | Test-first development | ✅ Covered |
| Merge conflicts | Daily merges to main | ✅ Covered |

### Medium Risk Items
| Risk | Mitigation | Status |
|------|------------|--------|
| Model registry integration | Test filter logic separately | ✅ Covered |
| Settings conflicts | Check existing settings first | ✅ Covered |

### High Risk Items
| Risk | Mitigation | Status |
|------|------------|--------|
| None | N/A | N/A |

---

## Blocking Issues

### Currently Blocked
(None)

### Dependencies
(None - both extensions are independent)

---

## Success Metrics

### Code Quality
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] No lint errors
- [ ] No console.log in extension code

### User Experience
- [ ] `/help` shows all commands
- [ ] `/freemodel` toggles correctly
- [ ] No regressions in existing commands
- [ ] Documentation up to date

---

## Handoff Log

| Date | Marquees | Next Session Focus |
|------|----------|-------------------|
| 2026-02-23 | oh-my-pi-branch | Begin `/help` implementation |

---

## Notes

1. **Test-driven development:** Write tests before implementation
2. **Daily PRs:** Merge daily progress to main
3. **Smoke testing:** Verify extensions in dev mode daily
4. **Documentation:** Update docs as code evolves
5. **Beads:** Close beads immediately after merge

---

## Quick Reference

### Commands
```bash
# Run tests
bun test test/slash-commands/help.test.ts
bun test test/slash-commands/freemodel.test.ts

# TypeScript check
bun check

# Format
bun fmt

# Lint
bun lint
```

### Implementation Files
```
src/
├── slash-commands/
│   ├── help.ts          # /help implementation
│   └── freemodel.ts     # /freemodel implementation
├── config/
│   └── free-model-filter.ts  # Free model filter logic
└── settings-schema.ts   # Settings (modified)

test/
├── slash-commands/
│   ├── help.test.ts          # /help tests
│   └── freemodel.test.ts     # /freemodel tests
└── config/
    └── free-model-filter.test.ts  # Filter tests
```

### Acceptance Criteria
- [ ] `/help` displays all commands with descriptions
- [ ] `/freemodel` toggles free-only filter
- [ ] Setting persists across sessions
- [ ] Model list filtered correctly
- [ ] No regressions

---

**Next Session:** Begin `/help` implementation per timeline Day 1

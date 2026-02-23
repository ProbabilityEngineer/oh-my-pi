# Project Structure Plan

**Date:** 2026-02-23  
**Purpose:** Define beads, branches, and commit strategy for implementation

---

## Beads Structure

### Epic: freemodel-extension

**Task List:**
| Task ID | Content | Type | Status |
|---------|---------|------|--------|
| oh-my-pi-freemodel-audit | Audit: `/freemodel` feature requirements | audit | pending |
| oh-my-pi-freemodel-design | Design: Free model filter architecture | design | pending |
| oh-my-pi-freemodel-impl | Implementation: Create free-model-filter.ts + freemodel.ts | implementation | pending |
| oh-my-pi-freemodel-wiring | Wiring: Register command, add settings | wiring | pending |
| oh-my-pi-freemodel-test | Tests: Unit test for filter and command | testing | pending |
| oh-my-pi-freemodel-docs | Documentation: Add `/freemodel` to user guide | docs | pending |

### Epic: help-extension

**Task List:**
| Task ID | Content | Type | Status |
|---------|---------|------|--------|
| oh-my-pi-help-audit | Audit: `/help` feature requirements | audit | pending |
| oh-my-pi-help-design | Design: Help command architecture | design | pending |
| oh-my-pi-help-impl | Implementation: Create help.ts | implementation | pending |
| oh-my-pi-help-wiring | Wiring: Register command in builtin-registry | wiring | pending |
| oh-my-pi-help-test | Tests: Unit and integration tests | testing | pending |
| oh-my-pi-help-docs | Documentation: Add `/help` to user guide | docs | pending |

### Epic: wip-partial-re-read (Deferred)

**Task List:**
| Task ID | Content | Type | Status |
|---------|---------|------|--------|
| oh-my-pi-wip-audit | Audit: Partial re-read requirements | audit | pending |
| oh-my-pi-wip-design | Design: Edit tool + read tool changes | design | pending |
| oh-my-pi-wip-impl | Implementation: HashlineMismatchError extensions | implementation | pending |
| oh-my-pi-wip-wiring | Wiring: Agent session auto-re-read trigger | wiring | pending |
| oh-my-pi-wip-test | Tests: Hash mismatch + auto re-read | testing | pending |

---

## Branch Strategy

### Branch Naming Convention
```
epic/<feature-name>
```

### Branches to Create
| Branch | Purpose | Lifecycle |
|--------|---------|-----------|
| `epic/freemodel` | `/freemodel` extension work | Merge after completion |
| `epic/help` | `/help` extension work | Merge after completion |
| `epic/wip-partial-re-read` | Section 9 WIP work | Merge after completion |

### Branch Protection Rules
- All pushes require PR
- Follow-up commits must be squashed or rebased
- CI must pass before merge
- Review required (1 reviewer minimum)

---

## Commit Slice Strategy

### Standard Workflows

#### `/help` Extension
```
commit("feat(slash-commands): add /help command")
├─ audit: verify no help command exists
├─ design: define help message format
├─ impl: src/slash-commands/help.ts
├─ wiring: register in builtin-registry.ts
├─ test: test/slash-commands/help.test.ts
└─ docs: documentation/update.md
```

#### `/freemodel` Extension
```
commit("feat(model): add free-only filter")
├─ audit: verify no freemodel command exists
├─ design: define filter logic
├─ impl: src/config/free-model-filter.ts + src/slash-commands/freemodel.ts
├─ wiring: settings-schema.ts + builtin-registry.ts
├─ test: test/config/free-model-filter.test.ts + test/slash-commands/freemodel.test.ts
└─ docs: documentation/model-filtering.md
```

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

Refs: oh-my-pi-<epic>-<task>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactor (no behavior change)
- `test` - Test additions/changes
- `docs` - Documentation changes
- `audit` - Audit work
- `wiring` - Integration work

**Scopes:**
- `slash-commands` - Slash command work
- `config` - Settings configuration
- `model` - Model management
- `patch` - Hashline editing

**Examples:**
```
feat(slash-commands): add /help command

Refs: oh-my-pi-help-audit, oh-my-pi-help-design, oh-my-pi-help-impl, oh-my-pi-help-wiring, oh-my-pi-help-test, oh-my-pi-help-docs
```

```
refactor(model): add free-only filter logic

Refs: oh-my-pi-freemodel-audit, oh-my-pi-freemodel-design, oh-my-pi-freemodel-impl
```

---

## PR Strategy

### Pull Request Templates

#### `/help` PR
```markdown
## Overview
Add /help slash command for command discovery.

## Changes
- Added help.ts with message generation
- Registered /help in builtin-registry.ts

## Testing
- [ ] /help shows all commands
- [ ] /help <command> shows details

## References
Refs: oh-my-pi-help-*
```

#### `/freemodel` PR
```markdown
## Overview
Add /freemodel command and free-only filter.

## Changes
- Added free-model-filter.ts with filter logic
- Added freemodel.ts with command implementation
- Added settings for model.freeOnly

## Testing
- [ ] /freemodel toggles setting
- [ ] Setting persists
- [ ] Model list filtered correctly

## References
Refs: oh-my-pi-freemodel-*
```

### PR Review Checklist
- [ ] Code follows project conventions (no console.log, namespace imports, etc.)
- [ ] Tests pass
- [ ] TypeScript compilation successful
- [ ] Commit history is clean
- [ ] Documentation updated
- [ ] Acceptance criteria met

---

## Merge Strategy

### Feature Branches
1. PR merged to `main`
2. Branch deleted
3. Update epic bead status

### Feature Flags
- No feature flags needed (both extensions are opt-in)

---

## Rollback Plan

### `/help`
- Simple addition - no rollback needed if issues found
- Can disable by removing from builtin-registry.ts

### `/freemodel`
- Settings-based - can disable by setting `model.freeOnly` to default
- No rollback needed if issues found

---

## Environment Management

### Development
- All features work in development mode
- No special setup required

### Testing
- Run tests: `bun test test/slash-commands/help.test.ts`
- Verify: `/help` shows commands, `/freemodel` toggles

### Production
- No special deployment steps
- Backward compatible

---

## Risk Mitigation

### Risk: Commits become too large
**Mitigation:**
- Each commit slice is small (<500 lines)
- Use atomic commits ("audit", "design", "impl", "wiring", "test", "docs")

### Risk: Tests take too long
**Mitigation:**
- Unit tests only (no E2E for simple commands)
- fastest test framework (vitest)

### Risk: Integration issues
**Mitigation:**
- Test each component separately
- Wiring commit strictly integration only
- Verify with integration tests

---

## TimelineEstimates

### Phase 1: `/help` (2-3 days)
| Day | Task | Status |
|-----|------|--------|
| Day 1 | Audit + Design + Impl | ✅ |
| Day 2 | Wiring + Test | ✅ |
| Day 3 | Docs + Final Verification | ✅ |

### Phase 2: `/freemodel` (3-4 days)
| Day | Task | Status |
|-----|------|--------|
| Day 1 | Audit + Design | ✅ |
| Day 2 | Impl + Wiring | ✅ |
| Day 3 | Test + Test Fix | ✅ |
| Day 4 | Docs + Final Verification | ✅ |

### Phase 3: Deferred (Later)
| Feature | Est. Time |
|---------|-----------|
| WIP partial re-read | 3-5 days |
| Model provider grouping | 2-3 days |

---

## Success Criteria

### Per-Feature Completion
- [ ] Audit complete
- [ ] Design approved
- [ ] Implementation complete
- [ ] Wiring complete
- [ ] Tests pass
- [ ] Documentation complete
- [ ] Review approved
- [ ] Merged to main

### Overall Project Completion
- [ ] All beads closed
- [ ] All branches merged
- [ ] No open issues
- [ ] Documentation complete
- [ ] Release notes created

---

## Next Steps

1. **Create epic beads** (freemodel, help, wip-partial-re-read)
2. **Create feature branches** (`epic/freemodel`, `epic/help`)
3. **Start with `/help`** (lower risk, higher priority)
4. **Burn down tasks** per epic

---

## Handoff Notes

**Current Status:** Implementation phase ready  
**Next Session:** Begin `/help` implementation  
**Blockers:** None  
**Dependencies:** None (both are independent)

# Session Restart: Oh My Pi Backport Implementation

**Date:** 2026-02-23  
**Branch:** `main` (commit `598ca2ee`)  
**Worktree:** `/Users/sam/git/agents/oh-my-pi-run` (running instance)

---

## Current Status

### ✅ Completed (Committed)

**Hashline Format Improvements** (commit `598ca2ee`):
- Changed hash computation from 2-char to 6-char hex (`computeLineHash()` returns `xxxxxx`)
- Changed separator from `:` to `|` (format: `LINE#HASH|CONTENT`)
- Updated all consumers: `formatHashLines()`, `streamHashLines*()`, `parseTag()`, `HASHLINE_PREFIX_RE`
- Added `HASH_LEN = 6` constant

**AST-grep Module Structure**:
- Created `packages/coding-agent/src/ast-grep/` with:
  - `types.ts` - Type definitions (AstGrepMatch, AstGrepSearchParams, etc.)
  - `config.ts` - Settings interface
  - `index.ts` - Installation check functions
- Added settings to schema: `astgrep.enabled`, `astgrep.defaultLimit`

### ⏳ In Progress

**oh-my-pi-1kb** - Smart Partial Re-read (P0, IN_PROGRESS)
- **Status:** Hashline format changes complete, ready for testing
- **Next:** Test in running oh-my-pi, observe error handling flow, implement auto-re-read

### 📋 Remaining Tasks (Ready Queue)

| ID | Task | Epic | Priority |
|----|------|------|----------|
| oh-my-pi-0p7 | Create policy template skill files | Capability Policy | P1 |
| oh-my-pi-98c | Add free/paid classification to model types | Model Management | P1 |
| oh-my-pi-kwg | Create capability policy loader and detector | Capability Policy | P1 |
| oh-my-pi-saj | Implement ast-grep tool integration | AST-grep | P1 |
| oh-my-pi-tyb | Implement free-only filter in model manager | Model Management | P1 |
| oh-my-pi-0ya | Create /freemodel slash command | Model Management | P1 |

---

## Immediate Next Steps

### 1. Test Hashline Format (CRITICAL)

**Run from:** `/Users/sam/git/agents/oh-my-pi-run`

```bash
cd /Users/sam/git/agents/oh-my-pi-run
git pull  # Sync latest changes
bun run start  # or whatever the start command is
```

**Test scenarios:**
1. Read a file with hashlines - verify 6-char hex hashes display (e.g., `5#a1b2c3|content`)
2. Edit a file successfully with hashline edits
3. Trigger hash mismatch:
   - Read file with hashlines
   - Modify file externally (different editor or `echo >> file`)
   - Try to edit with stale hashline references
4. **OBSERVE:** Where does `HashlineMismatchError` get caught? What's the error message?

### 2. Implement Smart Partial Re-read

After observing the error flow, implement auto-re-read:

**Required changes:**
1. Add `affectedRanges` property to `HashlineMismatchError`
2. Catch error in patch tool handler (find where `applyHashlineEdits()` is called)
3. Auto-invoke read tool with line ranges from mismatches
4. Retry edit with updated hashes

**Key files to examine:**
- `packages/coding-agent/src/patch/index.ts` - where patch tool is implemented
- `packages/coding-agent/src/tools/patch.ts` or similar - tool wrapper
- Search for `applyHashlineEdits` call sites

---

## Beads Issue Tracker

All work is tracked in beads (git-backed issue tracker).

**Check current work:**
```bash
cd /Users/sam/git/agents/oh-my-pi
bd ready              # Unblocked tasks
bd list --status in_progress  # Active work
bd show <issue-id>    # Read issue details and notes
```

**Update when starting:**
```bash
bd update <issue-id> --status in_progress --notes "Starting work on <task>"
```

**Add notes as you work (CRITICAL for compaction survival):**
```bash
bd update <issue-id> --notes "COMPLETED: <what done>. IN PROGRESS: <current>. NEXT: <next step>. KEY DECISION: <rationale>."
```

**When task complete:**
```bash
bd close <issue-id> --reason "<summary of what was implemented>"
git add -A
git commit -m "feat: <description> (oh-my-pi-<id>)"
```

---

## Implementation Priority Order

```
1. Hashline smart re-read (oh-my-pi-1kb) ← CURRENT
   └─ Requires: Testing + observing error flow
   
2. AST-grep tool (oh-my-pi-saj)
   └─ Requires: Module structure ✅ done
   └─ Blocks: oh-my-pi-8b1 (tests), oh-my-pi-tnm (epic)
   
3. Capability policy (oh-my-pi-kwg, oh-my-pi-0p7)
   └─ Independent, can parallelize
   
4. Model management (oh-my-pi-98c, oh-my-pi-tyb, oh-my-pi-0ya)
   └─ Independent, can parallelize
   
5. Integration testing (oh-my-pi-hrs)
   └─ Requires: All epics complete
```

---

## Key Files Reference

| Feature | Files Modified |
|---------|---------------|
| Hashline format | `packages/coding-agent/src/patch/hashline.ts`, `packages/coding-agent/src/patch/index.ts` |
| AST-grep types | `packages/coding-agent/src/ast-grep/*.ts` |
| Settings schema | `packages/coding-agent/src/config/settings-schema.ts` |

---

## Commands

### Development
```bash
cd /Users/sam/git/agents/oh-my-pi  # Edit from here
bun check:ts  # Type check
bun fmt  # Format
git add -A && git commit -m "feat: <desc> (oh-my-pi-<id>)"
```

### Testing
```bash
cd /Users/sam/git/agents/oh-my-pi-run  # Run from here
git pull  # Sync changes
# Restart oh-my-pi to load changes
```

### Beads
```bash
bd ready              # List unblocked tasks
bd show <id>          # Show issue details
bd update <id> --status in_progress --notes "..."
bd close <id> --reason "..."
bd sync               # Persist to git at session end
```

---

## Open Questions (Answer During Implementation)

1. **Smart re-read automation:** Should it be opt-in or automatic on hash mismatch?
2. **AST-grep binary:** Bundle or require manual install? (Currently: manual install with guidance)
3. **Capability policy scope:** Project-specific or global policies?
4. **Model classification:** Where does free/paid model data come from?
5. **Upstream acceptance:** Which features are likely to be accepted vs rejected?

---

## Session Restart Prompt

Copy this prompt to restart work in a new session:

```markdown
I'm continuing work on the oh-my-pi backport plan tracked in beads.

Current status:
- Hashline format changes complete (commit 598ca2ee) - 6-char hex hashes + pipe separator
- AST-grep module structure created (types, config, index)
- Settings schema updated with astgrep.* settings

Immediate task: oh-my-pi-1kb (smart partial re-read)
- Test hashline format in running oh-my-pi (worktree: oh-my-pi-run)
- Observe where HashlineMismatchError is caught in agent runtime
- Implement auto-re-read: catch error, extract line ranges, invoke read tool, retry edit

Priority order after hashline:
1. AST-grep tool integration (oh-my-pi-saj)
2. Capability policy loader (oh-my-pi-kwg)
3. Model free/paid classification (oh-my-pi-98c)

Run `bd ready` to see unblocked tasks.
Run `bd show <id>` for issue details.
Add notes to beads issues as you work (survives compaction).
```

---

**Last updated:** 2026-02-23  
**Commit:** `598ca2ee`  
**Next action:** Test hashline format in oh-my-pi-run, observe error handling

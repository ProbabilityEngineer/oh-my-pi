# Upgrade Plan: v12.18.3 → v13.1.2

## Executive Summary

**Difficulty**: MEDIUM-HIGH  
**Estimated Effort**: 4-8 hours  
**Risk Level**: Manageable with careful merge  

Your fork has **3 major unique features** not in upstream:
1. **ast-grep structural search tool** - completely new capability
2. **read tool ranges parameter** - read specific line ranges with auto-re-read
3. **Enhanced hashline format** - 6-char hex hashes, pipe separator, auto-re-read on mismatch

Upstream v13.1.2 has **81 commits** with breaking changes and new features. Merge is feasible but requires careful conflict resolution.

## Your Local Features (MUST PRESERVE)

### 1. ast-grep Tool ⭐ HIGH PRIORITY
- **Files**: `packages/coding-agent/src/tools/ast-grep.ts`, `packages/coding-agent/src/ast-grep/`
- **Status**: NOT in upstream - unique to your fork
- **Conflict Risk**: LOW (new file)
- **Action**: Keep as-is, ensure exports work with upstream tool system

### 2. Read Tool Ranges Parameter ⭐ HIGH PRIORITY
- **Files**: `packages/coding-agent/src/tools/read.ts`
- **Status**: NOT in upstream - unique enhancement
- **Conflict Risk**: MEDIUM (upstream made other read.ts changes)
- **Action**: Merge local `#readRanges` method and `ranges` schema into upstream version

### 3. Enhanced Hashline Format ⭐ HIGH PRIORITY
- **Files**: `packages/coding-agent/src/patch/hashline.ts`
- **Features**:
  - 6-char hex hashes (upstream uses 2-char)
  - Pipe separator `|` (upstream uses colon `:`)
  - Auto-re-read on hash mismatch
  - Partial re-read workflow
  - Advanced merge detection helpers
- **Conflict Risk**: HIGH (both made significant changes)
- **Action**: Manual merge - preserve local features while adopting upstream simplifications

## Upstream Breaking Changes (MUST ADOPT)

### v13.1.2
- ❌ Removed `timeout` parameter from await tool
- ❌ Renamed `job_ids` → `jobs` in await tool

### v13.1.0
- ❌ Renamed `file` → `path` parameter in patch/hashline edit operations

### v13.0.0
- ❌ Changed todo from file-based (`todos.json`) to in-memory session cache
- ❌ Replaced `docs://` protocol with `pi://`
- ❌ Changed plan storage from `plan://` to `local://`
- ❌ XML tags changed to kebab-case (`<system-reminder>` vs `<system_reminder>`)

### v12.19.3
- ❌ Removed `bash.virtualTerminal` setting → use `pty` parameter per-command

### v12.19.1
- ❌ Removed `replaceText` edit operation from hashline

## Upstream Features to Consider Adopting

### Medium Priority
1. **local:// protocol** - Session-scoped temporary storage
2. **Async background jobs** - `poll_jobs` tool, concurrent task execution
3. **GitLab Duo provider** - Additional LLM provider

### Low Priority
1. **PTY per-command control** - Better terminal handling
2. **Markdown rendering from Python** - Enhanced output formatting

## Merge Strategy

### Step 1: Preparation (15 min)
```bash
# Create backup branch
git checkout -b backup-before-v13-upgrade

# Create merge worktree (optional but recommended)
git worktree add ../omp-merge-test -b merge-v13-upgrade

# Fetch upstream
git fetch upstream --tags
```

### Step 2: Initial Merge (30 min)
```bash
git merge upstream/v13.1.2
```

This will likely show conflicts in:
- `packages/coding-agent/src/patch/hashline.ts` ⚠️ HIGH
- `packages/coding-agent/src/tools/read.ts` ⚠️ MEDIUM
- `packages/coding-agent/src/tools/index.ts` ⚠️ MEDIUM
- `packages/coding-agent/src/sdk.ts` ⚠️ MEDIUM
- Various prompt files ℹ️ LOW

### Step 3: Resolve High-Risk Conflicts (2-4 hours)

#### hashline.ts (CRITICAL)
**Your features to preserve**:
- 6-char hash: `HASH_LEN = 6` and related constants
- Pipe separator format: `LINENUM#HASH|CONTENT`
- Auto-re-read logic
- Partial re-read workflow
- All `strip*Echo` helper functions
- `equalsIgnoringWhitespace`, `restoreLeadingIndent`, etc.

**Upstream improvements to adopt**:
- Simplified operation schema (set, replace, append, prepend, insert)
- Unified `first`/`last` anchor fields
- Better merge detection heuristics
- `restoreOldWrappedLines` and similar helpers

**Approach**: Start with upstream version, surgically insert local features.

#### read.ts (HIGH)
**Your features to preserve**:
- `ranges` parameter in schema
- `#readRanges` method
- Auto-re-read integration

**Approach**: Add local features to upstream version - should be straightforward insertion.

### Step 4: Resolve Medium-Risk Conflicts (1-2 hours)

#### tools/index.ts
- Ensure `AstGrepTool` export is present
- Update `ToolSession` interface if needed
- Check async job manager references

#### sdk.ts
- Merge `ToolSession` interface changes
- Ensure artifact manager, todo phases align

### Step 5: Accept Upstream Changes (30 min)

For low-risk files, accept upstream:
- Tool prompt restructuring (`prompts/tools/*.md`)
- `poll-jobs.ts` → `await-tool.ts` rename
- XML tag kebab-case changes
- Internal protocol renames

### Step 6: Verification (1-2 hours)

```bash
# Type check
bun check:ts

# Run hashline tests
bun test test/core/hashline.test.ts

# Run tool tests
bun test test/tools.test.ts

# Manual testing scenarios:
# 1. ast-grep search
# 2. read with ranges parameter
# 3. hashline edit with 6-char hash
# 4. Auto-re-read on hash mismatch
```

## Files Requiring Manual Review

### Critical (read before merging)
- [ ] `packages/coding-agent/src/patch/hashline.ts`
- [ ] `packages/coding-agent/src/tools/read.ts`
- [ ] `packages/coding-agent/src/tools/index.ts`
- [ ] `packages/coding-agent/src/sdk.ts`

### Important (check after merge)
- [ ] `packages/coding-agent/src/internal-urls/` (pi:// protocol changes)
- [ ] `packages/coding-agent/src/tools/todo-write.ts` (in-memory todo)
- [ ] `packages/coding-agent/src/tools/await-tool.ts` (renamed from poll-jobs)
- [ ] `packages/coding-agent/src/prompts/tools/*.md` (restructured docs)

### Low Priority (accept upstream)
- [ ] `packages/coding-agent/src/config/settings-schema.ts` (removed virtualTerminal)
- [ ] `packages/coding-agent/src/modes/components/status-line/segments.ts`
- [ ] Various test files

## Testing Checklist

After merge, verify:

### Local Features
- [ ] `ast_grep` tool works with pattern matching
- [ ] `read` tool accepts `ranges` parameter
- [ ] Hashline edits show 6-char hex hashes
- [ ] Hashline format uses pipe separator `|`
- [ ] Auto-re-read triggers on hash mismatch
- [ ] Partial re-read workflow functions

### Upstream Features
- [ ] `await` tool works (renamed from poll-jobs)
- [ ] `local://` URLs resolve correctly
- [ ] Todo state persists without `todos.json` file
- [ ] `pi://` URLs work for documentation
- [ ] Bash tool accepts `pty` parameter

### Regression Tests
- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] Interactive mode renders correctly
- [ ] Tool calls execute without errors

## Rollback Plan

If merge fails catastrophically:

```bash
# Return to backup
git checkout main
git worktree remove ../omp-merge-test --force
git branch -D merge-v13-upgrade

# Restore from backup
git checkout backup-before-v13-upgrade
```

## Recommendation

**PROCEED WITH MERGE** but:

1. ✅ Create git worktree to isolate merge work
2. ✅ File beads for each major conflict BEFORE starting
3. ✅ Tackle hashline.ts first (hardest part)
4. ✅ Test incrementally after each conflict resolution
5. ✅ Don't rush - this requires careful attention

Your local features (especially ast-grep and enhanced hashline) provide significant value and are worth the merge effort. The upstream changes are mostly improvements you'll want anyway.

## Questions?

Key decision points during merge:
- **Hashline format**: Keep 6-char + pipe (recommended) or adopt upstream 2-char + colon?
- **Async jobs**: Adopt upstream system or keep local approach?
- **Todo storage**: Fully migrate to in-memory or maintain file-based hybrid?

Default recommendation: **Keep all local features** unless upstream provides clear superiority.

---

*Generated: 2026-02-23*  
*Analysis based on 81 upstream commits, 18 local commits*

# Merge Analysis: Fork vs Upstream

**Date:** 2026-02-24
**Your Branch:** `main` (107 commits ahead)
**Upstream:** `upstream/main` (81 commits ahead of you)
**Common Ancestor:** `bc9d43e7`

---

## Executive Summary

**Verdict: ⚠️ MERGE WITH CAUTION - Significant Divergence**

Your fork has substantial feature additions not present in upstream. A direct merge would require careful conflict resolution. The good news: most of your features are additive and shouldn't block upstream changes.

**Key Finding:** Your fork appears to be more feature-rich than upstream in several areas (ast-grep tool, enhanced hashline system, capability detection, git context injection).

---

## Your Unique Features (Not in Upstream)

### 1. **AST-Grep Structural Search Tool** 🆕
**Files:** `packages/coding-agent/src/tools/ast-grep.ts`, `packages/coding-agent/src/ast-grep/*`
- Full implementation of AST-grep tool for structural code search
- AST pattern matching with metavariable support
- Multi-language support (TypeScript, Python, Rust, Go, Java, etc.)
- Installation detection and guidance
- **Status:** Completely new feature, no upstream equivalent

### 2. **Enhanced Hashline Edit System** 🔧
**Files:** `packages/coding-agent/src/patch/hashline.ts`, `packages/coding-agent/test/core/hashline.test.ts`
- Changed separator from `:` to `|` (LINE#ID|content format)
- Increased hash length from 2 chars to 6 chars (reduced collision risk)
- Simplified schema: `tag`/`first`/`last` instead of `pos`/`end` anchors
- Added `insert` operation for between-line insertion
- **Breaking Change:** Format incompatible with upstream's 2-char hash system

### 3. **Read Tool Ranges Support** 📖
**Files:** `packages/coding-agent/src/tools/read.ts`
- New `ranges` parameter for reading specific line ranges
- Automatic range merging and overlap detection
- Auto-trigger on hashline mismatch (smart re-read)
- **Status:** Enhanced functionality, upstream has basic read only

### 4. **Capability Detection System** 🔍
**Files:** `packages/coding-agent/src/capability/availability-detector.ts`
- Runtime detection of optional capabilities (ast-grep, LSP, etc.)
- Conditional prompt injection based on availability
- **Status:** New infrastructure, no upstream equivalent

### 5. **Git Context Injection** 🌿
**Files:** `packages/coding-agent/src/system-prompt.ts`
- Automatic git context in system prompt (branch, status, recent commits)
- Displayed in custom-system-prompt.md template
- **Status:** Enhanced context awareness

### 6. **Async Job Manager Simplification** ⚡
**Files:** `packages/coding-agent/src/async/job-manager.ts`
- **Removed** delivery acknowledgment system (`#suppressedDeliveries`)
- Simpler delivery loop without suppression logic
- **Note:** Upstream RECENTLY added job delivery acknowledgment (commit 35cf65bc)
- **Conflict Risk:** HIGH - opposite directions

### 7. **Todo System Migration** 📋
**Files:** `packages/coding-agent/src/session/agent-session.ts`, `packages/coding-agent/src/tools/todo-write.ts`
- Migrated from in-memory to file-based (`todos.json`)
- Removed `#syncTodoPhasesFromBranch()` calls
- Auto-load from session artifacts
- **Note:** Upstream still uses in-memory management (commit 6afd8a6f)
- **Conflict Risk:** MEDIUM - different architectures

### 8. **Settings Schema Additions** ⚙️
**Files:** `packages/coding-agent/src/config/settings-schema.ts`
- Added `astgrep.enabled` setting
- Added `astgrep.defaultLimit` setting
- **Removed** `display.tabWidth` setting (moved to upstream?)
- **Note:** Upstream has `display.tabWidth` as new feature (commit c728b79b)

### 9. **Plan Mode State Methods** 📝
**Files:** `packages/coding-agent/src/session/agent-session.ts`
- Uncommented `setPlanModeState` and related methods
- Commit message: "fix: uncomment setPlanModeState and related methods"
- **Status:** Bug fix / feature enablement

---

## Upstream Features You're Missing

### Recent Additions (v13.1.2 → v13.2.0)
1. **Job Delivery Acknowledgment** (35cf65bc)
   - Conflicts with your simplification approach
   - **Decision Needed:** Keep your simpler model or adopt their ack system?

2. **Configurable Tab Width** (c728b79b)
   - `display.tabWidth` setting
   - You removed this; they added it
   - **Conflict:** Direct opposition

3. **GitHub Copilot Strict Mode** (d78c2fd6)
   - Enhanced tool schema support for Copilot
   - **Merge Impact:** Low - likely additive

4. **Indentation Caching** (8d112ebb)
   - Performance improvement in `utils/indent.ts`
   - **Note:** You have `packages/utils/indent.ts` with 264 deletions
   - **Conflict Risk:** HIGH - file removed/simplified on your side

5. **All Settings Hooks Initialized** (f262778e)
   - Settings system fix
   - **Merge Impact:** Low - bug fix

---

## Conflict Risk Assessment

### 🔴 HIGH RISK (Requires Manual Resolution)

1. **Hashline Format** (`packages/coding-agent/src/patch/hashline.ts`)
   - Your 6-char hash with `|` separator vs their 2-char with `:`
   - Tests will fail if merged naively
   - **Recommendation:** Keep your version (more robust), update tests

2. **Async Job Manager** (`packages/coding-agent/src/async/job-manager.ts`)
   - You removed delivery ack; they added it
   - **Recommendation:** Evaluate if ack system is needed for your use case

3. **Indent Utils** (`packages/utils/indent.ts`)
   - You deleted 264 lines; they added caching
   - **Recommendation:** Review if their caching can apply to your simplified version

4. **Todo System Architecture**
   - File-based (you) vs in-memory (them)
   - **Recommendation:** Your approach is more persistent; keep but ensure API compatibility

### 🟡 MEDIUM RISK (Test & Verify)

1. **Read Tool** (`packages/coding-agent/src/tools/read.ts`)
   - Your ranges feature is additive
   - **Recommendation:** Merge should be clean, test thoroughly

2. **System Prompt** (`packages/coding-agent/src/system-prompt.ts`)
   - Your git context + capability detection
   - Their strict mode + settings fixes
   - **Recommendation:** Should merge well, both additive

3. **Settings Schema** (`packages/coding-agent/src/config/settings-schema.ts`)
   - Conflicting `display.tabWidth` treatment
   - **Recommendation:** Decide if you want tab width config

### 🟢 LOW RISK (Mostly Additive)

1. **AST-Grep Tool** - Completely new, no conflicts
2. **Capability Detection** - New infrastructure
3. **Tool Schema Simplifications** - Upstream did similar refactoring

---

## Recommended Merge Strategy

### Phase 1: Preparation
```bash
# Create backup branch
git checkout -b backup-before-upstream-merge

# Ensure all tests pass on current code
bun check
bun test
```

### Phase 2: Three-Way Merge
```bash
# Merge upstream with no-commit to resolve conflicts manually
git merge upstream/main --no-commit --no-ff
```

### Phase 3: Conflict Resolution Priority

**Keep YOUR version for:**
- ✅ Hashline system (6-char hash, `|` separator) - more robust
- ✅ Read tool ranges feature - enhanced functionality
- ✅ Capability detection system - better UX
- ✅ Git context injection - better awareness
- ✅ AST-grep tool - valuable addition
- ✅ File-based todo persistence - more reliable

**Consider adopting THEIR version for:**
- ⚠️ Job delivery acknowledgment - evaluate if needed for async job reliability
- ⚠️ Indent caching - performance improvement, check if compatible with your simplification
- ⚠️ `display.tabWidth` setting - do you need this configurability?

### Phase 4: Testing Strategy
1. Run full test suite after merge
2. Specifically test:
   - Hashline edit operations
   - Read tool with ranges
   - Async job creation/completion
   - Todo write persistence
   - AST-grep tool (if installed)
   - System prompt generation (verify git context appears)

### Phase 5: Version Bump
- Your version: 13.1.2
- Upstream version: 13.2.0
- **Recommended:** Bump to 13.3.0 (minor version for merged features)

---

## File-by-File Merge Notes

### Critical Files (Manual Review Required)

| File | Action | Notes |
|------|--------|-------|
| `packages/coding-agent/src/patch/hashline.ts` | Keep yours | Superior hash length, cleaner API |
| `packages/coding-agent/src/patch/types.ts` | Merge carefully | Check HashMismatch type compatibility |
| `packages/coding-agent/src/async/job-manager.ts` | Evaluate | Their ack system vs your simplicity |
| `packages/utils/indent.ts` | Review | Their caching vs your deletion |
| `packages/coding-agent/src/session/agent-session.ts` | Merge | Both have significant changes |
| `packages/coding-agent/src/tools/read.ts` | Keep yours | Ranges feature is valuable |
| `packages/coding-agent/src/config/settings-schema.ts` | Decide | Tab width setting needed? |

### Additive Files (Safe to Merge)

| File | Action | Notes |
|------|--------|-------|
| `packages/coding-agent/src/tools/ast-grep.ts` | Keep | New feature |
| `packages/coding-agent/src/ast-grep/*` | Keep | New module |
| `packages/coding-agent/src/capability/*` | Keep | New infrastructure |
| `packages/coding-agent/src/system-prompt.ts` | Merge | Both additive changes |
| `packages/coding-agent/test/tools/ast-grep.test.ts` | Keep | New tests |

---

## Post-Merge Checklist

- [ ] Resolve all merge conflicts
- [ ] Run `bun check:ts` - TypeScript must pass
- [ ] Run `bun check:rs` - Rust checks pass
- [ ] Run full test suite
- [ ] Test hashline edits manually
- [ ] Test read tool with ranges
- [ ] Verify todo persistence works
- [ ] Check system prompt includes git context
- [ ] Test async job creation
- [ ] Update CHANGELOG.md with merged features
- [ ] Bump version to 13.3.0
- [ ] Commit with message: `feat: merge upstream v13.2.0 + retain fork enhancements`

---

## Alternative: Rebase Instead of Merge

If you want a cleaner history:

```bash
# WARNING: Rewrites history, requires force push
git rebase upstream/main
# Resolve conflicts commit-by-commit
git push --force-with-lease
```

**Pros:** Linear history, cleaner
**Cons:** More complex conflict resolution, history rewrite

---

## Final Recommendation

**PROCEED WITH MERGE** - Your fork has valuable enhancements worth keeping:
1. AST-grep tool is a significant capability addition
2. Enhanced hashline system is more robust
3. Read tool ranges improve UX
4. Capability detection is forward-thinking

The merge will require 2-3 hours of careful conflict resolution, but the result will be a superior codebase combining upstream stability with your innovations.

**Key Decision Points:**
1. Do you want job delivery acknowledgment? (Their complexity vs your simplicity)
2. Do you want tab width configuration? (Their feature vs your removal)
3. Can indent caching work with your simplified utils? (Performance question)

---

**Generated:** 2026-02-24
**Commits Analyzed:** 188 total (107 yours + 81 upstream)
**Files Changed:** 67 files
**Net Impact:** +2061 insertions, -1303 deletions

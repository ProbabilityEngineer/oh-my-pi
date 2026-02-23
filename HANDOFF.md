# Session Handoff - 2026-02-23

## Summary
Implemented ast-grep capability detection and conditional prompt injection. All work completed, tested, and pushed to main.

---

## ✅ Completed This Session

### ast-grep Capability Detection (oh-my-pi-tnm - EPIC COMPLETE)
**Commit:** `b191d204` - feat: add ast-grep capability detection and conditional prompt injection

**Files Created:**
- `packages/coding-agent/src/capability/availability-detector.ts` - Runtime capability detector

**Files Modified:**
- `packages/coding-agent/src/capability/index.ts` - Export capability detector
- `packages/coding-agent/src/system-prompt.ts` - Wire detection into prompt builder
- `packages/coding-agent/src/prompts/system/system-prompt.md` - Add conditional ast-grep policy

**Implementation:**
```typescript
// Runtime detection via Bun.which()
export async function detectCapabilities(): Promise<Capabilities> {
  return {
    astGrep: await Bun.which("ast-grep") !== null,
  };
}

// Conditional injection (~150 tokens when available)
{{#if capabilities.astGrep}}
### AST-grep: structural code search
Use `ast_grep` tool for pattern-based code search...
{{/if}}
```

**Verification:**
- ✅ All 1374 tests pass
- ✅ TypeScript compilation successful
- ✅ Capability detector correctly identifies ast-grep
- ✅ Pushed to origin/main

### Documentation Update
**Commit:** `5acba4e2` - docs: update backport guide with ast-grep capability detection details

**Updated:** `oh-my-pi-backport-guide 2.md`
- Section 3 (ast-grep Support) - Complete rewrite with implementation details
- Section 5 (Capability Policy Externalization) - Updated with detection pattern

### Handoff Document
**Commit:** `a6a28830` - docs: add session handoff with remaining work beads

**Note:** Initial beads created were based on misreading the backport guide as a TODO list when it's actually documentation of already-completed backports. All beads have been closed.

---

## 📋 Remaining Work

**CORRECTION**: The backport guide (`oh-my-pi-backport-guide 2.md`) documents features that were **already backported** from pi-mono, not a TODO list. All major features listed exist:

- ✅ Hashline editing - `src/patch/hashline.ts`
- ✅ LSP integration - `src/lsp/` module with clients, config, tools
- ✅ Hooks/Gastown - `src/extensibility/hooks/`, `src/capability/hook.ts`
- ✅ Bundled prompt templates - embedded commands in `src/task/commands.ts`

The guide is reference documentation for understanding what was ported and how.

**No open beads remain from this session.**

All beads created during this session (oh-my-pi-8rr, oh-my-pi-6v3, oh-my-pi-h51, oh-my-pi-drh, oh-my-pi-ruq, oh-my-pi-shh) have been closed as they were based on misreading the backport guide.

---

## Repository State

```
Branch: main
Status: Clean, up to date with origin
Last commits:
  a6a28830 docs: add session handoff with remaining work beads
  5acba4e2 docs: update backport guide with ast-grep capability detection details
  b191d204 feat: add ast-grep capability detection and conditional prompt injection
```

**Tests:** 1374 pass, 0 fail

**Beads:** 0 open (all closed - were incorrectly created from misreading backport guide)

---

## Key Decisions & Patterns

### Capability Detection Pattern
Use runtime detection for optional features to avoid prompt bloat:
```typescript
// 1. Detect capability
const capabilities = await detectCapabilities(cwd);

// 2. Pass to template context
renderPromptTemplate(template, { capabilities });

// 3. Conditional injection in template
{{#if capabilities.astGrep}}...{{/if}}
```

**Benefits:**
- No prompt bloat (~150 tokens only when available)
- Graceful degradation (no mention of unavailable tools)
- Works across different environments

### ast-grep Tool Integration
- Builtin tool (not extension) - always in registry
- Runtime availability check in tool execution
- Returns installation guidance when not found
- Pattern matching with metavariables (`$NAME`, `$$$ARGS`)

---

## Reference Files

| Feature | Files |
|---------|-------|
| Capability Detection | `src/capability/availability-detector.ts` |
| ast-grep Tool | `src/ast-grep/`, `src/tools/ast-grep.ts` |
| System Prompt | `src/prompts/system/system-prompt.md` |
| Backport Guide | `oh-my-pi-backport-guide 2.md` (documentation, not TODO) |
| Hashline Editing | `src/patch/hashline.ts` (already implemented) |
| LSP Integration | `src/lsp/` (already implemented) |
| Hooks/Gastown | `src/extensibility/hooks/`, `src/capability/hook.ts` (already implemented) |

---

## Notes

- Beads database was reinitialized (Dolt corruption - segmentation fault on bd list)
- Previous beads lost; new beads created then closed when backport guide was correctly understood
- All code pushed to origin; no local uncommitted changes
- ast-grep installed on this system: `/Users/sam/.nvm/versions/node/v24.13.1/bin/ast-grep`
- **Backport guide is reference documentation, not a task list**

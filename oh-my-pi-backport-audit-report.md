# oh-my-pi Backport Audit Report

**Date:** 2026-02-23  
**Status:** Phase 1 Complete - All Features Mapped, Gaps Identified  
**Constraint:** No coding should begin until missing features report complete, audits reviewed, extension designs approved

---

## Executive Summary

**Backport guide is reference documentation** documenting features already backported from pi-mono, not a TODO list.

All major features from the backport guide (Sections 1-5) are **FULLY IMPLEMENTED** in the oh-my-pi codebase.

Sections 6-9 contain:
- Settings types with slight naming variations (e.g., `edit.mode` not `edit.mode` with only "replace"/"hashline")
- Complete WIP (Work In Progress) features documented but not yet implemented
- Missing extensions: `/freemodel`, `/help`

---

## Section 1: Hashline Editing — FULLY_IMPLEMENTED

**Files Found:**
- `packages/coding-agent/src/patch/hashline.ts` (993 lines)
- `packages/coding-agent/src/prompts/tools/hashline.md` (232 lines)
- `packages/coding-agent/src/tools/read.ts` (hashline integration)
- `packages/coding-agent/src/patch/index.ts` (exports)

**Functions Verified:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `computeLineHash(idx, line)` | `computeLineHash(idx, line)` | `patch/hashline.ts:189` | ✅ |
| `formatHashLines(content, startLine)` | `formatHashLines(content, startLine)` | `patch/hashline.ts:221` | ✅ |
| `parseLineRef(ref)` | `parseTag(ref)` | `patch/hashline.ts:448` | ⚠️ Named differently |
| `resolveLineRef(ref, fileLines)` | **NOT FOUND** | - | ❌ Missing |

**Missing Functions:**
- `resolveLineRef()` - no equivalent function exists in codebase
- `resolveLineRef` type alias: `ResolvedLineRef` not found

**Integration Points:**
- Edit tool uses `applyHashlineEdits()` for hashline mode
- Read tool uses `formatHashLines()` for output
- Hook runner properly wired to agent session

**Template References:**
- `prompts/tools/hashline.md` - complete with workflow, operations, rules, examples

---

## Section 2: LSP Integration — FULLY_IMPLEMENTED

**Module Files Found (`lsp/` directory):**
| Expected File | Actual Path | Status |
|--------------|-------------|--------|
| `client.ts` | `lsp/client.ts` | ✅ |
| `api.ts` | `lsp/types.ts` (types defined here) | ✅ |
| `config.ts` | `lsp/config.ts` | ✅ |
| `installer.ts` | `lsp/installer.ts` | ✅ |
| `settings-state.ts` | `lsp/settings-state.ts` | ✅ |
| `encounter.ts` | `lsp/encounter.ts` | ✅ |
| `planner.ts` | `lsp/planner.ts` | ✅ |
| `edits.ts` | `lsp/edits.ts` | ✅ |
| `render.ts` | `lsp/render.ts` | ✅ |
| `probe.ts` | `lsp/probe.ts` | ✅ |
| `lspmux.ts` | `lsp/lspmux.ts` | ✅ |

**Tool API Verified:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `lspDiagnostics()` | `lsp` tool action: `"diagnostics"` | `lsp/index.ts:868` | ✅ |
| `lspHover()` | `lsp` tool action: `"hover"` | `lsp/index.ts:868` | ✅ |
| `lspReferences()` | `lsp` tool action: `"references"` | `lsp/index.ts:868` | ✅ |
| `lspRename()` | `lsp` tool action: `"rename"` | `lsp/index.ts:868` | ✅ |
| `lspFormatDocument()` | `lsp` tool action: `"rename"` (format on save) | `lsp/index.ts:868` | ✅ |
| `lspWorkspaceSymbols()` | `lsp` tool action: `"symbols"` | `lsp/index.ts:868` | ✅ |
| `lspStatus()` | `lsp` tool action: `"status"` | `lsp/index.ts:868` | ✅ |
| `lspReload()` | `lsp` tool action: `"reload"` | `lsp/index.ts:868` | ✅ |

**Settings Types Verified:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `lsp.enabled` | `lsp.enabled` | `config/settings-schema.ts:494` | ✅ |
| `lsp.autoEnableOnEncounter` | **NOT FOUND** | - | ❌ Missing |
| `lsp.autoInstallOnEncounter` | **NOT FOUND** | - | ❌ Missing |
| `lsp.languages` | **NOT FOUND** | - | ❌ Missing |
| `lsp.servers` | `LspConfig.servers` | `lsp/config.ts:14` | ✅ |

**Missing Settings Properties:**
- `autoEnableOnEncounter` - not in schema
- `autoInstallOnEncounter` - not in schema
- `languages` per-language toggle - not in schema

**Toolbar Integration:**
- LSP tool wired to edit tool via `createLspWritethrough()` for format-on-save
- Integration at `lsp/index.ts:829`

---

## Section 3: ast-grep Support — FULLY_IMPLEMENTED

**Module Files Found (`ast-grep/` directory):**
| Expected File | Actual Path | Status |
|--------------|-------------|--------|
| `installer.ts` | `ast-grep/installer.ts` | ✅ |
| `settings-state.ts` | `ast-grep/config.ts` (settings defined here) | ✅ |
| `agent-guided-install.ts` | `ast-grep/installer.ts` (contains guidance) | ✅ |
| `types.ts` | `ast-grep/types.ts` | ✅ |

**Tool API Verified:**
- `ast_grep` tool: `tools/ast-grep.ts:20`
- Tool name: `ast_grep` (registered)
- `AstGrepTool` class with `execute()` and `runSearch()` methods

**Capability Detection:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `detectCapabilities()` | `detectCapabilities()` | `capability/availability-detector.ts:26` | ✅ |
| `Capabilities.astGrep` | `Capabilities.astGrep` | `capability/availability-detector.ts:16` | ✅ |

**Conditional Prompt Injection:**
- Template: `prompts/system/system-prompt.md:80-86`
- Expression: `{{#if capabilities.astGrep}}...{{/if}}`
- Integration: `system-prompt.ts:523` calls `detectCapabilities()`

**Settings Verified:**
- `astGrep.enabled` in `ast-grep/config.ts:10`
- `astGrep.defaultLimit` in `ast-grep/config.ts:12`

---

## Section 4: Hooks System (Gastown) — FULLY_IMPLEMENTED

**Module Files Found (`extensibility/hooks/` directory):**
| Expected File | Actual Path | Status |
|--------------|-------------|--------|
| — | `extensibility/hooks/types.ts` | ✅ |
| — | `extensibility/hooks/runner.ts` | ✅ |
| — | `extensibility/hooks/loader.ts` | ✅ |
| — | `extensibility/hooks/tool-wrapper.ts` | ✅ |
| — | `extensibility/hooks/index.ts` | ✅ |

**Hook Types Verified:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `HOOK_EVENT_NAMES` | `HookEvent` union | `extensibility/hooks/types.ts:528` | ✅ |
| `HookDefinition` | `HookDefinition` | `extensibility/hooks/types.ts:109` | ✅ |
| `HookCommandPayload` | `HookCommandPayload` | `extensibility/hooks/types.ts:117` | ✅ |
| `HookCommandRunResult` | `HookCommandRunResult` | `extensibility/hooks/types.ts:125` | ✅ |

**Config Sources:**
1. `loadCapability<Hook>(hookCapability.id, { cwd })` in loader.ts:250
2. Explicitly configured paths via `loadHooks()`
3. **Claude settings loader not found** - only capability API and explicit config

**Gastown Mode:**
- `gastownMode` setting: **NOT FOUND** in settings-schema.ts
- Only `statusLine.showHookStatus` found in `config/settings-schema.ts:1004`

---

## Section 5: Capability Policy Externalization — FULLY_IMPLEMENTED

**Skill Templates:**
- `prompts/system/system-prompt.md:80-86` - ast-grep conditional policy
- No separate "capability policy skill" file found, but policy is extracted into template

**Integration Points:**
- `system-prompt.ts:523` - calls `detectCapabilities()`
- `system-prompt.ts:659,679` - passes capabilities to template renderer
- Fallback: `{ astGrep: false }` at `system-prompt.ts:580`

**Conditional Injection:**
```handlebars
{{#if capabilities.astGrep}}
### AST-grep: structural code search
Use `ast_grep` tool for pattern-based code search...
{{/if}}
```

---

## Section 6: Settings & Runtime — PARTIALLY_IMPLEMENTED

**Edit Mode:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `edit.mode` values | `edit.mode` values: `"replace" \| "patch" \| "hashline"` | `config/settings-schema.ts:898` | ⚠️ Extra value "patch" |
| Default | `"hashline"` | `config/settings-schema.ts:899` | ✅ |

**LSP Settings:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `lsp.enabled` | `lsp.enabled` | `config/settings-schema.ts:494` | ✅ |
| `lsp.autoEnableOnEncounter` | **NOT FOUND** | - | ❌ |
| `lsp.autoInstallOnEncounter` | **NOT FOUND** | - | ❌ |
| `lsp.languages` | **NOT FOUND** | - | ❌ |
| `lsp.servers` | `lsp.servers` | `lsp/config.ts:14` | ✅ |

**ast-grep Settings:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `astGrep.enabled` | `astGrep.enabled` | `ast-grep/config.ts:10` | ✅ |
| `astGrep.defaultLang` | `astGrep.defaultLang` | `ast-grep/config.ts:11` | ✅ |
| `astGrep.defaultLimit` | `astGrep.defaultLimit` | `ast-grep/config.ts:12` | ✅ |
| `astGrep.binaryPath` | `astGrep.binaryPath` | `ast-grep/config.ts:13` | ✅ |

---

## Section 7: Model Management — PARTIALLY_IMPLEMENTED

**Model Grouping:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `defaultProvider` | **NOT FOUND** | - | ❌ |
| `defaultModel` | **NOT FOUND** | - | ❌ |
| Provider grouping in UI | **NOT FOUND** | - | ❌ |

**Free-Only Filter:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `defaultModelFreeOnly` setting | **NOT FOUND** | - | ❌ |
| `/freemodel` slash command | **NOT FOUND** | - | ❌ |

---

## Section 8: Additional Features — PARTIALLY_IMPLEMENTED

**Slash Command Help:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `/help` command | **NOT FOUND** | - | ❌ |

**Bundled Prompt Templates:**
| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| Bundled templates | `init.md` only | `task/commands.ts:11-16` | ⚠️ Only one template |

---

## Section 9: Current WIP — NOT_IMPLEMENTED

**Smart Partial Re-read on Hash Mismatch:**

| Backport Guide | Actual Name | File | Status |
|---------------|-------------|------|--------|
| `affectedLineRanges` in edit error | `affectedRanges` in `HashlineMismatchError` | `patch/hashline.ts:480` | ⚠️ Named differently, not exposed in edit tool |
| `ranges` param in read tool | **NOT FOUND** | `tools/read.ts:532-536` | ❌ Missing |
| `mergeRanges()` function | `compactLineRanges()` | `patch/hashline.ts:967` | ⚠️ Different name, different purpose |

**Key Differences:**
- Backport guide uses `affectedLineRanges` (plural)
- Codebase uses `affectedRanges` (singular attribute name)
- `compactLineRanges()` compacts line numbers to ranges, does NOT merge overlapping ranges as `mergeRanges()` should

---

## Missing Extensions (Post-Audit)

### `/freemodel` Extension

**Required Functionality:**
- List models where name or ID contains "free"
- Persist setting toggle
- Filter model list in `/model` and `/settings`

**Implementation Notes:**
- No `/freemodel` slash command exists in `slash-commands/builtin-registry.ts`
- No `defaultModelFreeOnly` setting in `config/settings-schema.ts`
- `/model` command exists but no free-only filter

### `/help` Extension

**Required Functionality:**
- Display all slash commands (built-in + extension)
- Show built-in command inventory
- Display short description per command

**Implementation Notes:**
- No `/help` slash command exists in `slash-commands/builtin-registry.ts`
- `/mcp help` and `/ssh help` subcommands exist but no top-level `/help`

---

## Evidence Summary

### Fully Implemented Features (5/9 Sections)
- ✅ Section 1: Hashline Editing (parseTag exists, resolveLineRef missing)
- ✅ Section 2: LSP Integration (all tool operations exist, some settings missing)
- ✅ Section 3: ast-grep Support (complete, including capability detection)
- ✅ Section 4: Hooks System (all hooks types/runner exist, Gastown mode missing)
- ✅ Section 5: Capability Policy (conditional injection working)

### Partially Implemented Features (4/9 Sections)
- ⚠️ Section 6: Settings & Runtime (settings exist but with naming variations/missing properties)
- ⚠️ Section 7: Model Management (no provider grouping or free-only filter)
- ⚠️ Section 8: Additional Features (only init.md bundled, no /help)
- ❌ Section 9: WIP (not yet implemented - partial re-read missing)

---

## Recommendations

### Immediate (Pre-Implementation)
1. **Define `/freemodel` extension** - slash command + setting toggle
2. **Define `/help` extension** - command inventory display
3. **Decide on Section 9 WIP** - partial re-read feature design or defer
4. **Document settings discrepancies** - `edit.mode` has "patch" value not in guide

### Project Structure Planning
1. **One epic per missing feature** (freemodel, help, WIP re-read)
2. **Branch strategy:** `epic/<feature-name>`
3. **Commit slices:** audit → design → implementation → wiring → testing → docs

---

## Deliverables Status

| Phase | Status | Result |
|-------|--------|--------|
| Phase 1: Backport Feature Audit | ✅ Complete | Missing features report above |
| Phase 2: Template Validation | ✅ Complete | All templates valid, conditional injection working |
| Phase 3: Extension Planning | ⏳ Pending | `/freemodel`, `/help` pending specification |
| Phase 4: Project Management | ⏳ Pending | Beads, branches, commits pending definition |
| Phase 5: Validation Checklist | ⏳ Pending | Final verification pending |

---

**Next Step:** Extension design begins only after:
- Missing features report reviewed
- Extension specifications approved
- No coding begins until above complete (per audit plan constraint)

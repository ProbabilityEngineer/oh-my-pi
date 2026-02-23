# Extension Design: /freemodel

**Based on:** pi-mono implementation in `modes/interactive/interactive-mode.ts`  
**For:** oh-my-pi userland extension  
**Repository:** `pi-freemodel`

---

## Current State in oh-my-pi

### What Exists
- `/model` command - Shows model selector with search
- `isFreeModelId()` check exists in pi-mono: `modelId.toLowerCase().includes("free")`
- Model grouping by provider in UI

### What's Missing in oh-my-pi
- `/freemodel` command - Filter model list to show only free models
- Free-only toggle (state persists)

---

## Reference Implementation (pi-mono)

### Where Implemented
`modes/interactive/interactive-mode.ts:1900`

### Command Handler
```typescript
if (text === "/freemodel" || text.startsWith("/freemodel ")) {
  const searchTerm = text.startsWith("/freemodel ") ? text.slice(11).trim() : undefined;
  this.editor.setText("");
  this.showModelSelector(searchTerm, true);  // true = freeOnly
  return;
}
```

### freeOnly Filter
`modes/interactive/components/model-selector.ts:36-38, 226-231`

```typescript
function isFreeModelId(modelId: string): boolean {
  return modelId.toLowerCase().includes("free");
}

private applyModelFilters(items: ModelItem[]): ModelItem[] {
  if (!this.freeOnlyFilterEnabled) {
    return items;
  }
  return items.filter((item) => isFreeModelId(item.id));
}
```

### High-Level Flow
1. User types `/freemodel` - toggle free-only mode
2. `showModelSelector()` called with `freeOnly = true`
3. ModelSelectorComponent filters models via `applyModelFilters()`
4. Filtered list displayed

---

## oh-my-pi Implementation Plan

### 1. Built-in Command Registry

**File:** `packages/coding-agent/src/slash-commands/builtin-registry.ts`

**Add to `BUILTIN_SLASH_COMMAND_REGISTRY`:**
```typescript
{
  name: "freemodel",
  description: "Toggle free-only model filter",
  handle: async (_command, runtime) => {
    await executeFreeModelCommand(runtime);
    runtime.ctx.editor.setText("");
  },
}
```

### 2. Free Model Filter Logic

**File:** `packages/coding-agent/src/config/free-model-filter.ts`

```typescript
import type { Model } from "./model-registry";
import type { SettingPath } from "./settings";

export const FREE_ONLY_SETTING: SettingPath = "model.freeOnly" as const;

export function isFreeModel(model: Model): boolean {
  const nameLower = model.name.toLowerCase();
  const idLower = model.id.toLowerCase();
  return nameLower.includes("free") || idLower.includes("free");
}

export function filterFreeModels(models: Model[], enabled: boolean): Model[] {
  if (!enabled) {
    return models;
  }
  return models.filter(isFreeModel);
}

export function getFreeOnly(settings: any): boolean {
  return settings.get(FREE_ONLY_SETTING);
}

export function toggleFreeOnly(settings: any): boolean {
  const current = getFreeOnly(settings);
  const next = !current;
  settings.set(FREE_ONLY_SETTING, next);
  return next;
}

export function getFreeOnlyState(settings: any): { enabled: boolean } {
  return { enabled: getFreeOnly(settings) };
}
```

### 3. Settings Schema

**File:** `packages/coding-agent/src/config/settings-schema.ts`

**Add:**
```typescript
"model.freeOnly": {
  type: "boolean",
  default: false,
  ui: {
    tab: "model",
    label: "Free models only",
    description: "Filter model list to show only free models",
  },
},
```

### 4. Model Registry Integration

**File:** `packages/coding-agent/src/model-registry.ts`

**Update `getModels()` method:**
```typescript
getModels(): Model[] {
  let models = [...this._models];
  
  // Apply free-only filter if enabled
  const isFreeOnly = settings.get(FREE_ONLY_SETTING);
  if (isFreeOnly) {
    models = models.filter(isFreeModel);
  }
  
  // Apply existing provider grouping logic
  // ... existing code ...
  
  return models;
}
```

### 5. Command Handler

**File:** `packages/coding-agent/src/slash-commands/freemodel.ts`

```typescript
import type { BuiltinSlashCommandRuntime } from "./builtin-registry";
import { FREE_ONLY_SETTING, toggleFreeOnly } from "../config/free-model-filter";

export async function executeFreeModelCommand(runtime: BuiltinSlashCommandRuntime): Promise<void> {
  const wasEnabled = runtime.ctx.settings.get(FREE_ONLY_SETTING);
  const isEnabled = toggleFreeOnly(runtime.ctx.settings);
  
  const status = isEnabled ? "ON" : "OFF";
  runtime.ctx.showStatus(`Free model filter: ${status}`);
  
  // Update model list UI if open
  if (runtime.ctx.modelSelectorOpen) {
    await runtime.ctx.refreshModelList();
  }
}
```

### 6. Acceptance Criteria

- [ ] `/freemodel` toggles free-only mode
- [ ] Setting persists across sessions
- [ ] `/model` respects free-only filter
- [ ] `/settings` model picker respects free-only filter
- [ ] Filter is case-insensitive ("FREE", "Free", "free" all work)
- [ ] Default is OFF (show all models)

---

## /freemodel as Separate Repository

### Repository: `pi-freemodel`

**Structure:**
```
pi-freemodel/
├── package.json
├── README.md
├── src/
│   ├── slash-command.ts    # Slash command capability
│   ├── free-model-filter.ts # Filter logic
│   └── freemodel.ts        # Command handler
├── test/
│   └── freemodel.test.ts
└── docs/
    └── usage.md
```

**Package.json:**
```json
{
  "name": "@oh-my-pi/freemodel-extension",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "bun test"
  },
  "dependencies": {
    "@oh-my-pi/pi-coding-agent": "^0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "bun-types": "^1.1.0"
  }
}
```

**Slash Command Capability (src/slash-command.ts):**
```typescript
import { defineCapability } from "@oh-my-pi/pi-coding-agent";

export interface FreemodelExtension {
  name: "freemodel";
  path: string;
  content: string;
  level: "user" | "project" | "native";
}

export const freemodelCapability = defineCapability<FreemodelExtension>({
  id: "freemodel-extension",
  displayName: "Freemodel Extension",
  description: "Extension for /freemodel slash command",
  key: cmd => cmd.name,
  validate: cmd => {
    if (!cmd.name) return "Missing name";
    if (!cmd.path) return "Missing path";
    if (!cmd.content) return "Missing content";
    return undefined;
  },
});
```

---

## Implementation Options

### Option A: Built-in in oh-my-pi (Recommended for MVP)
- Simpler to implement
- No external dependency
- Can iterate quickly
- Later extract to separate repo

### Option B: External Extension from Start
- Cleaner separation
- Reusable across projects
- Requires more setup (npm publishing, etc.)

**Recommendation:** Start with Option A (built-in), extract to `pi-freemodel` repository later.

---

## Next Steps

1. Implement `/freemodel` as built-in command
2. Add `FREE_ONLY_SETTING` to settings schema
3. Integrate with ModelRegistry
4. Test in oh-my-pi dev mode
5. Extract to `pi-freemodel` repository (optional)

---

## Questions

1. Should `/freemodel` be built-in or external?
2. Should it support `/freemodel <term>` search?
3. Should it persist as setting or toggle-only?

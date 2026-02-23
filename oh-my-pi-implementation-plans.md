# Implementation Plans

**Date:** 2026-02-23  
**Status:** Phase 2 - Detailed Implementation Planning

---

## `/help` Extension

### 1. Files to Create/Modify

**New Files:**
- `packages/coding-agent/src/slash-commands/help.ts` - Command implementation

**Modified Files:**
- `packages/coding-agent/src/slash-commands/builtin-registry.ts` - Register `/help` command

### 2. Implementation Steps

#### Step 1: Create `help.ts`
```typescript
// packages/coding-agent/src/slash-commands/help.ts
import type { BuiltinSlashCommandRuntime } from "./builtin-registry";
import {
  BUILTIN_SLASH_COMMAND_DEFS,
  type BuiltinSlashCommand,
  type SubcommandDef,
} from "./builtin-registry";
import type { FileSlashCommand } from "../extensibility/slash-commands";

export function makeHelpMessage(
  builtinCmds: BuiltinSlashCommand[],
  fileCmds: FileSlashCommand[],
): string {
  const width = 16;
  
  const formatRow = (name: string, desc: string): string => {
    const padded = `${name.slice(0, width - 1).padEnd(width - 1)}  `;
    return `${padded}${desc}`;
  };

  let output = "Slash Commands:\n";
  output += "--------------------------------\n\n";

  // Builtin commands
  output += "Built-in Commands:\n";
  for (const cmd of builtinCmds.sort((a, b) => a.name.localeCompare(b.name))) {
    output += formatRow(cmd.name, cmd.description) + "\n";
    if (cmd.subcommands) {
      for (const sub of cmd.subcommands) {
        output += formatRow(`  ${cmd.name} ${sub.name}`, sub.description) + "\n";
      }
    }
  }

  output += "\nExtension Commands:\n";
  const extensions = fileCmds.filter(c => !c.source.includes("bundled"));
  if (extensions.length === 0) {
    output += "  (no extension commands registered)\n";
  } else {
    for (const cmd of extensions.sort((a, b) => a.name.localeCompare(b.name))) {
      output += formatRow(`/${cmd.name}`, cmd.description) + "\n";
    }
  }

  output += "\nBundled Templates:\n";
  const bundled = fileCmds.filter(c => c.source.includes("bundled"));
  if (bundled.length === 0) {
    output += "  (no bundled templates)\n";
  } else {
    for (const cmd of bundled.sort((a, b) => a.name.localeCompare(b.name))) {
      output += formatRow(`/${cmd.name}`, cmd.description) + "\n";
    }
  }

  return output;
}

async function showAllHelp(
  builtinCmds: BuiltinSlashCommand[],
  fileCmds: FileSlashCommand[],
): Promise<string> {
  return makeHelpMessage(builtinCmds, fileCmds);
}

export async function handleHelpCommand(
  runtime: BuiltinSlashCommandRuntime,
  args: string,
): Promise<void> {
  // TODO: Load file commands
  const builtinCmds = BUILTIN_SLASH_COMMAND_DEFS;
  const fileCmds: FileSlashCommand[] = [];

  if (!args) {
    const msg = await showAllHelp(builtinCmds, fileCmds);
    runtime.ctx.showStatus(msg);
    return;
  }

  // TODO: /help <command> support
  const cmd = builtinCmds.find(c => c.name === args);
  if (cmd) {
    let msg = `${cmd.name} - ${cmd.description}\n`;
    msg += "-".repeat(40) + "\n";
    msg += `Description: ${cmd.description}\n`;
    if (cmd.inlineHint) msg += `Hint: ${cmd.inlineHint}\n`;
    runtime.ctx.showStatus(msg);
    return;
  }

  runtime.ctx.showStatus(`Command '/${args}' not found.`);
}

export async function executeHelpCommand(
  runtime: BuiltinSlashCommandRuntime,
): Promise<void> {
  await handleHelpCommand(runtime, "");
}
```

#### Step 2: Register `/help` in builtin-registry.ts
```typescript
// In BUILTIN_SLASH_COMMAND_REGISTRY array:
{
  name: "help",
  description: "Display help message",
  handle: async (_command, runtime) => {
    await executeHelpCommand(runtime);
    runtime.ctx.editor.setText("");
  },
},
```

### 3. Acceptance Criteria
- [ ] `/help` displays built-in commands with descriptions
- [ ] Extension commands shown (when available)
- [ ] Bundled templates listed
- [ ] `/help <command>` shows command-specific help
- [ ] Output formatted as table with aligned columns

---

## `/freemodel` Extension

### 1. Files to Create/Modify

**New Files:**
- `packages/coding-agent/src/slash-commands/freemodel.ts` - Command implementation
- `packages/coding-agent/src/config/free-model-filter.ts` - Filter logic and state

**Modified Files:**
- `packages/coding-agent/src/config/settings-schema.ts` - Add setting
- `packages/coding-agent/src/model-registry.ts` - Add filter
- `packages/coding-agent/src/slash-commands/builtin-registry.ts` - Register `/freemodel`

### 2. Implementation Steps

#### Step 1: Create `free-model-filter.ts`
```typescript
// packages/coding-agent/src/config/free-model-filter.ts
import type { Model } from "./model-registry";
import { settings, type SettingPath } from "./settings";

export const FREE_ONLY_SETTING: SettingPath = "model.freeOnly" as const;

export function isFreeModel(model: Model): boolean {
  const nameLower = model.name.toLowerCase();
  const idLower = model.id.toLowerCase();
  return nameLower.includes("free") || idLower.includes("free");
}

export function filterFreeModels(models: Model[]): Model[] {
  if (settings.get(FREE_ONLY_SETTING)) {
    return models.filter(isFreeModel);
  }
  return models;
}

export function toggleFreeOnly(): void {
  const current = settings.get(FREE_ONLY_SETTING);
  settings.set(FREE_ONLY_SETTING, !current);
}

export function getFreeOnly(): boolean {
  return settings.get(FREE_ONLY_SETTING);
}
```

#### Step 2: Create `freemodel.ts`
```typescript
// packages/coding-agent/src/slash-commands/freemodel.ts
import type { BuiltinSlashCommandRuntime } from "./builtin-registry";
import { FREE_ONLY_SETTING, getFreeOnly, toggleFreeOnly } from "../config/free-model-filter";

export async function handleFreeModelCommand(
  runtime: BuiltinSlashCommandRuntime,
): Promise<void> {
  toggleFreeOnly();
  const isFreeOnly = getFreeOnly();
  runtime.ctx.showStatus(`Free model filter: ${isFreeOnly ? "ON" : "OFF"}`);
  
  // Trigger model list refresh if UI is open
  if (runtime.ctx.modelSelectorOpen) {
    await runtime.ctx.refreshModelList();
  }
}

export async function executeFreeModelCommand(
  runtime: BuiltinSlashCommandRuntime,
): Promise<void> {
  await handleFreeModelCommand(runtime);
  runtime.ctx.editor.setText("");
}
```

#### Step 3: Add setting to settings-schema.ts
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

#### Step 4: Register `/freemodel` in builtin-registry.ts
```typescript
{
  name: "freemodel",
  description: "Toggle free-only model filter",
  handle: async (_command, runtime) => {
    await executeFreeModelCommand(runtime);
  },
},
```

### 3. Acceptance Criteria
- [ ] `/freemodel` toggles setting on/off
- [ ] Setting persists across sessions
- [ ] `/model` respects free-only filter
- [ ] `/settings` model picker respects free-only filter
- [ ] Filter is case-insensitive for "free" substring
- [ ] Default is OFF (show all models)

---

## Settings Schema Updates

### Complete Settings Additions

#### In `config/settings-schema.ts`:

```typescript
// Model settings section
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

#### In `config/settings.ts` - Settings class needs getter/setter:

```typescript
// Getter
get freeOnly(): boolean {
  return this.get(FREE_ONLY_SETTING);
}

// Setter
set freeOnly(value: boolean) {
  this.set(FREE_ONLY_SETTING, value);
}
```

---

## Model Registry Integration

### Free-only filter integration

```typescript
// packages/coding-agent/src/model-registry.ts

export class ModelRegistry {
  // ... existing code ...

  getModels(): Model[] {
    let models = [...this._models];
    
    // Apply free-only filter
    const isFreeOnly = settings.get(FREE_ONLY_SETTING);
    if (isFreeOnly) {
      models = models.filter(isFreeModel);
    }
    
    // Apply provider grouping
    // ... existing grouping code ...
    
    return models;
  }
}
```

---

## Implementation Priorities

### Phase 1: `/help` (Priority: HIGH - 2-3 days)
1. Create `help.ts` - 1 day
2. Register command in builtin-registry.ts - 0.5 day
3. Tests - 0.5 day
4. Documentation - 0.5 day

### Phase 2: `/freemodel` (Priority: MEDIUM - 3-4 days)
1. Create `free-model-filter.ts` - 0.5 day
2. Create `freemodel.ts` - 0.5 day
3. Add setting to settings-schema.ts - 0.5 day
4. Register command - 0.5 day
5. Model registry integration - 1 day
6. Tests - 1 day

### Phase 3: Post-MVP Enhancements
- `/help <command>` subcommand (1 day)
- Provider grouping UI (2-3 days)
- Model provider settings (1-2 days)

---

## Testing Strategy

### `/help` Tests
```typescript
// test/slash-commands/help.test.ts
describe("help command", () => {
  it("shows all builtin commands with descriptions", async () => {
    // ...
  });
  
  it("shows extension commands", async () => {
    // ...
  });
  
  it("shows bundled templates", async () => {
    // ...
  });
  
  it("/help <command> shows command-specific help", async () => {
    // ...
  });
});
```

### `/freemodel` Tests
```typescript
// test/slash-commands/freemodel.test.ts
describe("freemodel command", () => {
  it("toggles free-only setting", async () => {
    // ...
  });
  
  it("persists setting across sessions", async () => {
    // ...
  });
  
  it("filters model list correctly", async () => {
    // ...
  });
  
  it("case-insensitive 'free' matching", async () => {
    // ...
  });
});
```

---

## Acceptance Checklist

### `/help`
- [ ] `/help` displays built-in commands
- [ ] `/help` displays extension commands
- [ ] `/help` displays bundled templates
- [ ] Each command shows description
- [ ] Output formatted as aligned table
- [ ] `/help <command>` shows command details

### `/freemodel`
- [ ] `/freemodel` toggles setting
- [ ] Setting persists
- [ ] `/model` respects filter
- [ ] `/settings` respects filter
- [ ] Case-insensitive filtering
- [ ] Default OFF

---

## Risk Mitigation

### `/help`
- **Risk:** File commands not loaded
  - **Mitigation:** Load via capability API, fallback gracefully

### `/freemodel`
- **Risk:** Filter not applied to all model displays
  - **Mitigation:** Centralize filter in ModelRegistry.getModels()
  - **Risk:** Performance impact on large model lists
  - **Mitigation:** Filter is O(n) but lists are small (<100 models)

---

## Notes

1. Both commands are standalone - no shared state
2. `/help` can be extended later for subcommands
3. `/freemodel` integrates with existing settings infrastructure
4. No changes to agent session or tool execution required

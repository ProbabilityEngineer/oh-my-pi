# Extension Design: /help

**Based on:** pi-mono implementation in `modes/interactive/interactive-mode.ts`  
**For:** oh-my-pi userland extension  
**Repository:** `pi-help`

---

## Current State in oh-my-pi

### What Exists (Built-in Commands)
- `/settings` - Open settings menu
- `/model` - Select model (opens selector UI)
- `/plan` - Toggle plan mode
- `/export` - Export session to HTML file
- `/share` - Share session as GitHub gist
- `/copy` - Copy last agent message
- `/session` - Show session stats
- `/usage` - Show provider usage
- `/changelog` - Show changelog entries
- `/dump` - Copy transcript to clipboard

### What's Missing
- `/help` - Show available slash commands (built-in + extension + prompt templates + skills)

---

## Reference Implementation (pi-mono)

### Where Implemented
`packages/coding-agent/src/modes/interactive/interactive-mode.ts`

### Command Handler
```typescript
if (text === "/help") {
    this.handleHelpCommand();
    this.editor.setText("");
    return;
}
```

### Help Display
Builds markdown table with sections:
1. **Built-in** - from `BUILTIN_SLASH_COMMANDS`
2. **Prompt Templates** - from `session.promptTemplates`
3. **Extensions** - from `extensionRunner.getRegisteredCommands()`
4. **Skills** - from `resourceLoader.getSkills().skills` (if enabled)

### Key Reference Files (pi-mono)
| File | Purpose |
|------|---------|
| `modes/interactive/interactive-mode.ts:4168` | `handleHelpCommand()` |
| `core/slash-commands.ts:18` | `BUILTIN_SLASH_COMMANDS` |
| `extensibility/slash-commands.ts` | Extension command loading |
| `core/prompt-templates.ts` | Prompt template registry |

---

## oh-my-pi Implementation Plan

### 1. Slash Command Registry

**File:** `packages/coding-agent/src/slash-commands/builtin-registry.ts`

**Add to `BUILTIN_SLASH_COMMAND_REGISTRY`:**
```typescript
{
  name: "help",
  description: "Show available slash commands",
  handle: async (_command, runtime) => {
    await executeHelpCommand(runtime);
    runtime.ctx.editor.setText("");
  },
}
```

### 2. Help Command Implementation

**File:** `packages/coding-agent/src/slash-commands/help.ts`

```typescript
import {
  BUILTIN_SLASH_COMMAND_DEFS,
  type BuiltinSlashCommand,
  type SubcommandDef,
} from "./builtin-registry";
import { loadSlashCommands } from "../extensibility/slash-commands";
import { EMBEDDED_COMMAND_TEMPLATES } from "../task/commands";

export async function executeHelpCommand(runtime: BuiltinSlashCommandRuntime): Promise<void> {
  const helpMsg = await buildHelpMessage();
  runtime.ctx.showStatus(helpMsg);
}

async function buildHelpMessage(): Promise<string> {
  const builtinCmds = BUILTIN_SLASH_COMMAND_DEFS;
  
  // Load extension commands
  const fileCmds = await loadSlashCommands({ cwd: runtime.ctx.cwd });
  
  // Embedded templates
  const embeddedCmds = EMBEDDED_COMMAND_TEMPLATES.map(t => ({
    name: t.name.replace(/\.md$/, ""),
    description: "Bundled template",
  }));

  const width = 16;
  
  const formatRow = (name: string, desc: string): string => {
    const padded = `${name.slice(0, width - 1).padEnd(width - 1)}  `;
    return `${padded}${desc}`;
  };

  let output = "Slash Commands:\n";
  output += "--------------------------------\n\n";

  // Built-in commands
  output += "Built-in Commands:\n";
  for (const cmd of builtinCmds.sort((a, b) => a.name.localeCompare(b.name))) {
    output += formatRow(cmd.name, cmd.description) + "\n";
    if (cmd.subcommands) {
      for (const sub of cmd.subcommands) {
        output += formatRow(`  ${cmd.name} ${sub.name}`, sub.description) + "\n";
      }
    }
  }

  // Extension commands
  const extensions = fileCmds.filter(c => !c.source.includes("bundled"));
  if (extensions.length === 0) {
    output += "\nExtension Commands:\n  (no extension commands registered)\n";
  } else {
    output += "\nExtension Commands:\n";
    for (const cmd of extensions.sort((a, b) => a.name.localeCompare(b.name))) {
      output += formatRow(`/${cmd.name}`, cmd.description) + "\n";
    }
  }

  // Bundled templates
  if (embeddedCmds.length === 0) {
    output += "\nBundled Templates:\n  (no bundled templates)\n";
  } else {
    output += "\nBundled Templates:\n";
    for (const cmd of embeddedCmds.sort((a, b) => a.name.localeCompare(b.name))) {
      output += formatRow(`/${cmd.name}`, cmd.description) + "\n";
    }
  }

  return output;
}
```

### 3. Acceptance Criteria

- [ ] `/help` displays all built-in commands with descriptions
- [ ] Extension commands shown (when registered)
- [ ] Bundled templates listed
- [ ] Each command shows description
- [ ] Output formatted as aligned table
- [ ] No errors if no extensions loaded

---

## /help as Separate Repository

### Repository: `pi-help`

**Structure:**
```
pi-help/
├── package.json
├── README.md
├── src/
│   ├── slash-command.ts    # Slash command capability
│   └── help.ts             # Help implementation
├── test/
│   └── help.test.ts
└── docs/
    └── usage.md
```

**Package.json:**
```json
{
  "name": "@oh-my-pi/help-extension",
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

export interface HelpExtension {
  name: "help";
  path: string;
  content: string;
  level: "user" | "project" | "native";
}

export const helpCapability = defineCapability<HelpExtension>({
  id: "help-extension",
  displayName: "Help Extension",
  description: "Extension for /help slash command",
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

## Next Steps

1. Create `/help` as built-in command in oh-my-pi
2. Test in oh-my-pi dev mode
3. Extract to `pi-help` repository
4. Document as userland extension
5. Test as external extension

---

## Questions

1. Should `/help` be built-in or userland extension?
2. Should it show subcommands from `subcommands` field?
3. Should it support `/help <command>` syntax?

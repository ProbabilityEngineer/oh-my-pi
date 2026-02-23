# Extension Design Documents

**Date:** 2026-02-23  
**Purpose:** Specify `/freemodel` and `/help` extensions before implementation

---

## `/freemodel` Extension

### 1. Extension Name

`/freemodel`

### 2. Behavior Specification

**Functionality:**
- Display models where name OR id contains "free" (case-insensitive)
- Persist setting toggle: `defaultModelFreeOnly: boolean`
- Filter model list in `/model` selector and `/settings` UI
- Works alongside provider grouping

**User Interface:**
```
$ /freemodel
Toggle free-only model filter: ON/OFF

Current setting: {ON|OFF}
```

**Model Filtering Logic:**
```typescript
function isFreeModel(model: Model): boolean {
  const nameLower = model.name.toLowerCase();
  const idLower = model.id.toLowerCase();
  return nameLower.includes("free") || idLower.includes("free");
}
```

### 3. Files to Create/Modify

**New Files:**
- `packages/coding-agent/src/slash-commands/freemodel.ts` - slash command implementation
- `packages/coding-agent/src/config/free-model-filter.ts` - filter logic and state

**Modified Files:**
- `packages/coding-agent/src/config/settings-schema.ts` - add `defaultModelFreeOnly` setting
- `packages/coding-agent/src/model-registry.ts` - add free filter to model list
- `packages/coding-agent/src/slash-commands/builtin-registry.ts` - register `/freemodel` command
- `packages/coding-agent/src/config/settings.ts` - add getter/setter for toggle

### 4. Settings Schema

```typescript
// In settings-schema.ts
"model.freeOnly": {
  type: "boolean",
  default: false,
  ui: {
    tab: "model",
    label: "Show free models only",
    description: "Filter model list to show only free models",
  },
},
```

### 5. Slash Command Interface

**Command:** `/freemodel`

**Subcommands:** (none, simple toggle)

**Output Format:**
```
Free model filter: {ON|OFF}
```

### 6. Integration Points

**Model Provider:**
- `ModelRegistry` must support free-only filter
- Filter applies to `/model` command output
- Filter applies to `/settings` model picker UI

**Prompt Builder:**
- Free-only setting should NOT appear in system prompt
- Model filtering is UI-level concern, not agent behavior

### 7. Acceptance Criteria

- `/freemodel` command toggles setting
- Setting persists across sessions
- `/model` command respects free-only filter
- `/settings` model picker respects free-only filter
- Filter is case-insensitive for "free" substring
- Default is OFF (show all models)

---

## `/help` Extension

### 1. Extension Name

`/help`

### 2. Behavior Specification

**Functionality:**
- Display all slash commands (built-in + extension)
- Show built-in command inventory
- Show extension commands
- Display short description per command

**Output Format:**
```
Slash Commands:
--------------
Command         Description
---------       -----------
/freemodel      Toggle free-only model filter
/help           Display this help message
/model          Select model for agent
/settings       Open settings manager
/plan           View and manage work plan
/ssh            SSH into remote server
/mcp            MCP server management

Built-in Commands:
-----------------
alias           Define command alias
cd              Change working directory
edit            Edit file
grep            Search files
阅读            Read file
写入            Write to file
修改            Patch file
hashline        Hashline editing mode
```

### 3. Files to Create/Modify

**New Files:**
- `packages/coding-agent/src/slash-commands/help.ts` - slash command implementation

**Modified Files:**
- `packages/coding-agent/src/slash-commands/builtin-registry.ts` - register `/help` command
- `packages/coding-agent/src/slash-commands/types.ts` - add command metadata type

### 4. Command Registry Metadata

**Required Metadata Per Command:**
```typescript
interface CommandMetadata {
  name: string;           // Full command name (e.g., "/freemodel")
  description: string;    // Short description
  category: string;       // "builtin" | "extension" | "wip"
  subcommands?: string[]; // List of subcommand names if applicable
}
```

**Sample Metadata:**
```typescript
const BUILTIN_COMMANDS: CommandMetadata[] = [
  {
    name: "/freemodel",
    description: "Toggle free-only model filter",
    category: "extension",
  },
  {
    name: "/help",
    description: "Display help message",
    category: "builtin",
  },
  {
    name: "/model",
    description: "Select model for agent",
    category: "builtin",
  },
  {
    name: "/settings",
    description: "Open settings manager",
    category: "builtin",
  },
  // ... all other commands
];
```

### 5. Slash Command Interface

**Command:** `/help`

**Subcommands:**
- `/help <command>` - Show detailed help for specific command
- `/help builtins` - Show only built-in commands
- `/help extensions` - Show only extension commands

**Output Format:**
```
$ /help /model

/model - Select model for agent
----------------
Usage: /model

Lists available models and allows selection of default model.
``
```

### 6. Integration Points

**Slash Command Registry:**
- Each registered command must provide metadata
- `/help` queries registry for all commands
- Filters by category if subcommand specified

**No Changes Required:**
- Model registry (metadata already exists)
- Settings schema (no settings for help itself)

### 7. Acceptance Criteria

- `/help` displays all slash commands
- `/help` shows built-in command inventory
- `/help` shows extension commands
- Each command shows short description
- `/help <command>` shows detailed help
- Extensions can register their own help entries

---

## Extension Architecture Requirements

### 1. Modular Design

Each extension must:
- Be independently installable
- Have minimal coupling to core
- Include documentation (README.md)
- Include usage examples

### 2. Registration Pattern

Extensions register via capability API:
```typescript
registerCapability(capability, {
  name: "freemodel",
  path: "./slash-commands/freemodel.ts",
});
```

### 3. Directory Structure

```
packages/coding-agent/src/slash-commands/
├── freemodel.ts      # /freemodel implementation
├── help.ts           # /help implementation
├── model.ts          # /model implementation
├── settings.ts       # /settings implementation
├── plan.ts           # /plan implementation
└── builtin-registry.ts  # Command registry
```

---

## Extension Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Add settings types for extensions
- [ ] Create settings selector UI with toggles
- [ ] Implement settings persistence and hot-reload

### Phase 2: /freemodel
- [ ] Implement `src/slash-commands/freemodel.ts`
- [ ] Add `defaultModelFreeOnly` setting to schema
- [ ] Register `/freemodel` command
- [ ] Integrate with model filter
- [ ] Add tests for free model filter

### Phase 3: /help
- [ ] Implement `src/slash-commands/help.ts`
- [ ] Add command metadata to registry
- [ ] Register `/help` command
- [ ] Implement subcommand handling
- [ ] Add tests for help commands

### Phase 4: Testing & Deployment
- [ ] End-to-end tests for both extensions
- [ ] Documentation updates
- [ ] Release notes
- [ ] User guide

---

## Next Steps

1. **Extension Design Review** - Approve `/freemodel` and `/help` specifications
2. **Extension Architecture** - Finalize modular design and registration pattern
3. **Implementation Scheduling** - Allocate effort for each extension
4. **Beads Structure** - Create epics and tasks for each extension
5. **Branch Strategy** - `epic/freemodel`, `epic/help` branches

---

**Note:** No coding begins until extension designs approved per audit plan constraint.

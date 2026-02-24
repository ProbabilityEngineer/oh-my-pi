# Task Tracking with Beads

The `todo_write` tool has been **deprecated** in favor of [beads](https://github.com/steveyegge/beads).

## Why Beads?

| Feature | Todo System | Beads |
|---------|-------------|-------|
| Persistence | ❌ In-memory (lost on restart) | ✅ Git-backed (survives restarts) |
| Cross-session | ❌ No | ✅ Yes |
| History | ❌ None | ✅ Git history |
| CLI | ❌ Custom | ✅ `bd` commands |
| Sharing | ❌ Local only | ✅ Git sync |

## Usage

### Create Tasks

```bash
# Create epic/feature
bd create --title="Implement feature X" --type=feature --priority=1

# Create task under epic
bd create --title="Task 1: Setup infrastructure" --type=task --parent=oh-my-pi-123
```

### Update Tasks

```bash
# Start working
bd update oh-my-pi-456 --status=in_progress

# Add notes
bd update oh-my-pi-456 --notes="Completed setup, starting implementation"

# Complete task
bd update oh-my-pi-456 --status=completed --reason="Implemented in commit abc123"
```

### List Tasks

```bash
# All open issues
bd list --status=open

# My tasks
bd list --status=open --assignee=@me

# High priority
bd list --priority=1
```

### Dependencies

```bash
# Block task B on task A
bd dep add oh-my-pi-B oh-my-pi-A

# View dependencies
bd show oh-my-pi-B
```

## Agent Integration

The agent automatically reads beads issues from AGENTS.md. When you mention issue IDs (e.g., `oh-my-pi-123`), the agent includes that context.

**Example workflow:**
```
User: "Work on oh-my-pi-456 today"
Agent: [reads beads issue, understands scope, starts work]
```

## Migration from todo_write

**Before:**
```typescript
todo_write({
  op: "add_task",
  content: "Implement feature",
  status: "pending"
})
```

**After:**
```bash
bd create --title="Implement feature" --type=task
```

## Resources

- [Beads Documentation](https://github.com/steveyegge/beads)
- [Beads CLI Reference]('/Users/sam/.claude/plugins/cache/beads-marketplace/beads/0.49.6/skills/beads/SKILL.md')
- [Workflows]('/Users/sam/.claude/plugins/cache/beads-marketplace/beads/0.49.6/skills/beads/resources/WORKFLOWS.md')

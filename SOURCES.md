# Sources

## Claude Code Officiële Documentatie
- https://code.claude.com/docs/en/overview
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/cli-reference
- https://code.claude.com/docs/en/mcp
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/permissions
- https://code.claude.com/docs/en/commands
- https://code.claude.com/docs/en/setup

## Agent Skills Open Standaard
- https://agentskills.io/home
- https://agentskills.io/specification
- https://agentskills.io/what-are-skills
- https://github.com/agentskills/agentskills

## Skill Bronnen
- https://github.com/anthropics/skills (Anthropic official skills)
- https://github.com/anthropics/claude-plugins-official (Official plugins)
- https://github.com/orgs/OpenAEC-Foundation/repositories (OpenAEC skill packages)

## Officieel Skill Formaat

### Directory structuur
```
skill-naam/
  SKILL.md           # Hoofd-instructies (verplicht)
  reference.md       # Optioneel: gedetailleerde docs
  examples/          # Optioneel: voorbeelden
  scripts/           # Optioneel: uitvoerbare scripts
```

### SKILL.md Frontmatter
```yaml
---
name: skill-naam
description: Wat de skill doet en wanneer te gebruiken
disable-model-invocation: true/false
user-invocable: true/false
allowed-tools: Read, Grep, Glob
model: claude-opus-4-6
effort: low/medium/high/max
context: fork
agent: Explore/Plan/general-purpose
---
```

### Installatie locaties
| Scope | Pad | Wie |
|-------|-----|-----|
| Persoonlijk | ~/.claude/skills/<naam>/SKILL.md | Alle projecten |
| Project | .claude/skills/<naam>/SKILL.md | Dit project |
| Plugin | <plugin>/skills/<naam>/SKILL.md | Waar plugin actief |
| Enterprise | Managed settings | Hele organisatie |

## Claude Code Configuratie

### Settings bestanden
| Scope | Locatie | Gedeeld |
|-------|---------|---------|
| User | ~/.claude/settings.json | Nee |
| Project | .claude/settings.json | Ja (git) |
| Local | .claude/settings.local.json | Nee |
| Managed | Systeem-niveau | Ja (IT) |

### CLAUDE.md locaties
| Scope | Locatie |
|-------|---------|
| Project | ./CLAUDE.md of ./.claude/CLAUDE.md |
| User | ~/.claude/CLAUDE.md |
| Managed | Systeem-specifiek pad |

### Auto Memory
- Locatie: ~/.claude/projects/<project>/memory/
- MEMORY.md als index (eerste 200 regels geladen)
- Topic bestanden voor details
- Machine-lokaal, niet gedeeld

### Hooks Events
SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, SessionEnd, PermissionRequest, SubagentStart, SubagentStop, Notification, ConfigChange, InstructionsLoaded, PreCompact, PostCompact, WorktreeCreate, WorktreeRemove, Elicitation

### MCP Configuratie
- .mcp.json in project root
- ~/.claude/.mcp.json voor globaal

## Compatibele Agents (Agent Skills standaard)
Claude Code, Cursor, VS Code, GitHub Copilot, Gemini CLI, JetBrains Junie, OpenHands, Goose, Roo Code, OpenAI Codex, Kiro, Databricks, Snowflake, en 20+ andere tools.

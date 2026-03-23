# ANALYSIS: Real-World Claude Code Configuratiepatronen

> Gebaseerd op onderzoek van 35+ projecten, ~/.claude/ global settings, en Impertio-AI-Ecosystem-Deployment

## 1. Permission Patronen (3 tiers)

### Tier A: Restrictive (Open-Agents, multi-package projecten)
Expliciete command whitelist per tool. Voorkomt onbedoelde acties in complexe projecten.
```json
{
  "permissions": {
    "allow": [
      "Bash(npm run build)",
      "Bash(npx tsc --noEmit)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Read",
      "Glob",
      "Grep",
      "WebFetch",
      "WebSearch"
    ]
  }
}
```

### Tier B: Standard (23 repos, meest gebruikt)
Tool patterns met wildcards. Balans tussen vrijheid en controle.
```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(cargo *)",
      "Bash(git *)",
      "Bash(docker *)",
      "Read", "Write", "Edit", "Glob", "Grep",
      "WebFetch", "WebSearch",
      "Agent"
    ]
  }
}
```

### Tier C: Full Access (15 repos, skill package development)
Alle tools open. Gebruikt met agent-delegatie en hoog vertrouwen.
```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read", "Write", "Edit", "Glob", "Grep",
      "WebFetch", "WebSearch",
      "Agent", "Skill(*)"
    ]
  }
}
```

## 2. Hook Patronen (uit Open-Agents, erpnext-nextcloud)

### PreToolUse: Delegation Check
Waarschuwt bij directe code edits zonder agent delegatie.
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/check-delegation.sh"
      }]
    }]
  }
}
```

### PostToolUse: Auto-restart Dev Server
Herstart dev server automatisch na bestandswijzigingen.
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "bash ./scripts/ensure-dev-running.sh"
      }]
    }]
  }
}
```

### SessionStart: Infrastructure Setup
SSH tunnels, session summaries bij sessiestart.
```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "bash ./scripts/tunnel.sh start"
      }]
    }]
  }
}
```

## 3. MCP Server Patronen (9 projecten)

### Patroon 1: Lokale tool (meest gebruikt)
```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"],
      "env": { "BLENDER_MCP_PORT": "9876" }
    }
  }
}
```

### Patroon 2: NPX package
```json
{
  "mcpServers": {
    "frappe": {
      "command": "npx",
      "args": ["-y", "frappe-mcp-server@latest"],
      "env": {
        "FRAPPE_URL": "${FRAPPE_URL}",
        "FRAPPE_API_KEY": "${FRAPPE_API_KEY}",
        "FRAPPE_API_SECRET": "${FRAPPE_API_SECRET}"
      }
    }
  }
}
```

### Patroon 3: Python module
```json
{
  "mcpServers": {
    "open-agents": {
      "command": "python3",
      "args": ["-m", "open_agents.mcp_server"],
      "cwd": "/path/to/project"
    }
  }
}
```

## 4. CLAUDE.md Structuren (3 templates)

### Lightweight (~40 regels)
Projecten: OpenAEC-Workspace-Composer
Secties: Identity, Stack, Conventions, Commands

### Standard Application (~200 regels)
Projecten: erpnext-nextcloud-NL-websites
Secties: Identity, Stack, Architecture, Conventions, Protocols (P-001 t/m P-003), Core Files Map, Credentials

### Full Skill Package (~300+ regels)
Projecten: Docker, Cross-Tech-AEC, Blender-Bonsai
Secties: Standing Orders, Identity, Core Files Map (8+), Protocols P-000a t/m P-010, Skill Categories, YAML Frontmatter Rules, Publication Protocol

## 5. Custom Commands (8 uit ~/.claude/commands/)

| Command | Doel |
|---------|------|
| `/start` | Session bootstrap. Leest ROADMAP, LESSONS, DECISIONS |
| `/bootstrap [TECH]` | Nieuw skill package opzetten met alle core files |
| `/status` | ROADMAP fase en voortgang tonen |
| `/validate` | SKILL.md quality gates checken |
| `/lessons` | Lessons learned tonen of toevoegen |
| `/audit` | Completeness audit met scoring |
| `/mcp-search` | MCP servers zoeken voor een technologie |
| `/prompts` | Beschikbare commands tonen |

## 6. Workspace Tiers (uit Impertio-AI-Ecosystem-Deployment)

| Tier | Token Budget | Geschikt voor |
|------|-------------|---------------|
| Minimal | ~100-200 | Eenmalige taken |
| Standard | ~500-1000 | Software development |
| Standard + Design | ~800-1400 | UI/UX projecten |
| Standard + Research | ~700-1200 | Onderzoek/documentatie |
| Standard + BIM | ~800-1500 | 3D modellering |
| Full | ~1500-2500 | Enterprise projecten |

## 7. Universele Conventies (alle 35 projecten)

### Privacy Protocol (P-000a)
- PROMPTS.md ALTIJD in .gitignore
- .claude/ directory in .gitignore
- *.code-workspace in .gitignore
- API keys nooit in git-tracked bestanden

### Session Start Protocol (P-001)
1. Lees ROADMAP.md, bepaal huidige fase
2. Lees LESSONS.md, check recente ontdekkingen
3. Lees DECISIONS.md, begrijp constraints
4. Bepaal volgende actie
5. Bevestig met gebruiker

### Skills Architectuur
- Progressive disclosure: frontmatter triggers, body on activation
- Naming: kebab-case, max 64 tekens
- Description: begint met "Use when..."
- Keywords: altijd een "Keywords:" regel
- Max 500 regels per SKILL.md

## 8. Gevonden MCP Servers (10 echte configs)

| Server | Type | Categorie |
|--------|------|-----------|
| Blender MCP | uvx | 3D/BIM |
| FreeCAD MCP | uvx | 3D/BIM |
| Speckle MCP | node | 3D/BIM |
| ERPNext/Frappe MCP | npx | ERP |
| Draw.io Editor | npx | Diagrams |
| Draw.io Converter | npx | Diagrams |
| Open-Agents MCP | python3 | AI/Agents |
| GitHub MCP | npx | Development |
| Filesystem MCP | npx | Development |
| Puppeteer MCP | npx | Development |

# Orchestrator Data — Reference

Voorbeelddata van de orchestrator-structuur die de Manage modus moet scannen en tonen.

## project-registry.json (structuur)

```json
{
  "version": "2.0",
  "projects": {
    "warmteverlies": {
      "naam": "Warmteverliesberekening",
      "pad": "D:/Github/warmteverliesberekening",
      "claude_project": "D--Github-warmteverliesberekening",
      "beschrijving": "NEN-EN 12831 warmteverliesberekening",
      "status": "active",
      "taal": ["Python", "TypeScript", "Rust"],
      "deploy": "Hetzner VPS via GitHub Actions + GHCR + Watchtower",
      "context_file": "context/warmteverlies.md",
      "tags": ["berekening", "bouwfysica", "docker", "ci-cd"]
    },
    "pyrevit": {
      "naam": "PyRevit 3BM Toolbar",
      "pad": "X:/10_3BM_bouwkunde/50_Claude-Code-Projects/pyrevit",
      "status": "active",
      "taal": ["IronPython 2.7"],
      "tags": ["revit", "toolbar", "bim"]
    }
  },
  "integraties": [
    {
      "van": "pyrevit",
      "naar": "warmteverlies",
      "beschrijving": "PyRevit exporteert ruimtegegevens als JSON input"
    }
  ]
}
```

## Session summary formaat (*_latest.md)

```markdown
# Warmteverlies — Sessie update
**Datum:** 2026-03-19 17:00
**Branch:** master

## Wat is gedaan
- Shell-kleuren herlijnd met OpenAEC design system
- CI/CD pipeline: Docker build verplaatst naar GitHub Actions

## Huidige staat
Productie draait en is gezond.

## Gewijzigde bestanden
- `.github/workflows/deploy.yml`
- `docker-compose.yml`

## Openstaande issues / next steps
- GHCR package staat op private

## Cross-project notities
- Watchtower patroon herbruikbaar voor andere Docker-deployed tools
```

## Lessons learned formaat

```markdown
### 🔴 Schema-first development
**Bron:** Report Generator CLAUDE.md
**Les:** Bij elke nieuwe feature: update het JSON schema EERST.

### 🟡 Docker build caching
**Bron:** Report Generator Dockerfile
**Les:** Gebruik pip install . ipv hardcoded deps in Dockerfile.
```

Categorieën: MCP Server & Tooling, Code Kwaliteit & Architectuur, Deployment & Infrastructuur, UI & Frontend, Werkproces & Communicatie, Project-specifieke lessen.

## Filesystem locaties

```
C:\Users\JochemK\.claude\
├── CLAUDE.md
├── orchestrator\
│   ├── project-registry.json     (21 projecten, 12 integraties)
│   ├── lessons-learned.md        (pointer naar X-drive master)
│   ├── README.md
│   ├── context\
│   │   ├── warmteverlies.md
│   │   ├── pyrevit.md
│   │   ├── report.md
│   │   ├── dashboard.md
│   │   ├── administratie.md
│   │   └── hetzner.md
│   └── sessions\
│       ├── warmteverlies_latest.md
│       └── pyrevit_latest.md
└── projects\                     (interne Claude Code state — NIET tonen)
```

Master lessons learned: `X:\10_3BM_bouwkunde\50_Claude-Code-Projects\lessons_learned_global.md`

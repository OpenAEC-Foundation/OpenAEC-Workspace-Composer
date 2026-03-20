# Handoff: OpenAEC Workspace Composer

> Overgedragen vanuit Skill-Package-Workflow-Template — 2026-03-20

## Wat dit is

Meer dan een workspace generator — een **complete onboarding UI voor Claude Code**. De app maakt het makkelijk om Claude Code goed in te richten, zonder dat je een tech nerd hoeft te zijn. Alles wordt aan de achterkant geregeld: op "start" klikken en je bent klaar.

De app bedient twee niveaus:
1. **Local workspace level** — skill packages, presets, werkmap, `.code-workspace`, `.mcp.json`
2. **Global level** (~/.claude/) — commands, hooks, permissions, plugins, settings

## Huidige status

- Tauri 2 + SolidJS + Vite scaffold draait
- Basis UI en styling (OpenAEC Construction Amber palette) aanwezig
- Volledige componentenstructuur gebouwd: Titlebar, Sidebar, SearchBar, PresetSelector, PackageSelector, WorkspaceConfig, InstallPreview, StatusBar
- Preset- en packageselectie met zoek- en filterfunctionaliteit werkend in de UI
- Native file picker via Tauri dialog plugin geintegreerd (met browser fallback)
- Install flow roept `generate_workspace` Tauri command aan — **Rust backend nog niet geimplementeerd**
- Effort level selector (low/medium/high) aanwezig in UI
- Pakketdata en presetdefinities in `src/lib/packages.ts` en `src/lib/presets.ts`

## Wat er gebouwd moet worden

### MVP Features
1. **Rust backend** — `generate_workspace` command implementeren in Tauri (workspace files schrijven)
2. **GitHub API integratie** — Lijst skill packages ophalen van OpenAEC-Foundation org (nu hardcoded)
3. **Preset systeem** — Voorgeconfigureerde bundels van packages per werkcontext (UI aanwezig, generatie nog niet)
4. **Workspace generator** — `.code-workspace` + `.claude/skills/` + `CLAUDE.md` + `.mcp.json` installatie
5. **VS Code launcher** — Workspace openen na generatie via tauri-plugin-shell

### Presets

| Preset | Skill Packages |
|--------|---------------|
| `OPEN-PDF-STUDIO` | Tauri-2, SolidJS, PDFjs, pdf-lib, Fluent-i18n, Vite |
| `BIM-DEVELOPMENT` | Blender-Bonsai-IfcOpenShell-Sverchok, ThatOpen, Three.js, Docker |
| `ERPNEXT-FULLSTACK` | ERPNext, Nextcloud, Docker, n8n, React |
| `AEC-GIS-BIM` | Blender-Bonsai, Speckle, QGIS, Three.js, ThatOpen, Cross-Tech-AEC |

### Beschikbare Skill Packages (OpenAEC-Foundation)

**Afgerond (261 skills):**
- Blender-Bonsai-IfcOpenShell-Sverchok (73), ERPNext (28), Tauri-2 (27), Nextcloud (24), React (24), Draw.io (22), Vite (22), Docker (22), n8n (21), pdf-lib (17), Fluent-i18n (16), PDFjs (15)

**Gebootstrapt (94 skills gepland, nog te schrijven):**
- Speckle (22), QGIS (19), Three.js (19), ThatOpen (19), Cross-Tech-AEC (15)

### CI/CD Pipeline

De Skill-Package-Workflow-Template repo bevat nu een reusable GitHub Actions workflow die automatisch skill packages valideert. Dit is relevant voor de Composer app:
- De app kan dezelfde validatiescripts gebruiken om package kwaliteit te tonen
- Compliance score per package kan in de UI getoond worden
- Workflow: `OpenAEC-Foundation/Skill-Package-Workflow-Template/.github/workflows/skill-quality.yml`

### Global Level Features (nieuw — nog te bouwen)

De app moet ook **global Claude Code configuratie** kunnen beheren:

**Global Commands** (installeren/beheren via UI → `~/.claude/commands/`):

| Command | Wat het doet |
|---------|-------------|
| `/publish` | GitHub repo aanmaken, README genereren, release taggen, social preview |
| `/deploy` | Skill package naar GitHub pushen + CI/CD activeren |
| `/validate` | Lokale audit draaien met de CI/CD scripts |
| `/status` | Overzicht van alle actieve skills, MCP servers, plugins |
| `/workspace-info` | Huidige workspace configuratie tonen |

**Smart Hooks** (configureerbaar via UI → `~/.claude/hooks.json` of hookify):

| Hook | Trigger | Actie |
|------|---------|-------|
| Auto-detect workspace | SessionStart | Herkent workspace type (skill package, dev project, ERP) en laadt juiste config |
| Auto-effort | SessionStart | Stelt effort in op basis van ROADMAP fase |
| ROADMAP sync | Stop | Updatet ROADMAP.md automatisch bij sessie-einde |
| Safety check | PreToolUse | Waarschuwt bij gevaarlijke operaties in productie-contexten |

**Global Settings** (beheren via UI → `~/.claude/settings.json`):
- Permissions (tool allowlist)
- Plugin management
- Default effort level
- Model preferences

**Kerngedachte:** Mensen die in de praktijk aan de slag willen met Claude Code moeten niet handmatig JSON-bestanden bewerken. De UI regelt alles.

---

## Prerequisites Checker (nieuw — nog te bouwen)

De app moet bij eerste start en bij workspace generatie **automatisch checken** of de gebruiker klaar is om te werken. Niet-tech gebruikers moeten niet zelf uitzoeken wat er geinstalleerd moet zijn.

### Verplichte checks

| Prerequisite | Check command | Installatie-hint |
|-------------|--------------|-----------------|
| Claude Code CLI | `claude --version` | Link naar installatie-pagina |
| Node.js 20+ | `node --version` | Link naar nodejs.org of nvm |
| Git | `git --version` | Link naar git-scm.com |
| VS Code | `code --version` | Link naar code.visualstudio.com |

### Optionele checks (afhankelijk van preset)

| Prerequisite | Nodig voor | Check command |
|-------------|-----------|--------------|
| Rust toolchain | Tauri development | `rustc --version` |
| Docker | Docker, ERPNext presets | `docker --version` |
| Python 3.10+ | QGIS, Blender-Bonsai | `python --version` |
| Blender 4.x | BIM-DEVELOPMENT preset | Check blender pad |
| QGIS 3.34+ | AEC-GIS-BIM preset | Check qgis pad |

### UX Flow

```
[App start] → Prerequisites check →
  Alles OK? → Toon groene checkmarks, ga door
  Iets mist? → Toon rode X met:
    - Wat er mist
    - Waarom je het nodig hebt
    - One-click install link of commando
    - "Check opnieuw" knop
```

De checks draaien via Tauri shell commands (Command::new). Resultaat wordt in de UI getoond als een checklist.

---

## Impertio AI Ecosystem Deployment — Integratie

**Repo:** `C:\Users\Freek Heijting\Documents\GitHub\Impertio-AI-Ecosystem-Deployment\`

Dit is een bestaande deployment repo met:
- Modulaire workspace setup guide (kies type project → kies tier → kies modules)
- 40+ lessons learned uit echte projecten
- MCP server configs (blender-mcp, etc.)
- Skills (session-recovery, session-closure, etc.)
- MANIFEST.json met asset index en dependencies

**Integratie met de Composer:**
- De WORKSPACE_SETUP_GUIDE.md flow (5 stappen) is precies wat de Composer UI moet automatiseren
- De MANIFEST.json kan als data-bron dienen voor beschikbare modules/skills
- De lessons learned (CC_007: workspace-local principle) informeert architectuurbeslissingen
- MCP server configs uit `assets/mcp-servers/` kunnen via de UI geconfigureerd worden

**Let op CC_007:** De Impertio repo zegt "nooit global installeren". De Composer app biedt BEIDE aan (local workspace + global settings). De gebruiker kiest zelf — de UI maakt het verschil duidelijk.

---

## Architectuur beslissingen

- **Tauri 2** voor native file picker, shell commands (VS Code openen), en filesystem access
- **SolidJS** voor reactive UI — dogfooding van eigen SolidJS skill package
- **Vite** als build tool — dogfooding van eigen Vite skill package
- **GitHub REST API** voor package discovery (geen auth nodig voor public repos)
- **Geen database** — alles is file-based (workspace configs zijn JSON)

## Projectstructuur

```
src/
├── App.tsx                    ← Hoofdcomponent met alle state management
├── index.tsx                  ← Entry point
├── styles.css                 ← Globale styling
├── assets/                    ← Statische assets
├── components/
│   ├── Titlebar.tsx           ← Custom window titlebar
│   ├── Sidebar.tsx            ← Navigatie (home/packages/presets/settings/about)
│   ├── SearchBar.tsx          ← Zoek + filterbalk (AEC/BIM, ERP, Web Dev, DevOps)
│   ├── PresetSelector.tsx     ← Preset keuze cards
│   ├── PackageSelector.tsx    ← Individuele package selectie
│   ├── WorkspaceConfig.tsx    ← Pad + projectnaam + effort level configuratie
│   ├── InstallPreview.tsx     ← Overzicht geselecteerde packages + install knop
│   └── StatusBar.tsx          ← Onderin: aantal geselecteerde packages
├── lib/
│   ├── packages.ts            ← Package definities (hardcoded)
│   └── presets.ts             ← Preset definities (hardcoded)
└── pages/                     ← Leeg — routing nog niet geimplementeerd
```

## Gerelateerde repos

| Repo | Relatie |
|------|---------|
| `Skill-Package-Workflow-Template` | CI/CD pipeline, templates, audit tooling, validatiescripts |
| `Impertio-AI-Ecosystem-Deployment` | Deployment repo met MANIFEST.json, MCP configs, lessons learned, workspace setup guide |
| `VSCode_ClaudeCode_Workspace_Composer_App` | Vorige iteratie — module registry (28 modules) en preset definities herbruikbaar |
| `Open-VSCode-Controller` | HTTP bridge voor VS Code — kan gebruikt worden voor programmatisch openen |

## Hoe te starten

```bash
cd C:\Users\Freek Heijting\Documents\GitHub\OpenAEC-Workspace-Composer
npm run tauri dev
```

Vereist: Node.js 20+, Rust toolchain (cargo), Tauri CLI.

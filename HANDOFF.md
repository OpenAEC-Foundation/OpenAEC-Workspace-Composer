# HANDOFF: OpenAEC Workspace Composer

> Status per 2026-03-21 17:00

## Wat werkt (DONE)

| Feature | Status | Details |
|---------|--------|---------|
| 19 skill packages | Done | Matchen met GitHub, live registry fetch |
| Installer naar .claude/skills/ | Done | Lokaal eerst, GitHub clone als fallback |
| Per-skill selectie | Done | "Choose skills" drill-down, GitHub API fallback |
| Custom repo toevoegen | Done | Via gh CLI (auth), fallback naar API |
| 20 pagina's | Done | Router-based, Simple/Advanced mode toggle |
| Logo's (17/19) | Done | SVG + PNG, GitHub org avatars |
| Presets multi-select | Done | Core presets, combineerbaar, sticky bar |
| Config opslaan naar disk | Done | settings.json, .mcp.json, CLAUDE.md, commands |
| Permission presets | Done | 3 echte patronen uit 35+ projecten |
| MCP server templates | Done | 10 echte configs (Blender, Frappe, Draw.io, etc.) |
| CLAUDE.md templates | Done | 3 structuren met invulbare velden + live preview |
| Hook templates | Done | 6 echte hooks uit eigen projecten |
| Command templates | Done | 8 echte slash commands |
| Git pagina | Done | Init, status, commit, push, branches |
| Auth pagina | Done | Prerequisites check, login instructies |
| Core Files | Done | Templates per bestand, save naar workspace |
| GPU Server backend | Done | SSH, server status, Mutagen sync, provisioning |
| Prerequisites checker | Done | Claude CLI, Node, Git, VS Code, Rust, Docker |
| Tauri startup script | Done | scripts/dev.sh, npm run dev:clean |
| Em-dashes verwijderd | Done | Globale regel in CLAUDE.md |

## Wat NIET werkt / gaps

### Hoge prioriteit

1. **E2E install flow niet getest**
   - Hele flow (packages selecteren, pad kiezen, install klikken) moet getest in Tauri
   - Skills moeten daadwerkelijk in .claude/skills/ verschijnen
   - VS Code openen na install moet werken

2. **GPU Server SSH niet getest in Tauri**
   - camelCase fix is gedaan
   - Connectie met hetzner-freek moet getest
   - Mutagen sync niet getest

3. **Custom repo's niet persistent**
   - Toegevoegde repo's verdwijnen bij app herstart
   - Moeten opgeslagen worden in app config

4. **Sommige pagina's renderen niet goed**
   - Grijze/witte schermen door runtime JS errors
   - categoryIcons referentie errors (gefixed, maar kunnen terugkomen)
   - CSS split (styles.css is deprecated, src/styles/index.css is de nieuwe entry)

5. **Anthropic skills worden niet geinstalleerd**
   - Logo en namen zijn er
   - Maar de install flow kent ze niet (geen lokale map, geen installer mapping)

### Gevraagd maar nog niet gebouwd

6. **Template Marketplace** (uit prompt 2026-03-21 01:30)
   - Gebruikers delen CLAUDE.md templates via GitHub
   - Lokaal opslaan vs community delen
   - Sterren systeem
   - Consent flow

7. **Theme systeem / Theme Factory** (gevraagd in sessie)
   - Light/dark toggle staat in app.store.ts
   - theme-light.css bestaat
   - Maar de toggle werkt niet in de UI en er zijn geen extra themes

8. **Feedback mechanismen** (uit prompt 2026-03-21 01:30)
   - Logger
   - Request-to-push issues
   - Feedback loops

9. **Prompt window / terminal** (uit prompt 2026-03-21 01:30)
   - Geintegreerde Claude sessie vanuit de app
   - Terminal view

10. **RAG integratie** (uit prompt 2026-03-21 01:30)
    - Retrieval Augmented Generation
    - Nog geen plan

11. **Structured JSON outputs** (uit prompt 2026-03-21 01:30)
    - Templates voor gestructureerde output
    - Nog niet gebouwd

12. **State management / persistentie** (uit prompt 2026-03-21 01:30)
    - App state (geselecteerde packages, config) gaat verloren bij herstart
    - Moet persistent worden via localStorage of Tauri app data

13. **Version Upgrade workflow** (geparkeerd)
    - Presets staan in presets.ts maar zijn uit de UI verwijderd
    - Eigen pagina /upgrades nodig met wizard

14. **Logo upload bij custom repos** (gevraagd in sessie)
    - Nu wordt automatisch het GitHub org avatar gebruikt
    - Gebruiker moet zelf een logo kunnen uploaden

15. **Workspace Tier selector** (uit plan, niet gebouwd)
    - Minimal, Standard, Standard+Design, Standard+BIM, Full
    - Selecteert automatisch juiste packages, permissions, templates

### UI / Design gaps

16. **Package tiles uitlijning**
    - Logo's soms niet gecentreerd
    - Moeten visueel gevalideerd worden in de live app

17. **Meer interactieve UI gewenst**
    - "Dingetjes die zweven en bouncen" (deels gedaan met CSS animaties)
    - CSS libraries overwegen voor rijkere effecten

18. **Draw.io logo check**
    - Logo is er (oranje nodes icoon)
    - Moet visueel gevalideerd in de live app

## Architectuur (actueel)

```
src/
├── assets/logos/          ← 17+ logo's (SVG + PNG)
├── components/            ← PackageSelector, SearchBar, StatusBar, Titlebar
├── layouts/AppLayout.tsx  ← Sidebar + router + Simple/Advanced toggle
├── lib/
│   ├── packages.ts        ← 19 hardcoded packages
│   ├── presets.ts          ← 17 presets (core, combineerbaar)
│   ├── registry.ts        ← Live GitHub fetch + cache
│   ├── package-logos.ts   ← Logo mapping
│   ├── mcp-servers.ts     ← 10 echte MCP server templates
│   ├── hooks-templates.ts ← Hook template data
│   ├── gpu-types.ts       ← GPU server types
│   └── workflows.ts      ← Workflow definitions
├── pages/                 ← 20 pagina's
├── stores/                ← 6 SolidJS stores
├── styles/                ← 30 modulaire CSS bestanden
└── index.tsx              ← Entry + router

src-tauri/src/
├── lib.rs                 ← 35+ Tauri commands
├── installer.rs           ← Install + skill scanning + GitHub API fallback
├── config_writer.rs       ← Read/write settings, mcp, claude.md
├── git.rs                 ← 10 git commands
├── prerequisites.rs       ← Tool checker
├── registry.rs            ← Registry fetch + add_custom_repo
├── gpu_server/            ← SSH, Mutagen, provisioning
├── skill_scanner.rs       ← Skill package scanner
├── generators/            ← Workspace generators
└── workspace.rs           ← Path validation, recent workspaces
```

## CLAUDE.md Composer (kernfeature, nog niet gebouwd)

De grootste ontbrekende feature. De Workspace Composer moet CLAUDE.md bestanden kunnen **genereren** uit modulaire blokken.

### Concept: Atomaire CLAUDE.md Builder
- **Blokkenbank**: bibliotheek van herbruikbare instructieblokken (atomen)
- Elk blok is een los stuk CLAUDE.md content met metadata (categorie, relevante packages, prioriteit)
- Blokken worden automatisch gesuggereerd op basis van geselecteerde packages/presets
- Gebruiker kan blokken aan/uit zetten, volgorde wijzigen, eigen blokken toevoegen
- Resultaat: samengestelde CLAUDE.md die naar de workspace geschreven wordt

### Blokcategorieen
- **Identity**: projectnaam, beschrijving, team
- **Stack**: technologie opsomming (auto-gegenereerd uit packages)
- **Conventions**: taal, commit style, code review regels
- **Protocols**: P-001 verify before destructive, P-002 read before modify, etc.
- **Package instructies**: per skill package specifieke regels (auto uit SKILL.md frontmatter)
- **Cross-tech koppelingen**: ERPNext+Nextcloud sync, BIM+GIS coordinaten, IFC+Three.js pipeline
- **Hooks hints**: aanbevolen hooks per package combinatie
- **MCP configuratie**: welke MCP servers bij deze stack passen

### Community CLAUDE.md bestanden
- Gebruikers kunnen eigen CLAUDE.md blokken/bestanden delen
- Import vanuit GitHub URL of lokaal bestand
- Rating/populariteit systeem
- Curated collectie door OpenAEC Foundation

### Waar dit in de app komt
- Advanced mode: eigen pagina `/claude-builder` of vervangt huidige Templates pagina
- Simple mode: automatisch genereren op basis van preset keuze
- Install flow: CLAUDE.md wordt samengesteld en meegeschreven

### Architectuurprincipe: elk proces levert een blok aan
Elke pagina/store in de app exporteert een `toClaudeBlock(): string` functie:
- Packages store → "## Installed Skill Packages"
- Permissions pagina → "## Permissions"
- Hooks pagina → "## Hooks"
- MCP pagina → "## MCP Servers"
- Commands pagina → "## Commands"
- Templates pagina → "## Conventions"
- Auth pagina → "## Authentication"
- GPU Server → "## Remote Development"
- Presets → preset-specifieke instructies
- Custom blokken → alles wat de gebruiker zelf toevoegt

De CLAUDE.md is altijd een live samenstelling van alle blokken. Wijzig je iets op de Permissions pagina, dan update het Permissions blok automatisch mee.

### Implementatie aanpak
1. Interface: `ClaudeBlock { id, title, source, content, order, enabled }`
2. Elke store/pagina implementeert `toClaudeBlock()`
3. Centrale `claude-builder.store.ts` verzamelt alle blokken, beheert volgorde
4. Generator: `buildClaudeMd()` voegt alle enabled blokken samen
5. Preview: live CLAUDE.md preview op de builder pagina
6. UI: blokkenlijst met toggles, drag-and-drop volgorde, custom blokken toevoegen
7. Export: schrijft naar workspace als onderdeel van install flow
8. Import: gebruikers kunnen .md bestanden importeren als custom blokken
9. Rust: `generate_claude_md()` in installer.rs roept de builder output aan

## Prioriteiten volgende sessie

1. **CLAUDE.md Composer** bouwen (kernfeature)
2. E2E test install flow in Tauri
3. Custom repo's persistent maken
4. State persistentie (geselecteerde packages bewaren)
5. Theme toggle werkend in UI
6. Community CLAUDE.md marketplace beginnen

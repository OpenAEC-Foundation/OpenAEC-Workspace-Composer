# HANDOFF: OpenAEC Workspace Composer

> Status per 2026-03-24

## Release v3.0.6 is LIVE (bouwt nu via CI)

Tag gepusht, GitHub Actions bouwt installers voor Windows, Mac, Linux.

Releases: https://github.com/OpenAEC-Foundation/OpenAEC-Workspace-Composer/releases

### Wat nieuw is in v3.0.6

**MCP server auto-merge vanuit skill packages.** Skill packages die een `.mcp.json` bevatten (zoals blender-bonsai met Blender MCP) worden automatisch gedetecteerd en samengevoegd tijdens install. Meerdere packages met verschillende MCP servers worden gecombineerd in één `.mcp.json`. Werkt in simple mode zonder extra configuratie.

Gewijzigd bestand: `src-tauri/src/installer.rs` (+109 regels)
- `find_package_mcp_config()` — zoekt `.mcp.json` in de package repo root
- `merge_mcp_configs()` — merget mcpServers objecten van meerdere packages
- `install_workspace()` — verzamelt en schrijft merged MCP config
- `scan_conflicts()` — detecteert bestaande `.mcp.json`
- Respecteert conflict strategy (skip/merge/overwrite)

## Bekend probleem: App icoon in taakbalk

**PRIORITEIT 1 voor volgende sessie.**

Het OpenAEC huis logo (icon.png, 256x256 RGBA) staat correct in `src-tauri/icons/`. Maar de app toont het NIET correct in de Windows taakbalk. Het oude Tauri standaard icoon verschijnt steeds.

**Volgende stappen:**
1. Download een hoge-resolutie versie van het OpenAEC logo (512x512+ PNG, RGBA)
2. Gebruik `tauri icon` CLI command: `npx tauri icon path/to/512x512.png` (genereert alle formaten)
3. Test met production build (.msi installer)
4. Verifieer in de geinstalleerde versie, niet dev mode

## Wat werkt (Simple mode, getest)

- 22 skill packages met officieel logos (live GitHub registry)
- 20+ combineerbare presets
- Install flow: kies map, projectnaam, install
- Skills naar `.claude/skills/` (Claude Code auto-discovery)
- **MCP servers automatisch uit skill packages** (nieuw in v3.0.6)
- CLAUDE.md met project guidance en stack beschrijving
- Prerequisites check (Node, Git, Claude CLI, VS Code, Rust, Docker, SSH, Mutagen)
- Custom repos toevoegen via "+ Add repo" (gh CLI auth)
- Per-skill selectie via "Choose skills"
- GitHub API fallback voor skill scanning (elke repo structuur)
- CI/CD pipeline voor Windows, macOS, Linux installers

## Advanced mode (alpha, niet getest)

- Settings, Permissions (3 presets uit 35+ projecten), Hooks (6 templates), MCP (10 servers)
- Commands (8 templates), Memory, Templates (3 CLAUDE.md structuren), CORE Files, Prompts
- GPU Server (SSH, Mutagen sync, provisioning)
- Authentication, Git (init, commit, push)
- Config save naar disk (settings.json, .mcp.json, CLAUDE.md, commands)

## Niet gebouwd

- Template Marketplace (delen via GitHub, sterren)
- Theme systeem (toggle in code maar niet werkend in UI)
- State persistentie (selecties verdwijnen bij herstart)
- Anthropic skills installeren (logo en namen zijn er, install niet)
- Version Upgrade workflow (geparkeerd)
- CLAUDE.md Composer (atomaire blokken builder)
- Tauri signing keys (nodig voor auto-updates)

## Technische details

### Tauri signing
Uitgeschakeld (`createUpdaterArtifacts: false`). Voor auto-updates:
1. `npx tauri signer generate -w ~/.tauri/myapp.key`
2. GitHub Secret: `TAURI_SIGNING_PRIVATE_KEY`
3. `createUpdaterArtifacts: true` in tauri.conf.json

### Windows build timeout
De eerste Windows CI build kan een timeout krijgen (geen Rust cache). Rerun lost dit op (cache is er dan wel).

### Versienummer
tauri.conf.json zegt `1.0.0`, tags zeggen `v3.0.6`. Moet gesynchroniseerd worden.

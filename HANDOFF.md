# HANDOFF: OpenAEC Workspace Composer

> Status per 2026-03-23

## Release v3.0.5 is LIVE

Installers beschikbaar op: https://github.com/OpenAEC-Foundation/OpenAEC-Workspace-Composer/releases/tag/v3.0.5

| Platform | Bestand | Grootte |
|----------|---------|---------|
| Windows .exe | OpenAEC.Workspace.Composer_1.0.0_x64-setup.exe | 3MB |
| Windows .msi | OpenAEC.Workspace.Composer_1.0.0_x64_en-US.msi | 5MB |
| macOS .dmg | OpenAEC.Workspace.Composer_1.0.0_universal.dmg | 10MB |
| Linux .deb | OpenAEC.Workspace.Composer_1.0.0_amd64.deb | 5MB |
| Linux .AppImage | OpenAEC.Workspace.Composer_1.0.0_amd64.AppImage | 80MB |
| Linux .rpm | OpenAEC.Workspace.Composer-1.0.0-1.x86_64.rpm | 5MB |

## Bekend probleem: App icoon in taakbalk

**PRIORITEIT 1 voor volgende sessie.**

Het OpenAEC huis logo (icon.png, 256x256 RGBA) staat correct in `src-tauri/icons/`. Maar de app toont het NIET correct in de Windows taakbalk. Het oude Tauri standaard icoon verschijnt steeds.

Geprobeerd:
- icon.ico geconverteerd via png-to-ico
- icon.png als RGBA via puppeteer
- Windows icon cache gewist (ie4uinit, IconCache.db verwijderd)
- bundle.icon geconfigureerd in tauri.conf.json
- Dev mode en production build

**Mogelijke oorzaken:**
- Het ICO bestand is 128x128 bron, geschaald naar 48x48/32x32. Mogelijk te laag.
- Tauri 2 gebruikt het icoon uit de bundle config alleen bij production install, niet bij dev mode
- Windows cacht iconen per executable path

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
tauri.conf.json zegt `1.0.0`, tags zeggen `v3.0.5`. Moet gesynchroniseerd worden.

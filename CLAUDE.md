# OpenAEC Workspace Composer

## Identiteit
Desktop-first applicatie (Tauri 2 + SolidJS) voor het samenstellen van Claude Code workspaces met skill packages van de OpenAEC Foundation. De web versie wordt afgeleid van de desktop app, niet andersom.

## Platform strategie
- **Primair**: Desktop app (Tauri 2, Windows/Mac/Linux)
- **Secundair**: Web app (zelfde SolidJS frontend, zonder Rust backend)
- Desktop-first: alle features worden eerst voor Tauri gebouwd
- Web fallback: alle Tauri API calls zitten in try/catch, de app werkt ook in de browser maar met beperkte functionaliteit (geen file dialogs, geen shell commands, geen install)
- `npm run tauri dev` is de primaire development workflow
- `npm run dev` (Vite only) is voor snelle UI iteratie en de web versie

## Stack
- **Frontend**: SolidJS + TypeScript + Vite (gedeeld tussen desktop en web)
- **Backend**: Rust (Tauri 2, alleen desktop)
- **Icons**: solid-icons/tb (Tabler Icons)
- **Animaties**: solid-transition-group
- **CSS**: Modulair onder src/styles/ (30 bestanden)
- **Plugins**: tauri-plugin-dialog, tauri-plugin-shell, tauri-plugin-updater

## Architectuur
```
src/                    → SolidJS frontend (gedeeld desktop + web)
├── assets/             → Logo's, OpenAEC symbol
├── components/         → UI componenten
├── lib/               → Data (packages, presets, registry, logos)
├── pages/             → 20 route pages
├── stores/            → SolidJS stores (signals)
├── styles/            → 30 modulaire CSS bestanden
└── index.tsx          → Entry point + router

src-tauri/             → Rust backend (alleen desktop)
├── src/lib.rs         → Tauri command registratie
├── src/installer.rs   → Install flow + skill scanning
├── src/prerequisites.rs → Tool checker
├── src/registry.rs    → GitHub API registry fetch
└── tauri.conf.json    → App configuratie
```

## Commando's
- `npm run tauri dev` — Start desktop app in dev mode (primair)
- `npm run dev` — Start Vite dev server voor web/UI iteratie
- `npm run tauri build` — Build production desktop binary
- `npm run build` — Build frontend voor web deployment

## Conventies
- Documentatie: Nederlands
- Code & configs: Engels
- Conventional Commits: feat:, fix:, docs:, refactor:, test:, chore:
- SolidJS patterns: signals, createMemo, For/Show
- Rust: idiomatic error handling met Result<T, String>

## Skill Packages Registry
Alle OpenAEC Foundation packages staan in `src/lib/packages.ts`.
Presets staan in `src/lib/presets.ts`.
Bij toevoegen van een nieuw package: update beide bestanden.

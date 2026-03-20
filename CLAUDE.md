# OpenAEC Workspace Composer

## Identiteit
Desktop applicatie (Tauri 2 + SolidJS) voor het samenstellen van Claude Code workspaces met skill packages van de OpenAEC Foundation.

## Stack
- **Frontend**: SolidJS + TypeScript + Vite
- **Backend**: Rust (Tauri 2)
- **Plugins**: tauri-plugin-dialog (file picker), tauri-plugin-shell (VS Code launcher)

## Architectuur
```
src/                    → SolidJS frontend
├── components/         → UI componenten
├── lib/               → Data (packages, presets)
├── pages/             → Route pages
└── App.tsx            → Root component

src-tauri/             → Rust backend
├── src/lib.rs         → Tauri commands (generate_workspace)
└── tauri.conf.json    → App configuratie
```

## Commando's
- `npm run dev` — Start Vite dev server (port 1420)
- `npm run build` — Build frontend
- `npm run tauri dev` — Start Tauri app in dev mode
- `npm run tauri build` — Build production binary

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

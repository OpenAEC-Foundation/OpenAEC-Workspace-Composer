<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:36363E,30:D97706,60:F59E0B,100:EA580C&height=260&section=header&text=Workspace%20Composer&fontSize=60&fontColor=ffffff&fontAlignY=38&animation=fadeIn&desc=Build%20Claude%20Code%20workspaces%20with%20curated%20skill%20packages&descAlignY=56&descSize=18&descFontColor=ffffffcc" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=22&pause=1200&color=D97706&center=true&vCenter=true&width=800&height=60&lines=Select+packages+%E2%86%92+choose+folder+%E2%86%92+install;22+skill+packages+%7C+440%2B+skills+%7C+20+presets;Skills+installed+to+.claude%2Fskills%2F+automatically;Official+logos+%7C+GitHub+live+registry+%7C+Custom+repos;From+zero+to+productive+in+60+seconds" />

<br/>

<a href="#quick-start"><img src="https://img.shields.io/badge/version-3.0.0-D97706?style=flat-square" alt="Version"></a>
<a href="#skill-packages"><img src="https://img.shields.io/badge/skill_packages-22-D97706?style=flat-square" alt="Packages"></a>
<a href="#presets"><img src="https://img.shields.io/badge/presets-20-D97706?style=flat-square" alt="Presets"></a>
<a href="https://v2.tauri.app"><img src="https://img.shields.io/badge/Tauri_2-36363E?style=flat-square&logo=tauri&logoColor=24C8D8" alt="Tauri"></a>
<a href="https://www.solidjs.com"><img src="https://img.shields.io/badge/SolidJS-36363E?style=flat-square&logo=solid&logoColor=4f88c6" alt="SolidJS"></a>
<a href="https://www.rust-lang.org"><img src="https://img.shields.io/badge/Rust-36363E?style=flat-square&logo=rust&logoColor=white" alt="Rust"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-D97706?style=flat-square" alt="License"></a>

<br/><br/>

**Stel in seconden een volledig geconfigureerde Claude Code workspace samen met skill packages, CLAUDE.md, permissions, MCP servers, hooks en commands.**

*Build free. Build together.*

</div>

---

## Screenshots

### Workspace: selecteer skill packages met officieel logos
![Workspace](docs/screenshots/workspace-packages.png)

### Presets: combineerbare bundels
![Presets](docs/screenshots/workspace-presets.png)

### Install: skills geinstalleerd in .claude/skills/
![Install](docs/screenshots/install-complete.png)

---

## Wat doet het

**Workspace Composer** is een desktop app van de [OpenAEC Foundation](https://github.com/OpenAEC-Foundation) die Claude Code workspaces configureert. Selecteer skill packages, kies een map, en de app installeert alles.

### Wat er geinstalleerd wordt

```
jouw-project/
├── CLAUDE.md                     ← Projectinstructies voor Claude
├── .claude/
│   ├── settings.local.json       ← Permissions en configuratie
│   └── skills/
│       ├── tauri-2--*/           ← Tauri 2 skills (auto-discovered)
│       ├── solidjs--*/           ← SolidJS skills
│       └── vite--*/              ← Vite skills
├── .gitignore                    ← Met PROMPTS.md bescherming
└── jouw-project.code-workspace   ← VS Code workspace
```

Claude Code ontdekt de skills automatisch uit `.claude/skills/`. Je hoeft niks extra te configureren.

### De CLAUDE.md die gegenereerd wordt

```markdown
# Mijn Project

## What to build
Describe your project here. Claude will use this context...

## Available Stack
- Tauri 2
- SolidJS
- Vite

Claude automatically loads the relevant skills based on what you're working on.

## How to work
- Tell Claude what you want to build. Be specific about functionality.
- Claude knows your stack. Ask it to use the installed technologies.
- Start simple. Get something working first, then iterate.
```

---

## Skill Packages

22 packages, 440+ skills. Live registry van GitHub.

### AEC/BIM

| Package | Skills | Status |
|---------|--------|--------|
| **Blender Bonsai IfcOpenShell Sverchok** | 73 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **ThatOpen Engine** | 18 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Speckle** | 25 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **QGIS** | 19 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Three.js** | 24 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Cross-Tech AEC** | 15 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |

### ERP/Business

| Package | Skills | Status |
|---------|--------|--------|
| **Frappe/ERPNext** | 60 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Nextcloud** | 24 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **n8n** | 21 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |

### Web/Desktop

| Package | Skills | Status |
|---------|--------|--------|
| **Tauri 2** | 27 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **React** | 24 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **SolidJS** | 16 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Vite** | 22 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **PDF.js** | 15 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **pdf-lib** | 17 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Fluent i18n** | 16 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Open PDF Studio** | 6 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |

### DevOps

| Package | Skills | Status |
|---------|--------|--------|
| **Docker** | 22 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Draw.io** | 22 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |

Je kunt ook eigen GitHub repo's toevoegen via "+ Add repo" in de app.

---

## Presets

Core presets die je combineert. Elke preset bevat 1-3 packages.

| Preset | Packages | Geschikt voor |
|--------|----------|---------------|
| **BIM Core** | Blender Bonsai | 3D modeling, IFC bestanden |
| **BIM Web** | ThatOpen, Three.js | BIM viewer in de browser |
| **AEC + GIS** | Blender Bonsai, QGIS | BIM met geografische data |
| **Frappe/ERPNext** | Frappe | ERP systeem bouwen |
| **Nextcloud** | Nextcloud | Cloud app development |
| **Automation** | n8n | Workflow automatisering |
| **Tauri Desktop** | Tauri 2, SolidJS | Native desktop app |
| **React App** | React, Vite | React frontend |
| **Docker** | Docker | Containerization |
| ... en meer | | Selecteer meerdere presets om ze te combineren |

---

## Modes

### Simple (standaard)
Drie stappen: **Workspace** (selecteer packages), **Presets** (one-click bundels), **Install** (kies map, installeer).

### Advanced (alpha)
> ⚠️ Advanced mode is in alpha. Features werken maar zijn niet uitgebreid getest.

Extra pagina's voor fijnafstelling: Settings, Permissions, Hooks, MCP Servers, Commands, Memory, Templates, CORE Files, Prompts, GPU Server, Authentication, Git.

---

## Quick Start

### Vereisten

- [Node.js](https://nodejs.org/) 20+
- [Rust toolchain](https://rustup.rs/)
- [Git](https://git-scm.com/)

### Installatie

```bash
git clone https://github.com/OpenAEC-Foundation/OpenAEC-Workspace-Composer.git
cd OpenAEC-Workspace-Composer
npm install
npm run tauri dev
```

### Gebruik

1. Open de app
2. Selecteer packages (of kies een preset)
3. Ga naar **Install**
4. Kies een map en geef je project een naam
5. Klik **Install Workspace**
6. Open de gegenereerde workspace in VS Code

---

## Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | SolidJS, TypeScript, Vite 8, Solid Router |
| **Backend** | Rust, Tauri 2 |
| **Icons** | Tabler Icons (solid-icons/tb) |
| **CSS** | 30 modulaire CSS bestanden, Construction Amber palette |
| **Registry** | Live GitHub API fetch (OpenAEC-Foundation + Anthropic skills) |

---

## Bijdragen

Bijdragen zijn welkom. Nieuwe skill packages, presets, bugfixes of documentatie.

1. Fork het project
2. Maak een feature branch (`git checkout -b feat/mijn-feature`)
3. Commit met [Conventional Commits](https://www.conventionalcommits.org/)
4. Open een Pull Request

---

## Licentie

MIT &copy; [OpenAEC Foundation](https://github.com/OpenAEC-Foundation)

<div align="center">

<br/>

[![OpenAEC Foundation](https://img.shields.io/badge/OpenAEC-Foundation-D97706?style=flat-square&logo=github&logoColor=white)](https://github.com/OpenAEC-Foundation)
[![Style Book](https://img.shields.io/badge/Style-Book-EA580C?style=flat-square&logo=github&logoColor=white)](https://github.com/OpenAEC-Foundation/OpenAEC-style-book)
[![Open Agents](https://img.shields.io/badge/Open-Agents-F59E0B?style=flat-square&logo=github&logoColor=white)](https://github.com/OpenAEC-Foundation/open-agents)

*Build free. Build together.*

</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:36363E,30:D97706,60:F59E0B,100:EA580C&height=120&section=footer" width="100%"/>

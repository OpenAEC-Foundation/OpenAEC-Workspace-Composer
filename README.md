<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:36363E,30:D97706,60:F59E0B,100:EA580C&height=260&section=header&text=Workspace%20Composer&fontSize=60&fontColor=ffffff&fontAlignY=38&animation=fadeIn&desc=Compose%20Claude%20Code%20workspaces%20with%20curated%20skill%20packages&descAlignY=56&descSize=18&descFontColor=ffffffcc" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=22&pause=1200&color=D97706&center=true&vCenter=true&width=800&height=60&lines=One+click+%E2%86%92+fully+configured+Claude+Code+workspace;23+skill+packages+%7C+350%2B+skills+%7C+5+presets;CLAUDE.md+%2B+MCP+servers+%2B+hooks+%2B+commands;Progressive+disclosure+met+CORE-documenten;Van+zero+naar+productive+in+60+seconden" />

<br/>

<a href="#quick-start"><img src="https://img.shields.io/badge/version-1.0.0-D97706?style=flat-square" alt="Version"></a>
<a href="#skill-packages"><img src="https://img.shields.io/badge/skill_packages-23-D97706?style=flat-square" alt="Packages"></a>
<a href="#presets"><img src="https://img.shields.io/badge/presets-5-D97706?style=flat-square" alt="Presets"></a>
<a href="https://v2.tauri.app"><img src="https://img.shields.io/badge/Tauri_2-36363E?style=flat-square&logo=tauri&logoColor=24C8D8" alt="Tauri"></a>
<a href="https://www.solidjs.com"><img src="https://img.shields.io/badge/SolidJS-36363E?style=flat-square&logo=solid&logoColor=4f88c6" alt="SolidJS"></a>
<a href="https://www.rust-lang.org"><img src="https://img.shields.io/badge/Rust-36363E?style=flat-square&logo=rust&logoColor=white" alt="Rust"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-D97706?style=flat-square" alt="License"></a>
<a href="https://github.com/OpenAEC-Foundation/OpenAEC-Workspace-Composer/issues"><img src="https://img.shields.io/badge/contributions-welcome-D97706?style=flat-square" alt="Contributions"></a>

<br/><br/>

**Stel in seconden een volledig geconfigureerde Claude Code workspace samen — met skill packages, projectinstructies, MCP servers, hooks, commands en permissions.**

*Build free. Build together.*

</div>

---

## About

**Workspace Composer** is een desktop applicatie van de [OpenAEC Foundation](https://github.com/OpenAEC-Foundation) waarmee je in één klik een volledig ingerichte Claude Code workspace genereert. Kies een preset of stel zelf packages samen — de app genereert alle configuratie die je nodig hebt om direct productief te zijn.

### Het probleem

Een Claude Code workspace goed inrichten kost tijd. Je moet handmatig:

- `CLAUDE.md` projectinstructies schrijven met conventies en architectuur
- `settings.local.json` configureren met permissions en hooks
- MCP servers koppelen via `.mcp.json`
- Skill packages installeren als workspace folders
- CORE-documenten inrichten voor progressive disclosure
- Custom commands en slash commands toevoegen
- `.code-workspace` bestanden met de juiste structuur samenstellen

**Workspace Composer doet dit allemaal in één klik.**

---

## Hoe het werkt

```
┌─────────────────────────────────────────────────────────┐
│                  Workspace Composer                      │
│                                                          │
│  ┌─────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │ Preset   │ + │ Losse        │ → │ Generated Output  │  │
│  │ kiezen   │   │ packages     │   │                   │  │
│  │          │   │ toevoegen    │   │ .code-workspace   │  │
│  │ BIM Dev  │   │              │   │ CLAUDE.md         │  │
│  │ ERP Full │   │ ☑ Tauri 2    │   │ settings.json     │  │
│  │ Web Full │   │ ☑ Docker     │   │ .mcp.json         │  │
│  │ PDF      │   │ ☑ SolidJS    │   │ hooks & commands  │  │
│  │ AEC-GIS  │   │ ☐ React      │   │ .gitignore        │  │
│  └─────────┘   └──────────────┘   └──────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Wat er gegenereerd wordt

| Bestand | Doel |
|---------|------|
| `.code-workspace` | Multi-root workspace met skill package folders |
| `CLAUDE.md` | Projectinstructies + actieve package documentatie |
| `.claude/settings.local.json` | Permissions, hooks en tool configuratie |
| `.mcp.json` | MCP server configuratie voor de workspace |
| `.claude/commands/` | Custom slash commands per package |
| `.gitignore` | Met `PROMPTS.md` privacy-bescherming |

---

## CORE-documenten & Progressive Disclosure

Workspace Composer configureert een **progressive disclosure** systeem — Claude laadt alleen de context die op dat moment relevant is:

```
Workspace Root
├── CLAUDE.md                  ← Altijd geladen: identiteit, conventies, architectuur
├── PROMPTS.md                 ← Privé prompt-historie (nooit committen)
├── .claude/
│   ├── settings.local.json    ← Permissions, hooks & event triggers
│   ├── commands/              ← Custom slash commands
│   └── MEMORY.md              ← Persistent memory index
├── .mcp.json                  ← MCP server configuratie
└── [skill-package]/
    └── SKILL.md               ← Package-specifieke instructies & skills
```

**Hoe progressive disclosure werkt:**

1. **CLAUDE.md** is het startpunt — altijd geladen, bevat de basis
2. **Hooks** triggeren op events en laden diepere context wanneer nodig
3. **SKILL.md** bestanden bevatten domeinkennis per package — alleen geladen wanneer aangesproken
4. **PROMPTS.md** houdt privé prompt-historie bij (geconfigureerd vanuit global level via `~/.claude/CLAUDE.md`)
5. **Commands** bieden snelkoppelingen voor veelgebruikte workflows

> Net zoals `PROMPTS.md` vanuit global `CLAUDE.md` wordt ingesteld en in elke workspace automatisch wordt bijgehouden, zo configureert de Composer vergelijkbare CORE-mechanismen op workspace level.

---

## Skill Packages

### AEC/BIM

| Package | Skills | Status |
|---------|--------|--------|
| **Blender-Bonsai-IfcOpenShell-Sverchok** | 73 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **ThatOpen Engine** | 7 | ![Development](https://img.shields.io/badge/-development-D97706?style=flat-square) |
| **Speckle** | 25 | ![Planned](https://img.shields.io/badge/-planned-6B7280?style=flat-square) |
| **QGIS** | 20 | ![Planned](https://img.shields.io/badge/-planned-6B7280?style=flat-square) |

### ERP/Business

| Package | Skills | Status |
|---------|--------|--------|
| **ERPNext** | 28 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Nextcloud** | 24 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **n8n** | 21 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |

### Web Development

| Package | Skills | Status |
|---------|--------|--------|
| **Tauri 2** | 27 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **SolidJS** | 24 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **React** | 24 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Vite** | 22 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **PDF.js** | 17 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **pdf-lib** | 17 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Fluent i18n** | 15 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Three.js** | 20 | ![Planned](https://img.shields.io/badge/-planned-6B7280?style=flat-square) |

### DevOps & Cross-Tech

| Package | Skills | Status |
|---------|--------|--------|
| **Docker** | 22 | ![Published](https://img.shields.io/badge/-published-16A34A?style=flat-square) |
| **Draw.io** | 22 | ![Development](https://img.shields.io/badge/-development-D97706?style=flat-square) |
| **Cross-Tech AEC** | 15 | ![Planned](https://img.shields.io/badge/-planned-6B7280?style=flat-square) |

---

## Presets

<table>
<tr>
<td align="center" width="20%">

**Open PDF Studio**

![Skills](https://img.shields.io/badge/138_skills-D97706?style=flat-square)

Tauri + SolidJS + PDF.js + pdf-lib + Fluent i18n + Vite

</td>
<td align="center" width="20%">

**BIM Development**

![Skills](https://img.shields.io/badge/102_skills-D97706?style=flat-square)

Blender-Bonsai + ThatOpen + Docker

</td>
<td align="center" width="20%">

**ERPNext Fullstack**

![Skills](https://img.shields.io/badge/117_skills-D97706?style=flat-square)

ERPNext + Nextcloud + Docker + n8n + React

</td>
<td align="center" width="20%">

**AEC-GIS-BIM**

![Skills](https://img.shields.io/badge/138_skills-D97706?style=flat-square)

Blender-Bonsai + Speckle + QGIS + Three.js

</td>
<td align="center" width="20%">

**Web Fullstack**

![Skills](https://img.shields.io/badge/107_skills-D97706?style=flat-square)

React + Vite + Docker + SolidJS

</td>
</tr>
</table>

---

## Quick Start

### Vanuit source

```bash
# Clone
git clone https://github.com/OpenAEC-Foundation/OpenAEC-Workspace-Composer.git
cd OpenAEC-Workspace-Composer

# Dependencies
npm install

# Development
npm run tauri dev

# Production build
npm run tauri build
```

### Gebruik

1. Open de app
2. Kies een **preset** of selecteer individuele **packages**
3. Stel het **werkpad** en **projectnaam** in
4. Klik **Generate Workspace**
5. Open de gegenereerde `.code-workspace` in VS Code

---

## Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | SolidJS 1.9 · TypeScript 5.7 · Vite 8 · Solid Router |
| **Backend** | Rust · Tauri 2.10 |
| **Plugins** | tauri-plugin-dialog (file picker) · tauri-plugin-shell (VS Code launcher) |
| **Design** | OpenAEC Design System · Construction Amber `#D97706` · Deep Forge `#36363E` |

---

## Bijdragen

Bijdragen zijn welkom — nieuwe skill packages, presets, bugfixes of documentatie.

1. Fork het project
2. Maak een feature branch (`git checkout -b feat/mijn-feature`)
3. Commit met [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`)
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

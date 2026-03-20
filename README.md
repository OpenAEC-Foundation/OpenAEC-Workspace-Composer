<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a1a2e,25:16213e,50:0f3460,75:533483,100:e94560&height=280&section=header&text=OpenAEC%20Workspace%20Composer&fontSize=52&fontColor=ffffff&fontAlignY=38&animation=fadeIn&desc=Compose%20Claude%20Code%20workspaces%20met%20curated%20skill%20packages&descAlignY=56&descSize=20&descFontColor=cccccc" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1200&color=E94560&center=true&vCenter=true&width=800&height=60&lines=One+click+%E2%86%92+fully+configured+Claude+Code+workspace;23+skill+packages+%7C+5+curated+presets;CLAUDE.md+%2B+MCP+settings+%2B+hooks+%2B+permissions;Progressive+disclosure+met+CORE-documenten;Van+zero+naar+productive+in+60+seconden" />

<br/>

![Version](https://img.shields.io/badge/version-1.0.0-E94560?style=for-the-badge)
![Packages](https://img.shields.io/badge/skill_packages-23-533483?style=for-the-badge)
![Presets](https://img.shields.io/badge/presets-5-0f3460?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri_2-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)
![SolidJS](https://img.shields.io/badge/SolidJS-4f88c6?style=for-the-badge&logo=solid&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-16A34A?style=for-the-badge)

<br/>

![Skills](https://img.shields.io/badge/350%2B_skills-beschikbaar-E94560?style=flat-square&labelColor=1a1a2e)
![AEC/BIM](https://img.shields.io/badge/AEC%2FBIM-4_packages-0f3460?style=flat-square&labelColor=1a1a2e)
![ERP](https://img.shields.io/badge/ERP-3_packages-533483?style=flat-square&labelColor=1a1a2e)
![Web](https://img.shields.io/badge/Web_Dev-7_packages-16213e?style=flat-square&labelColor=1a1a2e)
![DevOps](https://img.shields.io/badge/DevOps-2_packages-e94560?style=flat-square&labelColor=1a1a2e)

<br/>

**Stel in seconden een volledig geconfigureerde Claude Code workspace samen — met skill packages, projectinstructies, MCP servers, hooks en permissions.**

</div>

---

## Het Probleem

Een Claude Code workspace goed inrichten kost tijd. Je moet handmatig:
- `CLAUDE.md` projectinstructies schrijven
- `settings.local.json` met permissions configureren
- MCP servers koppelen
- Skill packages installeren en als workspace folders toevoegen
- CORE-documenten en hooks instellen voor progressive disclosure
- `.code-workspace` bestanden met de juiste structuur aanmaken

**Workspace Composer doet dit allemaal in één klik.**

---

## Wat het doet

```
┌─────────────────────────────────────────────────────────┐
│                  Workspace Composer                     │
│                                                         │
│  ┌─────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │ Preset   │ + │ Losse        │ → │ Generated Output │ │
│  │ kiezen   │   │ packages     │   │                  │ │
│  │          │   │ toevoegen    │   │ .code-workspace  │ │
│  │ BIM Dev  │   │              │   │ CLAUDE.md        │ │
│  │ ERP Full │   │ ☑ Tauri 2    │   │ settings.json    │ │
│  │ Web Full │   │ ☑ Docker     │   │ .mcp.json        │ │
│  │ PDF      │   │ ☑ SolidJS    │   │ hooks config     │ │
│  │ AEC-GIS  │   │ ☐ React      │   │ .gitignore       │ │
│  └─────────┘   └──────────────┘   └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Generated workspace bevat:

| Bestand | Doel |
|---------|------|
| `.code-workspace` | Multi-root workspace met skill package folders |
| `CLAUDE.md` | Projectinstructies + actieve package documentatie |
| `.claude/settings.local.json` | Permissions (Bash, Read, Write, Edit, tools) |
| `.mcp.json` | MCP server configuratie voor de workspace |
| `.gitignore` | Met `PROMPTS.md` privacy-bescherming |

---

## CORE-documenten & Progressive Disclosure

De Workspace Composer configureert een **progressive disclosure** systeem via CORE-documenten en hooks:

```
Workspace Root
├── CLAUDE.md              ← Altijd geladen: project identiteit & conventies
├── PROMPTS.md             ← Privé prompt-historie (nooit committen)
├── .claude/
│   ├── settings.local.json  ← Permissions & hooks
│   └── MEMORY.md           ← Persistent memory index
└── [skill-package]/
    └── SKILL.md             ← Package-specifieke instructies
```

> **Progressive disclosure**: Claude leest alleen wat relevant is op het moment dat het nodig is. CLAUDE.md geeft de basis, hooks triggeren diepere context, en CORE-documenten bevatten de gedetailleerde kennis per domein — pas geladen wanneer een skill wordt aangesproken.

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

![Skills](https://img.shields.io/badge/138_skills-e74c3c?style=flat-square)

Tauri + SolidJS + PDF.js + pdf-lib + Fluent i18n + Vite

</td>
<td align="center" width="20%">

**BIM Development**

![Skills](https://img.shields.io/badge/102_skills-3498db?style=flat-square)

Blender-Bonsai + ThatOpen + Docker

</td>
<td align="center" width="20%">

**ERPNext Fullstack**

![Skills](https://img.shields.io/badge/117_skills-2ecc71?style=flat-square)

ERPNext + Nextcloud + Docker + n8n + React

</td>
<td align="center" width="20%">

**AEC-GIS-BIM**

![Skills](https://img.shields.io/badge/138_skills-9b59b6?style=flat-square)

Blender-Bonsai + Speckle + QGIS + Three.js

</td>
<td align="center" width="20%">

**Web Fullstack**

![Skills](https://img.shields.io/badge/107_skills-f39c12?style=flat-square)

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

```
Frontend                    Backend
├── SolidJS 1.9             ├── Rust
├── TypeScript 5.7          ├── Tauri 2.10
├── Vite 8                  ├── tauri-plugin-dialog
├── Solid Router 0.15       └── tauri-plugin-shell
└── Custom design system
```

---

## OpenAEC Foundation

<div align="center">

Dit project is onderdeel van de **[OpenAEC Foundation](https://github.com/OpenAEC-Foundation)** — een open-source initiatief voor het delen van AI-gestuurde skill packages in de AEC-industrie en daarbuiten.

[![OpenAEC](https://img.shields.io/badge/OpenAEC-Foundation-533483?style=for-the-badge&logo=github&logoColor=white)](https://github.com/OpenAEC-Foundation)
[![Open Agents](https://img.shields.io/badge/Open-Agents-E94560?style=for-the-badge&logo=github&logoColor=white)](https://github.com/OpenAEC-Foundation/open-agents)

</div>

---

## Bijdragen

Bijdragen zijn welkom! Of het nu gaat om nieuwe skill packages, presets, bugfixes of documentatie.

1. Fork het project
2. Maak een feature branch (`git checkout -b feat/mijn-feature`)
3. Commit met [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`)
4. Open een Pull Request

---

## Licentie

MIT &copy; [OpenAEC Foundation](https://github.com/OpenAEC-Foundation)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a1a2e,25:16213e,50:0f3460,75:533483,100:e94560&height=120&section=footer" width="100%"/>

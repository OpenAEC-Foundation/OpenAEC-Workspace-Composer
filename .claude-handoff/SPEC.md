# Feature: Workspace Manager (Manage Mode)

## Samenvatting

Voeg een "Manage" modus toe aan de Workspace Composer waarmee bestaande Claude Code workspaces geïnspecteerd en beheerd kunnen worden. De huidige app is setup-only (install skills → klaar). De Manage modus voegt runtime-inspectie toe: bekijk alle projecten, CLAUDE.md bestanden, orchestrator state, lessons learned, session summaries, en integratiepunten.

## Doelgroep

Power users die meerdere Claude Code projecten tegelijk beheren — met een orchestrator-structuur die cross-project context, lessons learned, en sessie-continuïteit bijhoudt.

---

## UX Concept

### Mode toggle uitbreiding
De bestaande Simple/Advanced toggle in de sidebar wordt uitgebreid met een derde optie: **Manage**. Dit voegt een nieuwe sidebar-groep toe met manage-specifieke pagina's.

### Sidebar (Manage mode)
```
[Simple] [Advanced] [Manage]    ← drie-weg toggle

── Manage ──────────────────
   Overview                    ← dashboard met project-tiles
   Projects                    ← lijst alle projecten uit registry
   CLAUDE.md Files             ← viewer/vergelijker voor alle CLAUDE.md's
   Lessons Learned             ← doorzoekbare lijst
   Sessions                    ← sessie-summaries per project
   Integrations                ← visuele integratie-kaart
```

De bestaande Simple en Advanced modes blijven ongewijzigd.

---

## Data Model

### Primaire bron: Orchestrator directory
```
C:\Users\{user}\.claude\
├── CLAUDE.md                          ← globale instructies
├── orchestrator/
│   ├── project-registry.json          ← alle projecten, paden, tags, integraties
│   ├── lessons-learned.md             ← pointer naar master
│   ├── README.md
│   ├── context/*.md                   ← per-project context files
│   └── sessions/*_latest.md           ← sessie-summaries
└── projects/                          ← Claude Code interne project state (NIET tonen)
```

### Secondaire bron: Per-project CLAUDE.md
Elk project in de registry heeft een `pad` veld dat naar de project-root wijst. Daar staat een `CLAUDE.md` met project-specifieke instructies.

### Data types (Rust → TypeScript)

```rust
// Rust structs (src-tauri/src/manager.rs)

#[derive(Serialize)]
pub struct ManagedProject {
    pub key: String,
    pub name: String,
    pub path: String,
    pub status: String,                 // active, maintenance, archived
    pub languages: Vec<String>,
    pub tags: Vec<String>,
    pub description: String,
    pub has_claude_md: bool,
    pub has_session: bool,
    pub session_date: Option<String>,
    pub claude_md_size: Option<u64>,
}

#[derive(Serialize)]
pub struct Integration {
    pub from: String,
    pub to: String,
    pub description: String,
}

#[derive(Serialize)]
pub struct LessonLearned {
    pub priority: String,               // "red", "yellow", "green"
    pub title: String,
    pub source: String,
    pub lesson: String,
    pub category: String,
}

#[derive(Serialize)]
pub struct SessionSummary {
    pub project: String,
    pub date: String,
    pub content: String,
}

#[derive(Serialize)]
pub struct WorkspaceOverview {
    pub global_claude_md: Option<String>,
    pub projects: Vec<ManagedProject>,
    pub integrations: Vec<Integration>,
    pub lessons_file: Option<String>,
    pub sessions: Vec<SessionSummary>,
    pub context_files: Vec<String>,
}
```

---

## Rust Backend (src-tauri/src/manager.rs)

### Tauri Commands

```rust
#[tauri::command]
pub fn scan_workspace() -> Result<WorkspaceOverview, String>
// Scant ~/.claude/ en bouwt het volledige overzicht op.
// 1. Leest project-registry.json
// 2. Voor elk project: check of CLAUDE.md bestaat op het pad
// 3. Scant sessions/ voor *_latest.md bestanden
// 4. Leest de globale CLAUDE.md
// 5. Lijst context/ bestanden

#[tauri::command]
pub fn read_project_claude_md(project_path: String) -> Result<String, String>
// Leest CLAUDE.md van een specifiek project

#[tauri::command]
pub fn read_session_summary(project_key: String) -> Result<String, String>
// Leest sessions/{key}_latest.md

#[tauri::command]
pub fn read_lessons_learned() -> Result<String, String>
// Leest het lessons learned bestand
// Probeert paden uit orchestrator/lessons-learned.md pointer
// Fallback: scant bekende locaties

#[tauri::command]
pub fn read_context_file(filename: String) -> Result<String, String>
// Leest orchestrator/context/{filename}

#[tauri::command]
pub fn open_in_terminal(project_path: String) -> Result<(), String>
// Opent Windows Terminal in het project pad (wt.exe -d {path})

#[tauri::command]
pub fn open_in_explorer(project_path: String) -> Result<(), String>
// Opent Explorer in het project pad
```

---

## Frontend Pages (src/pages/)

### ManageOverviewPage.tsx
Dashboard met:
- Stat cards: totaal projecten, actieve projecten, totaal lessons, laatste sessie
- Project tiles in een grid (gekleurde badges voor status)
- Quick-links naar lessons learned en globale CLAUDE.md

### ManageProjectsPage.tsx
Tabel/lijst van alle projecten met:
- Naam, pad, status (badge), taal (tags), tags
- Filter/zoek op naam, status, tag
- Klik → detail panel met CLAUDE.md preview, sessie-summary, acties (open terminal, explorer, VS Code)

### ManageCLAUDEPage.tsx
Twee-koloms vergelijker:
- Links: lijst van alle CLAUDE.md bestanden (globaal + per project)
- Rechts: markdown preview van het geselecteerde bestand

### ManageLessonsPage.tsx
Doorzoekbare lijst van alle lessons learned:
- Groepering per categorie (MCP, Code Kwaliteit, Deployment, etc.)
- Filter op prioriteit (rood/geel/groen)
- Zoekbalk over titel + inhoud
- Parse de markdown structuur naar individuele lesson-kaarten

### ManageSessionsPage.tsx
Timeline van sessie-summaries:
- Per project de laatste sessie
- Gesorteerd op datum (recentste eerst)
- Markdown preview per sessie
- Badge als sessie > 7 dagen oud (stale)

### ManageIntegrationsPage.tsx
Visuele kaart van integratiepunten:
- Projecten als nodes
- Integraties als pijlen met beschrijving

---

## Store (src/stores/manager.store.ts)

```typescript
const [workspace, setWorkspace] = createSignal<WorkspaceOverview | null>(null);
const [loading, setLoading] = createSignal(false);
const [selectedProject, setSelectedProject] = createSignal<string | null>(null);
const [searchQuery, setSearchQuery] = createSignal("");
const [statusFilter, setStatusFilter] = createSignal<string>("all");

const filteredProjects = createMemo(() => { /* filter op search + status */ });
const activeProjectCount = createMemo(() => { /* count status=active */ });
const staleSessions = createMemo(() => { /* sessies > 7 dagen */ });

async function loadWorkspace() { /* invoke scan_workspace */ }
```

---

## CSS (src/styles/manager.css)

Nieuwe classes (volg bestaand tokens.css patroon):
- `.manage-grid` — CSS grid voor project tiles
- `.project-tile` — project kaart met status-badge
- `.lesson-card` — lesson learned kaart met prioriteit-indicator
- `.session-timeline` — verticale timeline voor sessies
- `.status-badge` — gekleurde badge (active=green, maintenance=amber, archived=gray)
- `.priority-dot` — rode/gele/groene dot voor lessons
- `.markdown-preview` — gestyled markdown blok
- `.integration-map` — container voor integratie-visualisatie

---

## Routing (src/index.tsx)

Voeg routes toe:
```
/manage              → ManageOverviewPage
/manage/projects     → ManageProjectsPage
/manage/claude-files → ManageCLAUDEPage
/manage/lessons      → ManageLessonsPage
/manage/sessions     → ManageSessionsPage
/manage/integrations → ManageIntegrationsPage
```

---

## Sidebar uitbreiding (src/layouts/AppLayout.tsx)

Mode toggle: Simple | Advanced | Manage (drie-weg)
Manage mode toont eigen nav-groep met bovenstaande pagina's.

---

## Gefaseerde aanpak

### Fase 1: Foundation
1. `src-tauri/src/manager.rs` — alle Tauri commands
2. Registreer commands in `lib.rs`
3. `src/stores/manager.store.ts`
4. Mode toggle drie-weg in `app.store.ts`
5. Manage sidebar in `AppLayout.tsx`
6. Routes in `index.tsx`
7. `src/styles/manager.css`
8. `ManageOverviewPage.tsx`

### Fase 2: Projects + CLAUDE viewer
1. ManageProjectsPage met tabel, filters, detail panel
2. ManageCLAUDEPage met markdown viewer

### Fase 3: Lessons + Sessions
1. ManageLessonsPage met parsed lessons en zoek/filter
2. ManageSessionsPage met timeline

### Fase 4: Integrations + Polish
1. ManageIntegrationsPage met visuele kaart
2. Edge cases en polish

---

## Orchestrator paden (defaults)

```
CLAUDE_HOME = {USERPROFILE}\.claude
ORCHESTRATOR = {CLAUDE_HOME}\orchestrator
REGISTRY = {ORCHESTRATOR}\project-registry.json
SESSIONS = {ORCHESTRATOR}\sessions\
CONTEXT = {ORCHESTRATOR}\context\
GLOBAL_CLAUDE_MD = {CLAUDE_HOME}\CLAUDE.md
LESSONS_LEARNED = X:\10_3BM_bouwkunde\50_Claude-Code-Projects\lessons_learned_global.md
```

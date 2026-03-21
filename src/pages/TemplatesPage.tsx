import { createSignal, createMemo, For, Show } from "solid-js";
import { workspaceStore } from "../stores/workspace.store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea";
  rows?: number;
}

interface Template {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  lineEstimate: string;
  fields: TemplateField[];
  generate: (values: Record<string, string>) => string;
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const TEMPLATES: Template[] = [
  // ── Template 1: Lightweight ───────────────────────────────────────────
  {
    id: "lightweight",
    name: "Lightweight",
    subtitle: "Identity, stack, conventions, commands. Based on the OpenAEC Workspace Composer CLAUDE.md.",
    badge: "~40 lines",
    lineEstimate: "30-50",
    fields: [
      { key: "PROJECT_NAME", label: "Project Name", placeholder: "My Project", type: "text" },
      { key: "DESCRIPTION", label: "Description", placeholder: "Desktop app for managing widgets", type: "text" },
      { key: "TECH_STACK", label: "Tech Stack", placeholder: "React + TypeScript + Vite\nNode.js backend\nPostgreSQL", type: "textarea", rows: 3 },
      { key: "DEV_CMD", label: "Dev Command", placeholder: "npm run dev", type: "text" },
      { key: "BUILD_CMD", label: "Build Command", placeholder: "npm run build", type: "text" },
      { key: "TEST_CMD", label: "Test Command", placeholder: "npm run test", type: "text" },
      { key: "DOC_LANG", label: "Documentation Language", placeholder: "English", type: "text" },
      { key: "CODE_LANG", label: "Code Language", placeholder: "English", type: "text" },
      { key: "EXTRA_CONVENTIONS", label: "Extra Conventions (optional)", placeholder: "Conventional Commits: feat:, fix:, docs:, refactor:", type: "textarea", rows: 2 },
    ],
    generate: (v) => {
      const stack = (v.TECH_STACK || "").split("\n").filter(Boolean).map((l) => `- **${l.trim()}**`).join("\n");
      const conventions = [
        v.DOC_LANG ? `- Documentation: ${v.DOC_LANG}` : null,
        v.CODE_LANG ? `- Code & configs: ${v.CODE_LANG}` : null,
        v.EXTRA_CONVENTIONS ? v.EXTRA_CONVENTIONS.split("\n").filter(Boolean).map((l) => `- ${l.trim()}`).join("\n") : null,
      ].filter(Boolean).join("\n");

      return `# ${v.PROJECT_NAME || "Project Name"}

## Identity
${v.DESCRIPTION || "Project description here."}

## Stack
${stack || "- Define your tech stack here"}

## Commands
| Command | Purpose |
|---------|---------|
| \`${v.DEV_CMD || "npm run dev"}\` | Start development server |
| \`${v.BUILD_CMD || "npm run build"}\` | Production build |
| \`${v.TEST_CMD || "npm run test"}\` | Run tests |

## Conventions
${conventions || "- Define your conventions here"}
`;
    },
  },

  // ── Template 2: Standard Application ──────────────────────────────────
  {
    id: "standard",
    name: "Standard Application",
    subtitle: "Full project setup with architecture, protocols, core files map, and credentials. Based on erpnext-nextcloud-NL-websites.",
    badge: "~150 lines",
    lineEstimate: "150-200",
    fields: [
      { key: "PROJECT_NAME", label: "Project Name", placeholder: "My Application", type: "text" },
      { key: "DESCRIPTION", label: "Project Goal", placeholder: "Three websites for the Dutch open source market.\nCollaboration: Team A x Team B\nPhase: V1 Launch", type: "textarea", rows: 3 },
      { key: "TECH_STACK", label: "Tech Stack (one per line)", placeholder: "React 18 - Vite 6 - Tailwind CSS\nNode.js - Express\nPostgreSQL", type: "textarea", rows: 3 },
      { key: "DEV_CMD", label: "Dev Command", placeholder: "npm run dev", type: "text" },
      { key: "BUILD_CMD", label: "Build Command", placeholder: "npm run build", type: "text" },
      { key: "LINT_CMD", label: "Lint Command", placeholder: "npm run lint", type: "text" },
      { key: "EXTRA_COMMANDS", label: "Extra Commands (cmd | purpose, one per line)", placeholder: "npm run translate | Generate translations\nnpm run preview | Preview production build", type: "textarea", rows: 2 },
      { key: "ARCHITECTURE", label: "Directory Structure", placeholder: "src/\n  components/    UI components\n  pages/         Route pages\n  lib/           Utilities\npublic/          Static assets\ndocs/            Documentation", type: "textarea", rows: 8 },
      { key: "CODE_STYLE", label: "Code Style Rules", placeholder: "JSX/React for all components\nTailwind for styling, no custom CSS\nNamed exports, not default exports\nMobile-first responsive design", type: "textarea", rows: 4 },
      { key: "DESIGN_TOKENS", label: "Design Tokens (optional)", placeholder: "Primary: #1A2A3A (Deep Navy)\nCTA: #FF6B35 (Orange)\nBackground: #F9FAFB", type: "textarea", rows: 3 },
      { key: "CORE_FILES", label: "Core Files Map", placeholder: "ROADMAP.md | Status and progress\nDECISIONS.md | Architecture decisions\nARCHITECTURE.md | System architecture", type: "textarea", rows: 4 },
      { key: "CREDENTIAL_NOTES", label: "Credentials Section (stored where, accessed how)", placeholder: "GitHub tokens: OS keyring via gh auth\nAPI keys: .env.local (gitignored)\nAll credentials: CLAUDE.local.md (gitignored)", type: "textarea", rows: 3 },
      { key: "ALWAYS_RULES", label: "Always Rules", placeholder: "Research-first: no decisions without evidence\nPresent 2-3 alternatives before choosing\nDocument decisions in DECISIONS.md", type: "textarea", rows: 3 },
      { key: "NEVER_RULES", label: "Never Rules", placeholder: "Never commit credentials to Git\nNever make claims without sources\nNever put tracking info in CLAUDE.md", type: "textarea", rows: 3 },
    ],
    generate: (v) => {
      const techLine = v.TECH_STACK || "Define your tech stack";
      const cmds = [
        v.DEV_CMD ? `| \`${v.DEV_CMD}\` | Development server |` : null,
        v.BUILD_CMD ? `| \`${v.BUILD_CMD}\` | Production build |` : null,
        v.LINT_CMD ? `| \`${v.LINT_CMD}\` | Lint check |` : null,
        ...(v.EXTRA_COMMANDS || "").split("\n").filter(Boolean).map((l) => {
          const [cmd, purpose] = l.split("|").map((s) => s.trim());
          return `| \`${cmd}\` | ${purpose || ""} |`;
        }),
      ].filter(Boolean).join("\n");

      const arch = (v.ARCHITECTURE || "").split("\n").filter(Boolean).map((l) => `${l}`).join("\n");

      const codeStyle = (v.CODE_STYLE || "").split("\n").filter(Boolean).map((l) => `- ${l.trim()}`).join("\n");

      const tokens = (v.DESIGN_TOKENS || "").split("\n").filter(Boolean).map((l) => {
        const [name, ...rest] = l.split(":");
        return `| **${name.trim()}** | ${rest.join(":").trim()} |`;
      }).join("\n");

      const coreFiles = (v.CORE_FILES || "").split("\n").filter(Boolean).map((l) => {
        const [file, desc] = l.split("|").map((s) => s.trim());
        return `| \`${file}\` | ${desc || ""} |`;
      }).join("\n");

      const creds = (v.CREDENTIAL_NOTES || "").split("\n").filter(Boolean).map((l) => {
        const [what, where_] = l.split(":").map((s) => s.trim());
        return `| ${what} | ${where_ || ""} |`;
      }).join("\n");

      const always = (v.ALWAYS_RULES || "").split("\n").filter(Boolean).map((l) => `- ${l.trim()}`).join("\n");
      const never = (v.NEVER_RULES || "").split("\n").filter(Boolean).map((l) => `- ${l.trim()}`).join("\n");

      return `# ${v.PROJECT_NAME || "Project Name"}

> **Version**: 1
> **Last update**: ${new Date().toISOString().slice(0, 10)}

## Project Goal

${v.DESCRIPTION || "Describe your project goal here."}

---

## Core Files Map

| File | Purpose |
|------|---------|
${coreFiles || "| `ROADMAP.md` | Status and progress |"}

> **Golden Rule**: GitHub = Single Source of Truth for tracking.
> CLAUDE.md describes HOW you work, not WHERE you stand.

---

## Tech Stack & Commands

${techLine}

| Command | Purpose |
|---------|---------|
${cmds || "| `npm run dev` | Development server |"}

---

## Code Style

${codeStyle || "- Define your code style rules here"}

---
${tokens ? `
## Design Tokens

| Element | Value |
|---------|-------|
${tokens}

---
` : ""}
## Project Structure

\`\`\`
${arch || "Define your directory structure here"}
\`\`\`

---

## Credentials & Access

| What | Where |
|------|-------|
${creds || "| GitHub tokens | OS keyring via gh auth |"}

> Never commit credentials to Git. Use CLAUDE.local.md for AI-assistant context.

---

## Protocols

### P-001 Session Start
Read CLAUDE.md and relevant core files before starting work.

### P-002 Read Before Modify
Always read a file before editing. Never assume file contents.

### P-003 Dedicated Tools
Use the correct tool for the job. Grep for searching, Read for reading, Edit for editing.

---

## Way of Work

**Always**:
${always || "- Research-first: no decisions without evidence"}

**Never**:
${never || "- Never commit credentials to Git"}

---

*Version: 1*
*This file is the memory for Claude Code sessions.*
`;
    },
  },

  // ── Template 3: Full Skill Package ────────────────────────────────────
  {
    id: "full-skill",
    name: "Full Skill Package",
    subtitle: "Complete CLAUDE.md with standing orders, protocols P-000a through P-010, skill categories, YAML frontmatter rules, and publication protocol.",
    badge: "~300+ lines",
    lineEstimate: "300+",
    fields: [
      { key: "PROJECT_NAME", label: "Project Name", placeholder: "Docker Claude Skill Package", type: "text" },
      { key: "MISSION", label: "Mission Statement", placeholder: "Provide Claude with expert-level knowledge about Docker containerization, Compose orchestration, and production deployment patterns.", type: "textarea", rows: 3 },
      { key: "METHODOLOGY", label: "Methodology", placeholder: "Every skill file follows the OpenAEC 3-layer structure:\n1. YAML frontmatter (metadata)\n2. Prose guidance (when/why)\n3. Fenced code examples (how)", type: "textarea", rows: 3 },
      { key: "QUALITY_BAR", label: "Quality Bar", placeholder: "Every skill must be usable by Claude without prior context.\nNo placeholder code. All examples must compile/run.\nCitations required for version-specific claims.", type: "textarea", rows: 3 },
      { key: "CORE_FILES", label: "Core Files Map (8+ files, path | purpose)", placeholder: "CLAUDE.md | Standing orders, protocols, skill index\nROADMAP.md | Version targets, done/planned\nDECISIONS.md | Architecture Decision Records\nLESSONS.md | Reusable insights from past mistakes\nSOURCES.md | Approved documentation URLs\nCHANGELOG.md | Release history\nCONTRIBUTING.md | Contribution guidelines\nLICENSE | Apache 2.0", type: "textarea", rows: 8 },
      { key: "SKILL_CATEGORIES", label: "Skill Categories (category | description)", placeholder: "syntax | Language fundamentals and API surface\nimpl | Implementation patterns and best practices\nerrors | Common errors, root causes, fixes\ncore | Architecture and design patterns\nagents | Multi-step workflows and automation", type: "textarea", rows: 5 },
      { key: "REPO_STRUCTURE", label: "Repository Structure", placeholder: "skills/\n  syntax/       Language fundamentals\n  impl/         Implementation patterns\n  errors/       Error diagnosis\n  core/         Architecture patterns\n  agents/       Workflow automation\ndocs/           Package documentation\ntests/          Validation scripts", type: "textarea", rows: 8 },
      { key: "YAML_FIELDS", label: "Required YAML Frontmatter Fields", placeholder: "title | Human-readable skill name\ncategory | One of: syntax, impl, errors, core, agents\nplatform | Target platform or runtime\nversion_target | Minimum version this skill targets\npriority | P0 (critical) through P3 (nice-to-have)\nconfidence | high, medium, low\nverified_on | Date last verified against live docs", type: "textarea", rows: 7 },
      { key: "EXTRA_PROTOCOLS", label: "Extra Protocols (optional, name | rule)", placeholder: "P-006 No Hallucinated APIs | Never reference functions or flags that do not exist in official docs.\nP-007 Version Pinning | All version-specific advice must state the exact version.\nP-008 Cross-Reference | Link related skills using relative paths.\nP-009 Changelog Discipline | Every merged PR updates CHANGELOG.md.\nP-010 GitHub Publication | Tag, build, release, announce.", type: "textarea", rows: 5 },
      { key: "GITHUB_ORG", label: "GitHub Organization", placeholder: "OpenAEC-Foundation", type: "text" },
      { key: "LICENSE_TYPE", label: "License", placeholder: "Apache 2.0", type: "text" },
    ],
    generate: (v) => {
      const coreFiles = (v.CORE_FILES || "").split("\n").filter(Boolean).map((l) => {
        const [file, desc] = l.split("|").map((s) => s.trim());
        return `| \`${file}\` | ${desc || ""} |`;
      }).join("\n");

      const categories = (v.SKILL_CATEGORIES || "").split("\n").filter(Boolean).map((l) => {
        const [cat, desc] = l.split("|").map((s) => s.trim());
        return `| \`${cat}/\` | ${desc || ""} |`;
      }).join("\n");

      const repoStructure = (v.REPO_STRUCTURE || "").split("\n").filter(Boolean).join("\n");

      const yamlFields = (v.YAML_FIELDS || "").split("\n").filter(Boolean).map((l) => {
        const [field, desc] = l.split("|").map((s) => s.trim());
        return `| \`${field}\` | ${desc || ""} | **required** |`;
      }).join("\n");

      const methodology = (v.METHODOLOGY || "").split("\n").filter(Boolean).map((l) => l.trim()).join("\n");
      const qualityBar = (v.QUALITY_BAR || "").split("\n").filter(Boolean).map((l) => `- ${l.trim()}`).join("\n");
      const mission = v.MISSION || "Define your mission here.";

      const extraProtocols = (v.EXTRA_PROTOCOLS || "").split("\n").filter(Boolean).map((l) => {
        const [name, rule] = l.split("|").map((s) => s.trim());
        return `### ${name}\n${rule}\n`;
      }).join("\n");

      return `# ${v.PROJECT_NAME || "Skill Package"}

> **Maintainer**: ${v.GITHUB_ORG || "Your Organization"}
> **License**: ${v.LICENSE_TYPE || "Apache 2.0"}
> **Last update**: ${new Date().toISOString().slice(0, 10)}

---

## Standing Orders

### Mission
${mission}

### Methodology
${methodology || "Define your methodology here."}

### Quality Bar
${qualityBar || "- Every skill must be self-contained and usable without prior context."}

---

## Core Files Map

| File | Purpose |
|------|---------|
${coreFiles || "| `CLAUDE.md` | Standing orders, protocols, skill index |"}

---

## Protocols

### P-000a Session Bootstrap
1. Read CLAUDE.md completely.
2. Check ROADMAP.md for current priorities.
3. Scan DECISIONS.md for recent architecture choices.

### P-001 Read Before Modify
Always read a file before editing. Never assume contents. Use the Read tool, not cat or head.

### P-002 Dedicated Tools
Use Grep for searching, Read for reading, Edit for editing. Never use bash grep/sed/awk when dedicated tools exist.

### P-003 Atomic Commits
One logical change per commit. Conventional Commits format: feat:, fix:, docs:, refactor:, test:, chore:.

### P-004 No Orphan Files
Every new file must be referenced from at least one other file (index, README, or CLAUDE.md).

### P-005 Sources Required
All version-specific claims must cite official documentation. Add URLs to SOURCES.md.

${extraProtocols}
---

## Skill Categories

| Directory | Purpose |
|-----------|---------|
${categories || "| `skills/` | All skill files |"}

---

## Repository Structure

\`\`\`
${repoStructure || "Define your repository structure here"}
\`\`\`

---

## YAML Frontmatter Rules

Every skill file must begin with a YAML frontmatter block:

\`\`\`yaml
---
title: "Example Skill"
category: impl
platform: node
version_target: "20.x"
priority: P1
confidence: high
verified_on: ${new Date().toISOString().slice(0, 10)}
---
\`\`\`

### Required Fields

| Field | Description | Status |
|-------|-------------|--------|
${yamlFields || "| `title` | Human-readable skill name | **required** |"}

---

## GitHub Publication Protocol

### Release Checklist
1. All skills pass validation (\`npm run validate\` or equivalent).
2. CHANGELOG.md is updated with new entries.
3. Version bumped in package.json (semver).
4. Create annotated Git tag: \`git tag -a v1.x.x -m "Release v1.x.x"\`.
5. Push tag: \`git push origin v1.x.x\`.
6. Create GitHub Release with auto-generated notes.
7. Verify the release appears on the ${v.GITHUB_ORG || "organization"} page.

### Branch Strategy
- \`main\`: stable, release-ready.
- \`dev\`: integration branch for PRs.
- Feature branches: \`feat/skill-name\` or \`fix/issue-number\`.

---

*This CLAUDE.md was generated by OpenAEC Workspace Composer.*
`;
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplatesPage() {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [fieldValues, setFieldValues] = createSignal<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = createSignal<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = createSignal("");

  const selectedTemplate = createMemo(() =>
    TEMPLATES.find((t) => t.id === selectedId())
  );

  const preview = createMemo(() => {
    const tpl = selectedTemplate();
    if (!tpl) return "";
    return tpl.generate(fieldValues());
  });

  function updateField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function selectTemplate(id: string) {
    setSelectedId(id);
    setFieldValues({});
    setSaveStatus("idle");
    setSaveError("");
  }

  async function saveToWorkspace() {
    const ws = workspaceStore.workspacePath();
    if (!ws) {
      setSaveError("No workspace path selected. Go to the Workspace page first.");
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("write_claude_md", { path: ws, content: preview() });
      setSaveStatus("saved");
    } catch (err: any) {
      setSaveError(String(err));
      setSaveStatus("error");
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(preview());
    } catch {
      // fallback: no-op in Tauri webview
    }
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div class="card">
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            CLAUDE.md Templates
          </h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Choose a template based on real project structures. Fill in the fields and preview your CLAUDE.md live.
          </p>

          {/* Template selector cards */}
          <div style={{ display: "grid", gap: "var(--sp-3)" }}>
            <For each={TEMPLATES}>
              {(tpl) => (
                <div
                  class="sync-session-card"
                  style={{
                    cursor: "pointer",
                    "border-color": selectedId() === tpl.id ? "var(--accent)" : undefined,
                    background: selectedId() === tpl.id ? "var(--bg-active)" : undefined,
                  }}
                  onClick={() => selectTemplate(tpl.id)}
                >
                  <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-1)" }}>
                    <strong style={{ color: selectedId() === tpl.id ? "var(--accent)" : "var(--text-primary)" }}>
                      {tpl.name}
                    </strong>
                    <span
                      style={{
                        "font-size": "0.7rem",
                        padding: "1px 8px",
                        "border-radius": "var(--radius-sm)",
                        background: "var(--bg-night)",
                        color: "var(--text-dim)",
                        "font-family": "var(--font-mono)",
                      }}
                    >
                      {tpl.badge}
                    </span>
                  </div>
                  <p class="text-dim" style={{ "font-size": "0.8rem", margin: 0 }}>
                    {tpl.subtitle}
                  </p>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Editor + Preview (shown when a template is selected) */}
        <Show when={selectedTemplate()}>
          {(tpl) => (
            <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--sp-4)", "margin-top": "var(--sp-4)" }}>
              {/* Left: Form Fields */}
              <div class="card">
                <h2 class="card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Fill in your project details
                </h2>

                <div style={{ display: "flex", "flex-direction": "column", gap: "var(--sp-3)" }}>
                  <For each={tpl().fields}>
                    {(field) => (
                      <div class="form-group">
                        <label>{field.label}</label>
                        <Show
                          when={field.type === "textarea"}
                          fallback={
                            <input
                              type="text"
                              placeholder={field.placeholder}
                              value={fieldValues()[field.key] || ""}
                              onInput={(e) => updateField(field.key, e.currentTarget.value)}
                            />
                          }
                        >
                          <textarea
                            placeholder={field.placeholder}
                            rows={field.rows || 3}
                            value={fieldValues()[field.key] || ""}
                            onInput={(e) => updateField(field.key, e.currentTarget.value)}
                            style={{
                              width: "100%",
                              padding: "var(--sp-2) var(--sp-3)",
                              background: "var(--bg-input)",
                              border: "1px solid var(--border)",
                              "border-radius": "var(--radius-md)",
                              color: "var(--text-primary)",
                              "font-family": "var(--font-mono)",
                              "font-size": "0.8rem",
                              "line-height": "1.5",
                              resize: "vertical",
                            }}
                          />
                        </Show>
                      </div>
                    )}
                  </For>
                </div>

                {/* Action buttons */}
                <div style={{ "margin-top": "var(--sp-4)", display: "flex", gap: "var(--sp-2)" }}>
                  <button
                    class="btn btn-primary"
                    onClick={saveToWorkspace}
                    disabled={saveStatus() === "saving" || !workspaceStore.workspacePath()}
                    title={!workspaceStore.workspacePath() ? "Select a workspace path first" : ""}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <Show when={saveStatus() === "saving"} fallback="Save to workspace">
                      Saving...
                    </Show>
                  </button>
                  <button class="btn btn-secondary" onClick={copyToClipboard}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </button>
                </div>

                {/* Status messages */}
                <Show when={saveStatus() === "saved"}>
                  <p style={{
                    "margin-top": "var(--sp-2)",
                    "font-size": "0.8rem",
                    color: "var(--success)",
                  }}>
                    CLAUDE.md saved to {workspaceStore.workspacePath()}
                  </p>
                </Show>
                <Show when={saveStatus() === "error"}>
                  <p style={{
                    "margin-top": "var(--sp-2)",
                    "font-size": "0.8rem",
                    color: "var(--error)",
                  }}>
                    {saveError()}
                  </p>
                </Show>
              </div>

              {/* Right: Live Preview */}
              <div class="card" style={{ "max-height": "80vh", "overflow-y": "auto" }}>
                <h2 class="card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Live Preview
                </h2>
                <pre
                  style={{
                    "white-space": "pre-wrap",
                    "word-wrap": "break-word",
                    "font-family": "var(--font-mono)",
                    "font-size": "0.75rem",
                    "line-height": "1.6",
                    color: "var(--text-primary)",
                    background: "var(--bg-night)",
                    padding: "var(--sp-4)",
                    "border-radius": "var(--radius-md)",
                    border: "1px solid var(--border)",
                    margin: 0,
                    "overflow-x": "auto",
                  }}
                >
                  {preview()}
                </pre>
              </div>
            </div>
          )}
        </Show>

        {/* Placeholder when no template selected */}
        <Show when={!selectedTemplate()}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "text-align": "center" }}>
            <p class="text-dim" style={{ "font-size": "0.85rem", padding: "var(--sp-6) 0" }}>
              Select a template above to start editing your CLAUDE.md
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}

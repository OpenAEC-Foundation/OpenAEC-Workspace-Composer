import { createSignal, For, Show } from "solid-js";
import { workspaceStore } from "../stores/workspace.store";

interface CoreFile {
  id: string;
  filename: string;
  description: string;
  enabled: boolean;
  template: "minimal" | "standard" | "comprehensive";
}

interface TemplateOption {
  id: "minimal" | "standard" | "comprehensive";
  label: string;
  description: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: "minimal", label: "Minimal", description: "Bare essentials, fill in as you go" },
  { id: "standard", label: "Standard", description: "Pre-filled sections with guidance" },
  { id: "comprehensive", label: "Comprehensive", description: "Full structure with examples" },
];

const INITIAL_CORE_FILES: CoreFile[] = [
  {
    id: "claude-md",
    filename: "CLAUDE.md",
    description: "Primary instruction file for Claude Code. Defines project identity, stack, conventions, and protocols. Claude reads this at the start of every session.",
    enabled: true,
    template: "standard",
  },
  {
    id: "way-of-work",
    filename: "WAY_OF_WORK.md",
    description: "Team workflow agreements: branching strategy, PR review process, deployment pipeline, communication channels, and coding standards.",
    enabled: true,
    template: "standard",
  },
  {
    id: "sources",
    filename: "SOURCES.md",
    description: "Curated list of authoritative documentation, API references, design systems, and external resources the team relies on.",
    enabled: false,
    template: "minimal",
  },
  {
    id: "decisions",
    filename: "DECISIONS.md",
    description: "Architecture Decision Records (ADRs). Documents important technical decisions with context, options considered, and rationale.",
    enabled: false,
    template: "standard",
  },
  {
    id: "lessons",
    filename: "LESSONS.md",
    description: "Lessons learned during development. Captures pitfalls, debugging discoveries, and knowledge that prevents future mistakes.",
    enabled: false,
    template: "minimal",
  },
  {
    id: "changelog",
    filename: "CHANGELOG.md",
    description: "Version history following Keep a Changelog format. Documents Added, Changed, Fixed, and Removed items per release.",
    enabled: true,
    template: "standard",
  },
];

const FILE_PREVIEWS: Record<string, Record<string, string>> = {
  "claude-md": {
    minimal: `# Project Name

## Stack
<!-- Add your tech stack here -->

## Conventions
- Code language: English
- Conventional Commits: feat:, fix:, docs:, refactor:, test:, chore:`,
    standard: `# Project Name

Brief project description.

## Stack
- **Frontend**: Framework + Language
- **Backend**: Framework + Language
- **Database**: Type

## Conventions
- Documentation: English
- Code language: English
- Commit style: Conventional Commits (feat:, fix:, docs:, refactor:, test:, chore:)

## Protocols
- **P-001**: Verify before destructive operations
- **P-002**: Read files before modifying
- **P-003**: Use dedicated tools over Bash`,
    comprehensive: `# Project Name

Brief project description.

**Team/Org:** Organization Name

## Stack
- **Frontend**: Framework + Language + Build Tool
- **Backend**: Framework + Language
- **Database**: Type + ORM
- **Infrastructure**: Docker / Cloud Provider
- **CI/CD**: GitHub Actions / etc.

## Architecture
\`\`\`
src/                    -> Frontend source
  components/           -> UI components
  lib/                  -> Utilities & data
  pages/                -> Route pages
backend/                -> Backend source
  api/                  -> API routes
  models/               -> Data models
\`\`\`

## Commands
- \`npm run dev\` -- Start dev server
- \`npm run build\` -- Build for production
- \`npm run test\` -- Run test suite

## Conventions
- Documentation language: English
- Code language: English
- Commit style: Conventional Commits
- Branch naming: feature/*, fix/*, chore/*

## Protocols
- **P-001**: Verify before destructive operations
- **P-002**: Read files before modifying
- **P-003**: Use dedicated tools over Bash
- **P-004**: Progressive disclosure in responses
- **P-005**: Save PROMPTS.md per session`,
  },
  "way-of-work": {
    minimal: `# Way of Work

## Branching
- main: production
- feature/*: new features
- fix/*: bug fixes

## Review
- All changes via Pull Request
- At least 1 approval required`,
    standard: `# Way of Work

## Git Branching Strategy
- **main**: Production-ready code, always deployable
- **feature/***: New feature branches from main
- **fix/***: Bug fix branches from main
- **chore/***: Maintenance tasks

## Pull Request Process
1. Create branch from main
2. Make changes with conventional commits
3. Open PR with clear description
4. Get at least 1 review approval
5. Squash merge to main

## Code Standards
- Follow project linting rules
- Write meaningful commit messages
- Include tests for new features
- Update documentation when relevant

## Communication
- Use PR comments for code discussions
- Tag relevant reviewers explicitly`,
    comprehensive: `# Way of Work

## Git Branching Strategy
- **main**: Production-ready code, protected branch
- **develop**: Integration branch (optional)
- **feature/***: New features — branch from main
- **fix/***: Bug fixes — branch from main
- **hotfix/***: Urgent production fixes
- **release/***: Release preparation
- **chore/***: Maintenance and refactoring

## Pull Request Process
1. Create branch from main using naming convention
2. Make atomic commits using Conventional Commits
3. Push branch and open PR with description template
4. Automated checks must pass (lint, test, build)
5. Request review from at least 1 team member
6. Address review feedback
7. Squash merge to main, delete feature branch

## Code Quality Standards
- ESLint / Prettier for formatting
- TypeScript strict mode
- Minimum 80% test coverage for new code
- No console.log in production code
- Meaningful variable and function names

## Deployment Pipeline
- **CI**: Automated on every PR (lint + test + build)
- **Staging**: Auto-deploy on merge to main
- **Production**: Manual promotion from staging

## Communication
- PR comments for code-specific discussions
- Team channel for general updates
- Stand-up for blockers and progress
- ADR for architecture decisions`,
  },
  "sources": {
    minimal: `# Sources

## Documentation
- <!-- Add your primary docs here -->

## API References
- <!-- Add API docs here -->

## Design
- <!-- Add design system links here -->`,
    standard: `# Sources

## Official Documentation
- [Project Framework Docs](https://example.com) — Primary framework reference
- [Language Reference](https://example.com) — Language specification

## API References
- [REST API Docs](https://example.com) — Backend API documentation
- [Third-party APIs](https://example.com) — External service docs

## Design System
- [Component Library](https://example.com) — UI component reference
- [Brand Guidelines](https://example.com) — Colors, typography, spacing

## Tools & Infrastructure
- [CI/CD Platform](https://example.com) — Build pipeline docs
- [Cloud Provider](https://example.com) — Infrastructure documentation`,
    comprehensive: `# Sources

## Official Documentation
- [Project Framework Docs](https://example.com) — Primary framework reference
- [Language Reference](https://example.com) — Language specification
- [Build Tool Docs](https://example.com) — Bundler / build system

## API References
- [REST API Docs](https://example.com) — Backend API documentation
- [GraphQL Schema](https://example.com) — API schema explorer
- [Third-party APIs](https://example.com) — External service docs

## Design System
- [Component Library](https://example.com) — UI component reference
- [Figma Designs](https://example.com) — Source of truth for UI
- [Brand Guidelines](https://example.com) — Colors, typography, spacing

## Tools & Infrastructure
- [CI/CD Platform](https://example.com) — Build pipeline docs
- [Cloud Provider](https://example.com) — Infrastructure documentation
- [Monitoring](https://example.com) — Observability platform

## Internal Resources
- [Onboarding Guide](https://example.com) — New team member setup
- [Architecture Diagram](https://example.com) — System overview
- [Runbooks](https://example.com) — Incident response procedures`,
  },
  "decisions": {
    minimal: `# Architecture Decisions

## ADR-001: [Title]
- **Date**: YYYY-MM-DD
- **Status**: Proposed | Accepted | Deprecated
- **Decision**: ...
- **Rationale**: ...`,
    standard: `# Architecture Decisions

Record important technical decisions with context and rationale.

## ADR-001: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded

### Context
What is the issue or situation that motivates this decision?

### Decision
What is the change that we are proposing or have agreed to implement?

### Consequences
What becomes easier or harder as a result of this decision?

---

_Template based on [Michael Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)._`,
    comprehensive: `# Architecture Decisions

Record important technical decisions with context and rationale.
Follow the [ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## ADR-001: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded
**Deciders:** [list of people involved]

### Context
What is the issue or situation that motivates this decision?
What forces are at play (technical, business, team)?

### Options Considered
1. **Option A** — description, pros, cons
2. **Option B** — description, pros, cons
3. **Option C** — description, pros, cons

### Decision
What is the change that we are proposing or have agreed to implement?

### Consequences
- **Positive**: What becomes easier?
- **Negative**: What becomes harder?
- **Neutral**: What other effects does this have?

### Follow-up
- [ ] Action items resulting from this decision

---

## ADR-002: ...

---

_Use \`git log --all --oneline -- DECISIONS.md\` to see the history of decisions._`,
  },
  "lessons": {
    minimal: `# Lessons Learned

## [Date] — [Title]
**Problem**: ...
**Solution**: ...
**Takeaway**: ...`,
    standard: `# Lessons Learned

Capture pitfalls, debugging discoveries, and knowledge that prevents future mistakes.

## YYYY-MM-DD — [Title]

**Problem:**
What went wrong or was unexpectedly difficult?

**Root Cause:**
Why did it happen?

**Solution:**
How was it resolved?

**Takeaway:**
What should the team remember to avoid this in the future?

---

_Add new entries at the top. Tag with categories: [build], [deploy], [performance], [security], [testing]._`,
    comprehensive: `# Lessons Learned

Capture pitfalls, debugging discoveries, and knowledge that prevents future mistakes.
Add new entries at the top with the most recent date.

## YYYY-MM-DD — [Title] [category]

**Context:**
What were you working on?

**Problem:**
What went wrong or was unexpectedly difficult?

**Root Cause:**
Why did it happen? (5 Whys analysis if applicable)

**Solution:**
How was it resolved? Include code snippets if helpful.

**Time Spent:**
How long did debugging take?

**Takeaway:**
What should the team remember to avoid this in the future?

**References:**
- Link to relevant issue, PR, or documentation

---

### Categories
- [build] — Build system, dependencies, compilation
- [deploy] — Deployment, CI/CD, infrastructure
- [performance] — Speed, memory, optimization
- [security] — Vulnerabilities, auth, access control
- [testing] — Test failures, coverage gaps, flaky tests
- [integration] — Third-party services, APIs, data flow`,
  },
  "changelog": {
    minimal: `# Changelog

## [Unreleased]
### Added
### Changed
### Fixed`,
    standard: `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Initial project setup

### Changed

### Fixed

### Removed`,
    comprehensive: `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial project setup with tech stack
- Core feature implementation
- CI/CD pipeline configuration

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.1.0] - YYYY-MM-DD

### Added
- Project scaffolding
- README and documentation`,
  },
};

export function CoreFilesPage() {
  const [coreFiles, setCoreFiles] = createSignal<CoreFile[]>(INITIAL_CORE_FILES);
  const [previewFileId, setPreviewFileId] = createSignal<string | null>("claude-md");
  const [saving, setSaving] = createSignal(false);
  const [saveResult, setSaveResult] = createSignal<{ success: boolean; message: string } | null>(null);

  function toggleFile(id: string) {
    setCoreFiles(
      coreFiles().map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  }

  function setTemplate(id: string, template: CoreFile["template"]) {
    setCoreFiles(
      coreFiles().map((f) => (f.id === id ? { ...f, template } : f))
    );
  }

  const enabledCount = () => coreFiles().filter((f) => f.enabled).length;

  const currentPreview = () => {
    const fileId = previewFileId();
    if (!fileId) return null;
    const file = coreFiles().find((f) => f.id === fileId);
    if (!file) return null;
    const previews = FILE_PREVIEWS[fileId];
    if (!previews) return null;
    return { file, content: previews[file.template] || previews["standard"] || "No preview available" };
  };

  function getFileContent(file: CoreFile): string {
    const previews = FILE_PREVIEWS[file.id];
    if (previews) {
      return previews[file.template] || previews["standard"] || "";
    }
    // Fallback: generate a basic template
    return `# ${file.filename.replace(".md", "")}\n\n<!-- Generated by OpenAEC Workspace Composer -->\n`;
  }

  async function saveFiles() {
    const wsPath = workspaceStore.workspacePath();
    if (!wsPath) {
      setSaveResult({ success: false, message: "No workspace path set. Go to the Workspace page and select a directory first." });
      return;
    }

    setSaving(true);
    setSaveResult(null);

    const enabledFiles = coreFiles().filter((f) => f.enabled);
    if (enabledFiles.length === 0) {
      setSaving(false);
      setSaveResult({ success: false, message: "No files are enabled. Toggle at least one file to save." });
      return;
    }

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const errors: string[] = [];
      let written = 0;

      for (const file of enabledFiles) {
        const content = getFileContent(file);
        try {
          await invoke("write_workspace_file", {
            workspace: wsPath,
            relativePath: file.filename,
            content,
          });
          written++;
        } catch (e) {
          errors.push(`${file.filename}: ${e}`);
        }
      }

      if (errors.length > 0) {
        setSaveResult({
          success: false,
          message: `Wrote ${written} file(s), but ${errors.length} failed:\n${errors.join("\n")}`,
        });
      } else {
        setSaveResult({
          success: true,
          message: `Successfully wrote ${written} file(s) to ${wsPath}`,
        });
      }
    } catch {
      // Not in Tauri environment
      setSaveResult({
        success: false,
        message: "This feature requires the desktop app. File writing is not available in browser mode.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div class="card">
          <h2 class="card-title">
            <span class="icon-placeholder" />
            Core Documentation Files
          </h2>
          <p class="text-dim" style={{ "font-size": "0.85rem", "margin-bottom": "var(--sp-2)" }}>
            Core files form the documentation backbone of your workspace. Toggle which files to generate
            and select a template complexity level for each.
          </p>
          <div style={{ display: "flex", gap: "var(--sp-2)", "align-items": "center" }}>
            <span style={{ "font-size": "0.8rem", color: "var(--accent)", "font-weight": "600" }}>
              {enabledCount()} of {coreFiles().length} files enabled
            </span>
          </div>
        </div>

        {/* File List */}
        <div style={{ "margin-top": "var(--sp-4)" }}>
          <For each={coreFiles()}>
            {(file) => (
              <div
                class="card"
                style={{
                  "margin-bottom": "var(--sp-2)",
                  opacity: file.enabled ? "1" : "0.6",
                  "border-left": file.enabled ? "3px solid var(--accent)" : "3px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-start" }}>
                  <div style={{ flex: "1" }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-1)" }}>
                      <span class="icon-placeholder" />
                      <code class="font-mono" style={{ color: file.enabled ? "var(--accent)" : "var(--text-muted)", "font-size": "0.9rem", "font-weight": "600" }}>
                        {file.filename}
                      </code>
                    </div>
                    <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-2)" }}>
                      {file.description}
                    </p>

                    {/* Template selector */}
                    <Show when={file.enabled}>
                      <div style={{ display: "flex", gap: "var(--sp-1)", "align-items": "center" }}>
                        <span class="text-dim" style={{ "font-size": "0.75rem", "margin-right": "var(--sp-1)" }}>Template:</span>
                        <For each={TEMPLATE_OPTIONS}>
                          {(opt) => (
                            <button
                              class={`btn ${file.template === opt.id ? "btn-primary" : "btn-ghost"}`}
                              style={{ "font-size": "0.7rem", padding: "2px 8px" }}
                              onClick={() => setTemplate(file.id, opt.id)}
                              title={opt.description}
                            >
                              {opt.label}
                            </button>
                          )}
                        </For>
                        <Show when={FILE_PREVIEWS[file.id]}>
                          <button
                            class="btn btn-ghost"
                            style={{ "font-size": "0.7rem", padding: "2px 8px", "margin-left": "var(--sp-2)" }}
                            onClick={() => setPreviewFileId(previewFileId() === file.id ? null : file.id)}
                          >
                            {previewFileId() === file.id ? "Hide Preview" : "Preview"}
                          </button>
                        </Show>
                      </div>
                    </Show>
                  </div>

                  <button
                    class={`toggle ${file.enabled ? "active" : ""}`}
                    onClick={() => toggleFile(file.id)}
                    style={{ "flex-shrink": "0", "margin-left": "var(--sp-3)" }}
                  >
                    {file.enabled ? "On" : "Off"}
                  </button>
                </div>

                {/* Inline Preview */}
                <Show when={previewFileId() === file.id && FILE_PREVIEWS[file.id]}>
                  <pre class="font-mono text-dim" style={{
                    "font-size": "0.78rem",
                    "white-space": "pre-wrap",
                    background: "var(--bg-input)",
                    padding: "var(--sp-3)",
                    "border-radius": "var(--radius)",
                    "margin-top": "var(--sp-3)",
                    "max-height": "300px",
                    overflow: "auto",
                    "line-height": "1.5",
                  }}>
                    {FILE_PREVIEWS[file.id]?.[file.template] || "No preview available for this template level."}
                  </pre>
                </Show>
              </div>
            )}
          </For>
        </div>

        {/* Save Action */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--sp-3)" }}>
            <div>
              <h2 class="card-title" style={{ margin: "0" }}>
                <span class="icon-placeholder" />
                Save Files
              </h2>
              <Show when={workspaceStore.workspacePath()}>
                <p class="text-dim" style={{ "font-size": "0.8rem", margin: "2px 0 0 0" }}>
                  Target: <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.75rem" }}>{workspaceStore.workspacePath()}</code>
                </p>
              </Show>
              <Show when={!workspaceStore.workspacePath()}>
                <p class="text-dim" style={{ "font-size": "0.8rem", margin: "2px 0 0 0" }}>
                  No workspace path set. Go to the Workspace page first.
                </p>
              </Show>
            </div>
            <button
              class="btn btn-primary"
              onClick={saveFiles}
              disabled={saving() || enabledCount() === 0}
              style={{ "flex-shrink": "0" }}
            >
              {saving() ? "Saving..." : `Save ${enabledCount()} File(s)`}
            </button>
          </div>

          {/* Save result feedback */}
          <Show when={saveResult()}>
            <div style={{
              background: saveResult()!.success ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: saveResult()!.success ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
              "border-radius": "var(--radius)",
              padding: "var(--sp-3)",
              "margin-bottom": "var(--sp-3)",
            }}>
              <p style={{
                "font-size": "0.85rem",
                margin: "0",
                color: saveResult()!.success ? "var(--success)" : "var(--error)",
                "white-space": "pre-wrap",
              }}>
                {saveResult()!.message}
              </p>
            </div>
          </Show>
        </div>

        {/* Summary */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">
            <span class="icon-placeholder" />
            Generated File Structure
          </h2>
          <pre class="font-mono text-dim" style={{
            "font-size": "0.8rem",
            background: "var(--bg-input)",
            padding: "var(--sp-3)",
            "border-radius": "var(--radius)",
            "white-space": "pre-wrap",
          }}>
{coreFiles()
  .filter((f) => f.enabled)
  .map((f) => `  ${f.filename.padEnd(20)} # ${f.description.slice(0, 50)}...`)
  .join("\n") || "  (no files selected)"}
          </pre>
        </div>
      </div>
    </div>
  );
}

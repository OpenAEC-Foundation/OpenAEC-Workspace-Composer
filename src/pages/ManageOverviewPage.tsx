import { createMemo, createSignal, onMount, Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { managerStore } from "../stores/manager.store";
import { TbOutlineFolder, TbOutlineFileText, TbOutlineBulb, TbOutlineClock, TbOutlineShare, TbOutlineRefresh, TbOutlineChecklist, TbOutlineReport } from "solid-icons/tb";

export function ManageOverviewPage() {
  onMount(() => {
    managerStore.loadWorkspace();
  });

  const totalProjects = createMemo(() => {
    const ws = managerStore.workspace();
    return ws ? ws.projects.length : 0;
  });

  const totalSessions = createMemo(() => {
    const ws = managerStore.workspace();
    return ws ? ws.sessions.length : 0;
  });

  const totalIntegrations = createMemo(() => {
    const ws = managerStore.workspace();
    return ws ? ws.integrations.length : 0;
  });

  const lastSessionDate = createMemo(() => {
    const ws = managerStore.workspace();
    if (!ws || ws.sessions.length === 0) return "—";
    return ws.sessions[0].date || "—";
  });

  const staleCount = createMemo(() => managerStore.staleSessions().length);

  const statusMdCount = createMemo(() => {
    const ws = managerStore.workspace();
    return ws ? ws.projects.filter((p) => p.has_status_md).length : 0;
  });

  const todoMdCount = createMemo(() => {
    const ws = managerStore.workspace();
    return ws ? ws.projects.filter((p) => p.has_todo_md).length : 0;
  });

  // File preview state
  const [previewFile, setPreviewFile] = createSignal<{ project: string; filename: string; path: string } | null>(null);
  const [previewContent, setPreviewContent] = createSignal<string>("");
  const [previewLoading, setPreviewLoading] = createSignal(false);

  async function openFilePreview(projectName: string, projectPath: string, filename: string) {
    setPreviewFile({ project: projectName, filename, path: projectPath });
    setPreviewLoading(true);
    try {
      const content = await managerStore.readProjectFile(projectPath, filename);
      setPreviewContent(content);
    } catch (e) {
      setPreviewContent(`Failed to read ${filename}: ${e}`);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div class="card" style={{ padding: "var(--sp-4) var(--sp-5)" }}>
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}>
            <div>
              <h1 style={{ "font-family": "var(--font-heading)", "font-size": "1.25rem", "margin-bottom": "2px" }}>
                Workspace Manager
              </h1>
              <p class="text-dim" style={{ "font-size": "0.8rem" }}>
                Orchestrator overview — inspect projects, sessions, and integrations
              </p>
            </div>
            <button
              class="btn btn-ghost"
              onClick={() => managerStore.loadWorkspace()}
              disabled={managerStore.loading()}
              title="Refresh workspace data"
            >
              <TbOutlineRefresh size={16} />
            </button>
          </div>
        </div>

        {/* Loading state */}
        <Show when={managerStore.loading()}>
          <div class="manage-loading">Scanning workspace...</div>
        </Show>

        {/* Error state */}
        <Show when={managerStore.error()}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "border-color": "var(--error)" }}>
            <p style={{ color: "var(--error)", "font-size": "0.8125rem" }}>
              {managerStore.error()}
            </p>
          </div>
        </Show>

        {/* Content */}
        <Show when={managerStore.workspace() && !managerStore.loading()}>
          {/* Stat cards */}
          <div class="manage-stats" style={{ "margin-top": "var(--sp-4)" }}>
            <div class="manage-stat-card">
              <span class="stat-value">{totalProjects()}</span>
              <span class="stat-label">Projects</span>
            </div>
            <div class="manage-stat-card">
              <span class="stat-value" style={{ color: "var(--success)" }}>
                {managerStore.activeProjectCount()}
              </span>
              <span class="stat-label">Active</span>
            </div>
            <div class="manage-stat-card">
              <span class="stat-value">{totalSessions()}</span>
              <span class="stat-label">Sessions</span>
            </div>
            <div class="manage-stat-card">
              <span class="stat-value" style={{ color: staleCount() > 0 ? "var(--warm-gold)" : "var(--text-primary)" }}>
                {staleCount()}
              </span>
              <span class="stat-label">Stale</span>
            </div>
            <div class="manage-stat-card">
              <span class="stat-value">{totalIntegrations()}</span>
              <span class="stat-label">Integrations</span>
            </div>
            <div class="manage-stat-card">
              <span class="stat-value">{statusMdCount()}</span>
              <span class="stat-label">STATUS.md</span>
            </div>
            <div class="manage-stat-card">
              <span class="stat-value">{todoMdCount()}</span>
              <span class="stat-label">TODO.md</span>
            </div>
          </div>

          {/* Quick links */}
          <div class="manage-quick-links" style={{ "margin-bottom": "var(--sp-4)" }}>
            <A href="/manage/projects" class="manage-quick-link">
              <TbOutlineFolder size={18} />
              <span>All Projects</span>
            </A>
            <A href="/manage/claude-files" class="manage-quick-link">
              <TbOutlineFileText size={18} />
              <span>CLAUDE.md Files</span>
            </A>
            <A href="/manage/lessons" class="manage-quick-link">
              <TbOutlineBulb size={18} />
              <span>Lessons Learned</span>
            </A>
            <A href="/manage/sessions" class="manage-quick-link">
              <TbOutlineClock size={18} />
              <span>Sessions</span>
            </A>
            <A href="/manage/integrations" class="manage-quick-link">
              <TbOutlineShare size={18} />
              <span>Integrations</span>
            </A>
          </div>

          {/* Last session info */}
          <Show when={lastSessionDate() !== "—"}>
            <div class="card" style={{ "margin-bottom": "var(--sp-4)" }}>
              <h2 class="card-title" style={{ "font-size": "0.875rem" }}>Last Session</h2>
              <p class="text-dim" style={{ "font-size": "0.8125rem" }}>
                {managerStore.workspace()!.sessions[0].project} — {lastSessionDate()}
              </p>
              <pre class="markdown-preview" style={{ "margin-top": "var(--sp-2)", "max-height": "200px" }}>
                {managerStore.workspace()!.sessions[0].content}
              </pre>
            </div>
          </Show>

          {/* Project tiles */}
          <h2 style={{ "font-family": "var(--font-heading)", "font-size": "0.9375rem", "margin-bottom": "var(--sp-3)" }}>
            Projects
          </h2>
          <div class="manage-grid">
            <For each={managerStore.workspace()!.projects}>
              {(project) => (
                <div class="project-tile">
                  <div class="project-tile-header">
                    <span class="project-tile-name">{project.name}</span>
                    <span class={`status-badge status-badge--${project.status}`}>
                      {project.status}
                    </span>
                  </div>
                  <Show when={project.description}>
                    <p class="project-tile-description">{project.description}</p>
                  </Show>
                  <div class="project-tile-meta">
                    <For each={project.languages}>
                      {(lang) => <span class="project-tile-tag">{lang}</span>}
                    </For>
                  </div>
                  <div style={{ display: "flex", gap: "var(--sp-1)", "flex-wrap": "wrap", "margin-top": "var(--sp-1)" }}>
                    <Show when={project.has_claude_md}>
                      <button
                        class="project-tile-tag"
                        style={{ cursor: "pointer", border: "none" }}
                        onClick={() => openFilePreview(project.name, project.path, "CLAUDE.md")}
                        title="View CLAUDE.md"
                      >
                        <TbOutlineFileText size={10} /> CLAUDE.md
                      </button>
                    </Show>
                    <Show when={project.has_status_md}>
                      <button
                        class="project-tile-tag"
                        style={{ cursor: "pointer", border: "none", background: "rgba(34, 197, 94, 0.12)", color: "var(--success)" }}
                        onClick={() => openFilePreview(project.name, project.path, "STATUS.md")}
                        title="View STATUS.md"
                      >
                        <TbOutlineReport size={10} /> STATUS.md
                      </button>
                    </Show>
                    <Show when={project.has_todo_md}>
                      <button
                        class="project-tile-tag"
                        style={{ cursor: "pointer", border: "none", background: "rgba(245, 158, 11, 0.12)", color: "var(--warm-gold)" }}
                        onClick={() => openFilePreview(project.name, project.path, "TODO.md")}
                        title="View TODO.md"
                      >
                        <TbOutlineChecklist size={10} /> TODO.md
                      </button>
                    </Show>
                    <Show when={project.has_session}>
                      <span class="project-tile-tag">session</span>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* File preview panel */}
          <Show when={previewFile()}>
            <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
              <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "var(--sp-2)" }}>
                <h2 class="card-title" style={{ "font-size": "0.875rem", margin: "0" }}>
                  {previewFile()!.project} — {previewFile()!.filename}
                </h2>
                <button
                  class="btn btn-ghost"
                  style={{ padding: "2px 8px", "font-size": "0.75rem" }}
                  onClick={() => setPreviewFile(null)}
                >
                  Close
                </button>
              </div>
              <Show when={previewLoading()}>
                <div class="manage-loading">Loading...</div>
              </Show>
              <Show when={!previewLoading()}>
                <pre class="markdown-preview">{previewContent()}</pre>
              </Show>
            </div>
          </Show>

          {/* Global CLAUDE.md preview */}
          <Show when={managerStore.workspace()!.global_claude_md}>
            <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
              <h2 class="card-title" style={{ "font-size": "0.875rem" }}>Global CLAUDE.md</h2>
              <pre class="markdown-preview" style={{ "margin-top": "var(--sp-2)" }}>
                {managerStore.workspace()!.global_claude_md!.slice(0, 1000)}
                {(managerStore.workspace()!.global_claude_md!.length > 1000) ? "\n\n... (truncated)" : ""}
              </pre>
            </div>
          </Show>
        </Show>

        {/* Empty state */}
        <Show when={!managerStore.workspace() && !managerStore.loading() && !managerStore.error()}>
          <div class="manage-empty" style={{ "margin-top": "var(--sp-8)" }}>
            <div class="manage-empty-icon">
              <TbOutlineFolder size={48} />
            </div>
            <p class="manage-empty-text">
              No orchestrator data found. Make sure ~/.claude/orchestrator/project-registry.json exists.
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}

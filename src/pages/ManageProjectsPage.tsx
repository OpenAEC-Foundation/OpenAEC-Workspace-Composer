import { createSignal, createMemo, onMount, Show, For } from "solid-js";
import { managerStore, ManagedProject } from "../stores/manager.store";
import {
  TbOutlineTerminal,
  TbOutlineFolder,
  TbOutlineFileText,
  TbOutlineSearch,
} from "solid-icons/tb";

const STATUS_FILTERS = ["all", "active", "maintenance", "archived"] as const;

export function ManageProjectsPage() {
  const [claudeMd, setClaudeMd] = createSignal<string | null>(null);
  const [sessionContent, setSessionContent] = createSignal<string | null>(null);
  const [detailLoading, setDetailLoading] = createSignal(false);

  onMount(() => {
    if (!managerStore.workspace()) {
      managerStore.loadWorkspace();
    }
  });

  const selectedProjectData = createMemo((): ManagedProject | null => {
    const key = managerStore.selectedProject();
    if (!key) return null;
    return (
      managerStore
        .filteredProjects()
        .find((p) => p.key === key) ?? null
    );
  });

  async function selectProject(project: ManagedProject): Promise<void> {
    managerStore.setSelectedProject(project.key);
    setClaudeMd(null);
    setSessionContent(null);
    setDetailLoading(true);

    try {
      const [md, session] = await Promise.allSettled([
        project.has_claude_md
          ? managerStore.readProjectClaudeMd(project.path)
          : Promise.resolve(null),
        project.has_session
          ? managerStore.readSessionSummary(project.key)
          : Promise.resolve(null),
      ]);

      setClaudeMd(
        md.status === "fulfilled" ? md.value : "Failed to load CLAUDE.md"
      );
      setSessionContent(
        session.status === "fulfilled"
          ? session.value
          : "Failed to load session summary"
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail(): void {
    managerStore.setSelectedProject(null);
    setClaudeMd(null);
    setSessionContent(null);
  }

  const projectCount = createMemo(() => managerStore.filteredProjects().length);

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div
          class="card"
          style={{ padding: "var(--sp-4) var(--sp-5)" }}
        >
          <h1
            style={{
              "font-family": "var(--font-heading)",
              "font-size": "1.25rem",
              "margin-bottom": "2px",
            }}
          >
            Projects
          </h1>
          <p class="text-dim" style={{ "font-size": "0.8rem" }}>
            Browse and inspect all registered orchestrator projects
          </p>
        </div>

        {/* Loading */}
        <Show when={managerStore.loading()}>
          <div class="manage-loading">Scanning workspace...</div>
        </Show>

        {/* Error */}
        <Show when={managerStore.error()}>
          <div
            class="card"
            style={{
              "margin-top": "var(--sp-4)",
              "border-color": "var(--error)",
            }}
          >
            <p style={{ color: "var(--error)", "font-size": "0.8125rem" }}>
              {managerStore.error()}
            </p>
          </div>
        </Show>

        {/* Main content */}
        <Show when={managerStore.workspace() && !managerStore.loading()}>
          {/* Search + filters */}
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "var(--sp-3)",
              "margin-top": "var(--sp-4)",
              "flex-wrap": "wrap",
            }}
          >
            {/* Search input */}
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "var(--sp-2)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                "border-radius": "var(--radius-md)",
                padding: "var(--sp-2) var(--sp-3)",
                flex: "1",
                "min-width": "200px",
                "max-width": "360px",
              }}
            >
              <TbOutlineSearch
                size={14}
                style={{ color: "var(--text-muted)", "flex-shrink": "0" }}
              />
              <input
                type="text"
                placeholder="Search name, key, or tag..."
                value={managerStore.searchQuery()}
                onInput={(e) =>
                  managerStore.setSearchQuery(e.currentTarget.value)
                }
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  "font-family": "var(--font-body)",
                  "font-size": "0.8125rem",
                  width: "100%",
                }}
              />
            </div>

            {/* Status filter buttons */}
            <div
              style={{
                display: "flex",
                gap: "var(--sp-1)",
              }}
            >
              <For each={[...STATUS_FILTERS]}>
                {(status) => (
                  <button
                    class={`btn ${
                      managerStore.statusFilter() === status
                        ? "btn-primary"
                        : "btn-ghost"
                    }`}
                    style={{
                      "font-size": "0.75rem",
                      padding: "var(--sp-1) var(--sp-3)",
                      "text-transform": "capitalize",
                    }}
                    onClick={() => managerStore.setStatusFilter(status)}
                  >
                    {status}
                  </button>
                )}
              </For>
            </div>

            {/* Result count */}
            <span
              class="text-muted"
              style={{ "font-size": "0.75rem", "margin-left": "auto" }}
            >
              {projectCount()} project{projectCount() !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Two-column layout: table + detail panel */}
          <div
            style={{
              display: "flex",
              gap: "var(--sp-4)",
              "margin-top": "var(--sp-4)",
              "align-items": "flex-start",
            }}
          >
            {/* Left: project list */}
            <div
              style={{
                flex: managerStore.selectedProject() ? "0 0 55%" : "1",
                "min-width": "0",
                transition: "flex 0.2s ease",
              }}
            >
              <Show
                when={projectCount() > 0}
                fallback={
                  <div class="manage-empty">
                    <div class="manage-empty-icon">
                      <TbOutlineFolder size={48} />
                    </div>
                    <p class="manage-empty-text">
                      No projects match your current filters.
                    </p>
                  </div>
                }
              >
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    "grid-template-columns":
                      "2fr 1fr 1.5fr 1.5fr",
                    gap: "var(--sp-3)",
                    padding: "var(--sp-2) var(--sp-4)",
                    "font-size": "0.6875rem",
                    "font-weight": "600",
                    color: "var(--text-muted)",
                    "text-transform": "uppercase",
                    "letter-spacing": "0.05em",
                    "border-bottom": "1px solid var(--border)",
                  }}
                >
                  <span>Name</span>
                  <span>Status</span>
                  <span>Languages</span>
                  <span>Tags</span>
                </div>

                {/* Project rows */}
                <For each={managerStore.filteredProjects()}>
                  {(project) => {
                    const isSelected = createMemo(
                      () => managerStore.selectedProject() === project.key
                    );

                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => selectProject(project)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectProject(project);
                          }
                        }}
                        style={{
                          display: "grid",
                          "grid-template-columns":
                            "2fr 1fr 1.5fr 1.5fr",
                          gap: "var(--sp-3)",
                          padding: "var(--sp-3) var(--sp-4)",
                          cursor: "pointer",
                          background: isSelected()
                            ? "var(--bg-active)"
                            : "transparent",
                          "border-left": isSelected()
                            ? "2px solid var(--accent)"
                            : "2px solid transparent",
                          "border-bottom": "1px solid var(--border)",
                          transition:
                            "background 0.15s ease, border-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected()) {
                            e.currentTarget.style.background =
                              "var(--bg-hover)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isSelected()
                            ? "var(--bg-active)"
                            : "transparent";
                        }}
                      >
                        {/* Name + description */}
                        <div style={{ "min-width": "0" }}>
                          <div
                            class="project-tile-name"
                            style={{ "font-size": "0.8125rem" }}
                          >
                            {project.name}
                          </div>
                          <Show when={project.description}>
                            <div
                              class="text-dim"
                              style={{
                                "font-size": "0.7rem",
                                "white-space": "nowrap",
                                overflow: "hidden",
                                "text-overflow": "ellipsis",
                                "margin-top": "2px",
                              }}
                            >
                              {project.description}
                            </div>
                          </Show>
                        </div>

                        {/* Status badge */}
                        <div
                          style={{
                            display: "flex",
                            "align-items": "center",
                          }}
                        >
                          <span
                            class={`status-badge status-badge--${project.status}`}
                          >
                            {project.status}
                          </span>
                        </div>

                        {/* Languages */}
                        <div
                          style={{
                            display: "flex",
                            "flex-wrap": "wrap",
                            gap: "var(--sp-1)",
                            "align-items": "center",
                          }}
                        >
                          <For each={project.languages}>
                            {(lang) => (
                              <span class="project-tile-tag">{lang}</span>
                            )}
                          </For>
                        </div>

                        {/* Tags */}
                        <div
                          style={{
                            display: "flex",
                            "flex-wrap": "wrap",
                            gap: "var(--sp-1)",
                            "align-items": "center",
                          }}
                        >
                          <For each={project.tags}>
                            {(tag) => (
                              <span class="project-tile-tag">{tag}</span>
                            )}
                          </For>
                          <Show when={project.has_claude_md}>
                            <span class="project-tile-tag">CLAUDE.md</span>
                          </Show>
                          <Show when={project.has_session}>
                            <span class="project-tile-tag">session</span>
                          </Show>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div>

            {/* Right: detail panel */}
            <Show when={managerStore.selectedProject() && selectedProjectData()}>
              <div
                style={{
                  flex: "0 0 43%",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  "border-radius": "var(--radius-md)",
                  padding: "var(--sp-4)",
                  position: "sticky",
                  top: "var(--sp-4)",
                  "max-height": "calc(100vh - 160px)",
                  "overflow-y": "auto",
                }}
              >
                {/* Detail header */}
                <div
                  style={{
                    display: "flex",
                    "align-items": "flex-start",
                    "justify-content": "space-between",
                    "margin-bottom": "var(--sp-4)",
                  }}
                >
                  <div style={{ "min-width": "0", flex: "1" }}>
                    <h2
                      style={{
                        "font-family": "var(--font-heading)",
                        "font-size": "1rem",
                        "font-weight": "600",
                        "margin-bottom": "var(--sp-1)",
                      }}
                    >
                      {selectedProjectData()!.name}
                    </h2>
                    <span
                      class={`status-badge status-badge--${selectedProjectData()!.status}`}
                    >
                      {selectedProjectData()!.status}
                    </span>
                  </div>
                  <button
                    class="btn btn-ghost"
                    onClick={closeDetail}
                    title="Close detail panel"
                    style={{
                      "font-size": "1rem",
                      padding: "var(--sp-1)",
                      "line-height": "1",
                    }}
                  >
                    &times;
                  </button>
                </div>

                {/* Description */}
                <Show when={selectedProjectData()!.description}>
                  <p
                    class="text-dim"
                    style={{
                      "font-size": "0.8125rem",
                      "line-height": "1.5",
                      "margin-bottom": "var(--sp-3)",
                    }}
                  >
                    {selectedProjectData()!.description}
                  </p>
                </Show>

                {/* Project path */}
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "var(--sp-2)",
                    "margin-bottom": "var(--sp-4)",
                    padding: "var(--sp-2) var(--sp-3)",
                    background: "var(--bg-primary)",
                    "border-radius": "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <TbOutlineFolder
                    size={14}
                    style={{ color: "var(--text-muted)", "flex-shrink": "0" }}
                  />
                  <span
                    style={{
                      "font-family": "var(--font-mono)",
                      "font-size": "0.7rem",
                      color: "var(--text-dim)",
                      "word-break": "break-all",
                    }}
                  >
                    {selectedProjectData()!.path}
                  </span>
                </div>

                {/* Meta chips */}
                <div
                  style={{
                    display: "flex",
                    "flex-wrap": "wrap",
                    gap: "var(--sp-1)",
                    "margin-bottom": "var(--sp-4)",
                  }}
                >
                  <For each={selectedProjectData()!.languages}>
                    {(lang) => (
                      <span class="project-tile-tag">{lang}</span>
                    )}
                  </For>
                  <For each={selectedProjectData()!.tags}>
                    {(tag) => (
                      <span class="project-tile-tag">{tag}</span>
                    )}
                  </For>
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "var(--sp-2)",
                    "margin-bottom": "var(--sp-4)",
                  }}
                >
                  <button
                    class="btn btn-ghost"
                    style={{
                      display: "flex",
                      "align-items": "center",
                      gap: "var(--sp-2)",
                      "font-size": "0.75rem",
                    }}
                    onClick={() =>
                      managerStore.openInTerminal(
                        selectedProjectData()!.path
                      )
                    }
                    title="Open terminal at project path"
                  >
                    <TbOutlineTerminal size={14} />
                    Open Terminal
                  </button>
                  <button
                    class="btn btn-ghost"
                    style={{
                      display: "flex",
                      "align-items": "center",
                      gap: "var(--sp-2)",
                      "font-size": "0.75rem",
                    }}
                    onClick={() =>
                      managerStore.openInExplorer(
                        selectedProjectData()!.path
                      )
                    }
                    title="Open folder in file explorer"
                  >
                    <TbOutlineFolder size={14} />
                    Open Explorer
                  </button>
                </div>

                {/* Loading state for detail content */}
                <Show when={detailLoading()}>
                  <div class="manage-loading">Loading project details...</div>
                </Show>

                {/* CLAUDE.md preview */}
                <Show when={!detailLoading()}>
                  <Show when={selectedProjectData()!.has_claude_md}>
                    <div style={{ "margin-bottom": "var(--sp-4)" }}>
                      <h3
                        style={{
                          "font-family": "var(--font-heading)",
                          "font-size": "0.8125rem",
                          "font-weight": "600",
                          display: "flex",
                          "align-items": "center",
                          gap: "var(--sp-2)",
                          "margin-bottom": "var(--sp-2)",
                        }}
                      >
                        <TbOutlineFileText size={14} />
                        CLAUDE.md
                        <Show when={selectedProjectData()!.claude_md_size}>
                          <span
                            class="text-muted"
                            style={{
                              "font-weight": "400",
                              "font-size": "0.6875rem",
                            }}
                          >
                            ({Math.round(selectedProjectData()!.claude_md_size! / 1024)}
                            KB)
                          </span>
                        </Show>
                      </h3>
                      <Show
                        when={claudeMd()}
                        fallback={
                          <p
                            class="text-muted"
                            style={{ "font-size": "0.75rem" }}
                          >
                            Content not loaded.
                          </p>
                        }
                      >
                        <pre class="markdown-preview">{claudeMd()}</pre>
                      </Show>
                    </div>
                  </Show>

                  {/* Session summary */}
                  <Show when={selectedProjectData()!.has_session}>
                    <div>
                      <h3
                        style={{
                          "font-family": "var(--font-heading)",
                          "font-size": "0.8125rem",
                          "font-weight": "600",
                          display: "flex",
                          "align-items": "center",
                          gap: "var(--sp-2)",
                          "margin-bottom": "var(--sp-2)",
                        }}
                      >
                        <TbOutlineFileText size={14} />
                        Session Summary
                        <Show when={selectedProjectData()!.session_date}>
                          <span
                            class="text-muted"
                            style={{
                              "font-weight": "400",
                              "font-size": "0.6875rem",
                            }}
                          >
                            ({selectedProjectData()!.session_date})
                          </span>
                        </Show>
                      </h3>
                      <Show
                        when={sessionContent()}
                        fallback={
                          <p
                            class="text-muted"
                            style={{ "font-size": "0.75rem" }}
                          >
                            Content not loaded.
                          </p>
                        }
                      >
                        <pre class="markdown-preview">{sessionContent()}</pre>
                      </Show>
                    </div>
                  </Show>

                  {/* No content available */}
                  <Show
                    when={
                      !selectedProjectData()!.has_claude_md &&
                      !selectedProjectData()!.has_session
                    }
                  >
                    <p
                      class="text-muted"
                      style={{
                        "font-size": "0.8125rem",
                        "text-align": "center",
                        padding: "var(--sp-4) 0",
                      }}
                    >
                      No CLAUDE.md or session data available for this project.
                    </p>
                  </Show>
                </Show>
              </div>
            </Show>
          </div>
        </Show>

        {/* Empty state: no workspace data at all */}
        <Show
          when={
            !managerStore.workspace() &&
            !managerStore.loading() &&
            !managerStore.error()
          }
        >
          <div class="manage-empty" style={{ "margin-top": "var(--sp-8)" }}>
            <div class="manage-empty-icon">
              <TbOutlineFolder size={48} />
            </div>
            <p class="manage-empty-text">
              No orchestrator data found. Make sure
              ~/.claude/orchestrator/project-registry.json exists.
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}

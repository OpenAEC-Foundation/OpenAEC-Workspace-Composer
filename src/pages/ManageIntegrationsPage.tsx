import { createSignal, createMemo, onMount, Show, For } from "solid-js";
import { managerStore } from "../stores/manager.store";
import {
  TbOutlineArrowRight,
  TbOutlineFileText,
  TbOutlineShare,
} from "solid-icons/tb";

export function ManageIntegrationsPage() {
  const [selectedContextFile, setSelectedContextFile] = createSignal<
    string | null
  >(null);
  const [contextContent, setContextContent] = createSignal<string | null>(null);
  const [contextLoading, setContextLoading] = createSignal(false);

  onMount(() => {
    if (!managerStore.workspace()) {
      managerStore.loadWorkspace();
    }
  });

  const integrations = createMemo(() => {
    const ws = managerStore.workspace();
    return ws ? ws.integrations : [];
  });

  const contextFiles = createMemo(() => {
    const ws = managerStore.workspace();
    return ws ? ws.context_files : [];
  });

  const projectNameByKey = createMemo(() => {
    const ws = managerStore.workspace();
    if (!ws) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    for (const p of ws.projects) {
      map[p.key] = p.name;
    }
    return map;
  });

  function resolveProjectName(key: string): string {
    return projectNameByKey()[key] || key;
  }

  async function loadContextFile(filename: string): Promise<void> {
    if (selectedContextFile() === filename) {
      setSelectedContextFile(null);
      setContextContent(null);
      return;
    }

    setSelectedContextFile(filename);
    setContextContent(null);
    setContextLoading(true);

    try {
      const content = await managerStore.readContextFile(filename);
      setContextContent(content);
    } catch (e) {
      setContextContent(`Error loading file: ${String(e)}`);
    } finally {
      setContextLoading(false);
    }
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div class="card" style={{ padding: "var(--sp-4) var(--sp-5)" }}>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "var(--sp-3)",
            }}
          >
            <TbOutlineShare
              size={20}
              style={{ color: "var(--accent)", "flex-shrink": "0" }}
            />
            <div>
              <h1
                style={{
                  "font-family": "var(--font-heading)",
                  "font-size": "1.25rem",
                  "margin-bottom": "2px",
                }}
              >
                Integrations
              </h1>
              <p class="text-dim" style={{ "font-size": "0.8rem" }}>
                <Show
                  when={managerStore.workspace()}
                  fallback="Loading integration data..."
                >
                  {integrations().length} integration
                  {integrations().length !== 1 ? "s" : ""} &middot;{" "}
                  {contextFiles().length} context file
                  {contextFiles().length !== 1 ? "s" : ""}
                </Show>
              </p>
            </div>
          </div>
        </div>

        {/* Loading state */}
        <Show when={managerStore.loading()}>
          <div class="manage-loading">Scanning workspace...</div>
        </Show>

        {/* Error state */}
        <Show when={managerStore.error()}>
          <div
            class="card"
            style={{
              "margin-top": "var(--sp-4)",
              "border-color": "var(--error)",
            }}
          >
            <p
              style={{ color: "var(--error)", "font-size": "0.8125rem" }}
            >
              {managerStore.error()}
            </p>
          </div>
        </Show>

        {/* Content */}
        <Show when={managerStore.workspace() && !managerStore.loading()}>
          {/* Integrations section */}
          <h2
            style={{
              "font-family": "var(--font-heading)",
              "font-size": "0.9375rem",
              "margin-top": "var(--sp-4)",
              "margin-bottom": "var(--sp-3)",
            }}
          >
            Integration Map
          </h2>

          <Show
            when={integrations().length > 0}
            fallback={
              <div class="integration-map">
                <div
                  class="manage-empty"
                  style={{ padding: "var(--sp-6)" }}
                >
                  <TbOutlineShare
                    size={32}
                    style={{ opacity: "0.3", "margin-bottom": "var(--sp-2)" }}
                  />
                  <p class="manage-empty-text">
                    No integrations defined in the project registry.
                  </p>
                </div>
              </div>
            }
          >
            <div class="manage-grid">
              <For each={integrations()}>
                {(integration) => (
                  <div class="project-tile">
                    <div
                      class="project-tile-header"
                      style={{
                        "justify-content": "flex-start",
                        gap: "var(--sp-2)",
                      }}
                    >
                      <span
                        class="status-badge status-badge--active"
                        style={{ "font-size": "0.6875rem" }}
                      >
                        {resolveProjectName(integration.from)}
                      </span>
                      <TbOutlineArrowRight
                        size={14}
                        style={{
                          color: "var(--accent)",
                          "flex-shrink": "0",
                        }}
                      />
                      <span
                        class="status-badge status-badge--maintenance"
                        style={{ "font-size": "0.6875rem" }}
                      >
                        {resolveProjectName(integration.to)}
                      </span>
                    </div>
                    <p class="project-tile-description">
                      {integration.description}
                    </p>
                    <div class="project-tile-meta">
                      <span class="project-tile-tag">{integration.from}</span>
                      <span class="project-tile-tag">{integration.to}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Context files section */}
          <h2
            style={{
              "font-family": "var(--font-heading)",
              "font-size": "0.9375rem",
              "margin-top": "var(--sp-4)",
              "margin-bottom": "var(--sp-3)",
            }}
          >
            Context Files
          </h2>

          <Show
            when={contextFiles().length > 0}
            fallback={
              <div class="integration-map">
                <div
                  class="manage-empty"
                  style={{ padding: "var(--sp-6)" }}
                >
                  <TbOutlineFileText
                    size={32}
                    style={{ opacity: "0.3", "margin-bottom": "var(--sp-2)" }}
                  />
                  <p class="manage-empty-text">
                    No context files found in the orchestrator directory.
                  </p>
                </div>
              </div>
            }
          >
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "var(--sp-2)",
              }}
            >
              <For each={contextFiles()}>
                {(filename) => (
                  <button
                    style={{
                      display: "flex",
                      "align-items": "center",
                      gap: "var(--sp-3)",
                      padding: "var(--sp-3) var(--sp-4)",
                      background:
                        selectedContextFile() === filename
                          ? "var(--bg-hover)"
                          : "var(--bg-card)",
                      border:
                        selectedContextFile() === filename
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                      "border-radius": "var(--radius-md)",
                      cursor: "pointer",
                      "text-align": "left",
                      color: "var(--text-primary)",
                      "font-size": "0.8125rem",
                      "font-family": "var(--font-body)",
                      width: "100%",
                      transition:
                        "border-color var(--transition), background var(--transition)",
                    }}
                    onClick={() => loadContextFile(filename)}
                  >
                    <TbOutlineFileText
                      size={16}
                      style={{
                        color:
                          selectedContextFile() === filename
                            ? "var(--accent)"
                            : "var(--text-muted)",
                        "flex-shrink": "0",
                      }}
                    />
                    <span
                      style={{
                        "font-family": "var(--font-mono)",
                        "font-size": "0.75rem",
                      }}
                    >
                      {filename}
                    </span>
                  </button>
                )}
              </For>
            </div>

            {/* Context file preview */}
            <Show when={selectedContextFile()}>
              <div
                class="card"
                style={{ "margin-top": "var(--sp-3)" }}
              >
                <h2
                  class="card-title"
                  style={{ "font-size": "0.875rem" }}
                >
                  {selectedContextFile()}
                </h2>
                <Show
                  when={!contextLoading()}
                  fallback={
                    <div class="manage-loading">Loading context file...</div>
                  }
                >
                  <pre
                    class="markdown-preview"
                    style={{ "margin-top": "var(--sp-2)" }}
                  >
                    {contextContent()}
                  </pre>
                </Show>
              </div>
            </Show>
          </Show>
        </Show>

        {/* Empty state */}
        <Show
          when={
            !managerStore.workspace() &&
            !managerStore.loading() &&
            !managerStore.error()
          }
        >
          <div class="manage-empty" style={{ "margin-top": "var(--sp-8)" }}>
            <div class="manage-empty-icon">
              <TbOutlineShare size={48} />
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

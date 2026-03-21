import { createSignal, onMount, For, Show } from "solid-js";
import { workspaceStore } from "../stores/workspace.store";

interface MemoryEntry {
  id: string;
  type: "user" | "feedback" | "project" | "reference";
  title: string;
  description: string;
  enabled: boolean;
}

const MEMORY_TYPES: { type: MemoryEntry["type"]; label: string; description: string; path: string; icon: string; docsUrl: string }[] = [
  {
    type: "user",
    label: "User Memory",
    description: "Personal preferences and habits that Claude learns over time. Persists across all projects.",
    path: "~/.claude/memory/user/",
    icon: "user",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
  },
  {
    type: "feedback",
    label: "Feedback Memory",
    description: "Corrections and feedback you give Claude. Helps avoid repeating mistakes.",
    path: ".claude/memory/feedback/",
    icon: "message",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code/memory#auto-memory",
  },
  {
    type: "project",
    label: "Project Memory",
    description: "Project-specific context like architecture decisions, coding patterns, and team conventions.",
    path: ".claude/memory/project/",
    icon: "folder",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code/memory#project-memory",
  },
  {
    type: "reference",
    label: "Reference Memory",
    description: "Links to documentation, API references, and external resources that Claude should know about.",
    path: ".claude/memory/reference/",
    icon: "book",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code/memory#memory-files",
  },
];

const EXAMPLE_MEMORIES: MemoryEntry[] = [
  { id: "mem-1", type: "user", title: "Preferred language: Nederlands", description: "Write documentation in Dutch, code in English", enabled: true },
  { id: "mem-2", type: "feedback", title: "Auto-restart Tauri after changes", description: "Restart tauri dev automatically after config changes", enabled: true },
  { id: "mem-3", type: "project", title: "Composer v2 Upgrade", description: "Upgrade to generalized workflow bootstrapper with 7-phase methodology", enabled: true },
  { id: "mem-4", type: "reference", title: "Claude Code Documentation", description: "Official docs URLs for CLI, settings, subagents, setup", enabled: true },
];

async function tryInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<T>(cmd, args);
  } catch {
    return null;
  }
}

export function MemoryPage() {
  const [autoMemory, setAutoMemory] = createSignal(true);
  const [memories, setMemories] = createSignal<MemoryEntry[]>(EXAMPLE_MEMORIES);
  const [selectedType, setSelectedType] = createSignal<MemoryEntry["type"] | "all">("all");
  const [memoryMdContent, setMemoryMdContent] = createSignal<string | null>(null);
  const [memoryDirPath, setMemoryDirPath] = createSignal<string>("");
  const [isDesktop, setIsDesktop] = createSignal(false);
  const [settingsSaved, setSettingsSaved] = createSignal(false);
  const [loadingMemory, setLoadingMemory] = createSignal(false);

  onMount(async () => {
    // Detect Tauri environment
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      setIsDesktop(true);

      // Determine memory directory path
      const homeDir = await invoke<string>("get_home_dir");
      if (homeDir) {
        const wsPath = workspaceStore.workspacePath();
        // Sanitize project path to create the Claude projects memory path
        const sanitized = wsPath.replace(/[/\\]/g, "-").replace(/^-/, "").replace(/:/, "");
        const memDir = `${homeDir}/.claude/projects/${sanitized}/memory/`;
        setMemoryDirPath(memDir);
      }

      // Try to read MEMORY.md from the workspace
      await loadMemoryMd();
    } catch {
      setIsDesktop(false);
    }
  });

  async function loadMemoryMd() {
    const wsPath = workspaceStore.workspacePath();
    if (!wsPath) return;
    setLoadingMemory(true);
    try {
      const content = await tryInvoke<string>("read_workspace_file", {
        workspace: wsPath,
        relativePath: ".claude/memory/MEMORY.md",
      });
      if (content) {
        setMemoryMdContent(content);
      } else {
        // Also try the project-level memory
        const homeDir = await tryInvoke<string>("get_home_dir");
        if (homeDir) {
          const sanitized = wsPath.replace(/[/\\]/g, "-").replace(/^-/, "").replace(/:/, "");
          const memContent = await tryInvoke<string>("read_workspace_file", {
            workspace: homeDir,
            relativePath: `.claude/projects/${sanitized}/memory/MEMORY.md`,
          });
          if (memContent) {
            setMemoryMdContent(memContent);
          }
        }
      }
    } finally {
      setLoadingMemory(false);
    }
  }

  async function handleAutoMemoryToggle() {
    const newVal = !autoMemory();
    setAutoMemory(newVal);

    if (isDesktop()) {
      const wsPath = workspaceStore.workspacePath();
      if (wsPath) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          // Write the auto_memory setting to settings.local.json
          const settings = { auto_memory: newVal };
          await invoke("write_settings_json", { path: wsPath, settings });
          setSettingsSaved(true);
          setTimeout(() => setSettingsSaved(false), 2000);
        } catch (e) {
          console.error("Failed to save auto-memory setting:", e);
        }
      }
    }
  }

  async function openMemoryDir() {
    if (isDesktop()) {
      try {
        const { Command } = await import("@tauri-apps/plugin-shell");
        const dir = memoryDirPath();
        if (dir) {
          // Use explorer on Windows, open on macOS, xdg-open on Linux
          await Command.create("open-dir", ["explorer", dir]).execute();
        }
      } catch (e) {
        console.error("Failed to open directory:", e);
      }
    }
  }

  const filteredMemories = () => {
    const type = selectedType();
    if (type === "all") return memories();
    return memories().filter((m) => m.type === type);
  };

  function toggleMemory(id: string) {
    setMemories(
      memories().map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  }

  function removeMemory(id: string) {
    setMemories(memories().filter((m) => m.id !== id));
  }

  function typeColor(type: MemoryEntry["type"]): string {
    switch (type) {
      case "user": return "var(--accent)";
      case "feedback": return "var(--success)";
      case "project": return "#3498db";
      case "reference": return "#9b59b6";
    }
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Explanation Card */}
        <div class="card">
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <line x1="9" y1="21" x2="15" y2="21" />
              <line x1="10" y1="24" x2="14" y2="24" />
            </svg>
            Claude Code Memory
          </h2>
          <p class="text-dim" style={{ "font-size": "0.85rem", "margin-bottom": "var(--sp-3)" }}>
            Memory allows Claude Code to remember context across conversations. Memory files are stored in{" "}
            <code class="font-mono" style={{ color: "var(--accent)" }}>.claude/memory/</code> and organized by type.
            Claude reads these automatically at the start of each session.
          </p>

          {/* Open memory directory button */}
          <Show when={memoryDirPath()}>
            <div style={{
              display: "flex",
              "align-items": "center",
              gap: "var(--sp-2)",
              background: "var(--bg-input)",
              padding: "var(--sp-2) var(--sp-3)",
              "border-radius": "var(--radius)",
              "margin-bottom": "var(--sp-3)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <code class="font-mono text-dim" style={{ "font-size": "0.75rem", flex: "1", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                {memoryDirPath()}
              </code>
              <button class="btn btn-secondary" style={{ "font-size": "0.75rem", padding: "2px 10px", "flex-shrink": "0" }} onClick={openMemoryDir}>
                Open Directory
              </button>
            </div>
          </Show>

          {/* Auto-memory toggle */}
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", background: "var(--bg-input)", padding: "var(--sp-3)", "border-radius": "var(--radius)" }}>
            <div>
              <strong>Auto-Memory</strong>
              <small class="text-dim" style={{ display: "block", "font-size": "0.8rem" }}>
                Automatically save learned context from conversations
              </small>
              <Show when={!isDesktop()}>
                <small style={{ display: "block", "font-size": "0.75rem", color: "var(--warning, #e67e22)", "margin-top": "2px" }}>
                  Setting saved locally. In Claude CLI, use: <code class="font-mono" style={{ color: "var(--accent)" }}>claude config set autoMemory true</code>
                </small>
              </Show>
              <Show when={settingsSaved()}>
                <small style={{ display: "block", "font-size": "0.75rem", color: "var(--success)", "margin-top": "2px" }}>
                  Setting saved to settings.local.json
                </small>
              </Show>
            </div>
            <button
              class={`toggle ${autoMemory() ? "active" : ""}`}
              onClick={handleAutoMemoryToggle}
            >
              {autoMemory() ? "On" : "Off"}
            </button>
          </div>
        </div>

        {/* MEMORY.md Content */}
        <Show when={memoryMdContent() !== null || loadingMemory()}>
          <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
            <h2 class="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              MEMORY.md
            </h2>
            <Show when={loadingMemory()}>
              <p class="text-dim" style={{ "font-size": "0.85rem" }}>Loading memory index...</p>
            </Show>
            <Show when={!loadingMemory() && memoryMdContent()}>
              <pre class="font-mono text-dim" style={{
                "font-size": "0.8rem",
                background: "var(--bg-input)",
                padding: "var(--sp-3)",
                "border-radius": "var(--radius)",
                "white-space": "pre-wrap",
                "max-height": "300px",
                overflow: "auto",
                "line-height": "1.5",
              }}>
                {memoryMdContent()}
              </pre>
            </Show>
            <div style={{ "margin-top": "var(--sp-2)" }}>
              <button class="btn btn-secondary" style={{ "font-size": "0.75rem", padding: "4px 12px" }} onClick={loadMemoryMd}>
                Reload
              </button>
            </div>
          </div>
        </Show>

        {/* Memory Types */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Memory Types
          </h2>
          <div class="tile-grid">
            <For each={MEMORY_TYPES}>
              {(memType) => (
                <a
                  href={memType.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="tile"
                  style={{ "text-decoration": "none", color: "inherit", cursor: "pointer", transition: "border-color 0.2s" }}
                >
                  <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-2)" }}>
                    <span style={{ width: "8px", height: "8px", "border-radius": "50%", background: typeColor(memType.type) }} />
                    <strong style={{ "font-size": "0.9rem" }}>{memType.label}</strong>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ "margin-left": "auto" }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                  <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-2)" }}>
                    {memType.description}
                  </p>
                  <code class="font-mono" style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                    {memType.path}
                  </code>
                </a>
              )}
            </For>
          </div>
        </div>

        {/* Memory Entries */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--sp-3)" }}>
            <h2 class="card-title" style={{ margin: "0" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Memory Entries ({filteredMemories().length})
            </h2>
            <div style={{ display: "flex", gap: "var(--sp-1)" }}>
              <button
                class={`btn ${selectedType() === "all" ? "btn-primary" : "btn-secondary"}`}
                style={{ "font-size": "0.75rem", padding: "2px 8px" }}
                onClick={() => setSelectedType("all")}
              >
                All
              </button>
              <For each={MEMORY_TYPES}>
                {(mt) => (
                  <button
                    class={`btn ${selectedType() === mt.type ? "btn-primary" : "btn-secondary"}`}
                    style={{ "font-size": "0.75rem", padding: "2px 8px" }}
                    onClick={() => setSelectedType(mt.type)}
                  >
                    {mt.label.replace(" Memory", "")}
                  </button>
                )}
              </For>
            </div>
          </div>

          <Show
            when={filteredMemories().length > 0}
            fallback={
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                  <line x1="9" y1="21" x2="15" y2="21" />
                </svg>
                <p>No memory entries for this filter</p>
              </div>
            }
          >
            <For each={filteredMemories()}>
              {(mem) => (
                <div style={{
                  display: "flex",
                  "justify-content": "space-between",
                  "align-items": "center",
                  background: "var(--bg-input)",
                  padding: "var(--sp-3)",
                  "border-radius": "var(--radius)",
                  "margin-bottom": "var(--sp-2)",
                  border: "1px solid var(--border)",
                  opacity: mem.enabled ? "1" : "0.5",
                }}>
                  <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-3)" }}>
                    <span style={{ width: "6px", height: "6px", "border-radius": "50%", background: typeColor(mem.type), "flex-shrink": "0" }} />
                    <div>
                      <strong style={{ "font-size": "0.85rem" }}>{mem.title}</strong>
                      <p class="text-dim" style={{ "font-size": "0.8rem", margin: "0" }}>{mem.description}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--sp-1)", "flex-shrink": "0" }}>
                    <button
                      class={`toggle ${mem.enabled ? "active" : ""}`}
                      onClick={() => toggleMemory(mem.id)}
                    >
                      {mem.enabled ? "On" : "Off"}
                    </button>
                    <button
                      class="btn btn-ghost"
                      style={{ padding: "2px 8px", "font-size": "0.75rem", color: "var(--error)" }}
                      onClick={() => removeMemory(mem.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>

        {/* File Structure Reference */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            File Structure
          </h2>
          <pre class="font-mono text-dim" style={{
            "font-size": "0.8rem",
            background: "var(--bg-input)",
            padding: "var(--sp-3)",
            "border-radius": "var(--radius)",
            "white-space": "pre-wrap",
          }}>
{`.claude/
  memory/
    MEMORY.md          # Memory index (auto-generated)
    user_*.md          # User preferences
    feedback_*.md      # Corrections & feedback
    project_*.md       # Project-specific context
    reference_*.md     # External references & docs`}
          </pre>
        </div>
      </div>
    </div>
  );
}

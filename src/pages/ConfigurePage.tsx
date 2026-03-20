import { createSignal, For, Show } from "solid-js";
import { configStore } from "../stores/config.store";

type Tab = "settings" | "mcp" | "hooks" | "core-files";

export function ConfigurePage() {
  const [activeTab, setActiveTab] = createSignal<Tab>("settings");

  const tabs: { id: Tab; label: string }[] = [
    { id: "settings", label: "Settings" },
    { id: "mcp", label: "MCP Servers" },
    { id: "hooks", label: "Hooks" },
    { id: "core-files", label: "Core Files" },
  ];

  return (
    <div class="content-body">
      <div class="content-scroll">
        <div class="card">
          <h2 class="card-title">Configuration</h2>

          {/* Tab navigation */}
          <div style={{
            display: "flex",
            gap: "var(--sp-1)",
            "margin-bottom": "var(--sp-4)",
            "border-bottom": "1px solid var(--border)",
            "padding-bottom": "var(--sp-2)",
          }}>
            <For each={tabs}>
              {(tab) => (
                <button
                  class={`btn ${activeTab() === tab.id ? "btn-primary" : "btn-ghost"}`}
                  style={{ "font-size": "0.8rem" }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              )}
            </For>
          </div>

          {/* Settings tab */}
          <Show when={activeTab() === "settings"}>
            <div>
              <h3 style={{ "font-family": "var(--font-heading)", "font-size": "0.95rem", "margin-bottom": "var(--sp-3)" }}>
                Claude Code Permissions
              </h3>
              <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-3)" }}>
                Configure which tools are allowed in settings.local.json
              </p>
              <div style={{ display: "flex", "flex-direction": "column", gap: "var(--sp-2)" }}>
                <For each={configStore.settings().permissions}>
                  {(perm, index) => (
                    <div class="config-item" style={{
                      display: "flex",
                      "justify-content": "space-between",
                      "align-items": "center",
                      padding: "var(--sp-2) var(--sp-3)",
                      background: "var(--bg-input)",
                      "border-radius": "var(--radius-sm)",
                    }}>
                      <code class="font-mono" style={{ "font-size": "0.8rem" }}>{perm}</code>
                      <button
                        class="btn btn-ghost"
                        style={{ padding: "2px 6px", "font-size": "0.7rem" }}
                        onClick={() => {
                          const perms = [...configStore.settings().permissions];
                          perms.splice(index(), 1);
                          configStore.setSettings({ ...configStore.settings(), permissions: perms });
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* MCP Servers tab */}
          <Show when={activeTab() === "mcp"}>
            <div>
              <h3 style={{ "font-family": "var(--font-heading)", "font-size": "0.95rem", "margin-bottom": "var(--sp-3)" }}>
                MCP Servers
              </h3>
              <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-3)" }}>
                Configure Model Context Protocol servers for your workspace
              </p>
              <Show
                when={configStore.mcpServers().length > 0}
                fallback={
                  <div class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                      <line x1="6" y1="6" x2="6.01" y2="6" />
                      <line x1="6" y1="18" x2="6.01" y2="18" />
                    </svg>
                    <p>No MCP servers configured</p>
                    <small>MCP server configuration coming soon</small>
                  </div>
                }
              >
                <For each={configStore.mcpServers()}>
                  {(server) => (
                    <div class="config-item" style={{
                      display: "flex",
                      "justify-content": "space-between",
                      "align-items": "center",
                      padding: "var(--sp-2) var(--sp-3)",
                      background: "var(--bg-input)",
                      "border-radius": "var(--radius-sm)",
                      "margin-bottom": "var(--sp-2)",
                    }}>
                      <div>
                        <strong style={{ "font-size": "0.85rem" }}>{server.name}</strong>
                        <small class="text-dim" style={{ display: "block" }}>{server.description}</small>
                      </div>
                      <button
                        class={`toggle ${server.enabled ? "active" : ""}`}
                        onClick={() => configStore.toggleMcpServer(server.id)}
                        style={{
                          padding: "4px 10px",
                          "border-radius": "var(--radius-full)",
                          border: "1px solid var(--border)",
                          background: server.enabled ? "var(--accent)" : "transparent",
                          color: server.enabled ? "#fff" : "var(--text-dim)",
                          cursor: "pointer",
                          "font-size": "0.75rem",
                        }}
                      >
                        {server.enabled ? "On" : "Off"}
                      </button>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </Show>

          {/* Hooks tab */}
          <Show when={activeTab() === "hooks"}>
            <div>
              <h3 style={{ "font-family": "var(--font-heading)", "font-size": "0.95rem", "margin-bottom": "var(--sp-3)" }}>
                Hooks
              </h3>
              <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-3)" }}>
                Configure lifecycle hooks for Claude Code sessions
              </p>
              <Show
                when={configStore.hooks().length > 0}
                fallback={
                  <div class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <p>No hooks configured</p>
                    <small>Hook configuration coming soon</small>
                  </div>
                }
              >
                <For each={configStore.hooks()}>
                  {(hook) => (
                    <div class="config-item" style={{
                      display: "flex",
                      "justify-content": "space-between",
                      "align-items": "center",
                      padding: "var(--sp-2) var(--sp-3)",
                      background: "var(--bg-input)",
                      "border-radius": "var(--radius-sm)",
                      "margin-bottom": "var(--sp-2)",
                    }}>
                      <div>
                        <strong style={{ "font-size": "0.85rem" }}>{hook.event}</strong>
                        <code class="font-mono text-dim" style={{ display: "block", "font-size": "0.75rem" }}>{hook.command}</code>
                      </div>
                      <button
                        class="btn btn-ghost"
                        style={{ padding: "2px 6px" }}
                        onClick={() => configStore.removeHook(hook.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </Show>

          {/* Core Files tab */}
          <Show when={activeTab() === "core-files"}>
            <div>
              <h3 style={{ "font-family": "var(--font-heading)", "font-size": "0.95rem", "margin-bottom": "var(--sp-3)" }}>
                Core Files
              </h3>
              <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-3)" }}>
                Toggle which core files to generate in your workspace
              </p>
              <div style={{ display: "flex", "flex-direction": "column", gap: "var(--sp-2)" }}>
                <For each={configStore.coreFiles()}>
                  {(file) => (
                    <div class="config-item" style={{
                      display: "flex",
                      "justify-content": "space-between",
                      "align-items": "center",
                      padding: "var(--sp-2) var(--sp-3)",
                      background: "var(--bg-input)",
                      "border-radius": "var(--radius-sm)",
                    }}>
                      <div>
                        <strong style={{ "font-size": "0.85rem" }}>{file.name}</strong>
                        <small class="text-dim" style={{ display: "block" }}>{file.description}</small>
                      </div>
                      <button
                        class={`toggle ${file.enabled ? "active" : ""}`}
                        onClick={() => configStore.toggleCoreFile(file.id)}
                        style={{
                          padding: "4px 10px",
                          "border-radius": "var(--radius-full)",
                          border: "1px solid var(--border)",
                          background: file.enabled ? "var(--accent)" : "transparent",
                          color: file.enabled ? "#fff" : "var(--text-dim)",
                          cursor: "pointer",
                          "font-size": "0.75rem",
                        }}
                      >
                        {file.enabled ? "On" : "Off"}
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

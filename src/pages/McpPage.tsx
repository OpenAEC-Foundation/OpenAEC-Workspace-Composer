import { createSignal, Show } from "solid-js";
import { configStore } from "../stores/config.store";
import { workspaceStore } from "../stores/workspace.store";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function McpPage() {
  const [saveStatus, setSaveStatus] = createSignal<SaveStatus>("idle");
  const [saveError, setSaveError] = createSignal("");

  function buildMcpJson(): string | null {
    const servers = configStore.mcpServers();
    if (servers.length === 0) return null;
    const mcpConfig: Record<string, Record<string, unknown>> = { mcpServers: {} };
    for (const s of servers) {
      const entry: Record<string, unknown> = { type: s.type };
      if (s.command) entry.command = s.command;
      if (s.args) entry.args = s.args;
      if (s.url) entry.url = s.url;
      const envEntries = Object.entries(s.envVars || {}).filter(([, v]) => v.trim() !== "");
      if (envEntries.length > 0) entry.env = Object.fromEntries(envEntries);
      mcpConfig.mcpServers[s.id] = entry;
    }
    return JSON.stringify(mcpConfig, null, 2);
  }

  async function handleSave() {
    setSaveStatus("saving");
    setSaveError("");
    const wsPath = workspaceStore.workspacePath();
    if (!wsPath) {
      setSaveStatus("error");
      setSaveError("Set a workspace path first");
      return;
    }
    const mcpJson = buildMcpJson();
    if (!mcpJson) {
      setSaveStatus("error");
      setSaveError("No MCP servers configured to save");
      return;
    }
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("write_mcp_json", { path: wsPath, config: JSON.parse(mcpJson) });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      setSaveStatus("error");
      const msg = String(e);
      if (msg.includes("not a function") || msg.includes("window.__TAURI")) {
        setSaveError("Save only works in desktop app");
      } else {
        setSaveError(e instanceof Error ? e.message : msg);
      }
    }
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        <div class="card">
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
            </svg>
            MCP Servers
          </h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Model Context Protocol servers extend Claude with external tools. Configuration goes in <code class="font-mono">.mcp.json</code>.
          </p>

          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
            </svg>
            <p>No MCP servers configured</p>
            <small>Add servers for GitHub, databases, APIs and more</small>
          </div>

          <button class="btn btn-primary" style={{ "margin-top": "var(--sp-3)", width: "100%" }}>
            + Add MCP Server
          </button>
        </div>

        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Server Types</h2>
          <div style={{ "font-size": "0.85rem" }}>
            <div style={{ padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong>stdio</strong>
              <p class="text-dim">Local process. Runs a command on your machine</p>
            </div>
            <div style={{ padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong>http</strong>
              <p class="text-dim">Remote HTTP server. Connects to a URL</p>
            </div>
            <div style={{ padding: "var(--sp-2) 0" }}>
              <strong>sse</strong>
              <p class="text-dim">Server-Sent Events. Streaming connection</p>
            </div>
          </div>
        </div>

        {/* Save to workspace */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Save MCP Config</h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Write MCP server configuration to <code class="font-mono">.mcp.json</code> in your workspace.
          </p>
          <button
            class={saveStatus() === "saved" ? "btn btn-success" : saveStatus() === "error" ? "btn btn-ghost" : "btn btn-primary"}
            disabled={saveStatus() === "saving"}
            style={{ width: "100%" }}
            onClick={handleSave}
          >
            {saveStatus() === "saving" ? "Saving..." : saveStatus() === "saved" ? "Saved!" : saveStatus() === "error" ? "Error" : "Save to workspace"}
          </button>
          <Show when={saveStatus() === "error" && saveError()}>
            <p style={{ color: "var(--error)", "font-size": "0.75rem", "margin-top": "var(--sp-1)" }}>
              {saveError()}
            </p>
          </Show>
          <Show when={saveStatus() === "saved"}>
            <p style={{ color: "var(--success)", "font-size": "0.75rem", "margin-top": "var(--sp-1)" }}>
              MCP config written to .mcp.json
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}

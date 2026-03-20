import { createSignal, For, Show, createMemo } from "solid-js";
import { configStore } from "../stores/config.store";
import { settingsSchema, defaultPermissions } from "../lib/claude-settings-schema";
import { mcpServerTemplates, mcpCategoryLabels, type McpServerTemplate } from "../lib/mcp-servers";
import { hookTemplates } from "../lib/hooks-templates";

type ConfigTab = "settings" | "mcp" | "hooks" | "core-files";

export function ConfigurePage() {
  const [activeTab, setActiveTab] = createSignal<ConfigTab>("settings");

  const tabs: { id: ConfigTab; label: string }[] = [
    { id: "settings", label: "Permissions" },
    { id: "mcp", label: "MCP Servers" },
    { id: "hooks", label: "Hooks" },
    { id: "core-files", label: "Core Files" },
  ];

  return (
    <div class="page">
      <div class="page-header">
        <h1>Configure Workspace</h1>
        <p>Set up Claude Code settings, MCP servers, hooks, and core files for your workspace.</p>
      </div>

      <div class="config-tabs">
        <For each={tabs}>
          {(tab) => (
            <button
              class={`config-tab ${activeTab() === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>

      <div class="config-section">
        <Show when={activeTab() === "settings"}>
          <SettingsTab />
        </Show>
        <Show when={activeTab() === "mcp"}>
          <McpTab />
        </Show>
        <Show when={activeTab() === "hooks"}>
          <HooksTab />
        </Show>
        <Show when={activeTab() === "core-files"}>
          <CoreFilesTab />
        </Show>
      </div>
    </div>
  );
}

function SettingsTab() {
  const permissions = createMemo(() => configStore.settings().permissions);

  function togglePermission(key: string) {
    const current = configStore.settings();
    const perms = current.permissions.includes(key)
      ? current.permissions.filter(p => p !== key)
      : [...current.permissions, key];
    configStore.setSettings({ ...current, permissions: perms });
  }

  return (
    <div>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--sp-4)" }}>
        <h3>Permission Rules</h3>
        <button class="btn btn-ghost" onClick={() => {
          configStore.setSettings({ ...configStore.settings(), permissions: [...defaultPermissions] });
        }}>
          Reset to defaults
        </button>
      </div>
      <For each={settingsSchema.filter(s => s.category === "permissions")}>
        {(setting) => (
          <div class="config-item">
            <div>
              <strong>{setting.label}</strong>
              <small>{setting.description}</small>
            </div>
            <button
              class={`toggle ${permissions().includes(setting.key) ? "active" : ""}`}
              onClick={() => togglePermission(setting.key)}
            >
              {permissions().includes(setting.key) ? "Allow" : "Deny"}
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

function McpTab() {
  const grouped = createMemo(() => {
    const groups: Record<string, McpServerTemplate[]> = {};
    for (const server of mcpServerTemplates) {
      if (!groups[server.category]) groups[server.category] = [];
      groups[server.category].push(server);
    }
    return groups;
  });

  const enabledIds = createMemo(() => configStore.mcpServers().map(s => s.id));

  function toggleServer(template: McpServerTemplate) {
    if (enabledIds().includes(template.id)) {
      configStore.removeMcpServer(template.id);
    } else {
      configStore.addMcpServer({
        id: template.id,
        name: template.name,
        description: template.description,
        enabled: true,
        type: template.type,
        command: template.command,
        args: template.args,
        url: template.url,
      });
    }
  }

  return (
    <div>
      <p class="text-dim" style={{ "margin-bottom": "var(--sp-4)", "font-size": "0.8125rem" }}>
        Select MCP servers to configure in your workspace. Environment variables can be set after installation.
      </p>
      <For each={Object.entries(grouped())}>
        {([category, servers]) => (
          <div style={{ "margin-bottom": "var(--sp-5)" }}>
            <h3 class="category-label" style={{ "margin-bottom": "var(--sp-2)" }}>
              {mcpCategoryLabels[category] || category}
            </h3>
            <For each={servers}>
              {(server) => (
                <div class="config-item">
                  <div>
                    <strong>{server.name}</strong>
                    <small>{server.description}</small>
                    <Show when={server.envVars && server.envVars.length > 0}>
                      <small style={{ color: "var(--warm-gold)" }}>
                        Requires: {server.envVars!.map(v => v.key).join(", ")}
                      </small>
                    </Show>
                  </div>
                  <button
                    class={`toggle ${enabledIds().includes(server.id) ? "active" : ""}`}
                    onClick={() => toggleServer(server)}
                  >
                    {enabledIds().includes(server.id) ? "On" : "Off"}
                  </button>
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}

function HooksTab() {
  const activeHookIds = createMemo(() => configStore.hooks().map(h => h.id));

  function toggleHook(template: typeof hookTemplates[0]) {
    if (activeHookIds().includes(template.id)) {
      configStore.removeHook(template.id);
    } else {
      configStore.addHook({
        id: template.id,
        event: template.event as any,
        type: "command",
        matcher: template.matcher,
        command: template.command,
      });
    }
  }

  return (
    <div>
      <p class="text-dim" style={{ "margin-bottom": "var(--sp-4)", "font-size": "0.8125rem" }}>
        Hooks run automatically in response to Claude Code events. Select templates to include.
      </p>
      <For each={hookTemplates}>
        {(template) => (
          <div class="config-item">
            <div>
              <strong>{template.name}</strong>
              <small>{template.description}</small>
              <small style={{ color: "var(--accent)" }}>
                {template.event}{template.matcher ? ` (${template.matcher})` : ""}
              </small>
            </div>
            <button
              class={`toggle ${activeHookIds().includes(template.id) ? "active" : ""}`}
              onClick={() => toggleHook(template)}
            >
              {activeHookIds().includes(template.id) ? "On" : "Off"}
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

function CoreFilesTab() {
  return (
    <div>
      <p class="text-dim" style={{ "margin-bottom": "var(--sp-4)", "font-size": "0.8125rem" }}>
        Select which core documentation files to generate in your workspace.
      </p>
      <For each={configStore.coreFiles()}>
        {(file) => (
          <div class="config-item">
            <div>
              <strong>{file.name}</strong>
              <small>{file.description}</small>
            </div>
            <button
              class={`toggle ${file.enabled ? "active" : ""}`}
              onClick={() => configStore.toggleCoreFile(file.id)}
            >
              {file.enabled ? "On" : "Off"}
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

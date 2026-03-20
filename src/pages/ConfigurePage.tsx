import { createSignal, For, Show, createMemo } from "solid-js";
import { configStore, type Hook } from "../stores/config.store";
import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import { settingsSchema, defaultPermissions } from "../lib/claude-settings-schema";
import { mcpServerTemplates, mcpCategoryLabels, type McpServerTemplate } from "../lib/mcp-servers";
import { hookTemplates } from "../lib/hooks-templates";

type ConfigTab = "claude-md" | "settings" | "mcp" | "hooks" | "core-files";

// Protocol definitions
const PROTOCOLS = [
  { id: "P-001", label: "Verify before destructive operations" },
  { id: "P-002", label: "Read files before modifying" },
  { id: "P-003", label: "Use dedicated tools over Bash" },
  { id: "P-004", label: "Progressive disclosure in responses" },
  { id: "P-005", label: "Save PROMPTS.md per session" },
];

// Permission presets
const PERMISSION_PRESETS = {
  minimal: { label: "Minimal", permissions: ["Read", "Glob", "Grep"] },
  standard: { label: "Standard", permissions: [...defaultPermissions] },
  full: {
    label: "Full Access",
    permissions: settingsSchema.filter((s) => s.category === "permissions").map((s) => s.key),
  },
};

export function ConfigurePage() {
  const [activeTab, setActiveTab] = createSignal<ConfigTab>("claude-md");

  const tabs: { id: ConfigTab; label: string }[] = [
    { id: "claude-md", label: "CLAUDE.md" },
    { id: "settings", label: "Permissions" },
    { id: "mcp", label: "MCP Servers" },
    { id: "hooks", label: "Hooks" },
    { id: "core-files", label: "Core Files" },
  ];

  return (
    <div class="page">
      <div class="page-header">
        <h1>Configure Workspace</h1>
        <p>
          Build your Claude Code configuration: CLAUDE.md, permissions, MCP
          servers, hooks, and core files.
        </p>
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
        <Show when={activeTab() === "claude-md"}>
          <ClaudeMdTab />
        </Show>
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

/* ================================================================
   Tab 1: CLAUDE.md Builder
   ================================================================ */
function ClaudeMdTab() {
  const sections = () => configStore.claudeMdSections();

  // Auto-populate stack from selected packages
  const stackTags = createMemo(() => {
    const pkgs = packagesStore.selectedPackageObjects();
    const tags = new Set<string>();
    for (const pkg of pkgs) {
      for (const tag of pkg.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags);
  });

  // Generate CLAUDE.md preview
  const claudeMdPreview = createMemo(() => {
    const s = sections();
    const lines: string[] = [];

    // Identity
    const name = s.projectName || workspaceStore.projectName() || "My Project";
    lines.push(`# ${name}`);
    if (s.projectDescription) {
      lines.push("", s.projectDescription);
    }
    if (s.teamOrg) {
      lines.push("", `**Team/Org:** ${s.teamOrg}`);
    }

    // Stack
    const tags = stackTags();
    if (tags.length > 0) {
      lines.push("", "## Stack", "", tags.join(", "));
    }

    // Conventions
    lines.push("", "## Conventions");
    const docLang = s.docLanguage === "nl" ? "Nederlands" : "English";
    lines.push(`- Documentation language: ${docLang}`);
    lines.push(`- Code language: English`);
    if (s.conventionalCommits) {
      lines.push(
        "- Commit style: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)"
      );
    }
    if (s.customConventions.trim()) {
      lines.push("", s.customConventions.trim());
    }

    // Protocols
    const enabledProtocols = PROTOCOLS.filter((p) =>
      s.protocols.includes(p.id)
    );
    if (enabledProtocols.length > 0 || s.customProtocol.trim()) {
      lines.push("", "## Protocols");
      for (const p of enabledProtocols) {
        lines.push(`- **${p.id}**: ${p.label}`);
      }
      if (s.customProtocol.trim()) {
        lines.push(`- **Custom**: ${s.customProtocol.trim()}`);
      }
    }

    // Installed packages
    const pkgs = packagesStore.selectedPackageObjects();
    if (pkgs.length > 0) {
      lines.push("", "## Installed Packages");
      for (const pkg of pkgs) {
        lines.push(`- **${pkg.name}** \u2014 ${pkg.description}`);
      }
    }

    return lines.join("\n");
  });

  return (
    <div class="config-editor">
      <div class="config-form">
        {/* Project Identity */}
        <div class="config-group">
          <h3>Project Identity</h3>
          <div class="form-group">
            <label>Project Name</label>
            <input
              type="text"
              value={sections().projectName || workspaceStore.projectName()}
              placeholder="e.g. OpenAEC Workspace Composer"
              onInput={(e) =>
                configStore.updateClaudeMdSection(
                  "projectName",
                  e.currentTarget.value
                )
              }
            />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea
              value={sections().projectDescription}
              placeholder="Brief project description for Claude's context..."
              onInput={(e) =>
                configStore.updateClaudeMdSection(
                  "projectDescription",
                  e.currentTarget.value
                )
              }
            />
          </div>
          <div class="form-group">
            <label>Team / Organization</label>
            <input
              type="text"
              value={sections().teamOrg}
              placeholder="e.g. OpenAEC Foundation"
              onInput={(e) =>
                configStore.updateClaudeMdSection(
                  "teamOrg",
                  e.currentTarget.value
                )
              }
            />
          </div>
        </div>

        {/* Stack */}
        <div class="config-group">
          <h3>Stack</h3>
          <p>Auto-populated from selected packages. Add more in the Packages tab.</p>
          <div class="tag-list">
            <For each={stackTags()}>
              {(tag) => <span class="hook-event-badge">{tag}</span>}
            </For>
            <Show when={stackTags().length === 0}>
              <span class="text-dim" style={{ "font-size": "0.8rem" }}>
                No packages selected yet.
              </span>
            </Show>
          </div>
        </div>

        {/* Conventions */}
        <div class="config-group">
          <h3>Conventions</h3>
          <div class="form-row" style={{ "margin-bottom": "var(--sp-3)" }}>
            <div class="form-group">
              <label>Documentation Language</label>
              <select
                class="form-input"
                value={sections().docLanguage}
                onChange={(e) =>
                  configStore.updateClaudeMdSection(
                    "docLanguage",
                    e.currentTarget.value as "nl" | "en"
                  )
                }
              >
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
              </select>
            </div>
            <div class="form-group">
              <label>Code Language</label>
              <select class="form-input" disabled>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div class="config-item">
            <div>
              <strong>Conventional Commits</strong>
              <small>
                feat:, fix:, docs:, refactor:, test:, chore:
              </small>
            </div>
            <button
              class={`toggle ${sections().conventionalCommits ? "active" : ""}`}
              onClick={() =>
                configStore.updateClaudeMdSection(
                  "conventionalCommits",
                  !sections().conventionalCommits
                )
              }
            >
              {sections().conventionalCommits ? "On" : "Off"}
            </button>
          </div>
          <div class="form-group" style={{ "margin-top": "var(--sp-3)" }}>
            <label>Custom Conventions</label>
            <textarea
              class="form-input"
              value={sections().customConventions}
              placeholder="Additional conventions (one per line)..."
              onInput={(e) =>
                configStore.updateClaudeMdSection(
                  "customConventions",
                  e.currentTarget.value
                )
              }
            />
          </div>
        </div>

        {/* Protocols */}
        <div class="config-group">
          <h3>Protocols</h3>
          <p>Toggle standard protocols for Claude Code behavior.</p>
          <For each={PROTOCOLS}>
            {(protocol) => (
              <div class="protocol-item">
                <span class="protocol-id">{protocol.id}</span>
                <span class="protocol-desc">{protocol.label}</span>
                <button
                  class={`toggle ${sections().protocols.includes(protocol.id) ? "active" : ""}`}
                  onClick={() => {
                    const current = sections().protocols;
                    const next = current.includes(protocol.id)
                      ? current.filter((p) => p !== protocol.id)
                      : [...current, protocol.id];
                    configStore.updateClaudeMdSection("protocols", next);
                  }}
                >
                  {sections().protocols.includes(protocol.id) ? "On" : "Off"}
                </button>
              </div>
            )}
          </For>
          <div class="form-group" style={{ "margin-top": "var(--sp-3)" }}>
            <label>Custom Protocol</label>
            <input
              type="text"
              value={sections().customProtocol}
              placeholder="e.g. Always run tests before committing"
              onInput={(e) =>
                configStore.updateClaudeMdSection(
                  "customProtocol",
                  e.currentTarget.value
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div class="config-preview">
        <div class="config-preview-header">
          <h4>CLAUDE.md Preview</h4>
          <span class="text-dim" style={{ "font-size": "0.7rem" }}>
            Live
          </span>
        </div>
        {claudeMdPreview()}
      </div>
    </div>
  );
}

/* ================================================================
   Tab 2: Permissions
   ================================================================ */
function SettingsTab() {
  const [customInput, setCustomInput] = createSignal("");
  const permissions = createMemo(() => configStore.settings().permissions);
  const customPermissions = createMemo(
    () => configStore.settings().customPermissions
  );

  // Group permissions by subcategory
  const bashPermissions = createMemo(() =>
    settingsSchema.filter(
      (s) => s.category === "permissions" && s.key.startsWith("Bash(")
    )
  );
  const toolPermissions = createMemo(() =>
    settingsSchema.filter(
      (s) => s.category === "permissions" && !s.key.startsWith("Bash(")
    )
  );

  function togglePermission(key: string) {
    const current = configStore.settings();
    const perms = current.permissions.includes(key)
      ? current.permissions.filter((p) => p !== key)
      : [...current.permissions, key];
    configStore.setSettings({ ...current, permissions: perms });
  }

  function applyPreset(presetKey: keyof typeof PERMISSION_PRESETS) {
    const preset = PERMISSION_PRESETS[presetKey];
    configStore.setSettings({
      ...configStore.settings(),
      permissions: [...preset.permissions],
    });
  }

  function addCustomPermission() {
    const val = customInput().trim();
    if (val && !customPermissions().includes(val)) {
      configStore.addCustomPermission(val);
      setCustomInput("");
    }
  }

  // Generate settings.json preview
  const settingsPreview = createMemo(() => {
    const allPerms = [...permissions(), ...customPermissions()];
    const obj = { permissions: { allow: allPerms } };
    return JSON.stringify(obj, null, 2);
  });

  return (
    <div class="config-editor">
      <div class="config-form">
        {/* Quick presets */}
        <div class="config-group">
          <h3>Quick Presets</h3>
          <div class="preset-row">
            <button class="preset-btn" onClick={() => applyPreset("minimal")}>
              Minimal
            </button>
            <button class="preset-btn" onClick={() => applyPreset("standard")}>
              Standard
            </button>
            <button class="preset-btn" onClick={() => applyPreset("full")}>
              Full Access
            </button>
            <button
              class="btn btn-ghost"
              style={{ "margin-left": "auto" }}
              onClick={() =>
                configStore.setSettings({
                  ...configStore.settings(),
                  permissions: [...defaultPermissions],
                })
              }
            >
              Reset to defaults
            </button>
          </div>
        </div>

        {/* Bash Commands */}
        <div class="config-group">
          <h3>Bash Commands</h3>
          <For each={bashPermissions()}>
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

        {/* Tool Permissions */}
        <div class="config-group">
          <h3>Tool Permissions</h3>
          <For each={toolPermissions()}>
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

        {/* Custom Permissions */}
        <div class="config-group">
          <h3>Custom Permission Rules</h3>
          <p>Add custom permission rules like Bash(python:*) or mcp__server__tool</p>
          <div class="input-with-button">
            <input
              type="text"
              class="form-input"
              value={customInput()}
              placeholder='e.g. Bash(python:*)'
              onInput={(e) => setCustomInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustomPermission();
              }}
            />
            <button class="btn btn-secondary" onClick={addCustomPermission}>
              Add
            </button>
          </div>
          <Show when={customPermissions().length > 0}>
            <div style={{ "margin-top": "var(--sp-2)" }}>
              <For each={customPermissions()}>
                {(perm) => (
                  <div class="config-item">
                    <div>
                      <strong>{perm}</strong>
                      <small>Custom rule</small>
                    </div>
                    <button
                      class="toggle active"
                      onClick={() => configStore.removeCustomPermission(perm)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* Preview */}
      <div class="config-preview">
        <div class="config-preview-header">
          <h4>.claude/settings.json</h4>
          <span class="text-dim" style={{ "font-size": "0.7rem" }}>
            Preview
          </span>
        </div>
        {settingsPreview()}
      </div>
    </div>
  );
}

/* ================================================================
   Tab 3: MCP Servers
   ================================================================ */
function McpTab() {
  const grouped = createMemo(() => {
    const groups: Record<string, McpServerTemplate[]> = {};
    for (const server of mcpServerTemplates) {
      if (!groups[server.category]) groups[server.category] = [];
      groups[server.category].push(server);
    }
    return groups;
  });

  const enabledIds = createMemo(() => configStore.mcpServers().map((s) => s.id));

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
        envVars: {},
      });
    }
  }

  function getServerConfig(id: string) {
    return configStore.mcpServers().find((s) => s.id === id);
  }

  // Generate .mcp.json preview
  const mcpJsonPreview = createMemo(() => {
    const servers = configStore.mcpServers();
    if (servers.length === 0) return "// No MCP servers configured";

    const mcpConfig: Record<string, Record<string, unknown>> = { mcpServers: {} };
    for (const s of servers) {
      const entry: Record<string, unknown> = { type: s.type };
      if (s.command) entry.command = s.command;
      if (s.args) entry.args = s.args;
      if (s.url) entry.url = s.url;

      // Merge env from template and user-provided envVars
      const envEntries = Object.entries(s.envVars || {}).filter(
        ([, v]) => v.trim() !== ""
      );
      if (envEntries.length > 0) {
        entry.env = Object.fromEntries(envEntries);
      }

      mcpConfig.mcpServers[s.id] = entry;
    }
    return JSON.stringify(mcpConfig, null, 2);
  });

  return (
    <div class="config-editor">
      <div class="config-form">
        <p
          class="text-dim"
          style={{ "margin-bottom": "var(--sp-4)", "font-size": "0.8125rem" }}
        >
          Select MCP servers and configure their environment variables.
        </p>
        <For each={Object.entries(grouped())}>
          {([category, servers]) => (
            <div class="config-group">
              <h3>{mcpCategoryLabels[category] || category}</h3>
              <For each={servers}>
                {(server) => {
                  const isEnabled = () => enabledIds().includes(server.id);
                  const serverConfig = () => getServerConfig(server.id);
                  const template = mcpServerTemplates.find(
                    (t) => t.id === server.id
                  );

                  return (
                    <div>
                      <div class="config-item">
                        <div>
                          <strong>{server.name}</strong>
                          <small>{server.description}</small>
                          <Show
                            when={
                              server.envVars && server.envVars.length > 0
                            }
                          >
                            <small style={{ color: "var(--warm-gold)" }}>
                              Requires:{" "}
                              {server.envVars!.map((v) => v.key).join(", ")}
                            </small>
                          </Show>
                        </div>
                        <button
                          class={`toggle ${isEnabled() ? "active" : ""}`}
                          onClick={() => toggleServer(server)}
                        >
                          {isEnabled() ? "On" : "Off"}
                        </button>
                      </div>
                      {/* Env var inputs when enabled */}
                      <Show
                        when={
                          isEnabled() &&
                          template?.envVars &&
                          template.envVars.length > 0
                        }
                      >
                        <div
                          style={{
                            "margin-left": "var(--sp-4)",
                            "margin-bottom": "var(--sp-3)",
                          }}
                        >
                          <For each={template!.envVars!}>
                            {(envVar) => (
                              <div class="env-var-input">
                                <label>
                                  {envVar.key}
                                  {envVar.required ? " *" : ""}
                                </label>
                                <input
                                  type="text"
                                  class="form-input"
                                  value={
                                    serverConfig()?.envVars?.[envVar.key] || ""
                                  }
                                  placeholder={envVar.label}
                                  onInput={(e) =>
                                    configStore.updateMcpServerEnvVar(
                                      server.id,
                                      envVar.key,
                                      e.currentTarget.value
                                    )
                                  }
                                />
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </div>

      {/* Preview */}
      <div class="config-preview">
        <div class="config-preview-header">
          <h4>.mcp.json</h4>
          <span class="text-dim" style={{ "font-size": "0.7rem" }}>
            Preview
          </span>
        </div>
        {mcpJsonPreview()}
      </div>
    </div>
  );
}

/* ================================================================
   Tab 4: Hooks Builder
   ================================================================ */
type HookEvent = Hook["event"];

const HOOK_EVENTS: { value: HookEvent; label: string }[] = [
  { value: "PreToolUse", label: "PreToolUse" },
  { value: "PostToolUse", label: "PostToolUse" },
  { value: "Stop", label: "Stop" },
  { value: "SessionStart", label: "SessionStart" },
  { value: "SessionEnd", label: "SessionEnd" },
  { value: "UserPromptSubmit", label: "UserPromptSubmit" },
];

function HooksTab() {
  const [showForm, setShowForm] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);

  // Form state (local, not in store until saved)
  const [formEvent, setFormEvent] = createSignal<HookEvent>("PostToolUse");
  const [formType, setFormType] = createSignal<"command" | "intercept">("command");
  const [formMatcher, setFormMatcher] = createSignal("");
  const [formCommand, setFormCommand] = createSignal("");

  function resetForm() {
    setFormEvent("PostToolUse");
    setFormType("command");
    setFormMatcher("");
    setFormCommand("");
    setEditingId(null);
    setShowForm(false);
  }

  function saveHook() {
    const cmd = formCommand().trim();
    if (!cmd) return;

    const id = editingId() || `hook-${Date.now()}`;

    if (editingId()) {
      configStore.updateHook(id, {
        event: formEvent(),
        type: formType(),
        matcher: formMatcher().trim() || undefined,
        command: cmd,
      });
    } else {
      configStore.addHook({
        id,
        event: formEvent(),
        type: formType(),
        matcher: formMatcher().trim() || undefined,
        command: cmd,
        enabled: true,
      });
    }
    resetForm();
  }

  function editHook(hook: Hook) {
    setFormEvent(hook.event);
    setFormType(hook.type);
    setFormMatcher(hook.matcher || "");
    setFormCommand(hook.command);
    setEditingId(hook.id);
    setShowForm(true);
  }

  function addFromTemplate(template: (typeof hookTemplates)[0]) {
    if (configStore.hooks().some((h) => h.id === template.id)) return;
    configStore.addHook({
      id: template.id,
      event: template.event as HookEvent,
      type: "command",
      matcher: template.matcher,
      command: template.command,
      enabled: true,
    });
  }

  // Generate hooks JSON preview
  const hooksPreview = createMemo(() => {
    const hks = configStore.hooks().filter((h) => h.enabled);
    if (hks.length === 0) return "// No hooks configured";

    const config: Record<string, unknown[]> = {};
    for (const h of hks) {
      const eventKey = h.event;
      if (!config[eventKey]) config[eventKey] = [];
      const entry: Record<string, unknown> = { type: h.type, command: h.command };
      if (h.matcher) entry.matcher = h.matcher;
      config[eventKey].push(entry);
    }
    return JSON.stringify({ hooks: config }, null, 2);
  });

  return (
    <div class="config-editor">
      <div class="config-form">
        <div
          style={{
            display: "flex",
            "justify-content": "space-between",
            "align-items": "center",
            "margin-bottom": "var(--sp-4)",
          }}
        >
          <h3 style={{ margin: "0" }}>Configured Hooks</h3>
          <button
            class="btn btn-secondary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Hook
          </button>
        </div>

        {/* Add/Edit Form */}
        <Show when={showForm()}>
          <div class="hook-form">
            <h4
              style={{
                "margin-bottom": "var(--sp-3)",
                "font-size": "0.85rem",
              }}
            >
              {editingId() ? "Edit Hook" : "New Hook"}
            </h4>
            <div class="hook-form-row">
              <div class="form-group">
                <label>Event</label>
                <select
                  class="form-input"
                  value={formEvent()}
                  onChange={(e) =>
                    setFormEvent(e.currentTarget.value as HookEvent)
                  }
                >
                  <For each={HOOK_EVENTS}>
                    {(evt) => (
                      <option value={evt.value}>{evt.label}</option>
                    )}
                  </For>
                </select>
              </div>
              <div class="form-group">
                <label>Type</label>
                <select
                  class="form-input"
                  value={formType()}
                  onChange={(e) =>
                    setFormType(
                      e.currentTarget.value as "command" | "intercept"
                    )
                  }
                >
                  <option value="command">Command</option>
                  <option value="intercept">Intercept</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>
                Matcher Pattern{" "}
                <span class="text-dim">(optional)</span>
              </label>
              <input
                type="text"
                value={formMatcher()}
                placeholder="e.g. Edit|Write or Bash"
                onInput={(e) => setFormMatcher(e.currentTarget.value)}
              />
            </div>
            <div class="form-group">
              <label>Command</label>
              <input
                type="text"
                value={formCommand()}
                placeholder='e.g. npm run lint --fix $FILE 2>/dev/null || true'
                onInput={(e) => setFormCommand(e.currentTarget.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "var(--sp-2)" }}>
              <button class="btn btn-primary" onClick={saveHook}>
                {editingId() ? "Update" : "Add"}
              </button>
              <button class="btn btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </div>
        </Show>

        {/* Configured hooks list */}
        <Show
          when={configStore.hooks().length > 0}
          fallback={
            <p
              class="text-dim"
              style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-4)" }}
            >
              No hooks configured yet. Add one above or pick a quick template
              below.
            </p>
          }
        >
          <For each={configStore.hooks()}>
            {(hook) => (
              <div
                class="hook-card"
                style={{
                  opacity: hook.enabled ? "1" : "0.5",
                }}
              >
                <div class="hook-card-header">
                  <span class="hook-event-badge">{hook.event}</span>
                  <Show when={hook.matcher}>
                    <span class="hook-matcher">{hook.matcher}</span>
                  </Show>
                  <span class="text-dim" style={{ "font-size": "0.7rem" }}>
                    {hook.type}
                  </span>
                  <div style={{ "margin-left": "auto", display: "flex", gap: "var(--sp-1)" }}>
                    <button
                      class={`toggle ${hook.enabled ? "active" : ""}`}
                      onClick={() => configStore.toggleHookEnabled(hook.id)}
                    >
                      {hook.enabled ? "On" : "Off"}
                    </button>
                    <button
                      class="btn btn-ghost"
                      style={{ padding: "2px 8px", "font-size": "0.75rem" }}
                      onClick={() => editHook(hook)}
                    >
                      Edit
                    </button>
                    <button
                      class="btn btn-ghost"
                      style={{
                        padding: "2px 8px",
                        "font-size": "0.75rem",
                        color: "var(--error)",
                      }}
                      onClick={() => configStore.removeHook(hook.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div class="hook-command">{hook.command}</div>
              </div>
            )}
          </For>
        </Show>

        {/* Quick Templates */}
        <div class="config-group" style={{ "margin-top": "var(--sp-5)" }}>
          <h3>Quick Templates</h3>
          <p>One-click add common hook patterns.</p>
          <For each={hookTemplates}>
            {(template) => {
              const isAdded = () =>
                configStore.hooks().some((h) => h.id === template.id);
              return (
                <div class="config-item">
                  <div>
                    <strong>{template.name}</strong>
                    <small>{template.description}</small>
                    <small style={{ color: "var(--accent)" }}>
                      {template.event}
                      {template.matcher ? ` (${template.matcher})` : ""}
                    </small>
                  </div>
                  <button
                    class={`toggle ${isAdded() ? "active" : ""}`}
                    onClick={() => addFromTemplate(template)}
                    disabled={isAdded()}
                  >
                    {isAdded() ? "Added" : "Add"}
                  </button>
                </div>
              );
            }}
          </For>
        </div>
      </div>

      {/* Preview */}
      <div class="config-preview">
        <div class="config-preview-header">
          <h4>.claude/settings.json hooks</h4>
          <span class="text-dim" style={{ "font-size": "0.7rem" }}>
            Preview
          </span>
        </div>
        {hooksPreview()}
      </div>
    </div>
  );
}

/* ================================================================
   Tab 5: Core Files
   ================================================================ */
function CoreFilesTab() {
  return (
    <div>
      <p
        class="text-dim"
        style={{ "margin-bottom": "var(--sp-4)", "font-size": "0.8125rem" }}
      >
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

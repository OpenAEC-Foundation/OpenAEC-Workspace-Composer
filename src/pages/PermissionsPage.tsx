import { createSignal, createMemo, For, Show } from "solid-js";
import { configStore } from "../stores/config.store";
import { workspaceStore } from "../stores/workspace.store";

// --- Permission Mode ---
type PermissionMode = "default" | "accept-edits" | "plan" | "bypass";

interface ModeOption {
  id: PermissionMode;
  label: string;
  description: string;
  icon: string;
  danger?: boolean;
}

const PERMISSION_MODES: ModeOption[] = [
  {
    id: "default",
    label: "Default",
    description: "Ask for permission on first use of each tool",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
  {
    id: "accept-edits",
    label: "Accept Edits",
    description: "Auto-accept file edits, ask for shell commands",
    icon: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  },
  {
    id: "plan",
    label: "Plan Mode",
    description: "Analysis only. No file modifications allowed",
    icon: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  },
  {
    id: "bypass",
    label: "Bypass",
    description: "Skip all permission prompts (dangerous)",
    icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    danger: true,
  },
];

// --- Allow Rules ---
interface PermissionRule {
  key: string;
  label: string;
  description: string;
  category: string;
}

const ALLOW_RULES: PermissionRule[] = [
  // Shell Commands
  { key: "Bash(npm run *)", label: "Bash(npm run *)", description: "Run npm scripts", category: "Shell Commands" },
  { key: "Bash(npx *)", label: "Bash(npx *)", description: "Run npx commands", category: "Shell Commands" },
  { key: "Bash(cargo *)", label: "Bash(cargo *)", description: "Run cargo commands", category: "Shell Commands" },
  { key: "Bash(git *)", label: "Bash(git *)", description: "Git operations", category: "Shell Commands" },
  { key: "Bash(docker *)", label: "Bash(docker *)", description: "Docker commands", category: "Shell Commands" },
  { key: "Bash(python *)", label: "Bash(python *)", description: "Python scripts", category: "Shell Commands" },
  // File Operations
  { key: "Read", label: "Read", description: "Read any file", category: "File Operations" },
  { key: "Write", label: "Write", description: "Create new files", category: "File Operations" },
  { key: "Edit", label: "Edit", description: "Modify existing files", category: "File Operations" },
  { key: "Glob", label: "Glob", description: "Search files by pattern", category: "File Operations" },
  { key: "Grep", label: "Grep", description: "Search file contents", category: "File Operations" },
  // Network
  { key: "WebFetch", label: "WebFetch", description: "Fetch URLs", category: "Network" },
  { key: "WebSearch", label: "WebSearch", description: "Search the web", category: "Network" },
  // AI
  { key: "Agent", label: "Agent", description: "Spawn sub-agents", category: "AI" },
  { key: "Skill(*)", label: "Skill(*)", description: "Use any skill", category: "AI" },
];

// --- Default Deny Rules ---
interface DenyRule {
  key: string;
  description: string;
}

const DEFAULT_DENY_RULES: DenyRule[] = [
  { key: "Bash(rm -rf *)", description: "Recursive delete" },
  { key: "Bash(git push --force)", description: "Force push" },
];

// --- Helpers ---
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

// --- Category Icons (SVG paths) ---
const CATEGORY_ICONS: Record<string, string> = {
  "Shell Commands": "M4 17l6-6-6-6M12 19h8",
  "File Operations": "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7",
  "Network": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  "AI": "M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z",
};

// --- Real-world Permission Presets (from 35+ OpenAEC projects) ---
const PERMISSION_PRESETS = [
  {
    id: "restrictive",
    label: "Restrictive",
    description: "Explicit command whitelist. Used in complex multi-package projects.",
    color: "var(--error)",
    rules: ["Bash(npm run build)", "Bash(npm run dev)", "Bash(npm run test)", "Bash(npx tsc --noEmit)", "Bash(git add *)", "Bash(git commit *)", "Bash(git status)", "Bash(git diff *)", "Read", "Glob", "Grep", "WebFetch", "WebSearch"],
  },
  {
    id: "standard",
    label: "Standard",
    description: "Tool patterns with wildcards. Used in 23+ standard development projects.",
    color: "var(--accent)",
    rules: ["Bash(npm run *)", "Bash(npx *)", "Bash(cargo *)", "Bash(git *)", "Bash(docker *)", "Bash(python *)", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "WebSearch", "Agent"],
  },
  {
    id: "full",
    label: "Full Access",
    description: "All tools open. Used in skill package development and agent workflows.",
    color: "var(--success)",
    rules: ["Bash(*)", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "WebSearch", "Agent", "Skill(*)"],
  },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function PermissionsPage() {
  const [saveStatus, setSaveStatus] = createSignal<SaveStatus>("idle");
  const [saveError, setSaveError] = createSignal("");
  const [mode, setMode] = createSignal<PermissionMode>("default");
  const [allowEnabled, setAllowEnabled] = createSignal<Record<string, boolean>>(
    Object.fromEntries(ALLOW_RULES.map((r) => [r.key, true]))
  );
  const [denyRules, setDenyRules] = createSignal<DenyRule[]>([...DEFAULT_DENY_RULES]);
  const [customRuleInput, setCustomRuleInput] = createSignal("");

  function applyPreset(presetId: string) {
    const preset = PERMISSION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newEnabled: Record<string, boolean> = {};
    for (const rule of ALLOW_RULES) {
      newEnabled[rule.key] = preset.rules.includes(rule.key);
    }
    // Add any preset rules not in default list
    for (const rule of preset.rules) {
      newEnabled[rule] = true;
    }
    setAllowEnabled(newEnabled);
  }
  const [customRuleType, setCustomRuleType] = createSignal<"allow" | "deny">("allow");

  // Toggle an allow rule
  function toggleAllow(key: string) {
    setAllowEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Toggle a deny rule (remove it)
  function removeDeny(key: string) {
    setDenyRules((prev) => prev.filter((r) => r.key !== key));
  }

  // Add custom rule
  function addCustomRule() {
    const value = customRuleInput().trim();
    if (!value) return;

    if (customRuleType() === "allow") {
      // Add to allow if not already present
      if (!allowEnabled()[value]) {
        setAllowEnabled((prev) => ({ ...prev, [value]: true }));
      }
    } else {
      // Add to deny if not already present
      if (!denyRules().some((r) => r.key === value)) {
        setDenyRules((prev) => [...prev, { key: value, description: "Custom rule" }]);
      }
    }
    setCustomRuleInput("");
  }

  // Grouped allow rules
  const groupedRules = createMemo(() => groupBy(ALLOW_RULES, (r) => r.category));

  // Compute active allow/deny arrays
  const activeAllowRules = createMemo(() => {
    const enabled = allowEnabled();
    return Object.entries(enabled)
      .filter(([, v]) => v)
      .map(([k]) => k);
  });

  const activeDenyRules = createMemo(() => denyRules().map((r) => r.key));

  // Custom allow rules (not in the default set)
  const customAllowRules = createMemo(() => {
    const defaultKeys = new Set(ALLOW_RULES.map((r) => r.key));
    return Object.entries(allowEnabled())
      .filter(([k, v]) => v && !defaultKeys.has(k))
      .map(([k]) => k);
  });

  // JSON preview
  const jsonPreview = createMemo(() => {
    const obj: Record<string, unknown> = {
      permissions: {
        allow: activeAllowRules(),
        deny: activeDenyRules(),
      },
    };
    if (mode() !== "default") {
      (obj as Record<string, unknown>)["permissionMode"] = mode();
    }
    return JSON.stringify(obj, null, 2);
  });

  // Sync to configStore
  createMemo(() => {
    const perms = activeAllowRules();
    const defaultKeys = new Set(ALLOW_RULES.map((r) => r.key));
    const builtIn = perms.filter((p) => defaultKeys.has(p));
    const custom = perms.filter((p) => !defaultKeys.has(p));
    configStore.setSettings({
      ...configStore.settings(),
      permissions: builtIn,
      customPermissions: custom,
    });
  });

  return (
    <div class="content-body">
      <div class="content-scroll">
        <div class="config-editor" style={{ "align-items": "flex-start" }}>
          {/* Left: Form */}
          <div class="config-form">

            {/* Section 1: Permission Mode */}
            <div class="card" style={{ "margin-bottom": "var(--sp-4)" }}>
              <h2 class="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Permission Mode
              </h2>
              <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
                Controls how Claude Code asks for permission before taking actions.
              </p>

              <div style={{
                display: "grid",
                "grid-template-columns": "repeat(2, 1fr)",
                gap: "var(--sp-2)",
              }}>
                <For each={PERMISSION_MODES}>
                  {(opt) => {
                    const isActive = () => mode() === opt.id;
                    const borderColor = () => {
                      if (!isActive()) return "var(--border)";
                      return opt.danger ? "var(--error)" : "var(--accent)";
                    };
                    const bgColor = () => {
                      if (!isActive()) return "var(--bg-card)";
                      return opt.danger ? "rgba(239, 68, 68, 0.1)" : "var(--bg-active)";
                    };

                    return (
                      <button
                        onClick={() => setMode(opt.id)}
                        style={{
                          display: "flex",
                          "flex-direction": "column",
                          "align-items": "flex-start",
                          gap: "var(--sp-1)",
                          padding: "var(--sp-3)",
                          background: bgColor(),
                          border: `2px solid ${borderColor()}`,
                          "border-radius": "var(--radius-md)",
                          cursor: "pointer",
                          "text-align": "left",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{
                          display: "flex",
                          "align-items": "center",
                          gap: "var(--sp-2)",
                          width: "100%",
                        }}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={isActive() ? (opt.danger ? "var(--error)" : "var(--accent)") : "var(--text-dim)"}
                            stroke-width="2"
                          >
                            <path d={opt.icon} />
                          </svg>
                          <strong style={{
                            "font-size": "0.85rem",
                            color: isActive()
                              ? (opt.danger ? "var(--error)" : "var(--accent)")
                              : "var(--text-primary)",
                          }}>
                            {opt.label}
                          </strong>
                          <Show when={isActive()}>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={opt.danger ? "var(--error)" : "var(--accent)"}
                              stroke-width="3"
                              style={{ "margin-left": "auto" }}
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </Show>
                        </div>
                        <span style={{
                          "font-size": "0.75rem",
                          color: "var(--text-dim)",
                          "line-height": "1.3",
                        }}>
                          {opt.description}
                        </span>
                      </button>
                    );
                  }}
                </For>
              </div>

              <Show when={mode() === "bypass"}>
                <div style={{
                  "margin-top": "var(--sp-3)",
                  padding: "var(--sp-2) var(--sp-3)",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid var(--error)",
                  "border-radius": "var(--radius-md)",
                  "font-size": "0.8rem",
                  color: "var(--error)",
                  display: "flex",
                  "align-items": "center",
                  gap: "var(--sp-2)",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Bypass mode skips all permission checks. Only use in trusted, sandboxed environments.
                </div>
              </Show>
            </div>

            {/* Section 2: Quick Presets */}
            <div class="card" style={{ "margin-bottom": "var(--sp-4)" }}>
              <h2 class="card-title">Quick Presets</h2>
              <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
                Battle-tested permission sets from 35+ real projects. Click to apply.
              </p>
              <div style={{ display: "grid", "grid-template-columns": "repeat(3, 1fr)", gap: "var(--sp-2)" }}>
                <For each={PERMISSION_PRESETS}>
                  {(preset) => (
                    <button
                      class="btn btn-ghost"
                      style={{
                        display: "flex", "flex-direction": "column", "align-items": "flex-start",
                        padding: "var(--sp-3)", "text-align": "left",
                        "border-color": preset.color,
                      }}
                      onClick={() => applyPreset(preset.id)}
                    >
                      <strong style={{ color: preset.color, "font-size": "0.85rem" }}>{preset.label}</strong>
                      <span class="text-dim" style={{ "font-size": "0.7rem", "margin-top": "2px" }}>{preset.description}</span>
                      <span class="font-mono text-muted" style={{ "font-size": "0.65rem", "margin-top": "var(--sp-1)" }}>
                        {preset.rules.length} rules
                      </span>
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* Section 3: Allow Rules */}
            <div class="card" style={{ "margin-bottom": "var(--sp-4)" }}>
              <h2 class="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Allow Rules
              </h2>
              <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
                Tools and commands Claude Code may use without asking. Toggle each rule on or off.
              </p>

              <For each={Object.entries(groupedRules())}>
                {([category, rules]) => (
                  <div class="config-group">
                    <h3 style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)" }}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        stroke-width="2"
                      >
                        <path d={CATEGORY_ICONS[category] || ""} />
                      </svg>
                      {category}
                    </h3>
                    <For each={rules}>
                      {(rule) => (
                        <div class="config-item">
                          <div>
                            <strong>{rule.label}</strong>
                            <small>{rule.description}</small>
                          </div>
                          <button
                            class={`toggle ${allowEnabled()[rule.key] ? "active" : ""}`}
                            onClick={() => toggleAllow(rule.key)}
                          >
                            {allowEnabled()[rule.key] ? "On" : "Off"}
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                )}
              </For>

              {/* Custom allow rules */}
              <Show when={customAllowRules().length > 0}>
                <div class="config-group">
                  <h3>Custom Allow Rules</h3>
                  <For each={customAllowRules()}>
                    {(key) => (
                      <div class="config-item">
                        <div>
                          <strong>{key}</strong>
                          <small>Custom rule</small>
                        </div>
                        <button
                          class="toggle active"
                          onClick={() => setAllowEnabled((prev) => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                          })}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* Section 3: Deny Rules */}
            <div class="card" style={{ "margin-bottom": "var(--sp-4)" }}>
              <h2 class="card-title" style={{ color: "var(--error)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                Deny Rules
              </h2>
              <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
                Blocked actions take priority over allow rules. These patterns are always denied.
              </p>

              <For each={denyRules()}>
                {(rule) => (
                  <div class="config-item" style={{ "border-color": "rgba(239, 68, 68, 0.25)" }}>
                    <div>
                      <strong style={{ color: "var(--error)" }}>{rule.key}</strong>
                      <small>{rule.description}</small>
                    </div>
                    <button
                      class="toggle active"
                      style={{
                        background: "rgba(239, 68, 68, 0.2)",
                        "border-color": "var(--error)",
                        color: "var(--error)",
                      }}
                      onClick={() => removeDeny(rule.key)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </For>

              <Show when={denyRules().length === 0}>
                <p class="text-dim" style={{ "font-size": "0.8rem", "font-style": "italic" }}>
                  No deny rules configured.
                </p>
              </Show>
            </div>

            {/* Section 4: Add Custom Rule */}
            <div class="card">
              <h2 class="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Custom Rule
              </h2>
              <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
                Add a custom permission pattern like <code class="font-mono" style={{ "font-size": "0.8rem" }}>Bash(python *)</code> or <code class="font-mono" style={{ "font-size": "0.8rem" }}>mcp__server__tool</code>.
              </p>

              <div style={{ display: "flex", gap: "var(--sp-2)", "margin-bottom": "var(--sp-2)" }}>
                <button
                  class={`toggle ${customRuleType() === "allow" ? "active" : ""}`}
                  onClick={() => setCustomRuleType("allow")}
                >
                  Allow
                </button>
                <button
                  class={`toggle ${customRuleType() === "deny" ? "active" : ""}`}
                  onClick={() => setCustomRuleType("deny")}
                  style={customRuleType() === "deny" ? {
                    background: "rgba(239, 68, 68, 0.2)",
                    "border-color": "var(--error)",
                    color: "var(--error)",
                  } : {}}
                >
                  Deny
                </button>
              </div>

              <div class="input-with-button">
                <input
                  type="text"
                  value={customRuleInput()}
                  placeholder="e.g. Bash(python *)"
                  onInput={(e) => setCustomRuleInput(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCustomRule();
                  }}
                />
                <button class="btn btn-secondary" onClick={addCustomRule}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div class="config-preview" style={{ position: "sticky", top: "0" }}>
            <div class="config-preview-header">
              <h4>.claude/settings.local.json</h4>
              <span class="text-dim" style={{ "font-size": "0.7rem" }}>Live Preview</span>
            </div>
            {jsonPreview()}
            <div style={{ "margin-top": "var(--sp-3)" }}>
              <button
                class={saveStatus() === "saved" ? "btn btn-success" : saveStatus() === "error" ? "btn btn-ghost" : "btn btn-primary"}
                disabled={saveStatus() === "saving"}
                style={{ width: "100%" }}
                onClick={async () => {
                  setSaveStatus("saving");
                  setSaveError("");
                  const wsPath = workspaceStore.workspacePath();
                  if (!wsPath) {
                    setSaveStatus("error");
                    setSaveError("Set a workspace path first");
                    return;
                  }
                  try {
                    const { invoke } = await import("@tauri-apps/api/core");
                    await invoke("write_settings_json", { path: wsPath, settings: JSON.parse(jsonPreview()) });
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
                }}
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
                  File written to workspace directory.
                </p>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

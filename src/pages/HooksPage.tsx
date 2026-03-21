import { createSignal, For, Show } from "solid-js";
import { configStore, Hook } from "../stores/config.store";
import { workspaceStore } from "../stores/workspace.store";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface HookTemplate {
  name: string;
  event: Hook["event"];
  type: Hook["type"];
  matcher?: string;
  command: string;
  description: string;
}

const HOOK_TEMPLATES: HookTemplate[] = [
  {
    name: "Delegation Check",
    event: "PreToolUse",
    type: "intercept",
    matcher: "Edit|Write",
    command: "bash .claude/hooks/check-delegation.sh",
    description:
      "Warns when editing .py/.tsx files without agent delegation. Suggests using oa run instead.",
  },
  {
    name: "Auto-restart Dev Server",
    event: "PostToolUse",
    type: "command",
    matcher: "Edit|Write",
    command: "bash ./scripts/ensure-dev-running.sh",
    description: "Automatically restarts the dev server after file changes",
  },
  {
    name: "SSH Tunnel Setup",
    event: "SessionStart",
    type: "command",
    command: "bash ./scripts/tunnel.sh start",
    description: "Opens SSH tunnel to remote server at session start",
  },
  {
    name: "Session Start Summary",
    event: "SessionStart",
    type: "command",
    command: "node .claude/skills/session-history/scripts/session-start-summary.js",
    description: "Shows project status summary when Claude Code starts",
  },
  {
    name: "Lint on Edit",
    event: "PostToolUse",
    type: "command",
    matcher: "Edit|Write",
    command: "npm run lint:fix 2>/dev/null || true",
    description: "Runs linter automatically after file edits",
  },
  {
    name: "Prompt Logger",
    event: "UserPromptSubmit",
    type: "command",
    command: "python .claude/hooks/log-prompt.py",
    description: "Logs every user prompt to a file for analysis",
  },
];

function eventColor(event: string): string {
  switch (event) {
    case "PreToolUse":
      return "#e67e22";
    case "PostToolUse":
      return "#27ae60";
    case "SessionStart":
      return "#3498db";
    case "Stop":
      return "#e74c3c";
    case "UserPromptSubmit":
      return "#9b59b6";
    default:
      return "var(--text-dim)";
  }
}

export function HooksPage() {
  const [saveStatus, setSaveStatus] = createSignal<SaveStatus>("idle");
  const [saveError, setSaveError] = createSignal("");
  const [expandedTemplate, setExpandedTemplate] = createSignal<string | null>(null);

  // Build hooks JSON from configStore
  function buildHooksJson(): string | null {
    const hks = configStore.hooks().filter((h) => h.enabled);
    if (hks.length === 0) return null;
    const config: Record<string, unknown[]> = {};
    for (const h of hks) {
      if (!config[h.event]) config[h.event] = [];
      const entry: Record<string, unknown> = { type: h.type, command: h.command };
      if (h.matcher) entry.matcher = h.matcher;
      config[h.event].push(entry);
    }
    return JSON.stringify({ hooks: config }, null, 2);
  }

  function isTemplateAdded(template: HookTemplate): boolean {
    return configStore
      .hooks()
      .some(
        (h) =>
          h.event === template.event &&
          h.command === template.command
      );
  }

  function addFromTemplate(template: HookTemplate) {
    if (isTemplateAdded(template)) return;
    const hook: Hook = {
      id: `hook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      event: template.event,
      type: template.type,
      matcher: template.matcher,
      command: template.command,
      enabled: true,
    };
    configStore.addHook(hook);
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
    const hooksJson = buildHooksJson();
    if (!hooksJson) {
      setSaveStatus("error");
      setSaveError("No hooks configured to save");
      return;
    }
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("write_settings_json", { path: wsPath, settings: JSON.parse(hooksJson) });
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
        {/* Header */}
        <div class="card">
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Hooks
          </h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Hooks run shell commands in response to Claude Code events. Configure them in{" "}
            <code class="font-mono">.claude/settings.json</code>.
          </p>
        </div>

        {/* Active Hooks */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title" style={{ "margin-bottom": "var(--sp-3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Active Hooks ({configStore.hooks().length})
          </h2>

          <Show
            when={configStore.hooks().length > 0}
            fallback={
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <p>No hooks configured</p>
                <small>Add hooks from the templates below or create your own</small>
              </div>
            }
          >
            <For each={configStore.hooks()}>
              {(hook) => (
                <div
                  style={{
                    background: "var(--bg-input)",
                    padding: "var(--sp-3)",
                    "border-radius": "var(--radius)",
                    "margin-bottom": "var(--sp-2)",
                    border: hook.enabled ? "1px solid var(--accent)" : "1px solid var(--border)",
                    opacity: hook.enabled ? "1" : "0.6",
                  }}
                >
                  <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "flex-wrap": "wrap" }}>
                      <span
                        style={{
                          "font-size": "0.7rem",
                          "font-weight": "600",
                          color: eventColor(hook.event),
                          background: `${eventColor(hook.event)}15`,
                          padding: "2px 8px",
                          "border-radius": "4px",
                          "text-transform": "uppercase",
                          "letter-spacing": "0.03em",
                        }}
                      >
                        {hook.event}
                      </span>
                      <Show when={hook.matcher}>
                        <span
                          style={{
                            "font-size": "0.7rem",
                            color: "var(--text-dim)",
                            background: "var(--bg-card)",
                            padding: "2px 6px",
                            "border-radius": "4px",
                            "font-family": "var(--font-mono)",
                          }}
                        >
                          matcher: {hook.matcher}
                        </span>
                      </Show>
                      <span
                        style={{
                          "font-size": "0.7rem",
                          color: "var(--text-dim)",
                          background: "var(--bg-card)",
                          padding: "2px 6px",
                          "border-radius": "4px",
                          "font-family": "var(--font-mono)",
                        }}
                      >
                        {hook.type}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                      <button
                        class="btn btn-ghost"
                        style={{
                          padding: "2px 8px",
                          "font-size": "0.75rem",
                          color: hook.enabled ? "var(--text-dim)" : "var(--success)",
                        }}
                        onClick={() => configStore.toggleHookEnabled(hook.id)}
                      >
                        {hook.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        class="btn btn-ghost"
                        style={{ padding: "2px 8px", "font-size": "0.75rem", color: "var(--error)" }}
                        onClick={() => configStore.removeHook(hook.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <code
                    class="font-mono"
                    style={{
                      display: "block",
                      "font-size": "0.8rem",
                      "margin-top": "var(--sp-2)",
                      color: "var(--accent)",
                      "word-break": "break-all",
                    }}
                  >
                    {hook.command}
                  </code>
                </div>
              )}
            </For>
          </Show>
        </div>

        {/* Hook Templates */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Hook Templates
          </h2>
          <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-3)" }}>
            Real-world hooks from OpenAEC Foundation projects. Click to add them to your workspace.
          </p>

          <For each={HOOK_TEMPLATES}>
            {(template) => {
              const added = () => isTemplateAdded(template);
              const isExpanded = () => expandedTemplate() === template.name;
              return (
                <div
                  style={{
                    background: "var(--bg-input)",
                    padding: "var(--sp-3)",
                    "border-radius": "var(--radius)",
                    "margin-bottom": "var(--sp-2)",
                    border: added() ? "1px solid var(--success)" : "1px solid var(--border)",
                    opacity: added() ? "0.6" : "1",
                  }}
                >
                  <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-start" }}>
                    <div style={{ flex: "1" }}>
                      <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-1)", "flex-wrap": "wrap" }}>
                        <strong style={{ "font-size": "0.85rem" }}>{template.name}</strong>
                        <span
                          style={{
                            "font-size": "0.65rem",
                            "font-weight": "600",
                            color: eventColor(template.event),
                            background: `${eventColor(template.event)}15`,
                            padding: "1px 6px",
                            "border-radius": "4px",
                            "text-transform": "uppercase",
                            "letter-spacing": "0.03em",
                          }}
                        >
                          {template.event}
                        </span>
                        <Show when={template.matcher}>
                          <span
                            style={{
                              "font-size": "0.65rem",
                              color: "var(--text-dim)",
                              background: "var(--bg-card)",
                              padding: "1px 6px",
                              "border-radius": "4px",
                              "font-family": "var(--font-mono)",
                            }}
                          >
                            {template.matcher}
                          </span>
                        </Show>
                        <Show when={added()}>
                          <span
                            style={{
                              "font-size": "0.65rem",
                              color: "var(--success)",
                              background: "rgba(39, 174, 96, 0.1)",
                              padding: "1px 6px",
                              "border-radius": "4px",
                            }}
                          >
                            added
                          </span>
                        </Show>
                      </div>
                      <p class="text-dim" style={{ "font-size": "0.8rem", margin: "0" }}>
                        {template.description}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-1)", "margin-left": "var(--sp-2)" }}>
                      <button
                        class="btn btn-ghost"
                        style={{ padding: "2px 8px", "font-size": "0.7rem" }}
                        onClick={() => setExpandedTemplate(isExpanded() ? null : template.name)}
                      >
                        {isExpanded() ? "Hide" : "Details"}
                      </button>
                      <button
                        class={`btn ${added() ? "btn-secondary" : "btn-primary"}`}
                        style={{ padding: "2px 10px", "font-size": "0.75rem" }}
                        onClick={() => addFromTemplate(template)}
                        disabled={added()}
                      >
                        {added() ? "Added" : "Add"}
                      </button>
                    </div>
                  </div>

                  <Show when={isExpanded()}>
                    <div
                      style={{
                        background: "var(--bg-card)",
                        padding: "var(--sp-2)",
                        "border-radius": "var(--radius)",
                        "margin-top": "var(--sp-2)",
                      }}
                    >
                      <div class="text-dim" style={{ "font-size": "0.7rem", "margin-bottom": "var(--sp-1)" }}>
                        settings.json entry:
                      </div>
                      <pre
                        class="font-mono"
                        style={{
                          "font-size": "0.75rem",
                          "white-space": "pre-wrap",
                          margin: "0",
                          color: "var(--text-dim)",
                        }}
                      >
{JSON.stringify(
  {
    hooks: {
      [template.event]: [
        {
          type: template.type,
          command: template.command,
          ...(template.matcher ? { matcher: template.matcher } : {}),
        },
      ],
    },
  },
  null,
  2
)}
                      </pre>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        {/* Available Events reference */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Available Events</h2>
          <div style={{ "font-size": "0.85rem" }}>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong style={{ color: eventColor("PreToolUse") }}>PreToolUse</strong>
              <span class="text-dim">Before a tool runs (can block with intercept type)</span>
            </div>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong style={{ color: eventColor("PostToolUse") }}>PostToolUse</strong>
              <span class="text-dim">After a tool completes</span>
            </div>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong style={{ color: eventColor("SessionStart") }}>SessionStart</strong>
              <span class="text-dim">When Claude Code starts</span>
            </div>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong style={{ color: eventColor("Stop") }}>Stop</strong>
              <span class="text-dim">When Claude finishes a response</span>
            </div>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0" }}>
              <strong style={{ color: eventColor("UserPromptSubmit") }}>UserPromptSubmit</strong>
              <span class="text-dim">When user sends a message</span>
            </div>
          </div>
        </div>

        {/* Save to workspace */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Save Hooks</h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Write hooks configuration to <code class="font-mono">.claude/settings.json</code> in your workspace.
          </p>
          <button
            class={saveStatus() === "saved" ? "btn btn-success" : saveStatus() === "error" ? "btn btn-ghost" : "btn btn-primary"}
            disabled={saveStatus() === "saving" || configStore.hooks().length === 0}
            style={{ width: "100%" }}
            onClick={handleSave}
          >
            {saveStatus() === "saving"
              ? "Saving..."
              : saveStatus() === "saved"
                ? "Saved!"
                : saveStatus() === "error"
                  ? "Error"
                  : `Save ${configStore.hooks().filter((h) => h.enabled).length} hook(s) to workspace`}
          </button>
          <Show when={saveStatus() === "error" && saveError()}>
            <p style={{ color: "var(--error)", "font-size": "0.75rem", "margin-top": "var(--sp-1)" }}>
              {saveError()}
            </p>
          </Show>
          <Show when={saveStatus() === "saved"}>
            <p style={{ color: "var(--success)", "font-size": "0.75rem", "margin-top": "var(--sp-1)" }}>
              Hooks written to .claude/settings.json
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}

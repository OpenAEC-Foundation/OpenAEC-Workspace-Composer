import { createSignal, For } from "solid-js";
import { configStore } from "../stores/config.store";

const defaultPermissions = [
  { rule: "Bash(npm run *)", category: "Build" },
  { rule: "Bash(npx *)", category: "Build" },
  { rule: "Bash(cargo *)", category: "Build" },
  { rule: "Bash(git *)", category: "Git" },
  { rule: "Read", category: "Files" },
  { rule: "Write", category: "Files" },
  { rule: "Edit", category: "Files" },
  { rule: "Glob", category: "Search" },
  { rule: "Grep", category: "Search" },
  { rule: "WebFetch", category: "Network" },
  { rule: "WebSearch", category: "Network" },
  { rule: "Agent", category: "AI" },
];

export function PermissionsPage() {
  const [newRule, setNewRule] = createSignal("");

  return (
    <div class="content-body">
      <div class="content-scroll">
        <div class="card">
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Permissions
          </h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Control what Claude Code is allowed to do. These rules go into <code class="font-mono">.claude/settings.local.json</code>.
          </p>

          <div class="form-group">
            <label>Allowed Tools & Commands</label>
            <For each={defaultPermissions}>
              {(perm) => (
                <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-1)" }}>
                  <input type="checkbox" checked style={{ "accent-color": "var(--accent)" }} />
                  <code class="font-mono" style={{ "font-size": "0.8rem", flex: 1 }}>{perm.rule}</code>
                  <span class="text-muted" style={{ "font-size": "0.7rem" }}>{perm.category}</span>
                </div>
              )}
            </For>
          </div>

          <div class="form-group" style={{ "margin-top": "var(--sp-3)" }}>
            <label>Add Custom Rule</label>
            <div class="input-with-button">
              <input
                type="text"
                placeholder='Bash(docker *)'
                value={newRule()}
                onInput={(e) => setNewRule(e.currentTarget.value)}
              />
              <button class="btn btn-secondary" onClick={() => setNewRule("")}>Add</button>
            </div>
          </div>
        </div>

        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Deny Rules</h2>
          <p class="text-dim" style={{ "font-size": "0.85rem" }}>
            Deny rules block actions permanently. They take priority over allow rules.
          </p>
          <div style={{ "margin-top": "var(--sp-2)" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-1)" }}>
              <input type="checkbox" checked style={{ "accent-color": "var(--error)" }} />
              <code class="font-mono" style={{ "font-size": "0.8rem", color: "var(--error)" }}>Bash(rm -rf *)</code>
            </div>
            <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)" }}>
              <input type="checkbox" checked style={{ "accent-color": "var(--error)" }} />
              <code class="font-mono" style={{ "font-size": "0.8rem", color: "var(--error)" }}>Bash(git push --force)</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

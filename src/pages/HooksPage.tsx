export function HooksPage() {
  return (
    <div class="content-body">
      <div class="content-scroll">
        <div class="card">
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Hooks
          </h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Hooks run shell commands in response to Claude Code events. Configure them in <code class="font-mono">.claude/settings.json</code>.
          </p>

          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <p>No hooks configured</p>
            <small>Add hooks for PreToolUse, PostToolUse, SessionStart, Stop events</small>
          </div>

          <button class="btn btn-primary" style={{ "margin-top": "var(--sp-3)", width: "100%" }}>
            + Add Hook
          </button>
        </div>

        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Available Events</h2>
          <div style={{ "font-size": "0.85rem" }}>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong>PreToolUse</strong>
              <span class="text-dim">Before a tool runs</span>
            </div>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong>PostToolUse</strong>
              <span class="text-dim">After a tool completes</span>
            </div>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong>SessionStart</strong>
              <span class="text-dim">When Claude Code starts</span>
            </div>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong>Stop</strong>
              <span class="text-dim">When Claude finishes a response</span>
            </div>
            <div style={{ display: "flex", "justify-content": "space-between", padding: "var(--sp-2) 0" }}>
              <strong>UserPromptSubmit</strong>
              <span class="text-dim">When user sends a message</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

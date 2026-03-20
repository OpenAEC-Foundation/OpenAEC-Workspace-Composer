export function TemplatesPage() {
  return (
    <div class="content-body">
      <div class="content-scroll">
        <div class="card">
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            CLAUDE.md Templates
          </h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Choose a template for your project's CLAUDE.md — the main instruction file for Claude Code.
          </p>

          <div style={{ display: "grid", gap: "var(--sp-3)" }}>
            <div class="sync-session-card" style={{ cursor: "pointer" }}>
              <strong>Minimal</strong>
              <p class="text-dim" style={{ "font-size": "0.8rem" }}>Identity + conventions only. Good for small projects.</p>
            </div>
            <div class="sync-session-card" style={{ cursor: "pointer", "border-color": "var(--accent)" }}>
              <strong style={{ color: "var(--accent)" }}>Standard (recommended)</strong>
              <p class="text-dim" style={{ "font-size": "0.8rem" }}>Identity + stack + conventions + installed packages. Default for most projects.</p>
            </div>
            <div class="sync-session-card" style={{ cursor: "pointer" }}>
              <strong>Full</strong>
              <p class="text-dim" style={{ "font-size": "0.8rem" }}>Identity + stack + conventions + protocols + way of work + sources + decisions log.</p>
            </div>
            <div class="sync-session-card" style={{ cursor: "pointer" }}>
              <strong>Custom</strong>
              <p class="text-dim" style={{ "font-size": "0.8rem" }}>Write your own CLAUDE.md content from scratch.</p>
            </div>
          </div>
        </div>

        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Core Files</h2>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-3)", "font-size": "0.85rem" }}>
            Additional project documentation files to generate alongside CLAUDE.md.
          </p>
          <div style={{ "font-size": "0.85rem" }}>
            <label style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-2)", cursor: "pointer" }}>
              <input type="checkbox" checked style={{ "accent-color": "var(--accent)" }} />
              <strong>CLAUDE.md</strong> <span class="text-dim">— Project identity</span>
            </label>
            <label style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-2)", cursor: "pointer" }}>
              <input type="checkbox" style={{ "accent-color": "var(--accent)" }} />
              <strong>WAY_OF_WORK.md</strong> <span class="text-dim">— Methodology</span>
            </label>
            <label style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-2)", cursor: "pointer" }}>
              <input type="checkbox" style={{ "accent-color": "var(--accent)" }} />
              <strong>SOURCES.md</strong> <span class="text-dim">— Approved docs</span>
            </label>
            <label style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "margin-bottom": "var(--sp-2)", cursor: "pointer" }}>
              <input type="checkbox" style={{ "accent-color": "var(--accent)" }} />
              <strong>DECISIONS.md</strong> <span class="text-dim">— Architecture log</span>
            </label>
            <label style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", cursor: "pointer" }}>
              <input type="checkbox" style={{ "accent-color": "var(--accent)" }} />
              <strong>LESSONS.md</strong> <span class="text-dim">— Lessons learned</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

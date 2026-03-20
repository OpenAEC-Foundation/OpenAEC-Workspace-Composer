export function McpPage() {
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
              <p class="text-dim">Local process — runs a command on your machine</p>
            </div>
            <div style={{ padding: "var(--sp-2) 0", "border-bottom": "1px solid var(--border)" }}>
              <strong>http</strong>
              <p class="text-dim">Remote HTTP server — connects to a URL</p>
            </div>
            <div style={{ padding: "var(--sp-2) 0" }}>
              <strong>sse</strong>
              <p class="text-dim">Server-Sent Events — streaming connection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

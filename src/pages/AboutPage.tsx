export function AboutPage() {
  return (
    <div class="content-body">
      <div class="content-scroll">
        <div class="card" style={{ "text-align": "center", padding: "var(--sp-8) var(--sp-6)" }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style={{ "margin-bottom": "var(--sp-4)" }}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <h1 style={{ "font-family": "var(--font-heading)", "font-size": "1.5rem", "margin-bottom": "var(--sp-2)" }}>
            OpenAEC Workspace Composer
          </h1>
          <span class="font-mono text-accent" style={{ "font-size": "0.85rem" }}>v3.0.0</span>
          <p class="text-dim" style={{ "margin-top": "var(--sp-3)", "max-width": "480px", "margin-left": "auto", "margin-right": "auto" }}>
            Generate ready-to-use Claude Code workspaces with curated skill packages
            from the OpenAEC Foundation. Supports skill package workspaces and
            version upgrade workflows with a structured 7-phase methodology.
          </p>
        </div>

        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">OpenAEC Foundation</h2>
          <p class="text-dim" style={{ "font-size": "0.85rem" }}>
            The OpenAEC Foundation develops open-source tools and skill packages for the
            Architecture, Engineering, and Construction (AEC) industry. Our mission is to
            make AI-assisted development accessible and productive for AEC professionals.
          </p>
        </div>

        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Tech Stack</h2>
          <div style={{ display: "flex", gap: "var(--sp-4)", "flex-wrap": "wrap", "margin-top": "var(--sp-3)" }}>
            <div style={{ flex: "1", "min-width": "140px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", "font-size": "0.85rem", "margin-bottom": "var(--sp-1)", color: "var(--accent)" }}>
                Frontend
              </h3>
              <p class="text-dim font-mono" style={{ "font-size": "0.8rem" }}>SolidJS + TypeScript</p>
              <p class="text-dim font-mono" style={{ "font-size": "0.8rem" }}>Vite</p>
            </div>
            <div style={{ flex: "1", "min-width": "140px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", "font-size": "0.85rem", "margin-bottom": "var(--sp-1)", color: "var(--accent)" }}>
                Backend
              </h3>
              <p class="text-dim font-mono" style={{ "font-size": "0.8rem" }}>Rust (Tauri 2)</p>
              <p class="text-dim font-mono" style={{ "font-size": "0.8rem" }}>tauri-plugin-dialog</p>
              <p class="text-dim font-mono" style={{ "font-size": "0.8rem" }}>tauri-plugin-shell</p>
            </div>
            <div style={{ flex: "1", "min-width": "140px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", "font-size": "0.85rem", "margin-bottom": "var(--sp-1)", color: "var(--accent)" }}>
                Build
              </h3>
              <p class="text-dim font-mono" style={{ "font-size": "0.8rem" }}>Tauri CLI</p>
              <p class="text-dim font-mono" style={{ "font-size": "0.8rem" }}>NSIS Installer</p>
            </div>
          </div>
        </div>

        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Links</h2>
          <div style={{ display: "flex", "flex-direction": "column", gap: "var(--sp-2)", "margin-top": "var(--sp-2)" }}>
            <a
              href="https://github.com/OpenAEC-Foundation"
              target="_blank"
              rel="noopener noreferrer"
              class="text-dim"
              style={{ "font-size": "0.85rem", "text-decoration": "none" }}
            >
              <span style={{ color: "var(--accent)" }}>GitHub</span> — OpenAEC Foundation
            </a>
            <a
              href="https://github.com/OpenAEC-Foundation/OpenAEC-Workspace-Composer"
              target="_blank"
              rel="noopener noreferrer"
              class="text-dim"
              style={{ "font-size": "0.85rem", "text-decoration": "none" }}
            >
              <span style={{ color: "var(--accent)" }}>Repository</span> — Workspace Composer source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

import { createMemo, Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import { gpuStore } from "../stores/gpu.store";
import { appStore } from "../stores/app.store";

export function DashboardPage() {
  const totalPackages = createMemo(() => packagesStore.registryPackages().length);
  const totalSkills = createMemo(() =>
    packagesStore.registryPackages().reduce((sum, p) => sum + p.skillCount, 0)
  );
  const selectedCount = createMemo(() => packagesStore.selectedPackages().length);
  const recentWorkspaces = createMemo(() => workspaceStore.recentWorkspaces());

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Compact hero */}
        <div class="card" style={{ display: "flex", "align-items": "center", gap: "var(--sp-4)", padding: "var(--sp-4) var(--sp-5)" }}>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" style={{ "flex-shrink": "0" }}>
            <rect x="4" y="14" width="24" height="14" rx="1" stroke="var(--accent)" stroke-width="1.5" fill="rgba(217, 119, 6, 0.08)" />
            <path d="M2 14L16 4L30 14" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <rect x="8" y="18" width="5" height="5" rx="0.5" fill="var(--accent)" opacity="0.6" />
            <rect x="19" y="18" width="5" height="5" rx="0.5" fill="var(--accent)" opacity="0.6" />
            <rect x="13" y="21" width="6" height="7" rx="0.5" fill="var(--accent)" opacity="0.35" />
          </svg>
          <div>
            <h1 style={{ "font-family": "var(--font-heading)", "font-size": "1.25rem", "margin-bottom": "2px" }}>
              OpenAEC Workspace Composer
            </h1>
            <p class="text-dim" style={{ "font-size": "0.8rem" }}>
              Configure and deploy Claude Code workspaces with curated skill packages
            </p>
          </div>
          <div style={{ "margin-left": "auto", display: "flex", gap: "var(--sp-3)" }}>
            <div class="stat" style={{ "text-align": "center" }}>
              <span class="stat-value">{totalPackages()}</span>
              <span class="stat-label">Packages</span>
            </div>
            <div class="stat" style={{ "text-align": "center" }}>
              <span class="stat-value">{totalSkills()}</span>
              <span class="stat-label">Skills</span>
            </div>
            <div class="stat" style={{ "text-align": "center" }}>
              <span class="stat-value">{selectedCount()}</span>
              <span class="stat-label">Selected</span>
            </div>
          </div>
        </div>

        {/* Tile grid */}
        <div class="tile-grid" style={{ "margin-top": "var(--sp-4)" }}>
          {/* Row 1: Main actions */}
          <A href="/workspace" class="tile tile-wide">
            <div class="tile-icon" style={{ color: "var(--accent)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <strong>Browse Packages</strong>
              <p class="text-dim" style={{ "font-size": "0.75rem" }}>Explore {totalPackages()} skill packages</p>
            </div>
            <Show when={selectedCount() > 0}>
              <span class="sidebar-badge" style={{ "margin-left": "auto" }}>{selectedCount()}</span>
            </Show>
          </A>

          <A href="/install" class="tile tile-wide tile-accent">
            <div class="tile-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <strong>Install Workspace</strong>
              <p style={{ "font-size": "0.75rem", opacity: 0.8 }}>
                {selectedCount() > 0 ? `${selectedCount()} packages ready` : "Select packages first"}
              </p>
            </div>
          </A>

          {/* Row 2: Configuration tiles */}
          <A href="/workspace" class="tile">
            <div class="tile-icon" style={{ color: "var(--info)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <strong>Workspace</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>Path & project</span>
          </A>

          <A href="/configure" class="tile">
            <div class="tile-icon" style={{ color: "var(--warm-gold)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <strong>Settings</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>Claude config</span>
          </A>

          <A href="/permissions" class="tile">
            <div class="tile-icon" style={{ color: "var(--success)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <strong>Permissions</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>Allow & deny</span>
          </A>

          <A href="/hooks" class="tile">
            <div class="tile-icon" style={{ color: "#a78bfa" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <strong>Hooks</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>Event triggers</span>
          </A>

          <A href="/mcp" class="tile">
            <div class="tile-icon" style={{ color: "#f472b6" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
              </svg>
            </div>
            <strong>MCP Servers</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>External tools</span>
          </A>

          <A href="/templates" class="tile">
            <div class="tile-icon" style={{ color: "#38bdf8" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <strong>Templates</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>CLAUDE.md</span>
          </A>

          {/* Row 3: Remote */}
          <A href="/gpu-server" class="tile">
            <div class="tile-icon" style={{ color: gpuStore.connected() ? "var(--success)" : "var(--text-muted)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
            <strong>GPU Server</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>
              {gpuStore.connected() ? "Connected" : "Not connected"}
            </span>
          </A>

          <A href="/sync" class="tile">
            <div class="tile-icon" style={{ color: gpuStore.activeSyncCount() > 0 ? "var(--success)" : "var(--text-muted)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </div>
            <strong>Folder Sync</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>
              {gpuStore.activeSyncCount() > 0 ? `${gpuStore.activeSyncCount()} active` : "No syncs"}
            </span>
          </A>
        </div>

        {/* Recent workspaces */}
        <Show when={recentWorkspaces().length > 0}>
          <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
            <h2 class="card-title">Recent Workspaces</h2>
            <For each={recentWorkspaces()}>
              {(ws) => (
                <div class="preview-item">
                  <span class="preview-name font-mono">{ws}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}

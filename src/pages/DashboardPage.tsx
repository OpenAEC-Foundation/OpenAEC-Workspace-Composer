import { createMemo, Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";

export function DashboardPage() {
  const totalPackages = createMemo(() => packagesStore.registryPackages().length);
  const totalSkills = createMemo(() =>
    packagesStore.registryPackages().reduce((sum, p) => sum + p.skillCount, 0)
  );
  const recentWorkspaces = createMemo(() => workspaceStore.recentWorkspaces());

  const quickActions = [
    {
      title: "New Workspace",
      description: "Set up a new Claude Code workspace with skill packages",
      href: "/workspace",
      icon: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      ),
    },
    {
      title: "Browse Packages",
      description: "Explore the OpenAEC skill package registry",
      href: "/packages",
      icon: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      title: "Configure",
      description: "Adjust settings, MCP servers, hooks and core files",
      href: "/configure",
      icon: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Hero section */}
        <div class="card" style={{ "text-align": "center", "padding": "var(--sp-8) var(--sp-6)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style={{ "margin-bottom": "var(--sp-4)" }}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <h1 style={{ "font-family": "var(--font-heading)", "font-size": "1.5rem", "margin-bottom": "var(--sp-2)" }}>
            OpenAEC Workspace Composer
          </h1>
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-1)" }}>
            Generate ready-to-use Claude Code workspaces with curated skill packages
          </p>
          <span class="font-mono text-muted" style={{ "font-size": "0.75rem" }}>v3.0.0</span>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: "var(--sp-4)", "margin-top": "var(--sp-4)" }}>
          <For each={quickActions}>
            {(action) => (
              <A href={action.href} class="card" style={{ flex: "1", "text-decoration": "none", cursor: "pointer", transition: "var(--transition)" }}>
                <div style={{ color: "var(--accent)", "margin-bottom": "var(--sp-3)" }}>
                  {action.icon()}
                </div>
                <h3 class="card-title" style={{ "font-size": "0.95rem", "margin-bottom": "var(--sp-1)" }}>
                  {action.title}
                </h3>
                <p class="text-dim" style={{ "font-size": "0.8rem" }}>{action.description}</p>
              </A>
            )}
          </For>
        </div>

        {/* Stats overview */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Registry Stats</h2>
          <div class="preview-stats">
            <div class="stat">
              <span class="stat-value">{totalPackages()}</span>
              <span class="stat-label">Packages</span>
            </div>
            <div class="stat">
              <span class="stat-value">{totalSkills()}</span>
              <span class="stat-label">Skills</span>
            </div>
            <div class="stat">
              <span class="stat-value">{packagesStore.selectedPackages().length}</span>
              <span class="stat-label">Selected</span>
            </div>
          </div>
        </div>

        {/* Recent workspaces */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Recent Workspaces</h2>
          <Show
            when={recentWorkspaces().length > 0}
            fallback={
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <p>No recent workspaces</p>
                <small>Generated workspaces will appear here</small>
              </div>
            }
          >
            <For each={recentWorkspaces()}>
              {(ws) => (
                <div class="preview-item">
                  <span class="preview-name font-mono">{ws}</span>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
}

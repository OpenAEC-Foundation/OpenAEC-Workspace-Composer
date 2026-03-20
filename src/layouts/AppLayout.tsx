import { createMemo, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { ParentProps } from "solid-js";
import { Titlebar } from "../components/Titlebar";
import { StatusBar } from "../components/StatusBar";
import { packagesStore } from "../stores/packages.store";
import { gpuStore } from "../stores/gpu.store";
import { appStore } from "../stores/app.store";

function NavIcon(props: { icon: string }) {
  const icons: Record<string, () => any> = {
    dashboard: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    quickstart: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    packages: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    workspace: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    configure: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    hooks: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    permissions: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    mcp: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
    templates: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    install: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    ),
    "gpu-server": () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    sync: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    about: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  const render = icons[props.icon];
  return render ? render() : null;
}

export function AppLayout(props: ParentProps) {
  const selectedCount = createMemo(() => packagesStore.selectedPackages().length);
  const gpuConnected = createMemo(() => gpuStore.connected());
  const gpuSyncCount = createMemo(() => gpuStore.activeSyncCount());
  const advanced = createMemo(() => appStore.isAdvanced());

  return (
    <div class="app">
      <Titlebar />
      <div class="app-main">
        <nav class="sidebar">
          <div class="sidebar-brand">
            <svg class="sidebar-brand-logo" width="32" height="32" viewBox="0 0 32 32" fill="none">
              {/* Building/construction outline */}
              <rect x="4" y="14" width="24" height="14" rx="1" stroke="var(--accent)" stroke-width="1.5" fill="rgba(217, 119, 6, 0.08)" />
              {/* Roof / triangle */}
              <path d="M2 14L16 4L30 14" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              {/* Windows */}
              <rect x="8" y="18" width="5" height="5" rx="0.5" fill="var(--accent)" opacity="0.6" />
              <rect x="19" y="18" width="5" height="5" rx="0.5" fill="var(--accent)" opacity="0.6" />
              {/* Door */}
              <rect x="13" y="21" width="6" height="7" rx="0.5" fill="var(--accent)" opacity="0.35" />
              {/* Chimney accent */}
              <rect x="22" y="7" width="3" height="7" rx="0.5" stroke="var(--accent)" stroke-width="1" fill="none" opacity="0.5" />
            </svg>
            <span class="sidebar-brand-name">Open<span>AEC</span></span>
          </div>

          {/* Mode toggle */}
          <div style={{ padding: "0 var(--sp-3)", "margin-bottom": "var(--sp-2)" }}>
            <button
              class="mode-toggle"
              onClick={() => appStore.toggleMode()}
              title={advanced() ? "Switch to Simple mode" : "Switch to Advanced mode"}
            >
              <span class={`mode-toggle-option ${!advanced() ? "active" : ""}`}>Simple</span>
              <span class={`mode-toggle-option ${advanced() ? "active" : ""}`}>Advanced</span>
            </button>
          </div>

          <div class="sidebar-nav">
            {/* === SIMPLE MODE === */}
            <Show when={!advanced()}>
              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Setup</div>
                <A href="/workspace" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="workspace" />
                  <span>Workspace</span>
                  {selectedCount() > 0 && (
                    <span class="sidebar-badge">{selectedCount()}</span>
                  )}
                </A>
                <A href="/install" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="install" />
                  <span>Install</span>
                </A>
              </div>
            </Show>

            {/* === ADVANCED MODE === */}
            <Show when={advanced()}>
              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Workspace</div>
                <A href="/dashboard" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="dashboard" />
                  <span>Dashboard</span>
                </A>
                <A href="/workspace" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="workspace" />
                  <span>Workspace</span>
                  {selectedCount() > 0 && (
                    <span class="sidebar-badge">{selectedCount()}</span>
                  )}
                </A>
              </div>

              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Configuration</div>
                <A href="/configure" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="configure" />
                  <span>Settings</span>
                </A>
                <A href="/permissions" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="permissions" />
                  <span>Permissions</span>
                </A>
                <A href="/hooks" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="hooks" />
                  <span>Hooks</span>
                </A>
                <A href="/mcp" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="mcp" />
                  <span>MCP Servers</span>
                </A>
                <A href="/templates" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="templates" />
                  <span>Templates</span>
                </A>
              </div>

              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Deploy</div>
                <A href="/install" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="install" />
                  <span>Install</span>
                  {selectedCount() > 0 && (
                    <span class="sidebar-badge">{selectedCount()}</span>
                  )}
                </A>
              </div>

              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Remote</div>
                <A href="/gpu-server" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="gpu-server" />
                  <span>GPU Server</span>
                  <Show when={gpuConnected()}>
                    <span class="sidebar-badge" style={{ background: gpuSyncCount() > 0 ? "var(--success)" : "var(--accent)" }}>
                      {gpuSyncCount() > 0 ? gpuSyncCount() : ""}
                    </span>
                  </Show>
                </A>
                <A href="/sync" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="sync" />
                  <span>Folder Sync</span>
                </A>
              </div>
            </Show>

            <div class="sidebar-nav-group">
              <A href="/about" class="sidebar-nav-item" activeClass="active">
                <NavIcon icon="about" />
                <span>About</span>
              </A>
            </div>
          </div>
          <div class="sidebar-footer">
            <span class="version">v3.0.0</span>
            <span>OpenAEC Foundation</span>
          </div>
        </nav>
        <div class="content">
          {props.children}
        </div>
      </div>
      <StatusBar />
    </div>
  );
}

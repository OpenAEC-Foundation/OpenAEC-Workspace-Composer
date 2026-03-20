import { createMemo, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { ParentProps } from "solid-js";
import { Titlebar } from "../components/Titlebar";
import { StatusBar } from "../components/StatusBar";
import { packagesStore } from "../stores/packages.store";
import { gpuStore } from "../stores/gpu.store";

function NavIcon(props: { icon: string }) {
  const icons: Record<string, () => any> = {
    dashboard: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
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
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    configure: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

  return (
    <div class="app">
      <Titlebar />
      <div class="app-main">
        <nav class="sidebar">
          <div class="sidebar-brand">
            <svg class="sidebar-brand-logo" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span class="sidebar-brand-name">Open<span>AEC</span></span>
          </div>
          <div class="sidebar-nav">
            <div class="sidebar-nav-group">
              <div class="sidebar-nav-group-title">Navigate</div>
              <A href="/" class="sidebar-nav-item" activeClass="active" end>
                <NavIcon icon="dashboard" />
                <span>Dashboard</span>
              </A>
              <A href="/packages" class="sidebar-nav-item" activeClass="active">
                <NavIcon icon="packages" />
                <span>Packages</span>
                {selectedCount() > 0 && (
                  <span class="sidebar-badge">{selectedCount()}</span>
                )}
              </A>
              <A href="/workspace" class="sidebar-nav-item" activeClass="active">
                <NavIcon icon="workspace" />
                <span>Workspace</span>
              </A>
              <A href="/configure" class="sidebar-nav-item" activeClass="active">
                <NavIcon icon="configure" />
                <span>Configure</span>
              </A>
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
            </div>
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

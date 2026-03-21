import { createMemo, Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import { gpuStore } from "../stores/gpu.store";
import { appStore } from "../stores/app.store";
import { TbOutlinePackage, TbOutlineBolt, TbOutlineFolder, TbOutlineSettings, TbOutlineShield, TbOutlineLink, TbOutlineCpu, TbOutlineFileText, TbOutlineServer, TbOutlineRefresh } from "solid-icons/tb";
import openaecSymbol from "../assets/openaec-symbol.svg";

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
          <img src={openaecSymbol} alt="OpenAEC" width="34" height="40" style={{ "flex-shrink": "0" }} />
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
              <TbOutlinePackage size={24} />
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
              <TbOutlineBolt size={24} />
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
              <TbOutlineFolder size={20} />
            </div>
            <strong>Workspace</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>Path & project</span>
          </A>

          <A href="/configure" class="tile">
            <div class="tile-icon" style={{ color: "var(--warm-gold)" }}>
              <TbOutlineSettings size={20} />
            </div>
            <strong>Settings</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>Claude config</span>
          </A>

          <A href="/permissions" class="tile">
            <div class="tile-icon" style={{ color: "var(--success)" }}>
              <TbOutlineShield size={20} />
            </div>
            <strong>Permissions</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>Allow & deny</span>
          </A>

          <A href="/hooks" class="tile">
            <div class="tile-icon" style={{ color: "#a78bfa" }}>
              <TbOutlineLink size={20} />
            </div>
            <strong>Hooks</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>Event triggers</span>
          </A>

          <A href="/mcp" class="tile">
            <div class="tile-icon" style={{ color: "#f472b6" }}>
              <TbOutlineCpu size={20} />
            </div>
            <strong>MCP Servers</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>External tools</span>
          </A>

          <A href="/templates" class="tile">
            <div class="tile-icon" style={{ color: "#38bdf8" }}>
              <TbOutlineFileText size={20} />
            </div>
            <strong>Templates</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>CLAUDE.md</span>
          </A>

          {/* Row 3: Remote */}
          <A href="/gpu-server" class="tile">
            <div class="tile-icon" style={{ color: gpuStore.connected() ? "var(--success)" : "var(--text-muted)" }}>
              <TbOutlineServer size={20} />
            </div>
            <strong>GPU Server</strong>
            <span class="text-dim" style={{ "font-size": "0.7rem" }}>
              {gpuStore.connected() ? "Connected" : "Not connected"}
            </span>
          </A>

          <A href="/sync" class="tile">
            <div class="tile-icon" style={{ color: gpuStore.activeSyncCount() > 0 ? "var(--success)" : "var(--text-muted)" }}>
              <TbOutlineRefresh size={20} />
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

import { createMemo, createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { ParentProps } from "solid-js";
import { Titlebar } from "../components/Titlebar";
import { StatusBar } from "../components/StatusBar";
import { FeedbackDialog } from "../components/FeedbackDialog";
import { packagesStore } from "../stores/packages.store";
import { gpuStore } from "../stores/gpu.store";
import { appStore } from "../stores/app.store";
import { PageTransition } from "../components/PageTransition";
import { TbOutlineHome, TbOutlineBolt, TbOutlinePackage, TbOutlineFolder, TbOutlineSettings, TbOutlineLink, TbOutlineShield, TbOutlineCpu, TbOutlineFileText, TbOutlineCloudDownload, TbOutlineServer, TbOutlineRefresh, TbOutlineInfoCircle, TbOutlineSun, TbOutlineMoon, TbOutlineMessage, TbOutlineBulb, TbOutlineClock, TbOutlineShare } from "solid-icons/tb";
import openaecSymbol from "../assets/openaec-symbol.svg";

function NavIcon(props: { icon: string }) {
  const iconMap: Record<string, any> = {
    dashboard: TbOutlineHome,
    quickstart: TbOutlineBolt,
    packages: TbOutlinePackage,
    workspace: TbOutlineFolder,
    configure: TbOutlineSettings,
    hooks: TbOutlineLink,
    permissions: TbOutlineShield,
    mcp: TbOutlineCpu,
    templates: TbOutlineFileText,
    install: TbOutlineCloudDownload,
    "gpu-server": TbOutlineServer,
    sync: TbOutlineRefresh,
    about: TbOutlineInfoCircle,
    "manage-overview": TbOutlineHome,
    "manage-projects": TbOutlineFolder,
    "manage-claude": TbOutlineFileText,
    "manage-lessons": TbOutlineBulb,
    "manage-sessions": TbOutlineClock,
    "manage-integrations": TbOutlineShare,
  };
  const Icon = iconMap[props.icon];
  return Icon ? <Icon size={18} /> : null;
}

export function AppLayout(props: ParentProps) {
  const selectedCount = createMemo(() => packagesStore.selectedPackages().length);
  const gpuConnected = createMemo(() => gpuStore.connected());
  const gpuSyncCount = createMemo(() => gpuStore.activeSyncCount());
  const advanced = createMemo(() => appStore.isAdvanced());
  const manage = createMemo(() => appStore.isManage());
  const [feedbackOpen, setFeedbackOpen] = createSignal(false);

  return (
    <div class="app">
      <Titlebar />
      <div class="app-main">
        <nav class="sidebar">
          <div class="sidebar-brand">
            <img src={openaecSymbol} alt="OpenAEC" class="sidebar-brand-logo" width="28" height="34" />
            <span class="sidebar-brand-name">Open<span>AEC</span></span>
          </div>

          {/* Mode toggle — three-way */}
          <div style={{ padding: "0 var(--sp-3)", "margin-bottom": "var(--sp-2)" }}>
            <div class="mode-toggle">
              <span
                class={`mode-toggle-option ${appStore.mode() === "simple" ? "active" : ""}`}
                onClick={() => appStore.setMode("simple")}
              >Simple</span>
              <span
                class={`mode-toggle-option ${appStore.mode() === "advanced" ? "active" : ""}`}
                onClick={() => appStore.setMode("advanced")}
              >Advanced</span>
              <span
                class={`mode-toggle-option ${appStore.mode() === "manage" ? "active" : ""}`}
                onClick={() => appStore.setMode("manage")}
              >Manage</span>
            </div>
          </div>

          <div class="sidebar-nav">
            {/* === SIMPLE MODE === */}
            <Show when={appStore.mode() === "simple"}>
              <div class="sidebar-nav-group">
                <A href="/workspace" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="workspace" />
                  <span>Workspace</span>
                </A>
                <A href="/presets" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="quickstart" />
                  <span>Presets</span>
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
                  <NavIcon icon="packages" />
                  <span>Packages</span>
                  {selectedCount() > 0 && (
                    <span class="sidebar-badge">{selectedCount()}</span>
                  )}
                </A>
                <A href="/presets" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="quickstart" />
                  <span>Presets</span>
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
                <A href="/commands" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="templates" />
                  <span>Commands</span>
                </A>
                <A href="/memory" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="about" />
                  <span>Memory</span>
                </A>
              </div>

              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Templates</div>
                <A href="/templates" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="templates" />
                  <span>CLAUDE.md</span>
                </A>
                <A href="/core-files" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="templates" />
                  <span>CORE Files</span>
                </A>
                <A href="/prompts" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="templates" />
                  <span>Prompts</span>
                </A>
              </div>

              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Teams</div>
                <A href="/teams" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="configure" />
                  <span>Team Factory</span>
                </A>
              </div>

              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Infrastructure</div>
                <A href="/gpu-server" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="gpu-server" />
                  <span>GPU Server</span>
                  <Show when={gpuConnected()}>
                    <span class="sidebar-badge" style={{ background: gpuSyncCount() > 0 ? "var(--success)" : "var(--accent)" }}>
                      {gpuSyncCount() > 0 ? gpuSyncCount() : ""}
                    </span>
                  </Show>
                </A>
                <A href="/auth" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="permissions" />
                  <span>Authentication</span>
                </A>
                <A href="/git" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="workspace" />
                  <span>Git</span>
                </A>
              </div>
            </Show>

            {/* === MANAGE MODE === */}
            <Show when={manage()}>
              <div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">Manage</div>
                <A href="/manage" class="sidebar-nav-item" activeClass="active" end>
                  <NavIcon icon="manage-overview" />
                  <span>Overview</span>
                </A>
                <A href="/manage/projects" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="manage-projects" />
                  <span>Projects</span>
                </A>
                <A href="/manage/lessons" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="manage-lessons" />
                  <span>Lessons Learned</span>
                </A>
                <A href="/manage/sessions" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="manage-sessions" />
                  <span>Sessions</span>
                </A>
                <A href="/manage/integrations" class="sidebar-nav-item" activeClass="active">
                  <NavIcon icon="manage-integrations" />
                  <span>Integrations</span>
                </A>
              </div>
            </Show>

            <div class="sidebar-nav-group">
              <A href="/about" class="sidebar-nav-item" activeClass="active">
                <NavIcon icon="about" />
                <span>About</span>
              </A>
            </div>

            <div class="sidebar-nav-group">
              <button class="sidebar-feedback-btn" onClick={() => setFeedbackOpen(true)}>
                <TbOutlineMessage size={16} />
                <span>Send Feedback</span>
              </button>
            </div>
          </div>
          <div class="sidebar-footer">
            <button
              class="btn btn-ghost"
              style={{ padding: "4px", "line-height": "1" }}
              onClick={() => appStore.toggleTheme()}
              title={appStore.theme() === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {appStore.theme() === "dark" ? <TbOutlineSun size={14} /> : <TbOutlineMoon size={14} />}
            </button>
            <span class="version">v3.0.0</span>
            <span>OpenAEC Foundation</span>
          </div>
        </nav>
        <div class="content">
          <PageTransition>
            {props.children}
          </PageTransition>
        </div>
      </div>
      <StatusBar />
      <FeedbackDialog open={feedbackOpen()} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

import { createMemo, For, Show, onMount, onCleanup } from "solid-js";
import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import { configStore } from "../stores/config.store";
import { installStore } from "../stores/install.store";
import { getWorkflowType } from "../lib/workflows";

export function InstallPage() {
  const currentWorkflow = createMemo(() => getWorkflowType(workspaceStore.workflowType()));

  const selectedPackageObjects = createMemo(() =>
    packagesStore.registryPackages().filter((p) => packagesStore.selectedPackages().includes(p.id))
  );

  const totalSkills = createMemo(() =>
    selectedPackageObjects().reduce((sum, p) => sum + p.skillCount, 0)
  );

  const publishedCount = createMemo(() =>
    selectedPackageObjects().filter((p) => p.status === "published").length
  );

  const enabledCoreFiles = createMemo(() =>
    configStore.coreFiles().filter((f) => f.enabled)
  );

  const buttonLabel = createMemo(() =>
    workspaceStore.workflowType() === "skill-package" ? "Install Workspace" : "Bootstrap Upgrade"
  );

  function canInstall(): boolean {
    if (!workspaceStore.workspacePath()) return false;
    if (workspaceStore.workflowType() === "skill-package") {
      return packagesStore.selectedPackages().length > 0;
    }
    return workspaceStore.sourceVersion() !== "" && workspaceStore.targetVersion() !== "";
  }

  // Listen for install-progress events from Tauri backend
  onMount(async () => {
    try {
      const { listen } = await import("@tauri-apps/api/event");
      const unlisten = await listen<{
        step: string;
        current: number;
        total: number;
        percent: number;
        detail: string;
      }>("install-progress", (event) => {
        const progress = event.payload;
        installStore.setInstallProgress(progress.percent);
        installStore.setInstallSteps((prev) => {
          const existing = prev.find((s) => s.id === progress.step);
          if (existing) {
            return prev.map((s) =>
              s.id === progress.step
                ? { ...s, status: progress.percent >= 100 ? "done" as const : "active" as const, label: progress.detail }
                : s
            );
          }
          return [
            ...prev.map((s) => (s.status === "active" ? { ...s, status: "done" as const } : s)),
            { id: progress.step, label: progress.detail, status: "active" as const },
          ];
        });
      });
      onCleanup(() => unlisten());
    } catch {
      // Not running in Tauri environment
    }
  });

  async function handleInstall() {
    if (!canInstall()) return;
    installStore.resetInstall();
    installStore.setInstallStatus("installing");
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke("install_workspace", {
        request: {
          workflow_type: workspaceStore.workflowType(),
          path: workspaceStore.workspacePath(),
          name: workspaceStore.projectName(),
          effort: workspaceStore.effortLevel(),
          packages: workspaceStore.workflowType() === "skill-package" ? packagesStore.selectedPackages() : undefined,
          source_version: workspaceStore.workflowType() === "version-upgrade" ? workspaceStore.sourceVersion() : undefined,
          target_version: workspaceStore.workflowType() === "version-upgrade" ? workspaceStore.targetVersion() : undefined,
          target_repo: workspaceStore.workflowType() === "version-upgrade" ? workspaceStore.targetRepo() : undefined,
          init_git: true,
          open_vscode: false,
          core_files: [],
          permissions: [],
        },
      });
      installStore.setInstallResult(result as any);
      installStore.setInstallStatus("success");
      // Mark all steps as done
      installStore.setInstallSteps((prev) =>
        prev.map((s) => ({ ...s, status: "done" as const }))
      );
    } catch (e) {
      installStore.setInstallError(e instanceof Error ? e.message : String(e));
      installStore.setInstallStatus("error");
      // Mark last active step as error
      installStore.setInstallSteps((prev) => {
        const lastActive = [...prev].reverse().find((s) => s.status === "active");
        if (lastActive) {
          return prev.map((s) =>
            s.id === lastActive.id ? { ...s, status: "error" as const } : s
          );
        }
        return prev;
      });
    }
  }

  async function handleOpenVSCode() {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = installStore.installResult();
      if (result) {
        const wsFile = workspaceStore.workspacePath() + "/" + result.workspaceFile;
        await invoke("open_in_vscode", { path: wsFile });
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Selected packages summary */}
        <Show when={workspaceStore.workflowType() === "skill-package"}>
          <div class="card">
            <h2 class="card-title">Selected Packages</h2>
            <div class="preview-stats">
              <div class="stat">
                <span class="stat-value">{selectedPackageObjects().length}</span>
                <span class="stat-label">Packages</span>
              </div>
              <div class="stat">
                <span class="stat-value">{totalSkills()}</span>
                <span class="stat-label">Skills</span>
              </div>
              <div class="stat">
                <span class="stat-value">{publishedCount()}</span>
                <span class="stat-label">Published</span>
              </div>
            </div>

            <Show
              when={selectedPackageObjects().length > 0}
              fallback={
                <div class="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <p>No packages selected</p>
                  <small>Go to Packages to select skill packages</small>
                </div>
              }
            >
              <div class="preview-list" style={{ "margin-top": "var(--sp-3)" }}>
                <For each={selectedPackageObjects()}>
                  {(pkg) => (
                    <div class="preview-item">
                      <span class="preview-name">{pkg.name}</span>
                      <div class="flex items-center gap-2">
                        <span class="preview-skills">{pkg.skillCount} skills</span>
                        <button
                          class="btn btn-ghost btn-sm"
                          onClick={() => packagesStore.removePackage(pkg.id)}
                          aria-label={`Remove ${pkg.name}`}
                          style={{ padding: "2px 4px", "min-width": "auto" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        {/* Version upgrade summary */}
        <Show when={workspaceStore.workflowType() === "version-upgrade"}>
          <div class="card">
            <h2 class="card-title">Upgrade Summary</h2>
            <div class="preview-stats">
              <div class="stat">
                <span class="stat-value">{currentWorkflow().outputFiles.length}</span>
                <span class="stat-label">Files</span>
              </div>
              <div class="stat">
                <span class="stat-value">7</span>
                <span class="stat-label">Phases</span>
              </div>
            </div>
            <div style={{ "margin-top": "var(--sp-3)", "font-size": "0.85rem" }}>
              <Show when={workspaceStore.sourceVersion()}>
                <p class="text-dim">
                  <strong style={{ color: "var(--text-primary)" }}>From:</strong> {workspaceStore.sourceVersion()}
                  {" "}<strong style={{ color: "var(--text-primary)" }}>To:</strong> {workspaceStore.targetVersion()}
                </p>
              </Show>
              <Show when={workspaceStore.targetRepo()}>
                <p class="text-dim font-mono" style={{ "margin-top": "var(--sp-1)", "font-size": "0.75rem" }}>
                  {workspaceStore.targetRepo()}
                </p>
              </Show>
            </div>
          </div>
        </Show>

        {/* Generated files list */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Generated Files</h2>
          <div class="preview-output">
            <ul>
              <For each={currentWorkflow().outputFiles}>
                {(file) => <li><code>{file}</code></li>}
              </For>
            </ul>
          </div>
          <Show when={enabledCoreFiles().length > 0}>
            <h3 style={{ "font-size": "0.85rem", "margin-top": "var(--sp-3)", "margin-bottom": "var(--sp-2)", color: "var(--text-dim)" }}>
              Core files:
            </h3>
            <ul style={{ "list-style": "none", "font-size": "0.8rem" }}>
              <For each={enabledCoreFiles()}>
                {(file) => (
                  <li style={{ padding: "var(--sp-1) 0", color: "var(--text-dim)" }}>
                    <code class="font-mono">{file.name}</code>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>

        {/* Prerequisites check */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Prerequisites</h2>
          <Show
            when={installStore.prerequisites().length > 0}
            fallback={
              <div class="empty-state" style={{ padding: "var(--sp-4)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p>Prerequisite checks will run before install</p>
              </div>
            }
          >
            <For each={installStore.prerequisites()}>
              {(prereq) => (
                <div class="config-item" style={{
                  display: "flex",
                  "justify-content": "space-between",
                  "align-items": "center",
                  padding: "var(--sp-2) var(--sp-3)",
                  background: "var(--bg-input)",
                  "border-radius": "var(--radius-sm)",
                  "margin-bottom": "var(--sp-2)",
                }}>
                  <div>
                    <strong style={{ "font-size": "0.85rem" }}>{prereq.name}</strong>
                    <Show when={prereq.version}>
                      <small class="text-dim font-mono" style={{ "margin-left": "var(--sp-2)" }}>{prereq.version}</small>
                    </Show>
                  </div>
                  <span style={{ color: prereq.found ? "var(--success)" : prereq.required ? "var(--error)" : "var(--text-muted)", "font-size": "0.75rem" }}>
                    {prereq.found ? "Found" : prereq.required ? "Missing" : "Optional"}
                  </span>
                </div>
              )}
            </For>
          </Show>
        </div>

        {/* Installation progress */}
        <Show when={installStore.installStatus() === "installing"}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "border-left": "3px solid var(--accent)" }}>
            <h2 class="card-title">Installing...</h2>
            <div class="install-progress">
              <div class="progress-bar">
                <div class="progress-fill" style={{ width: `${installStore.installProgress()}%` }} />
              </div>
              <For each={installStore.installSteps()}>
                {(step) => (
                  <div class={`progress-step ${step.status}`}>
                    <span class="step-indicator">
                      {step.status === "done" ? "\u2713" : step.status === "active" ? "\u25CF" : step.status === "error" ? "\u2717" : "\u25CB"}
                    </span>
                    <span>{step.label}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Validation warnings */}
        <Show when={!canInstall() && installStore.installStatus() !== "installing"}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "border-left": "3px solid var(--warm-gold)" }}>
            <p class="text-dim" style={{ "font-size": "0.8rem" }}>
              <Show when={!workspaceStore.workspacePath()}>
                Set a workspace path on the Workspace page to continue.
              </Show>
              <Show when={workspaceStore.workspacePath() && workspaceStore.workflowType() === "skill-package" && packagesStore.selectedPackages().length === 0}>
                Select at least one package on the Packages page.
              </Show>
              <Show when={workspaceStore.workspacePath() && workspaceStore.workflowType() === "version-upgrade" && (workspaceStore.sourceVersion() === "" || workspaceStore.targetVersion() === "")}>
                Configure source and target versions on the Workspace page.
              </Show>
            </p>
          </div>
        </Show>

        {/* Install result */}
        <Show when={installStore.installStatus() === "success" && installStore.installResult()}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "border-left": "3px solid var(--success)" }}>
            <h2 class="card-title" style={{ color: "var(--success)" }}>Workspace Installed</h2>
            <p class="text-dim" style={{ "font-size": "0.85rem" }}>
              Workspace file: <code class="font-mono">{installStore.installResult()!.workspaceFile}</code>
            </p>
            <p class="text-dim" style={{ "font-size": "0.8rem", "margin-top": "var(--sp-1)" }}>
              {installStore.installResult()!.filesCreated.length} files created
              <Show when={(installStore.installResult() as any)?.packagesInstalled?.length > 0}>
                {" "}&middot; {(installStore.installResult() as any).packagesInstalled.length} packages installed
              </Show>
              <Show when={(installStore.installResult() as any)?.skillsTotal > 0}>
                {" "}&middot; {(installStore.installResult() as any).skillsTotal} skills
              </Show>
            </p>

            {/* Completed progress steps */}
            <Show when={installStore.installSteps().length > 0}>
              <div class="install-progress" style={{ "margin-top": "var(--sp-3)" }}>
                <For each={installStore.installSteps()}>
                  {(step) => (
                    <div class={`progress-step ${step.status}`}>
                      <span class="step-indicator">
                        {step.status === "done" ? "\u2713" : step.status === "error" ? "\u2717" : "\u25CB"}
                      </span>
                      <span>{step.label}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <div style={{ "margin-top": "var(--sp-4)", display: "flex", gap: "var(--sp-3)" }}>
              <button class="btn-success" onClick={handleOpenVSCode}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ "margin-right": "6px", "vertical-align": "middle" }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open in VS Code
              </button>
            </div>
          </div>
        </Show>

        {/* Install error */}
        <Show when={installStore.installStatus() === "error"}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "border-left": "3px solid var(--error)" }}>
            <h2 class="card-title" style={{ color: "var(--error)" }}>Installation Error</h2>
            <p class="text-dim font-mono" style={{ "font-size": "0.8rem" }}>
              {installStore.installError()}
            </p>

            {/* Show progress steps with error */}
            <Show when={installStore.installSteps().length > 0}>
              <div class="install-progress" style={{ "margin-top": "var(--sp-3)" }}>
                <For each={installStore.installSteps()}>
                  {(step) => (
                    <div class={`progress-step ${step.status}`}>
                      <span class="step-indicator">
                        {step.status === "done" ? "\u2713" : step.status === "error" ? "\u2717" : "\u25CB"}
                      </span>
                      <span>{step.label}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        {/* Install button */}
        <div style={{ "margin-top": "var(--sp-4)", "padding-bottom": "var(--sp-4)" }}>
          <button
            class="btn btn-generate"
            style={{ width: "100%" }}
            onClick={handleInstall}
            disabled={installStore.isInstalling() || !canInstall()}
          >
            <Show when={!installStore.isInstalling()} fallback={
              <>
                <span class="spinner" />
                Installing...
              </>
            }>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              {buttonLabel()}
            </Show>
          </button>
        </div>
      </div>
    </div>
  );
}

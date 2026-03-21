import { createMemo, For, Show, onMount, onCleanup } from "solid-js";
import { workspaceStore } from "../stores/workspace.store";
import type { PathValidation } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import { installStore } from "../stores/install.store";
import type { ConflictStrategy } from "../stores/install.store";

export function InstallPage() {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function debouncedValidate(path: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!path) { workspaceStore.setPathValidation(null); return; }
    debounceTimer = setTimeout(() => validatePath(path), 300);
  }

  async function validatePath(path: string) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<PathValidation>("validate_path", { path });
      workspaceStore.setPathValidation(result);
    } catch { workspaceStore.setPathValidation(null); }
  }

  function handlePathChange(path: string) {
    workspaceStore.setWorkspacePath(path);
    debouncedValidate(path);
  }

  async function handleBrowse() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) {
        workspaceStore.setWorkspacePath(selected as string);
        await validatePath(selected as string);
      }
    } catch {
      const path = prompt("Workspace pad:");
      if (path) { workspaceStore.setWorkspacePath(path); debouncedValidate(path); }
    }
  }

  async function handleCreateDirectory() {
    const path = workspaceStore.workspacePath();
    if (!path) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("create_directory", { path });
      await validatePath(path);
    } catch (e) { console.error("Failed to create directory:", e); }
  }

  const validation = () => workspaceStore.pathValidation();
  const pathIsValid = createMemo(() => {
    const v = validation();
    return v !== null && v.exists && v.is_dir && v.is_writable;
  });
  const selectedPackageObjects = createMemo(() =>
    packagesStore.registryPackages().filter((p) => packagesStore.selectedPackages().includes(p.id))
  );

  const totalSkills = createMemo(() =>
    selectedPackageObjects().reduce((sum, p) => sum + p.skillCount, 0)
  );

  function canInstall(): boolean {
    if (!pathIsValid()) return false;
    if (packagesStore.selectedPackages().length === 0) return false;
    if (installStore.prerequisitesChecked() && !installStore.allPrerequisitesMet()) return false;
    return true;
  }

  // Run prerequisites check on mount
  onMount(async () => {
    if (!installStore.prerequisitesChecked()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const report = await invoke<{
          checks: Array<{
            name: string;
            command: string;
            required: boolean;
            found: boolean;
            version: string | null;
            installHint: string;
          }>;
          allRequiredOk: boolean;
        }>("check_prerequisites");
        installStore.setPrerequisites(
          report.checks.map((c) => ({
            id: c.command,
            name: c.name,
            required: c.required,
            found: c.found,
            version: c.version ?? undefined,
            installHint: c.installHint,
          }))
        );
        installStore.setPrerequisitesChecked(true);
      } catch {
        // Not in Tauri, skip
      }
    }
  });

  // Listen for install-progress events
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
    } catch {}
  });

  async function handleScanAndInstall() {
    if (!canInstall()) return;
    installStore.resetInstall();

    // Scan for conflicts first
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<{
        conflicts: Array<{ path: string; kind: string; description: string; existingSize: number | null }>;
        hasConflicts: boolean;
      }>("scan_conflicts", {
        path: workspaceStore.workspacePath(),
        packages: packagesStore.selectedPackages(),
        name: workspaceStore.projectName?.() ?? "",
      });

      if (result.hasConflicts) {
        installStore.setConflicts(result.conflicts);
        installStore.setInstallStatus("conflicts");
        return;
      }
    } catch {
      // If scan fails (not in Tauri), proceed directly
    }

    await doInstall();
  }

  async function doInstall() {
    installStore.setInstallStatus("installing");
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke("install_workspace", {
        request: {
          workflowType: "skill-package",
          path: workspaceStore.workspacePath(),
          name: workspaceStore.projectName?.() ?? "",
          effort: workspaceStore.effortLevel?.() ?? "medium",
          packages: packagesStore.selectedPackages(),
          initGit: true,
          openVscode: false,
          coreFiles: [],
          permissions: [],
          conflictStrategy: installStore.conflictStrategy(),
        },
      });
      installStore.setInstallResult(result as any);
      installStore.setInstallStatus("success");
      installStore.setInstallSteps((prev) =>
        prev.map((s) => ({ ...s, status: "done" as const }))
      );
    } catch (e) {
      installStore.setInstallError(e instanceof Error ? e.message : String(e));
      installStore.setInstallStatus("error");
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
    } catch {}
  }

  const strategyOptions: { id: ConflictStrategy; label: string; desc: string }[] = [
    { id: "merge", label: "Merge", desc: "Add new skills, keep existing files" },
    { id: "skip", label: "Skip", desc: "Only install what's missing" },
    { id: "overwrite", label: "Overwrite", desc: "Replace everything" },
  ];

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Selected packages summary */}
        <div class="card">
          <h2 class="card-title">Install Summary</h2>
          <div class="preview-stats">
            <div class="stat">
              <span class="stat-value">{selectedPackageObjects().length}</span>
              <span class="stat-label">Packages</span>
            </div>
            <div class="stat">
              <span class="stat-value">{totalSkills()}</span>
              <span class="stat-label">Skills</span>
            </div>
          </div>

          <Show
            when={selectedPackageObjects().length > 0}
            fallback={
              <div class="empty-state">
                <p>No packages selected</p>
                <small>Go to Workspace to select skill packages</small>
              </div>
            }
          >
            <div class="preview-list" style={{ "margin-top": "var(--sp-3)" }}>
              <For each={selectedPackageObjects()}>
                {(pkg) => (
                  <div class="preview-item">
                    <span class="preview-name">{pkg.name}</span>
                    <span class="preview-skills">{pkg.skillCount} skills</span>
                  </div>
                )}
              </For>
            </div>
          </Show>

        </div>

        {/* Workspace location */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Install Location</h2>
          <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-3)" }}>
            Kies de map waar je workspace aangemaakt wordt. Skills worden geinstalleerd in .claude/skills/.
          </p>

          <button
            class="btn btn-primary"
            style={{ width: "100%", "margin-bottom": "var(--sp-2)", padding: "var(--sp-3)" }}
            onClick={handleBrowse}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style={{ "margin-right": "var(--sp-2)", "vertical-align": "middle" }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Kies map
          </button>

          <Show when={workspaceStore.workspacePath()}>
            <div style={{
              display: "flex",
              "align-items": "center",
              gap: "var(--sp-2)",
              padding: "var(--sp-2) var(--sp-3)",
              background: "var(--bg-input)",
              "border-radius": "var(--radius)",
              "border": "1px solid var(--border)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <code class="font-mono" style={{ "font-size": "0.8rem", flex: 1, "word-break": "break-all" }}>
                {workspaceStore.workspacePath()}
              </code>
              <button
                class="btn btn-ghost"
                style={{ padding: "2px 6px", "font-size": "0.7rem" }}
                onClick={() => { workspaceStore.setWorkspacePath(""); workspaceStore.setPathValidation(null); }}
              >
                Wijzig
              </button>
            </div>
          </Show>

          {/* Path validation */}
          <Show when={workspaceStore.workspacePath()}>
            <div style={{ "margin-top": "var(--sp-2)", display: "flex", "align-items": "center", gap: "var(--sp-2)" }}>
              <Show when={validation()} fallback={
                <span class="text-muted" style={{ "font-size": "0.75rem" }}>Validating...</span>
              }>
                {(v) => (
                  <>
                    <Show when={v().exists && v().is_dir && v().is_writable}>
                      <span class="dot valid" />
                      <span style={{ color: "var(--success)", "font-size": "0.75rem" }}>Valid path</span>
                    </Show>
                    <Show when={v().exists && v().is_dir && !v().is_writable}>
                      <span class="dot error" />
                      <span style={{ color: "var(--error)", "font-size": "0.75rem" }}>Not writable</span>
                    </Show>
                    <Show when={!v().exists}>
                      <span class="dot error" />
                      <span style={{ color: "var(--error)", "font-size": "0.75rem" }}>Does not exist</span>
                      <button class="btn btn-ghost btn-sm" style={{ "font-size": "0.7rem" }} onClick={handleCreateDirectory}>
                        Create
                      </button>
                    </Show>
                    <Show when={v().has_claude_dir}>
                      <span class="text-muted" style={{ "font-size": "0.7rem", "margin-left": "var(--sp-2)" }}>
                        (has .claude config)
                      </span>
                    </Show>
                  </>
                )}
              </Show>
            </div>
          </Show>
        </div>

        {/* Prerequisites check */}
        <Show when={installStore.prerequisitesChecked()}>
          <div class="card" style={{
            "margin-top": "var(--sp-4)",
            "border-left": `3px solid ${installStore.allPrerequisitesMet() ? "var(--success)" : "var(--error)"}`,
          }}>
            <h2 class="card-title" style={{
              color: installStore.allPrerequisitesMet() ? "var(--success)" : "var(--error)"
            }}>
              {installStore.allPrerequisitesMet() ? "Prerequisites OK" : "Missing Prerequisites"}
            </h2>
            <div class="prereq-grid">
              <For each={installStore.prerequisites()}>
                {(prereq) => (
                  <div class="prereq-item">
                    <span class={`prereq-dot ${prereq.found ? "ok" : prereq.required ? "missing" : "optional"}`} />
                    <div class="prereq-info">
                      <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)" }}>
                        <strong style={{ "font-size": "0.8rem" }}>{prereq.name}</strong>
                        <Show when={prereq.required}>
                          <span class="text-muted" style={{ "font-size": "0.65rem" }}>required</span>
                        </Show>
                      </div>
                      <Show when={prereq.found && prereq.version}>
                        <span class="font-mono text-dim" style={{ "font-size": "0.7rem" }}>{prereq.version}</span>
                      </Show>
                      <Show when={!prereq.found && prereq.installHint}>
                        <code class="font-mono" style={{ "font-size": "0.65rem", color: "var(--accent)" }}>
                          {prereq.installHint}
                        </code>
                      </Show>
                    </div>
                    <span style={{
                      "font-size": "0.75rem",
                      color: prereq.found ? "var(--success)" : prereq.required ? "var(--error)" : "var(--text-muted)",
                    }}>
                      {prereq.found ? "\u2713" : prereq.required ? "\u2717" : "\u2014"}
                    </span>
                  </div>
                )}
              </For>
            </div>
            <Show when={!installStore.allPrerequisitesMet()}>
              <p class="text-dim" style={{ "margin-top": "var(--sp-3)", "font-size": "0.8rem" }}>
                Install the missing required tools and refresh to continue.
              </p>
              <button
                class="btn btn-secondary btn-sm"
                style={{ "margin-top": "var(--sp-2)" }}
                onClick={async () => {
                  installStore.setPrerequisitesChecked(false);
                  try {
                    const { invoke } = await import("@tauri-apps/api/core");
                    const report = await invoke<any>("check_prerequisites");
                    installStore.setPrerequisites(
                      report.checks.map((c: any) => ({
                        id: c.command,
                        name: c.name,
                        required: c.required,
                        found: c.found,
                        version: c.version ?? undefined,
                        installHint: c.installHint,
                      }))
                    );
                    installStore.setPrerequisitesChecked(true);
                  } catch {}
                }}
              >
                Re-check
              </button>
            </Show>
          </div>
        </Show>

        {/* Conflict resolution UI */}
        <Show when={installStore.installStatus() === "conflicts"}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "border-left": "3px solid var(--warm-gold)" }}>
            <h2 class="card-title" style={{ color: "var(--warm-gold)" }}>
              Existing Files Detected
            </h2>
            <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-3)" }}>
              The workspace already contains {installStore.conflicts().length} file(s) that would be affected.
            </p>

            {/* Conflict list */}
            <div class="conflict-list">
              <For each={installStore.conflicts()}>
                {(conflict) => (
                  <div class="conflict-item">
                    <div class="conflict-icon">
                      {conflict.kind === "skills" ? "\u{1F4E6}" : "\u{1F4C4}"}
                    </div>
                    <div class="conflict-info">
                      <code class="font-mono" style={{ "font-size": "0.75rem" }}>{conflict.path}</code>
                      <span class="text-muted" style={{ "font-size": "0.7rem" }}>{conflict.description}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>

            {/* Strategy selector */}
            <div style={{ "margin-top": "var(--sp-4)" }}>
              <label class="form-label">How to handle conflicts:</label>
              <div class="strategy-options">
                <For each={strategyOptions}>
                  {(opt) => (
                    <button
                      class={`strategy-option ${installStore.conflictStrategy() === opt.id ? "active" : ""}`}
                      onClick={() => installStore.setConflictStrategy(opt.id)}
                    >
                      <strong>{opt.label}</strong>
                      <span class="text-dim" style={{ "font-size": "0.7rem" }}>{opt.desc}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* Actions */}
            <div style={{ "margin-top": "var(--sp-4)", display: "flex", gap: "var(--sp-2)" }}>
              <button class="btn btn-generate" onClick={doInstall}>
                Continue with {installStore.conflictStrategy()}
              </button>
              <button class="btn btn-ghost" onClick={() => installStore.resetInstall()}>
                Cancel
              </button>
            </div>
          </div>
        </Show>

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
        <Show when={!canInstall() && installStore.installStatus() === "idle"}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "border-left": "3px solid var(--warm-gold)" }}>
            <p class="text-dim" style={{ "font-size": "0.8rem" }}>
              <Show when={!workspaceStore.workspacePath()}>
                Set a workspace path to continue.
              </Show>
              <Show when={workspaceStore.workspacePath() && packagesStore.selectedPackages().length === 0}>
                Select at least one package.
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
              <Show when={installStore.installResult()!.filesSkipped.length > 0}>
                {" "}&middot; {installStore.installResult()!.filesSkipped.length} skipped
              </Show>
              <Show when={(installStore.installResult() as any)?.packagesInstalled?.length > 0}>
                {" "}&middot; {(installStore.installResult() as any).packagesInstalled.length} packages
              </Show>
              <Show when={(installStore.installResult() as any)?.skillsTotal > 0}>
                {" "}&middot; {(installStore.installResult() as any).skillsTotal} skills
              </Show>
            </p>

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
        <Show when={installStore.installStatus() !== "conflicts"}>
          <div style={{ "margin-top": "var(--sp-4)", "padding-bottom": "var(--sp-4)" }}>
            <button
              class="btn btn-generate"
              style={{ width: "100%" }}
              onClick={handleScanAndInstall}
              disabled={installStore.isInstalling() || !canInstall()}
            >
              <Show when={!installStore.isInstalling()} fallback={
                <>
                  <span class="spinner" />
                  Installing...
                </>
              }>
                Install Workspace
              </Show>
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}

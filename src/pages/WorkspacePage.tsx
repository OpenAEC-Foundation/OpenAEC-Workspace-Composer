import { Show, For, createMemo, createSignal, onMount, onCleanup } from "solid-js";
import { WorkflowTypeSelector } from "../components/WorkflowTypeSelector";
import { PresetSelector } from "../components/PresetSelector";
import { UpgradeConfig } from "../components/UpgradeConfig";
import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import { presets } from "../lib/presets";
import type { WorkflowTypeId } from "../lib/workflows";
import type { Preset } from "../lib/presets";
import type { PathValidation } from "../stores/workspace.store";

export function WorkspacePage() {
  const filteredPresets = createMemo(() =>
    presets.filter((p) => p.workflowType === workspaceStore.workflowType())
  );

  const [showNewFolder, setShowNewFolder] = createSignal(false);
  const [newFolderName, setNewFolderName] = createSignal("");
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  // Load recent workspaces on mount
  onMount(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const recent = await invoke<string[]>("list_recent_workspaces");
      workspaceStore.setRecentWorkspaces(recent);
    } catch {
      // Not running in Tauri or no recent workspaces
    }
  });

  onCleanup(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  // Debounced path validation
  function debouncedValidate(path: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!path) {
      workspaceStore.setPathValidation(null);
      return;
    }
    debounceTimer = setTimeout(() => validatePath(path), 300);
  }

  async function validatePath(path: string) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<PathValidation>("validate_path", { path });
      workspaceStore.setPathValidation(result);
    } catch {
      workspaceStore.setPathValidation(null);
    }
  }

  function handlePathChange(path: string) {
    workspaceStore.setWorkspacePath(path);
    debouncedValidate(path);
  }

  async function handleCreateDirectory() {
    const path = workspaceStore.workspacePath();
    if (!path) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("create_directory", { path });
      await validatePath(path);
    } catch (e) {
      console.error("Failed to create directory:", e);
    }
  }

  async function handleCreateSubfolder() {
    const name = newFolderName().trim();
    if (!name) return;
    const base = workspaceStore.workspacePath() || ".";
    const fullPath = base.replace(/[\\/]$/, "") + "/" + name;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("create_directory", { path: fullPath });
      workspaceStore.setWorkspacePath(fullPath);
      setNewFolderName("");
      setShowNewFolder(false);
      await validatePath(fullPath);
    } catch (e) {
      console.error("Failed to create subfolder:", e);
    }
  }

  async function handleSelectRecent(path: string) {
    workspaceStore.setWorkspacePath(path);
    await validatePath(path);
  }

  function handleWorkflowTypeChange(id: WorkflowTypeId) {
    workspaceStore.setWorkflowType(id);
    packagesStore.clearSelection();
    workspaceStore.setSourceVersion("");
    workspaceStore.setTargetVersion("");
    workspaceStore.setTargetRepo("");
  }

  function handlePresetSelect(preset: Preset) {
    packagesStore.selectPreset(preset);
    if (preset.workflowType === "version-upgrade") {
      workspaceStore.setSourceVersion(preset.sourceVersion || "");
      workspaceStore.setTargetVersion(preset.targetVersion || "");
    }
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
      if (path) {
        workspaceStore.setWorkspacePath(path);
        debouncedValidate(path);
      }
    }
  }

  async function handleBrowseRepo() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) workspaceStore.setTargetRepo(selected as string);
    } catch {
      const path = prompt("Target repository pad:");
      if (path) workspaceStore.setTargetRepo(path);
    }
  }

  const validation = () => workspaceStore.pathValidation();

  const pathIsValid = createMemo(() => {
    const v = validation();
    return v !== null && v.exists && v.is_dir && v.is_writable;
  });

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Workflow type selection */}
        <WorkflowTypeSelector
          selected={workspaceStore.workflowType()}
          onSelect={handleWorkflowTypeChange}
        />

        {/* Preset selection */}
        <PresetSelector
          presets={filteredPresets()}
          selected={packagesStore.selectedPreset()}
          onSelect={handlePresetSelect}
        />

        {/* Workspace path configuration */}
        <div class="card">
          <h2 class="card-title">Workspace Path</h2>

          <div class="form-group">
            <label class="form-label">Project Name</label>
            <input
              type="text"
              class="form-input"
              placeholder="my-workspace"
              value={workspaceStore.projectName()}
              onInput={(e) => workspaceStore.setProjectName(e.currentTarget.value)}
            />
          </div>

          <div class="form-group" style={{ "margin-top": "var(--sp-3)" }}>
            <label class="form-label">Workspace Path</label>
            <div class="input-with-button">
              <input
                type="text"
                class="form-input"
                placeholder="C:\Projects\my-workspace"
                value={workspaceStore.workspacePath()}
                onInput={(e) => handlePathChange(e.currentTarget.value)}
                onPaste={(e) => {
                  const text = e.clipboardData?.getData("text");
                  if (text) {
                    e.preventDefault();
                    handlePathChange(text.trim());
                  }
                }}
              />
              <button class="btn btn-ghost" onClick={handleBrowse}>
                Browse
              </button>
            </div>

            {/* Path validation indicators */}
            <Show when={workspaceStore.workspacePath()}>
              <Show when={validation()} fallback={
                <div class="path-validation">
                  <span class="dot" style={{ background: "var(--text-muted)" }} />
                  <span class="message">Validating...</span>
                </div>
              }>
                {(v) => (
                  <>
                    <Show when={v().exists && v().is_dir && v().is_writable}>
                      <div class="path-validation">
                        <span class="dot valid" />
                        <span class="message valid">Valid workspace path</span>
                      </div>
                    </Show>
                    <Show when={v().exists && v().is_dir && !v().is_writable}>
                      <div class="path-validation">
                        <span class="dot error" />
                        <span class="message error">Directory is not writable</span>
                      </div>
                    </Show>
                    <Show when={!v().exists}>
                      <div class="path-validation">
                        <span class="dot error" />
                        <span class="message error">Path does not exist</span>
                        <button
                          class="btn btn-sm"
                          style={{ "margin-left": "var(--sp-2)", background: "var(--signal-orange)", color: "var(--text-primary)" }}
                          onClick={handleCreateDirectory}
                        >
                          Create
                        </button>
                      </div>
                    </Show>
                    <Show when={v().has_claude_dir}>
                      <div class="path-validation">
                        <span class="dot warning" />
                        <span class="message warning">Has existing .claude config</span>
                      </div>
                    </Show>
                    <Show when={v().has_workspace_file}>
                      <div class="path-validation">
                        <span class="dot warning" />
                        <span class="message warning">Has existing .code-workspace file</span>
                      </div>
                    </Show>
                  </>
                )}
              </Show>
            </Show>

            {/* New folder creation */}
            <div style={{ "margin-top": "var(--sp-2)" }}>
              <Show when={!showNewFolder()}>
                <button
                  class="btn btn-ghost btn-sm"
                  onClick={() => setShowNewFolder(true)}
                >
                  + Create New Folder
                </button>
              </Show>
              <Show when={showNewFolder()}>
                <div class="new-folder-input">
                  <input
                    type="text"
                    class="form-input"
                    placeholder="Folder name"
                    value={newFolderName()}
                    onInput={(e) => setNewFolderName(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateSubfolder();
                      if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
                    }}
                  />
                  <button class="btn btn-primary btn-sm" onClick={handleCreateSubfolder}>
                    Create
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </Show>
            </div>
          </div>

          {/* Effort level selector */}
          <div class="form-group" style={{ "margin-top": "var(--sp-3)" }}>
            <label class="form-label">Effort Level</label>
            <div style={{ display: "flex", gap: "var(--sp-2)" }}>
              <button
                class={`btn ${workspaceStore.effortLevel() === "low" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => workspaceStore.setEffortLevel("low")}
              >
                Low
              </button>
              <button
                class={`btn ${workspaceStore.effortLevel() === "medium" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => workspaceStore.setEffortLevel("medium")}
              >
                Medium
              </button>
              <button
                class={`btn ${workspaceStore.effortLevel() === "high" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => workspaceStore.setEffortLevel("high")}
              >
                High
              </button>
            </div>
          </div>
        </div>

        {/* Recent workspaces */}
        <Show when={workspaceStore.recentWorkspaces().length > 0}>
          <div class="card recent-workspaces">
            <h3>Recent Workspaces</h3>
            <For each={workspaceStore.recentWorkspaces()}>
              {(path) => (
                <div class="recent-item" onClick={() => handleSelectRecent(path)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span class="path">{path}</span>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Version upgrade config (conditional) */}
        <Show when={workspaceStore.workflowType() === "version-upgrade"}>
          <UpgradeConfig
            sourceVersion={workspaceStore.sourceVersion()}
            targetVersion={workspaceStore.targetVersion()}
            targetRepo={workspaceStore.targetRepo()}
            onSourceVersionChange={workspaceStore.setSourceVersion}
            onTargetVersionChange={workspaceStore.setTargetVersion}
            onTargetRepoChange={workspaceStore.setTargetRepo}
            onBrowseRepo={handleBrowseRepo}
          />
        </Show>
      </div>
    </div>
  );
}

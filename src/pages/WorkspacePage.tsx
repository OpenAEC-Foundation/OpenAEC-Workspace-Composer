import { Show, createMemo } from "solid-js";
import { WorkflowTypeSelector } from "../components/WorkflowTypeSelector";
import { PresetSelector } from "../components/PresetSelector";
import { UpgradeConfig } from "../components/UpgradeConfig";
import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import { presets } from "../lib/presets";
import type { WorkflowTypeId } from "../lib/workflows";
import type { Preset } from "../lib/presets";

export function WorkspacePage() {
  const filteredPresets = createMemo(() =>
    presets.filter((p) => p.workflowType === workspaceStore.workflowType())
  );

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
      if (selected) workspaceStore.setWorkspacePath(selected as string);
    } catch {
      const path = prompt("Workspace pad:");
      if (path) workspaceStore.setWorkspacePath(path);
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

  const pathValid = createMemo(() => {
    const p = workspaceStore.workspacePath();
    return p.length > 0;
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
                onInput={(e) => workspaceStore.setWorkspacePath(e.currentTarget.value)}
                onPaste={(e) => {
                  const text = e.clipboardData?.getData("text");
                  if (text) {
                    e.preventDefault();
                    workspaceStore.setWorkspacePath(text.trim());
                  }
                }}
              />
              <button class="btn btn-ghost" onClick={handleBrowse}>
                Browse
              </button>
            </div>
            <Show when={workspaceStore.workspacePath()}>
              <div style={{
                display: "flex",
                "align-items": "center",
                gap: "var(--sp-1)",
                "margin-top": "var(--sp-1)",
                "font-size": "0.75rem",
                color: pathValid() ? "var(--success)" : "var(--text-muted)",
              }}>
                <Show when={pathValid()}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Path set</span>
                </Show>
              </div>
            </Show>
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

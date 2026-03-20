import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import { installStore } from "../stores/install.store";
import type { WorkflowTypeId } from "../lib/workflows";
import { Show } from "solid-js";

const workflowLabels: Record<WorkflowTypeId, string> = {
  "skill-package": "Skill Package",
  "version-upgrade": "Version Upgrade",
};

export function StatusBar() {
  return (
    <div class="statusbar">
      <div class="statusbar-left">
        <span class="statusbar-item">
          <span class={`statusbar-dot ${installStore.isInstalling() ? "installing" : ""}`} />
          <Show when={!installStore.isInstalling()} fallback="Installing...">
            Ready
          </Show>
        </span>
        <span class="statusbar-item statusbar-workflow-badge">
          {workflowLabels[workspaceStore.workflowType()]}
        </span>
      </div>
      <div class="statusbar-right">
        <span class="statusbar-item">
          {packagesStore.selectedPackages().length} package{packagesStore.selectedPackages().length !== 1 ? "s" : ""} selected
        </span>
        <Show when={workspaceStore.workspacePath()}>
          <span class="statusbar-item" title={workspaceStore.workspacePath()} style={{ "max-width": "200px", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
            {workspaceStore.workspacePath().split(/[/\\]/).pop()}
          </span>
        </Show>
        <span class="statusbar-item" style={{ opacity: "0.7" }}>
          v3.0.0
        </span>
      </div>
    </div>
  );
}

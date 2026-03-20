import type { WorkflowTypeId } from "../lib/workflows";

interface Props {
  selectedCount: number;
  workflowType: WorkflowTypeId;
}

const workflowLabels: Record<WorkflowTypeId, string> = {
  "skill-package": "Skill Package",
  "version-upgrade": "Version Upgrade",
};

export function StatusBar(props: Props) {
  return (
    <div class="statusbar">
      <div class="statusbar-left">
        <span class="statusbar-item">
          <span class="statusbar-dot" />
          Ready
        </span>
        <span class="statusbar-item statusbar-workflow-badge">
          {workflowLabels[props.workflowType]}
        </span>
      </div>
      <div class="statusbar-right">
        <span class="statusbar-item">
          {props.selectedCount} package{props.selectedCount !== 1 ? "s" : ""} selected
        </span>
        <span class="statusbar-item" style={{ opacity: "0.7" }}>
          OpenAEC Foundation v2.0.0
        </span>
      </div>
    </div>
  );
}

import { For } from "solid-js";
import { workflowTypes, type WorkflowTypeId } from "../lib/workflows";

interface Props {
  selected: WorkflowTypeId;
  onSelect: (id: WorkflowTypeId) => void;
}

function WorkflowIcon(props: { icon: string }) {
  if (props.icon === "skill-package") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function WorkflowTypeSelector(props: Props) {
  return (
    <div class="card">
      <h2 class="card-title">Workflow Type</h2>
      <div class="workflow-type-grid">
        <For each={workflowTypes}>
          {(wf) => (
            <button
              class={`workflow-type-card ${props.selected === wf.id ? "selected" : ""}`}
              style={{ "--workflow-color": wf.color }}
              onClick={() => props.onSelect(wf.id)}
            >
              <div class="workflow-type-icon">
                <WorkflowIcon icon={wf.icon} />
              </div>
              <div class="workflow-type-info">
                <strong>{wf.name}</strong>
                <small>{wf.description}</small>
              </div>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

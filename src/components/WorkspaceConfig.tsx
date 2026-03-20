import type { EffortLevel } from "../stores/workspace.store";

interface Props {
  projectName: string;
  workspacePath: string;
  effortLevel: EffortLevel;
  onNameChange: (name: string) => void;
  onPathChange: (path: string) => void;
  onBrowse: () => void;
  onEffortChange: (level: EffortLevel) => void;
}

const effortOptions: { id: EffortLevel; label: string; description: string }[] = [
  {
    id: "low",
    label: "Low",
    description: "Core skills only, minimal config",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Standard setup with recommended skills",
  },
  {
    id: "high",
    label: "High",
    description: "Full skill set with advanced config",
  },
];

export function WorkspaceConfig(props: Props) {
  return (
    <div class="card workspace-config">
      <h2 class="card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        Workspace Configuration
      </h2>

      <div class="form-group">
        <label for="project-name">Project Name</label>
        <input
          id="project-name"
          type="text"
          placeholder="My BIM Project"
          value={props.projectName}
          onInput={(e) => props.onNameChange(e.currentTarget.value)}
        />
      </div>

      <div class="form-group">
        <label for="workspace-path">Workspace Path</label>
        <div class="input-with-button">
          <input
            id="workspace-path"
            type="text"
            placeholder="C:\Projects\..."
            value={props.workspacePath}
            onInput={(e) => props.onPathChange(e.currentTarget.value)}
          />
          <button class="btn btn-secondary" onClick={props.onBrowse}>
            Browse
          </button>
        </div>
      </div>

      <div class="form-group">
        <label>Effort Level</label>
        <div class="effort-selector">
          {effortOptions.map((option) => (
            <button
              class={`effort-btn ${props.effortLevel === option.id ? "active" : ""}`}
              onClick={() => props.onEffortChange(option.id)}
            >
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

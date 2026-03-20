interface Props {
  projectName: string;
  workspacePath: string;
  onNameChange: (name: string) => void;
  onPathChange: (path: string) => void;
  onBrowse: () => void;
}

export function WorkspaceConfig(props: Props) {
  return (
    <div class="card">
      <h2 class="card-title">Workspace</h2>
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
    </div>
  );
}

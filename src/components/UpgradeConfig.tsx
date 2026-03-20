interface Props {
  sourceVersion: string;
  targetVersion: string;
  targetRepo: string;
  onSourceVersionChange: (v: string) => void;
  onTargetVersionChange: (v: string) => void;
  onTargetRepoChange: (v: string) => void;
  onBrowseRepo: () => void;
}

export function UpgradeConfig(props: Props) {
  return (
    <div class="card">
      <h2 class="card-title">Upgrade Configuration</h2>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Source Version</label>
          <input
            type="text"
            class="form-input"
            placeholder="e.g. 1.x"
            value={props.sourceVersion}
            onInput={(e) => props.onSourceVersionChange(e.currentTarget.value)}
          />
        </div>

        <div class="form-group" style={{ "align-self": "flex-end", "padding-bottom": "4px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>

        <div class="form-group">
          <label class="form-label">Target Version</label>
          <input
            type="text"
            class="form-input"
            placeholder="e.g. 2.x"
            value={props.targetVersion}
            onInput={(e) => props.onTargetVersionChange(e.currentTarget.value)}
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Target Repository (optional)</label>
        <div class="input-with-button">
          <input
            type="text"
            class="form-input"
            placeholder="Path to the codebase being upgraded"
            value={props.targetRepo}
            onInput={(e) => props.onTargetRepoChange(e.currentTarget.value)}
          />
          <button class="btn btn-ghost" onClick={props.onBrowseRepo}>
            Browse
          </button>
        </div>
      </div>
    </div>
  );
}

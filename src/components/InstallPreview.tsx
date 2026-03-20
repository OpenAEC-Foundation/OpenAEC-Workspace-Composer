import { For, Show, createMemo } from "solid-js";
import type { SkillPackage } from "../lib/packages";
import type { WorkflowTypeId } from "../lib/workflows";

interface Props {
  workflowType: WorkflowTypeId;
  selectedPackages: string[];
  packages: SkillPackage[];
  installing: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onRemove: (id: string) => void;
  outputFiles: string[];
}

export function InstallPreview(props: Props) {
  const selected = createMemo(() =>
    props.packages.filter((p) => props.selectedPackages.includes(p.id))
  );

  const totalSkills = createMemo(() =>
    selected().reduce((sum, p) => sum + p.skillCount, 0)
  );

  const publishedCount = createMemo(() =>
    selected().filter((p) => p.status === "published").length
  );

  const buttonLabel = createMemo(() =>
    props.workflowType === "skill-package" ? "Generate Workspace" : "Bootstrap Upgrade"
  );

  return (
    <div class="preview-card">
      <h2 class="card-title">
        {props.workflowType === "skill-package" ? "Installation Preview" : "Upgrade Preview"}
      </h2>

      <Show when={props.workflowType === "skill-package"}>
        <div class="preview-stats">
          <div class="stat">
            <span class="stat-value">{selected().length}</span>
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

        <div class="preview-list">
          <h3>Selected packages:</h3>
          <Show
            when={selected().length > 0}
            fallback={
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <p>No packages selected</p>
                <small>Choose a preset or select individual packages</small>
              </div>
            }
          >
            <For each={selected()}>
              {(pkg) => (
                <div class="preview-item">
                  <span class="preview-name">{pkg.name}</span>
                  <div class="flex items-center gap-2">
                    <span class="preview-skills">{pkg.skillCount} skills</span>
                    <button
                      class="btn btn-ghost btn-sm"
                      onClick={() => props.onRemove(pkg.id)}
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
          </Show>
        </div>
      </Show>

      <Show when={props.workflowType === "version-upgrade"}>
        <div class="preview-stats">
          <div class="stat">
            <span class="stat-value">{props.outputFiles.length}</span>
            <span class="stat-label">Files</span>
          </div>
          <div class="stat">
            <span class="stat-value">7</span>
            <span class="stat-label">Phases</span>
          </div>
        </div>
      </Show>

      <div class="preview-output">
        <h3>Will generate:</h3>
        <ul>
          <For each={props.outputFiles}>
            {(file) => <li><code>{file}</code></li>}
          </For>
        </ul>
      </div>

      <button
        class="btn btn-generate"
        onClick={props.onInstall}
        disabled={props.installing || !props.canInstall}
      >
        <Show when={!props.installing} fallback={
          <>
            <span class="spinner" />
            Generating...
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
  );
}

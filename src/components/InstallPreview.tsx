import { For, createMemo } from "solid-js";
import type { SkillPackage } from "../lib/packages";

interface Props {
  selectedPackages: string[];
  packages: SkillPackage[];
  installing: boolean;
  onInstall: () => void;
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

  return (
    <div class="card preview-card">
      <h2 class="card-title">Installation Preview</h2>

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
        <For each={selected()} fallback={<p class="empty">No packages selected</p>}>
          {(pkg) => (
            <div class="preview-item">
              <span class="preview-name">{pkg.name}</span>
              <span class="preview-skills">{pkg.skillCount} skills</span>
            </div>
          )}
        </For>
      </div>

      <div class="preview-output">
        <h3>Will generate:</h3>
        <ul>
          <li><code>.code-workspace</code></li>
          <li><code>.claude/settings.local.json</code></li>
          <li><code>CLAUDE.md</code> (preset-specific)</li>
          <li>Skill package references in workspace</li>
        </ul>
      </div>

      <button
        class="btn btn-primary btn-install"
        onClick={props.onInstall}
        disabled={props.installing || selected().length === 0}
      >
        {props.installing ? "Generating..." : "Generate Workspace"}
      </button>
    </div>
  );
}

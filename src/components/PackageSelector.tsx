import { For, createMemo } from "solid-js";
import { type SkillPackage, categoryLabels } from "../lib/packages";

interface Props {
  packages: SkillPackage[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function PackageSelector(props: Props) {
  const grouped = createMemo(() => {
    const groups: Record<string, SkillPackage[]> = {};
    for (const pkg of props.packages) {
      if (!groups[pkg.category]) groups[pkg.category] = [];
      groups[pkg.category].push(pkg);
    }
    return groups;
  });

  return (
    <div class="card">
      <h2 class="card-title">Skill Packages</h2>
      <For each={Object.entries(grouped())}>
        {([category, pkgs]) => (
          <div class="package-category">
            <h3 class="category-label">
              {categoryLabels[category as SkillPackage["category"]] ?? category}
            </h3>
            <div class="package-list">
              <For each={pkgs}>
                {(pkg) => (
                  <label
                    class={`package-item ${props.selected.includes(pkg.id) ? "selected" : ""} status-${pkg.status}`}
                  >
                    <input
                      type="checkbox"
                      checked={props.selected.includes(pkg.id)}
                      onChange={() => props.onToggle(pkg.id)}
                    />
                    <div class="package-info">
                      <div class="package-header">
                        <strong>{pkg.name}</strong>
                        <span class="skill-count">{pkg.skillCount} skills</span>
                      </div>
                      <small>{pkg.description}</small>
                      <div class="package-tags">
                        <For each={pkg.tags.slice(0, 4)}>
                          {(tag) => <span class="tag">{tag}</span>}
                        </For>
                        {pkg.status !== "published" && (
                          <span class={`status-badge ${pkg.status}`}>
                            {pkg.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                )}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

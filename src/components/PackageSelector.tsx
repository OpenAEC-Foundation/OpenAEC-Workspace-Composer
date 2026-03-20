import { For, Show, createMemo } from "solid-js";
import { type SkillPackage, categoryLabels } from "../lib/packages";
import type { FilterId } from "../App";

interface Props {
  packages: SkillPackage[];
  selected: string[];
  onToggle: (id: string) => void;
  searchQuery: string;
  activeFilters: FilterId[];
}

export function PackageSelector(props: Props) {
  const filtered = createMemo(() => {
    let pkgs = props.packages;
    const q = props.searchQuery.toLowerCase().trim();
    const filters = props.activeFilters;

    // Apply category / status filters
    if (!filters.includes("all")) {
      pkgs = pkgs.filter((pkg) => {
        const categoryMatch = filters.some(
          (f) => f !== "published" && f === pkg.category
        );
        const publishedMatch =
          filters.includes("published" as FilterId) && pkg.status === "published";
        const hasCategory = filters.some((f) => f !== "published");
        if (!hasCategory) return publishedMatch;
        if (!filters.includes("published" as FilterId)) return categoryMatch;
        return categoryMatch && publishedMatch;
      });
    }

    // Apply search query
    if (q) {
      pkgs = pkgs.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(q) ||
          pkg.description.toLowerCase().includes(q) ||
          pkg.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return pkgs;
  });

  const grouped = createMemo(() => {
    const groups: Record<string, SkillPackage[]> = {};
    for (const pkg of filtered()) {
      if (!groups[pkg.category]) groups[pkg.category] = [];
      groups[pkg.category].push(pkg);
    }
    return groups;
  });

  const selectedCount = createMemo(
    () => filtered().filter((p) => props.selected.includes(p.id)).length
  );

  return (
    <div class="card">
      <div class="flex justify-between items-center" style={{ "margin-bottom": "var(--sp-4)" }}>
        <h2 class="card-title" style={{ "margin-bottom": "0" }}>Skill Packages</h2>
        <span class="font-mono text-accent" style={{ "font-size": "0.75rem" }}>
          {selectedCount()} of {filtered().length} selected
        </span>
      </div>

      <Show
        when={Object.keys(grouped()).length > 0}
        fallback={<p class="empty">No packages match your search or filters.</p>}
      >
        <div class="package-categories">
          <For each={Object.entries(grouped())}>
            {([category, pkgs]) => (
              <div class="package-category">
                <h3 class="category-label">
                  {categoryLabels[category as SkillPackage["category"]] ?? category}
                  <span class="category-count">{pkgs.length}</span>
                </h3>
                <div class="package-list">
                  <For each={pkgs}>
                    {(pkg) => (
                      <label
                        class={`package-item ${props.selected.includes(pkg.id) ? "selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={props.selected.includes(pkg.id)}
                          onChange={() => props.onToggle(pkg.id)}
                        />
                        <div class="package-info">
                          <div class="package-header">
                            <strong class="package-name">{pkg.name}</strong>
                            <div class="flex items-center gap-2">
                              <span class="skill-count">{pkg.skillCount} skills</span>
                              {pkg.status !== "published" && (
                                <span class={`status-badge ${pkg.status}`}>
                                  {pkg.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <small class="package-description">{pkg.description}</small>
                          <div class="package-tags">
                            <For each={pkg.tags.slice(0, 4)}>
                              {(tag) => <span class="tag">{tag}</span>}
                            </For>
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
      </Show>
    </div>
  );
}

import { For, Show, createMemo } from "solid-js";
import { type SkillPackage, categoryLabels } from "../lib/packages";
import type { FilterId } from "../stores/packages.store";

interface Props {
  packages: SkillPackage[];
  selected: string[];
  onToggle: (id: string) => void;
  searchQuery: string;
  activeFilters: FilterId[];
}

const categoryIcons: Record<SkillPackage["category"], string> = {
  "aec-bim": "\u{1F3D7}",
  "erp-business": "\u{1F4CA}",
  "web-dev": "\u{1F310}",
  "devops": "\u{2699}",
  "cross-tech": "\u{1F517}",
};

export function PackageSelector(props: Props) {
  const filtered = createMemo(() => {
    let pkgs = props.packages;
    const q = props.searchQuery.toLowerCase().trim();
    const filters = props.activeFilters;

    if (!filters.includes("all")) {
      pkgs = pkgs.filter((pkg) => {
        const categoryMatch = filters.some(
          (f) => f !== "published" && f !== "anthropic" && f === pkg.category
        );
        const publishedMatch =
          filters.includes("published" as FilterId) && pkg.status === "published";
        const anthropicMatch =
          filters.includes("anthropic" as FilterId) && "publisher" in pkg && (pkg as any).publisher === "anthropic";
        const hasCategory = filters.some((f) => f !== "published" && f !== "anthropic");

        if (anthropicMatch) return true;
        if (!hasCategory) return publishedMatch;
        if (!filters.includes("published" as FilterId)) return categoryMatch;
        return categoryMatch && publishedMatch;
      });
    }

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
    <div class="packages-container">
      <div class="packages-header">
        <span class="font-mono text-accent" style={{ "font-size": "0.7rem" }}>
          {selectedCount()}/{filtered().length} selected
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
                  <span class="category-icon">
                    {categoryIcons[category as SkillPackage["category"]] ?? ""}
                  </span>
                  {categoryLabels[category as SkillPackage["category"]] ?? category}
                  <span class="category-count">{pkgs.length}</span>
                </h3>
                <div class="package-grid">
                  <For each={pkgs}>
                    {(pkg) => {
                      const isSelected = () => props.selected.includes(pkg.id);
                      return (
                        <div
                          class={`package-tile ${isSelected() ? "selected" : ""}`}
                          onClick={() => props.onToggle(pkg.id)}
                        >
                          {/* Check indicator */}
                          <div class="tile-check">
                            <div class={`check-circle ${isSelected() ? "checked" : ""}`}>
                              <Show when={isSelected()}>
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </Show>
                            </div>
                          </div>

                          {/* Skill count ring */}
                          <div class="tile-skill-ring">
                            <svg viewBox="0 0 48 48" class="ring-svg">
                              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(217,119,6,0.15)" stroke-width="3" />
                              <circle
                                cx="24" cy="24" r="20"
                                fill="none"
                                stroke="var(--accent)"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-dasharray={`${Math.min(pkg.skillCount / 80, 1) * 125.6} 125.6`}
                                transform="rotate(-90 24 24)"
                                class="ring-progress"
                              />
                            </svg>
                            <span class="ring-number">{pkg.skillCount}</span>
                          </div>

                          {/* Package name */}
                          <h4 class="tile-name">{pkg.name}</h4>

                          {/* Description */}
                          <p class="tile-description">{pkg.description}</p>

                          {/* Tags */}
                          <div class="tile-tags">
                            <For each={pkg.tags.slice(0, 3)}>
                              {(tag) => <span class="tag">{tag}</span>}
                            </For>
                            <Show when={pkg.tags.length > 3}>
                              <span class="tag tag-more">+{pkg.tags.length - 3}</span>
                            </Show>
                          </div>

                          {/* Status badge */}
                          <Show when={pkg.status !== "published"}>
                            <span class={`status-badge ${pkg.status}`}>{pkg.status}</span>
                          </Show>

                          <div class="tile-glow" />
                        </div>
                      );
                    }}
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

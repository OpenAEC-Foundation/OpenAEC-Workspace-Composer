import { For, Show, createMemo, createSignal } from "solid-js";
import { type SkillPackage, categoryLabels } from "../lib/packages";
import type { FilterId } from "../stores/packages.store";
import { getPackageLogo } from "../lib/package-logos";

interface SkillInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
}

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
  // Track which package is expanded to show skills
  const [expandedPkg, setExpandedPkg] = createSignal<string | null>(null);
  const [skills, setSkills] = createSignal<SkillInfo[]>([]);
  const [skillsLoading, setSkillsLoading] = createSignal(false);
  const [excludedSkills, setExcludedSkills] = createSignal<Record<string, Set<string>>>({});

  async function toggleExpand(pkgId: string) {
    if (expandedPkg() === pkgId) {
      setExpandedPkg(null);
      return;
    }
    setExpandedPkg(pkgId);
    setSkillsLoading(true);
    setSkills([]);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<SkillInfo[]>("list_package_skills", { packageId: pkgId });
      setSkills(result);
    } catch (e) {
      setSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  }

  function toggleSkillExclusion(pkgId: string, skillId: string) {
    setExcludedSkills((prev) => {
      const next = { ...prev };
      if (!next[pkgId]) next[pkgId] = new Set();
      const s = new Set(next[pkgId]);
      if (s.has(skillId)) {
        s.delete(skillId);
      } else {
        s.add(skillId);
      }
      next[pkgId] = s;
      return next;
    });
  }

  function isSkillExcluded(pkgId: string, skillId: string): boolean {
    return excludedSkills()[pkgId]?.has(skillId) ?? false;
  }

  function getExcludedCount(pkgId: string): number {
    return excludedSkills()[pkgId]?.size ?? 0;
  }

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

  // Group skills by category
  const groupedSkills = createMemo(() => {
    const groups: Record<string, SkillInfo[]> = {};
    for (const skill of skills()) {
      const cat = skill.category || "uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(skill);
    }
    return groups;
  });

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
                      const isExpanded = () => expandedPkg() === pkg.id;
                      const excluded = () => getExcludedCount(pkg.id);
                      return (
                        <div
                          class={`package-tile ${isSelected() ? "selected" : ""} ${isExpanded() ? "expanded" : ""}`}
                        >
                          {/* Main tile area — click to select */}
                          <div
                            style={{ cursor: "pointer", display: "flex", "flex-direction": "column", "align-items": "center", "text-align": "center", width: "100%" }}
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

                            {/* Package logo */}
                            <div class="tile-logo">
                              {(() => {
                                const logo = getPackageLogo(pkg.id);
                                if (logo) {
                                  return <img src={logo} alt={pkg.name} class="tile-logo-img" />;
                                }
                                return <span class="tile-logo-fallback">{pkg.name.charAt(0)}</span>;
                              })()}
                            </div>

                            {/* Package name + skill count + quality dot */}
                            <h4 class="tile-name">{pkg.name}</h4>
                            <div style={{ display: "flex", "align-items": "center", gap: "6px", "justify-content": "center" }}>
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  "border-radius": "50%",
                                  background:
                                    pkg.status === "published" && pkg.skillCount >= 10
                                      ? "var(--success)"
                                      : pkg.status === "published"
                                        ? "var(--warm-gold)"
                                        : pkg.status === "development"
                                          ? "var(--accent)"
                                          : "var(--text-muted)",
                                  "flex-shrink": "0",
                                }}
                              />
                              <span class="tile-skill-count">{pkg.skillCount} skills</span>
                            </div>

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

                            {/* Excluded count */}
                            <Show when={excluded() > 0}>
                              <span class="text-dim" style={{ "font-size": "0.7rem", display: "block", "margin-top": "var(--sp-1)" }}>
                                {excluded()} skill(s) excluded
                              </span>
                            </Show>
                          </div>

                          {/* Expand button */}
                          <button
                            class="skill-expand-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(pkg.id);
                            }}
                          >
                            <svg
                              width="12" height="12" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" stroke-width="2"
                              style={{
                                transition: "transform 0.2s",
                                transform: isExpanded() ? "rotate(180deg)" : "rotate(0deg)",
                              }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                            <span style={{ "font-size": "0.7rem" }}>
                              {isExpanded() ? "Hide skills" : "Choose skills"}
                            </span>
                          </button>

                          {/* Expanded skill list */}
                          <Show when={isExpanded()}>
                            <div class="skill-detail-panel" onClick={(e) => e.stopPropagation()}>
                              <Show when={skillsLoading()}>
                                <p class="text-dim" style={{ "font-size": "0.75rem", padding: "var(--sp-2)" }}>
                                  Loading skills...
                                </p>
                              </Show>
                              <Show when={!skillsLoading() && skills().length === 0}>
                                <p class="text-dim" style={{ "font-size": "0.75rem", padding: "var(--sp-2)" }}>
                                  Package not found locally. Install to see skills.
                                </p>
                              </Show>
                              <Show when={!skillsLoading() && skills().length > 0}>
                                <For each={Object.entries(groupedSkills())}>
                                  {([cat, catSkills]) => (
                                    <div>
                                      <Show when={cat !== "uncategorized" && cat !== ""}>
                                        <div class="skill-category-label">{cat}</div>
                                      </Show>
                                      <For each={catSkills}>
                                        {(skill) => {
                                          const excluded = () => isSkillExcluded(pkg.id, skill.id);
                                          return (
                                            <label
                                              class={`skill-item ${excluded() ? "excluded" : ""}`}
                                              onClick={() => toggleSkillExclusion(pkg.id, skill.id)}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={!excluded()}
                                                style={{ "accent-color": "var(--accent)" }}
                                              />
                                              <div style={{ flex: 1, "min-width": 0 }}>
                                                <span class="font-mono" style={{ "font-size": "0.72rem" }}>
                                                  {skill.name || skill.id}
                                                </span>
                                                <Show when={skill.description}>
                                                  <span class="text-dim" style={{ "font-size": "0.65rem", display: "block", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>
                                                    {skill.description}
                                                  </span>
                                                </Show>
                                              </div>
                                            </label>
                                          );
                                        }}
                                      </For>
                                    </div>
                                  )}
                                </For>
                              </Show>
                            </div>
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

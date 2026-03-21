import { createSignal, createMemo, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { presets, type Preset } from "../lib/presets";
import { packagesStore } from "../stores/packages.store";

type CategoryFilter = "all" | "aec" | "business" | "desktop" | "devops" | "upgrades";

const categoryFilters: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "aec", label: "AEC / Construction" },
  { id: "business", label: "Business / ERP" },
  { id: "desktop", label: "Desktop / Web" },
  { id: "devops", label: "DevOps" },
  { id: "upgrades", label: "Upgrades" },
];

/** Map preset IDs to their category filter */
function getPresetCategory(preset: Preset): CategoryFilter {
  const id = preset.id;
  if (preset.workflowType === "version-upgrade") return "upgrades";
  if (["bim-development", "aec-gis-bim", "bim-web-viewer", "aec-data-pipeline"].includes(id)) return "aec";
  if (["erpnext-fullstack", "business-automation", "document-management"].includes(id)) return "business";
  if (["devops-documentation", "minimal-starter"].includes(id)) return "devops";
  return "desktop";
}

export function PresetsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = createSignal<CategoryFilter>("all");

  const filteredPresets = createMemo(() => {
    const cat = activeCategory();
    if (cat === "all") return presets;
    return presets.filter((p) => getPresetCategory(p) === cat);
  });

  const selectedSet = createMemo(() => new Set(packagesStore.selectedPackages()));

  /** Check if all packages of a preset are in the current selection */
  function isPresetActive(preset: Preset): boolean {
    const sel = selectedSet();
    if (preset.packages.length === 0) return false;
    return preset.packages.every((p) => sel.has(p));
  }

  /** Count the total skills in a preset's packages */
  function presetSkillCount(preset: Preset): number {
    const registry = packagesStore.registryPackages();
    return preset.packages.reduce((sum, pkgId) => {
      const pkg = registry.find((p) => p.id === pkgId);
      return sum + (pkg?.skillCount ?? 0);
    }, 0);
  }

  /** Resolve package IDs to display names */
  function packageDisplayName(pkgId: string): string {
    const pkg = packagesStore.registryPackages().find((p) => p.id === pkgId);
    return pkg?.name ?? pkgId;
  }

  /** Toggle a preset — adds or removes its packages from selection */
  function togglePreset(preset: Preset) {
    if (preset.workflowType === "version-upgrade") {
      // Version upgrades just select the preset, user navigates to install manually
      packagesStore.selectPreset(preset);
      return;
    }
    const current = new Set(packagesStore.selectedPackages());
    const allSelected = preset.packages.every((p) => current.has(p));
    if (allSelected) {
      // Deselect this preset's packages
      const next = packagesStore.selectedPackages().filter(
        (p) => !preset.packages.includes(p)
      );
      packagesStore.setSelectedPackages(next);
    } else {
      // Add this preset's packages (merge with existing)
      const merged = new Set([...packagesStore.selectedPackages(), ...preset.packages]);
      packagesStore.setSelectedPackages([...merged]);
    }
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div
          class="card"
          style={{
            display: "flex",
            "align-items": "center",
            gap: "var(--sp-4)",
            padding: "var(--sp-4) var(--sp-5)",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            stroke-width="1.5"
            style={{ "flex-shrink": "0" }}
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <div>
            <h1
              style={{
                "font-family": "var(--font-heading)",
                "font-size": "1.25rem",
                "margin-bottom": "2px",
              }}
            >
              Presets
            </h1>
            <p class="text-dim" style={{ "font-size": "0.8rem" }}>
              One-click workspace bundles. Curated package combinations for common workflows
            </p>
          </div>
          <div style={{ "margin-left": "auto", display: "flex", gap: "var(--sp-3)" }}>
            <div class="stat" style={{ "text-align": "center" }}>
              <span class="stat-value">{presets.length}</span>
              <span class="stat-label">Presets</span>
            </div>
            <div class="stat" style={{ "text-align": "center" }}>
              <span class="stat-value">
                {presets.filter((p) => p.workflowType === "skill-package").length}
              </span>
              <span class="stat-label">Packages</span>
            </div>
            <div class="stat" style={{ "text-align": "center" }}>
              <span class="stat-value">
                {presets.filter((p) => p.workflowType === "version-upgrade").length}
              </span>
              <span class="stat-label">Upgrades</span>
            </div>
          </div>
        </div>

        {/* Selection tools + category filter */}
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "var(--sp-2)",
            "margin-top": "var(--sp-4)",
            "flex-wrap": "wrap",
          }}
        >
          <button
            class="btn btn-ghost"
            style={{ "font-size": "0.75rem", padding: "var(--sp-1) var(--sp-2)" }}
            onClick={() => {
              const allPkgs = new Set<string>();
              presets.filter(p => p.workflowType === "skill-package").forEach(p => p.packages.forEach(pkg => allPkgs.add(pkg)));
              packagesStore.setSelectedPackages([...allPkgs]);
            }}
          >
            Select All
          </button>
          <button
            class="btn btn-ghost"
            style={{ "font-size": "0.75rem", padding: "var(--sp-1) var(--sp-2)" }}
            onClick={() => {
              const catPresets = filteredPresets().filter(p => p.workflowType === "skill-package");
              const catPkgs = new Set<string>();
              catPresets.forEach(p => p.packages.forEach(pkg => catPkgs.add(pkg)));
              const merged = new Set([...packagesStore.selectedPackages(), ...catPkgs]);
              packagesStore.setSelectedPackages([...merged]);
            }}
          >
            Select Category
          </button>
          <button
            class="btn btn-ghost"
            style={{ "font-size": "0.75rem", padding: "var(--sp-1) var(--sp-2)" }}
            onClick={() => packagesStore.clearSelection()}
          >
            Clear All
          </button>
          <span style={{ width: "1px", height: "16px", background: "var(--border)", margin: "0 var(--sp-1)" }} />
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--sp-2)",
            "margin-top": "var(--sp-2)",
            "flex-wrap": "wrap",
          }}
        >
          <For each={categoryFilters}>
            {(filter) => (
              <button
                class={`btn ${activeCategory() === filter.id ? "btn-primary" : "btn-ghost"}`}
                style={{
                  "font-size": "0.78rem",
                  padding: "var(--sp-1) var(--sp-3)",
                  "border-radius": "var(--radius-full)",
                  "white-space": "nowrap",
                }}
                onClick={() => setActiveCategory(filter.id)}
              >
                {filter.label}
              </button>
            )}
          </For>
        </div>

        {/* Preset grid */}
        <div
          class="tile-grid"
          style={{
            "margin-top": "var(--sp-4)",
            display: "grid",
            "grid-template-columns": "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "var(--sp-3)",
          }}
        >
          <For each={filteredPresets()}>
            {(preset, index) => {
              const active = () => isPresetActive(preset);
              const isUpgrade = preset.workflowType === "version-upgrade";
              return (
                <div
                  class="card bounce-in"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    "border-left": `3px solid ${preset.color}`,
                    padding: "var(--sp-4)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    background: active()
                      ? "rgba(217, 119, 6, 0.12)"
                      : "var(--bg-card)",
                    "border-color": active() ? "var(--accent)" : undefined,
                    "animation-delay": `${Math.min(index() * 50, 400)}ms`,
                  }}
                  onClick={() => togglePreset(preset)}
                >
                  {/* Active checkmark */}
                  <Show when={active()}>
                    <div
                      style={{
                        position: "absolute",
                        top: "var(--sp-2)",
                        right: "var(--sp-2)",
                        width: "22px",
                        height: "22px",
                        "border-radius": "var(--radius-full)",
                        background: "var(--success)",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </Show>

                  {/* Color accent glow */}
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "2px",
                      background: `linear-gradient(90deg, ${preset.color}, transparent)`,
                      opacity: "0.6",
                    }}
                  />

                  {/* Preset name */}
                  <div
                    style={{
                      display: "flex",
                      "align-items": "center",
                      gap: "var(--sp-2)",
                      "margin-bottom": "var(--sp-2)",
                    }}
                  >
                    <strong
                      style={{
                        "font-family": "var(--font-heading)",
                        "font-size": "0.95rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {preset.name}
                    </strong>
                    <Show when={isUpgrade}>
                      <span
                        style={{
                          "font-size": "0.65rem",
                          padding: "1px 6px",
                          "border-radius": "var(--radius-full)",
                          background: "rgba(217, 119, 6, 0.15)",
                          color: "var(--warm-gold)",
                          "font-weight": "500",
                        }}
                      >
                        UPGRADE
                      </span>
                    </Show>
                  </div>

                  {/* Description */}
                  <p
                    class="text-dim"
                    style={{
                      "font-size": "0.78rem",
                      "line-height": "1.4",
                      "margin-bottom": "var(--sp-3)",
                    }}
                  >
                    {preset.description}
                  </p>

                  {/* Version badges for upgrades */}
                  <Show when={isUpgrade && preset.sourceVersion}>
                    <div
                      style={{
                        display: "flex",
                        "align-items": "center",
                        gap: "var(--sp-2)",
                        "margin-bottom": "var(--sp-3)",
                      }}
                    >
                      <span
                        style={{
                          "font-family": "var(--font-mono)",
                          "font-size": "0.72rem",
                          padding: "2px 8px",
                          "border-radius": "var(--radius-sm)",
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "var(--error)",
                        }}
                      >
                        v{preset.sourceVersion}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-dim)"
                        stroke-width="2"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      <span
                        style={{
                          "font-family": "var(--font-mono)",
                          "font-size": "0.72rem",
                          padding: "2px 8px",
                          "border-radius": "var(--radius-sm)",
                          background: "rgba(34, 197, 94, 0.15)",
                          color: "var(--success)",
                        }}
                      >
                        v{preset.targetVersion}
                      </span>
                    </div>
                  </Show>

                  {/* Badges row */}
                  <Show when={preset.packages.length > 0}>
                    <div
                      style={{
                        display: "flex",
                        "align-items": "center",
                        gap: "var(--sp-2)",
                        "margin-bottom": "var(--sp-3)",
                      }}
                    >
                      <span
                        class="sidebar-badge"
                        style={{
                          background: `${preset.color}22`,
                          color: preset.color,
                          "font-size": "0.7rem",
                        }}
                      >
                        {preset.packages.length} package{preset.packages.length !== 1 ? "s" : ""}
                      </span>
                      <span
                        class="sidebar-badge"
                        style={{
                          background: "rgba(217, 119, 6, 0.1)",
                          color: "var(--warm-gold)",
                          "font-size": "0.7rem",
                        }}
                      >
                        {presetSkillCount(preset)} skill{presetSkillCount(preset) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </Show>

                  {/* Package tags */}
                  <Show when={preset.packages.length > 0}>
                    <div
                      style={{
                        display: "flex",
                        "flex-wrap": "wrap",
                        gap: "4px",
                        "margin-bottom": "var(--sp-3)",
                      }}
                    >
                      <For each={preset.packages}>
                        {(pkgId) => (
                          <span
                            style={{
                              "font-size": "0.65rem",
                              padding: "1px 6px",
                              "border-radius": "var(--radius-sm)",
                              background: "rgba(245, 240, 235, 0.06)",
                              border: "1px solid var(--border)",
                              color: "var(--text-dim)",
                              "font-family": "var(--font-mono)",
                              "white-space": "nowrap",
                            }}
                          >
                            {packageDisplayName(pkgId)}
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>

                  {/* Select button */}
                  <button
                    class={`btn ${active() ? "btn-primary" : "btn-ghost"}`}
                    style={{
                      width: "100%",
                      "font-size": "0.78rem",
                      padding: "var(--sp-2) var(--sp-3)",
                      "margin-top": "auto",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePreset(preset);
                    }}
                  >
                    <Show when={active()} fallback="+ Add to selection">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        style={{ "margin-right": "4px", "vertical-align": "middle" }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Selected. Click to remove
                    </Show>
                  </button>
                </div>
              );
            }}
          </For>
        </div>

        {/* Selection summary + install button */}
        <Show when={packagesStore.selectedPackages().length > 0}>
          <div
            class="card"
            style={{
              "margin-top": "var(--sp-4)",
              display: "flex",
              "align-items": "center",
              gap: "var(--sp-3)",
              padding: "var(--sp-3) var(--sp-4)",
              "border-color": "var(--accent)",
              "position": "sticky",
              "bottom": "var(--sp-2)",
              "z-index": "10",
              "box-shadow": "0 -4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>{packagesStore.selectedPackages().length} packages</strong>
              <span class="text-dim" style={{ "margin-left": "var(--sp-2)", "font-size": "0.8rem" }}>
                {packagesStore.selectedPackages().join(", ")}
              </span>
            </div>
            <button
              class="btn btn-ghost"
              style={{ "font-size": "0.8rem" }}
              onClick={() => packagesStore.clearSelection()}
            >
              Clear
            </button>
            <button
              class="btn btn-primary"
              onClick={() => navigate("/install")}
            >
              Install →
            </button>
          </div>
        </Show>

        {/* Empty state */}
        <Show when={filteredPresets().length === 0}>
          <div
            class="card"
            style={{
              "margin-top": "var(--sp-4)",
              "text-align": "center",
              padding: "var(--sp-8)",
            }}
          >
            <p class="text-dim">No presets match this filter.</p>
            <button
              class="btn btn-ghost"
              style={{ "margin-top": "var(--sp-3)" }}
              onClick={() => setActiveCategory("all")}
            >
              Show all presets
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}

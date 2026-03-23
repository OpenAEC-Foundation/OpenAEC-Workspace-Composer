import { createSignal, createMemo, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { presets, type Preset } from "../lib/presets";
import { packagesStore } from "../stores/packages.store";
import { getPackageLogo } from "../lib/package-logos";

export function PresetsPage() {
  const navigate = useNavigate();

  const selectedSet = createMemo(() => new Set(packagesStore.selectedPackages()));

  function isPresetActive(preset: Preset): boolean {
    const sel = selectedSet();
    if (preset.packages.length === 0) return false;
    return preset.packages.every((p) => sel.has(p));
  }

  function presetSkillCount(preset: Preset): number {
    const registry = packagesStore.registryPackages();
    return preset.packages.reduce((sum, pkgId) => {
      const pkg = registry.find((p) => p.id === pkgId);
      return sum + (pkg?.skillCount ?? 0);
    }, 0);
  }

  function packageDisplayName(pkgId: string): string {
    const pkg = packagesStore.registryPackages().find((p) => p.id === pkgId);
    return pkg?.name ?? pkgId;
  }

  function togglePreset(preset: Preset) {
    if (preset.workflowType === "version-upgrade") {
      packagesStore.selectPreset(preset);
      return;
    }
    const current = new Set(packagesStore.selectedPackages());
    const allSelected = preset.packages.every((p) => current.has(p));
    if (allSelected) {
      const next = packagesStore.selectedPackages().filter(
        (p) => !preset.packages.includes(p)
      );
      packagesStore.setSelectedPackages(next);
    } else {
      const merged = new Set([...packagesStore.selectedPackages(), ...preset.packages]);
      packagesStore.setSelectedPackages([...merged]);
    }
  }

  const skillPresets = createMemo(() => presets.filter(p => p.workflowType === "skill-package"));

  return (
    <div class="content-body">
      <div class="content-scroll">

        {/* Skill Package Presets */}
        <div class="preset-section-label">
          <span class="preset-section-icon">📦</span>
          Skill Package Presets
          <span class="category-count">{skillPresets().length}</span>
        </div>

        <div class="preset-grid">
          <For each={skillPresets()}>
            {(preset) => {
              const active = () => isPresetActive(preset);
              return (
                <div
                  class={`preset-tile ${active() ? "active" : ""}`}
                  style={{ "--preset-color": preset.color }}
                  onClick={() => togglePreset(preset)}
                >
                  {/* Color bar top */}
                  <div class="preset-tile-bar" />

                  {/* Active indicator */}
                  <Show when={active()}>
                    <div class="preset-tile-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </Show>

                  {/* Logo row: show logos of included packages */}
                  <div class="preset-logos">
                    <For each={preset.packages.slice(0, 5)}>
                      {(pkgId) => {
                        const logo = getPackageLogo(pkgId);
                        return (
                          <div class="preset-logo-circle" title={packageDisplayName(pkgId)}>
                            {logo
                              ? <img src={logo} alt={pkgId} />
                              : <span style={{ "font-size": "1rem", "font-weight": "700", color: "var(--accent)" }}>{packageDisplayName(pkgId).charAt(0)}</span>
                            }
                          </div>
                        );
                      }}
                    </For>
                  </div>

                  {/* Name */}
                  <h3 class="preset-tile-name">{preset.name}</h3>

                  {/* Description */}
                  <p class="preset-tile-desc">{preset.description}</p>

                  {/* Stats */}
                  <div class="preset-tile-stats">
                    <span>{preset.packages.length} packages</span>
                    <span class="preset-tile-dot" />
                    <span>{presetSkillCount(preset)} skills</span>
                  </div>
                </div>
              );
            }}
          </For>
        </div>

        {/* Version Upgrades: parked for later */}

        {/* Sticky selection bar */}
        <Show when={packagesStore.selectedPackages().length > 0}>
          <div class="preset-selection-bar">
            <strong>{packagesStore.selectedPackages().length} packages</strong>
            <span class="text-dim" style={{ "font-size": "0.8rem" }}>
              {packagesStore.totalSkills()} skills
            </span>
            <div style={{ "margin-left": "auto", display: "flex", gap: "var(--sp-2)" }}>
              <button class="btn btn-ghost btn-sm" onClick={() => packagesStore.clearSelection()}>
                Clear
              </button>
              <button class="btn btn-primary btn-sm" onClick={() => navigate("/install")}>
                Install
              </button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

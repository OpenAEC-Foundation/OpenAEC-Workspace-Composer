import { Show, For, createMemo, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { SearchBar } from "../components/SearchBar";
import { PackageSelector } from "../components/PackageSelector";
import { packagesStore } from "../stores/packages.store";

export function PackagesPage() {
  onMount(() => {
    packagesStore.loadRegistry();
  });

  const registryStatusText = createMemo(() => {
    const count = packagesStore.registryPackages().length;
    if (packagesStore.registryLoading()) return "Loading registry...";
    if (packagesStore.registryError()) return `Error: ${packagesStore.registryError()}`;
    const lastUpdated = packagesStore.registryLastUpdated();
    const timeStr = lastUpdated
      ? `Updated ${lastUpdated.toLocaleTimeString()}`
      : "Using cached data";
    return `${count} packages from GitHub \u2014 ${timeStr}`;
  });

  const selectedCount = createMemo(() => packagesStore.selectedPackages().length);
  const totalSkills = createMemo(() => packagesStore.totalSkills());

  return (
    <div class="page">
      {/* Registry status */}
      <div class="registry-status">
        <span
          class={`dot ${packagesStore.registryLoading() ? "loading" : packagesStore.registryError() ? "error" : ""}`}
        />
        <span>{registryStatusText()}</span>
        <Show when={!packagesStore.registryLoading()}>
          <button
            class="btn btn-ghost"
            style={{ padding: "2px 6px", "font-size": "0.7rem" }}
            onClick={() => packagesStore.loadRegistry(true)}
          >
            Refresh
          </button>
        </Show>
      </div>

      {/* Search & filter */}
      <div class="content-header">
        <SearchBar
          query={packagesStore.searchQuery()}
          onQueryChange={packagesStore.setSearchQuery}
          activeFilters={packagesStore.activeFilters()}
          onFilterToggle={packagesStore.toggleFilter}
        />
      </div>

      {/* Package selector */}
      <div style={{ flex: "1", overflow: "auto", padding: "var(--sp-2) var(--sp-4)" }}>
        <PackageSelector
          packages={packagesStore.registryPackages()}
          selected={packagesStore.selectedPackages()}
          onToggle={packagesStore.togglePackage}
          searchQuery={packagesStore.searchQuery()}
          activeFilters={packagesStore.activeFilters()}
        />
      </div>

      {/* Selection summary + next step */}
      <Show when={selectedCount() > 0}>
        <div class="selection-bar">
          <div class="selection-bar-info">
            <strong>{selectedCount()} package{selectedCount() !== 1 ? "s" : ""}</strong>
            <span class="text-dim"> selected</span>
            <span class="text-muted" style={{ "margin-left": "var(--sp-2)" }}>
              ({totalSkills()} skills)
            </span>
          </div>
          <div class="selection-bar-actions">
            <button class="btn btn-ghost btn-sm" onClick={() => packagesStore.clearSelection()}>
              Clear
            </button>
            <A href="/workspace" class="btn btn-primary btn-sm">
              Configure Workspace →
            </A>
          </div>
        </div>
      </Show>
    </div>
  );
}

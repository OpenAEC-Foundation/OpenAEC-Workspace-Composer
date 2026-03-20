import { Show, createMemo, onMount } from "solid-js";
import { SearchBar } from "../components/SearchBar";
import { PackageSelector } from "../components/PackageSelector";
import { packagesStore, availableFilters } from "../stores/packages.store";

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

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Registry status indicator */}
        <div style={{
          display: "flex",
          "align-items": "center",
          gap: "var(--sp-2)",
          "margin-bottom": "var(--sp-3)",
          "font-size": "0.75rem",
          color: "var(--text-muted)",
        }}>
          <span
            class="statusbar-dot"
            style={{
              background: packagesStore.registryLoading()
                ? "var(--warm-gold)"
                : packagesStore.registryError()
                ? "var(--error)"
                : "var(--success)",
            }}
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

        {/* Search & filter bar */}
        <div class="content-header">
          <SearchBar
            query={packagesStore.searchQuery()}
            onQueryChange={packagesStore.setSearchQuery}
            activeFilters={packagesStore.activeFilters()}
            onFilterToggle={packagesStore.toggleFilter}
          />
        </div>

        {/* Package selector */}
        <PackageSelector
          packages={packagesStore.registryPackages()}
          selected={packagesStore.selectedPackages()}
          onToggle={packagesStore.togglePackage}
          searchQuery={packagesStore.searchQuery()}
          activeFilters={packagesStore.activeFilters()}
        />
      </div>
    </div>
  );
}

import { createSignal, createMemo, Show } from "solid-js";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { SearchBar } from "./components/SearchBar";
import { PresetSelector } from "./components/PresetSelector";
import { PackageSelector } from "./components/PackageSelector";
import { WorkspaceConfig } from "./components/WorkspaceConfig";
import { InstallPreview } from "./components/InstallPreview";
import { StatusBar } from "./components/StatusBar";
import { presets, type Preset } from "./lib/presets";
import { type SkillPackage, packages } from "./lib/packages";

export type PageId = "home" | "packages" | "presets" | "settings" | "about";
export type EffortLevel = "low" | "medium" | "high";
export type FilterId = "aec-bim" | "erp-business" | "web-dev" | "devops" | "published" | "all";

const availableFilters: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "aec-bim", label: "AEC/BIM" },
  { id: "erp-business", label: "ERP" },
  { id: "web-dev", label: "Web Dev" },
  { id: "devops", label: "DevOps" },
  { id: "published", label: "Published" },
];

export default function App() {
  const [activePage, setActivePage] = createSignal<PageId>("home");
  const [selectedPreset, setSelectedPreset] = createSignal<Preset | null>(null);
  const [selectedPackages, setSelectedPackages] = createSignal<string[]>([]);
  const [workspacePath, setWorkspacePath] = createSignal("");
  const [projectName, setProjectName] = createSignal("");
  const [installing, setInstalling] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [activeFilters, setActiveFilters] = createSignal<FilterId[]>(["all"]);
  const [effortLevel, setEffortLevel] = createSignal<EffortLevel>("medium");

  function handlePresetSelect(preset: Preset) {
    setSelectedPreset(preset);
    setSelectedPackages(preset.packages);
  }

  function togglePackage(id: string) {
    setSelectedPackages((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
    setSelectedPreset(null);
  }

  function removePackage(id: string) {
    setSelectedPackages((prev) => prev.filter((p) => p !== id));
    setSelectedPreset(null);
  }

  function toggleFilter(id: FilterId) {
    if (id === "all") {
      setActiveFilters(["all"]);
      return;
    }
    setActiveFilters((prev) => {
      const without = prev.filter((f) => f !== "all");
      if (without.includes(id)) {
        const next = without.filter((f) => f !== id);
        return next.length === 0 ? ["all"] : next;
      }
      return [...without, id];
    });
  }

  async function handleBrowse() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) setWorkspacePath(selected as string);
    } catch {
      const path = prompt("Workspace pad:");
      if (path) setWorkspacePath(path);
    }
  }

  async function handleInstall() {
    if (!workspacePath() || selectedPackages().length === 0) return;
    setInstalling(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("generate_workspace", {
        path: workspacePath(),
        name: projectName(),
        packages: selectedPackages(),
        effort: effortLevel(),
      });
    } catch (e) {
      console.error("Install failed:", e);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div class="app">
      <Titlebar />
      <div class="app-main">
        <Sidebar activePage={activePage()} onNavigate={setActivePage} />
        <div class="content">
          <Show when={activePage() === "home" || activePage() === "packages"}>
            <div class="content-header">
              <SearchBar
                query={searchQuery()}
                onQueryChange={setSearchQuery}
                activeFilters={activeFilters()}
                onFilterToggle={toggleFilter}
                availableFilters={availableFilters}
              />
            </div>
          </Show>

          <div class="content-body">
            <div class="content-scroll">
              <Show when={activePage() === "home" || activePage() === "presets"}>
                <PresetSelector
                  presets={presets}
                  selected={selectedPreset()}
                  onSelect={handlePresetSelect}
                />
              </Show>

              <Show when={activePage() === "home" || activePage() === "packages"}>
                <PackageSelector
                  packages={packages}
                  selected={selectedPackages()}
                  onToggle={togglePackage}
                  searchQuery={searchQuery()}
                  activeFilters={activeFilters()}
                />
              </Show>

              <Show when={activePage() === "home" || activePage() === "settings"}>
                <WorkspaceConfig
                  projectName={projectName()}
                  workspacePath={workspacePath()}
                  effortLevel={effortLevel()}
                  onNameChange={setProjectName}
                  onPathChange={setWorkspacePath}
                  onBrowse={handleBrowse}
                  onEffortChange={setEffortLevel}
                />
              </Show>

              <Show when={activePage() === "about"}>
                <div class="card">
                  <h2 class="card-title">About</h2>
                  <p class="text-dim" style={{ "margin-bottom": "8px" }}>
                    <strong style={{ color: "var(--text-primary)" }}>OpenAEC Workspace Composer</strong> generates ready-to-use
                    Claude Code workspaces with curated skill packages for AEC, BIM,
                    ERP, and web development.
                  </p>
                  <p class="text-muted" style={{ "font-size": "0.8rem" }}>
                    Built by OpenAEC Foundation with Tauri 2 + SolidJS.
                  </p>
                </div>
              </Show>
            </div>

            <div class="install-panel">
              <InstallPreview
                selectedPackages={selectedPackages()}
                packages={packages}
                installing={installing()}
                onInstall={handleInstall}
                onRemove={removePackage}
              />
            </div>
          </div>
        </div>
      </div>
      <StatusBar selectedCount={selectedPackages().length} />
    </div>
  );
}

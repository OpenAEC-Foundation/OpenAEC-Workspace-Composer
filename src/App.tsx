import { createSignal, createMemo, Show, onMount } from "solid-js";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { SearchBar } from "./components/SearchBar";
import { WorkflowTypeSelector } from "./components/WorkflowTypeSelector";
import { PhaseOverview } from "./components/PhaseOverview";
import { PresetSelector } from "./components/PresetSelector";
import { PackageSelector } from "./components/PackageSelector";
import { UpgradeConfig } from "./components/UpgradeConfig";
import { WorkspaceConfig } from "./components/WorkspaceConfig";
import { InstallPreview } from "./components/InstallPreview";
import { StatusBar } from "./components/StatusBar";
import { presets, type Preset } from "./lib/presets";
import { type SkillPackage } from "./lib/packages";
import { getWorkflowType, type WorkflowTypeId } from "./lib/workflows";
import { getHardcodedRegistry, fetchRegistry, type RegistryPackage } from "./lib/registry";

export type PageId = "home" | "packages" | "presets" | "workflows" | "settings" | "about";
export type EffortLevel = "low" | "medium" | "high";
export type FilterId = "aec-bim" | "erp-business" | "web-dev" | "devops" | "published" | "anthropic" | "all";

const availableFilters: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "aec-bim", label: "AEC/BIM" },
  { id: "erp-business", label: "ERP" },
  { id: "web-dev", label: "Web Dev" },
  { id: "devops", label: "DevOps" },
  { id: "published", label: "Published" },
  { id: "anthropic", label: "Anthropic" },
];

export default function App() {
  // Core state
  const [activePage, setActivePage] = createSignal<PageId>("home");
  const [workflowType, setWorkflowType] = createSignal<WorkflowTypeId>("skill-package");
  const [selectedPreset, setSelectedPreset] = createSignal<Preset | null>(null);
  const [workspacePath, setWorkspacePath] = createSignal("");
  const [projectName, setProjectName] = createSignal("");
  const [installing, setInstalling] = createSignal(false);
  const [effortLevel, setEffortLevel] = createSignal<EffortLevel>("medium");

  // Skill package state
  const [selectedPackages, setSelectedPackages] = createSignal<string[]>([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [activeFilters, setActiveFilters] = createSignal<FilterId[]>(["all"]);

  // Live registry — starts with hardcoded, updates from GitHub
  const [registryPackages, setRegistryPackages] = createSignal<RegistryPackage[]>(getHardcodedRegistry());
  const [registryLoading, setRegistryLoading] = createSignal(false);

  onMount(async () => {
    setRegistryLoading(true);
    try {
      const live = await fetchRegistry();
      setRegistryPackages(live);
    } catch {
      // Keep hardcoded fallback
    } finally {
      setRegistryLoading(false);
    }
  });

  // Use registry packages as the source of truth
  const packages = createMemo<SkillPackage[]>(() => registryPackages());

  // Version upgrade state
  const [sourceVersion, setSourceVersion] = createSignal("");
  const [targetVersion, setTargetVersion] = createSignal("");
  const [targetRepo, setTargetRepo] = createSignal("");

  const currentWorkflow = createMemo(() => getWorkflowType(workflowType()));

  const filteredPresets = createMemo(() =>
    presets.filter((p) => p.workflowType === workflowType())
  );

  function handleWorkflowTypeChange(id: WorkflowTypeId) {
    setWorkflowType(id);
    setSelectedPreset(null);
    setSelectedPackages([]);
    setSourceVersion("");
    setTargetVersion("");
    setTargetRepo("");
  }

  function handlePresetSelect(preset: Preset) {
    setSelectedPreset(preset);
    if (preset.workflowType === "skill-package") {
      setSelectedPackages(preset.packages);
    } else {
      setSourceVersion(preset.sourceVersion || "");
      setTargetVersion(preset.targetVersion || "");
    }
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

  async function handleBrowseRepo() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) setTargetRepo(selected as string);
    } catch {
      const path = prompt("Target repository pad:");
      if (path) setTargetRepo(path);
    }
  }

  function canInstall(): boolean {
    if (!workspacePath()) return false;
    if (workflowType() === "skill-package") {
      return selectedPackages().length > 0;
    }
    return sourceVersion() !== "" && targetVersion() !== "";
  }

  async function handleInstall() {
    if (!canInstall()) return;
    setInstalling(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("generate_workspace", {
        request: {
          workflow_type: workflowType(),
          path: workspacePath(),
          name: projectName(),
          effort: effortLevel(),
          packages: workflowType() === "skill-package" ? selectedPackages() : undefined,
          source_version: workflowType() === "version-upgrade" ? sourceVersion() : undefined,
          target_version: workflowType() === "version-upgrade" ? targetVersion() : undefined,
          target_repo: workflowType() === "version-upgrade" ? targetRepo() : undefined,
        },
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
            <Show when={workflowType() === "skill-package"}>
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
          </Show>

          <div class="content-body">
            <div class="content-scroll">
              <Show when={activePage() === "home" || activePage() === "workflows"}>
                <WorkflowTypeSelector
                  selected={workflowType()}
                  onSelect={handleWorkflowTypeChange}
                />
                <PhaseOverview phases={currentWorkflow().phases} />
              </Show>

              <Show when={activePage() === "home" || activePage() === "presets"}>
                <PresetSelector
                  presets={filteredPresets()}
                  selected={selectedPreset()}
                  onSelect={handlePresetSelect}
                />
              </Show>

              <Show when={(activePage() === "home" || activePage() === "packages") && workflowType() === "skill-package"}>
                <PackageSelector
                  packages={packages()}
                  selected={selectedPackages()}
                  onToggle={togglePackage}
                  searchQuery={searchQuery()}
                  activeFilters={activeFilters()}
                />
              </Show>

              <Show when={(activePage() === "home" || activePage() === "packages") && workflowType() === "version-upgrade"}>
                <UpgradeConfig
                  sourceVersion={sourceVersion()}
                  targetVersion={targetVersion()}
                  targetRepo={targetRepo()}
                  onSourceVersionChange={setSourceVersion}
                  onTargetVersionChange={setTargetVersion}
                  onTargetRepoChange={setTargetRepo}
                  onBrowseRepo={handleBrowseRepo}
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
                    <strong style={{ color: "var(--text-primary)" }}>OpenAEC Workspace Composer v2</strong> generates ready-to-use
                    Claude Code workspaces. Supports skill package workspaces and version upgrade workflows.
                  </p>
                  <p class="text-muted" style={{ "font-size": "0.8rem" }}>
                    Built by OpenAEC Foundation with Tauri 2 + SolidJS.
                  </p>
                </div>
              </Show>
            </div>

            <div class="install-panel">
              <InstallPreview
                workflowType={workflowType()}
                selectedPackages={selectedPackages()}
                packages={packages()}
                installing={installing()}
                canInstall={canInstall()}
                onInstall={handleInstall}
                onRemove={removePackage}
                outputFiles={currentWorkflow().outputFiles}
              />
            </div>
          </div>
        </div>
      </div>
      <StatusBar
        selectedCount={selectedPackages().length}
        workflowType={workflowType()}
      />
    </div>
  );
}

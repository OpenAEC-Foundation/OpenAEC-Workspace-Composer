import { createSignal, Show } from "solid-js";
import { Header } from "./components/Header";
import { PresetSelector } from "./components/PresetSelector";
import { PackageSelector } from "./components/PackageSelector";
import { WorkspaceConfig } from "./components/WorkspaceConfig";
import { InstallPreview } from "./components/InstallPreview";
import { presets, type Preset } from "./lib/presets";
import { type SkillPackage, packages } from "./lib/packages";

export default function App() {
  const [selectedPreset, setSelectedPreset] = createSignal<Preset | null>(null);
  const [selectedPackages, setSelectedPackages] = createSignal<string[]>([]);
  const [workspacePath, setWorkspacePath] = createSignal("");
  const [projectName, setProjectName] = createSignal("");
  const [installing, setInstalling] = createSignal(false);

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

  async function handleBrowse() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) setWorkspacePath(selected as string);
    } catch {
      // Fallback for dev mode without Tauri
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
      });
    } catch (e) {
      console.error("Install failed:", e);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div class="app">
      <Header />
      <main class="main">
        <section class="panel left-panel">
          <WorkspaceConfig
            projectName={projectName()}
            workspacePath={workspacePath()}
            onNameChange={setProjectName}
            onPathChange={setWorkspacePath}
            onBrowse={handleBrowse}
          />
          <PresetSelector
            presets={presets}
            selected={selectedPreset()}
            onSelect={handlePresetSelect}
          />
          <PackageSelector
            packages={packages}
            selected={selectedPackages()}
            onToggle={togglePackage}
          />
        </section>
        <section class="panel right-panel">
          <InstallPreview
            selectedPackages={selectedPackages()}
            packages={packages}
            installing={installing()}
            onInstall={handleInstall}
          />
        </section>
      </main>
    </div>
  );
}

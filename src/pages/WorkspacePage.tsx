import { Show, createMemo, createSignal, onMount, onCleanup } from "solid-js";
import { A } from "@solidjs/router";
import { SearchBar } from "../components/SearchBar";
import { PackageSelector } from "../components/PackageSelector";
import { workspaceStore } from "../stores/workspace.store";
import { packagesStore } from "../stores/packages.store";
import type { PathValidation } from "../stores/workspace.store";

export function WorkspacePage() {
  const [showNewFolder, setShowNewFolder] = createSignal(false);
  const [newFolderName, setNewFolderName] = createSignal("");
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(async () => {
    packagesStore.loadRegistry();
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const recent = await invoke<string[]>("list_recent_workspaces");
      workspaceStore.setRecentWorkspaces(recent);
    } catch {}
  });

  onCleanup(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  function debouncedValidate(path: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!path) { workspaceStore.setPathValidation(null); return; }
    debounceTimer = setTimeout(() => validatePath(path), 300);
  }

  async function validatePath(path: string) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<PathValidation>("validate_path", { path });
      workspaceStore.setPathValidation(result);
    } catch { workspaceStore.setPathValidation(null); }
  }

  function handlePathChange(path: string) {
    workspaceStore.setWorkspacePath(path);
    debouncedValidate(path);
  }

  async function handleCreateDirectory() {
    const path = workspaceStore.workspacePath();
    if (!path) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("create_directory", { path });
      await validatePath(path);
    } catch (e) { console.error("Failed to create directory:", e); }
  }

  async function handleCreateSubfolder() {
    const name = newFolderName().trim();
    if (!name) return;
    const base = workspaceStore.workspacePath() || ".";
    const fullPath = base.replace(/[\\/]$/, "") + "/" + name;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("create_directory", { path: fullPath });
      workspaceStore.setWorkspacePath(fullPath);
      setNewFolderName("");
      setShowNewFolder(false);
      await validatePath(fullPath);
    } catch (e) { console.error("Failed to create subfolder:", e); }
  }

  async function handleBrowse() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) {
        workspaceStore.setWorkspacePath(selected as string);
        await validatePath(selected as string);
      }
    } catch {
      const path = prompt("Workspace pad:");
      if (path) { workspaceStore.setWorkspacePath(path); debouncedValidate(path); }
    }
  }

  const validation = () => workspaceStore.pathValidation();
  const pathIsValid = createMemo(() => {
    const v = validation();
    return v !== null && v.exists && v.is_dir && v.is_writable;
  });
  const selectedCount = createMemo(() => packagesStore.selectedPackages().length);
  const totalSkills = createMemo(() => packagesStore.totalSkills());
  const canInstall = createMemo(() => pathIsValid() && selectedCount() > 0);

  const registryStatusText = createMemo(() => {
    const count = packagesStore.registryPackages().length;
    if (packagesStore.registryLoading()) return "Loading...";
    if (packagesStore.registryError()) return `Error: ${packagesStore.registryError()}`;
    return `${count} packages`;
  });

  return (
    <div class="page">
      {/* Compact top bar: registry status + search */}
      <div class="workspace-topbar">
        <div class="registry-status">
          <span
            class={`dot ${packagesStore.registryLoading() ? "loading" : packagesStore.registryError() ? "error" : ""}`}
          />
          <span>{registryStatusText()}</span>
          <Show when={!packagesStore.registryLoading()}>
            <button
              class="btn btn-ghost"
              style={{ padding: "2px 6px", "font-size": "0.65rem" }}
              onClick={() => packagesStore.loadRegistry(true)}
            >
              Refresh
            </button>
          </Show>
        </div>
        <SearchBar
          query={packagesStore.searchQuery()}
          onQueryChange={packagesStore.setSearchQuery}
          activeFilters={packagesStore.activeFilters()}
          onFilterToggle={packagesStore.toggleFilter}
        />
      </div>

      {/* Package tile grid — main content area */}
      <div style={{ flex: "1", overflow: "auto", padding: "var(--sp-2) var(--sp-4)" }}>
        <PackageSelector
          packages={packagesStore.registryPackages()}
          selected={packagesStore.selectedPackages()}
          onToggle={packagesStore.togglePackage}
          searchQuery={packagesStore.searchQuery()}
          activeFilters={packagesStore.activeFilters()}
        />
      </div>

      {/* Bottom bar: workspace path + actions */}
      <div class="workspace-bottom">
        <div class="workspace-path-row">
          <div class="workspace-path-input">
            <input
              type="text"
              class="form-input"
              placeholder="Workspace path..."
              value={workspaceStore.workspacePath()}
              onInput={(e) => handlePathChange(e.currentTarget.value)}
              onPaste={(e) => {
                const text = e.clipboardData?.getData("text");
                if (text) { e.preventDefault(); handlePathChange(text.trim()); }
              }}
            />
            <button class="btn btn-ghost btn-sm" onClick={handleBrowse}>Browse</button>
            <Show when={!showNewFolder()}>
              <button class="btn btn-ghost btn-sm" onClick={() => setShowNewFolder(true)} title="Create subfolder">+</button>
            </Show>
          </div>

          {/* Inline validation */}
          <Show when={workspaceStore.workspacePath()}>
            <Show when={validation()}>
              {(v) => (
                <>
                  <Show when={v().exists && v().is_dir && v().is_writable}>
                    <span class="dot valid" title="Valid path" />
                  </Show>
                  <Show when={v().exists && v().is_dir && !v().is_writable}>
                    <span class="dot error" title="Not writable" />
                  </Show>
                  <Show when={!v().exists}>
                    <span class="dot error" title="Does not exist" />
                    <button
                      class="btn btn-ghost btn-sm"
                      style={{ "font-size": "0.65rem" }}
                      onClick={handleCreateDirectory}
                    >
                      Create
                    </button>
                  </Show>
                </>
              )}
            </Show>
          </Show>

          {/* Selection summary + install */}
          <div class="workspace-actions">
            <Show when={selectedCount() > 0}>
              <span class="workspace-summary">
                <strong>{selectedCount()}</strong> packages
                <span class="text-muted"> ({totalSkills()} skills)</span>
              </span>
              <button class="btn btn-ghost btn-sm" onClick={() => packagesStore.clearSelection()}>
                Clear
              </button>
            </Show>
            <A
              href="/install"
              class={`btn btn-sm ${canInstall() ? "btn-generate" : "btn-secondary"}`}
            >
              Install
            </A>
          </div>
        </div>

        {/* New folder inline */}
        <Show when={showNewFolder()}>
          <div class="new-folder-input" style={{ "margin-top": "var(--sp-2)" }}>
            <input
              type="text"
              class="form-input"
              placeholder="Folder name"
              value={newFolderName()}
              onInput={(e) => setNewFolderName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubfolder();
                if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
              }}
            />
            <button class="btn btn-primary btn-sm" onClick={handleCreateSubfolder}>Create</button>
            <button class="btn btn-ghost btn-sm" onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}>Cancel</button>
          </div>
        </Show>
      </div>
    </div>
  );
}

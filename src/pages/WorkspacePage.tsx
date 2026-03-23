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

  const [showAddRepo, setShowAddRepo] = createSignal(false);
  const [repoUrl, setRepoUrl] = createSignal("");
  const [addingRepo, setAddingRepo] = createSignal(false);

  async function handleAddRepo() {
    const url = repoUrl().trim();
    if (!url) return;

    // Parse GitHub URL: accept "owner/repo", "https://github.com/owner/repo", etc.
    let repoPath = url
      .replace("https://github.com/", "")
      .replace("http://github.com/", "")
      .replace(".git", "")
      .replace(/\/$/, "");

    if (!repoPath.includes("/")) {
      return; // Need owner/repo format
    }

    setAddingRepo(true);
    try {
      // Use Tauri backend (gh CLI auth, no rate limits)
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<any>("add_custom_repo", { repoPath });

      const orgName = repoPath.split("/")[0];
      const newPkg = {
        id: result.id,
        name: result.name,
        description: result.description,
        category: "cross-tech" as const,
        skillCount: result.skillCount ?? result.skill_count ?? 0,
        repo: result.repo,
        repoUrl: result.repoUrl ?? result.repo_url ?? "",
        status: (result.status || "development") as "published" | "development" | "planned",
        tags: result.tags || [],
        publisher: result.publisher || orgName,
        updatedAt: result.updatedAt ?? result.updated_at ?? "",
        skillsPath: "",
        logoUrl: `https://github.com/${orgName}.png?size=128`,
      };

      packagesStore.setRegistryPackages([...packagesStore.registryPackages(), newPkg] as any);
      setRepoUrl("");
    } catch (e) {
      // Fallback for browser mode: try direct fetch
      try {
        const response = await fetch(
          `https://api.github.com/repos/${repoPath}`,
          { headers: { Accept: "application/vnd.github.v3+json" } }
        );
        if (!response.ok) throw new Error(`Repo niet gevonden (${response.status}). Check de URL.`);
        const repo = await response.json();
        const orgName = repoPath.split("/")[0];

        const newPkg = {
          id: repoPath.replace(/\//g, "--").toLowerCase(),
          name: repo.name.replace(/[-_]/g, " "),
          description: repo.description || "",
          category: "cross-tech" as const,
          skillCount: 0,
          repo: repoPath,
          repoUrl: repo.html_url,
          status: "development" as const,
          tags: repo.topics || [],
          publisher: orgName,
          updatedAt: repo.updated_at,
          skillsPath: "",
          logoUrl: `https://github.com/${orgName}.png?size=128`,
        };
        packagesStore.setRegistryPackages([...packagesStore.registryPackages(), newPkg] as any);
        setRepoUrl("");
      } catch (e2) {
        alert(`Kon repo niet toevoegen: ${e2 instanceof Error ? e2.message : String(e2)}`);
      }
    } finally {
      setAddingRepo(false);
    }
  }

  return (
    <div class="page">
      {/* Top bar: registry status + add repo */}
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
          <button
            class="btn btn-ghost"
            style={{ padding: "2px 8px", "font-size": "0.65rem", "margin-left": "var(--sp-2)" }}
            onClick={() => setShowAddRepo(!showAddRepo())}
          >
            + Add repo
          </button>
        </div>

        <Show when={showAddRepo()}>
          <div style={{ display: "flex", gap: "var(--sp-2)", "align-items": "center", "margin-top": "var(--sp-2)" }}>
            <input
              type="text"
              style={{ flex: 1, padding: "var(--sp-1) var(--sp-2)", "font-size": "0.8rem", background: "var(--bg-input)", border: "1px solid var(--border)", "border-radius": "var(--radius)", color: "var(--text-primary)", "font-family": "var(--font-mono)" }}
              placeholder="github.com/owner/repo or owner/repo"
              value={repoUrl()}
              onInput={(e) => setRepoUrl(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddRepo(); }}
            />
            <button class="btn btn-primary btn-sm" onClick={handleAddRepo} disabled={addingRepo()}>
              {addingRepo() ? "..." : "Add"}
            </button>
            <button class="btn btn-ghost btn-sm" onClick={() => setShowAddRepo(false)}>Cancel</button>
          </div>
        </Show>
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

      {/* Bottom bar: selection summary + install */}
      <Show when={selectedCount() > 0}>
        <div class="workspace-bottom">
          <div class="workspace-actions" style={{ width: "100%", display: "flex", "align-items": "center", gap: "var(--sp-3)" }}>
            <span class="workspace-summary" style={{ flex: 1 }}>
              <strong>{selectedCount()}</strong> packages
              <span class="text-muted"> · {totalSkills()} skills selected</span>
            </span>
            <button class="btn btn-ghost btn-sm" onClick={() => packagesStore.clearSelection()}>Clear</button>
            <A href="/install" class="btn btn-sm btn-generate">Install</A>
          </div>
        </div>
      </Show>
    </div>
  );
}

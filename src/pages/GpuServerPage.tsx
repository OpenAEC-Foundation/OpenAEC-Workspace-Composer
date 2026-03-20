import { createSignal, onMount, Show, For } from "solid-js";
import { gpuStore } from "../stores/gpu.store";
import type { SyncStatus } from "../lib/gpu-types";
import { syncStatusLabel, syncStatusColor } from "../lib/gpu-types";

function ConnectionConfig() {
  const cfg = () => gpuStore.config();

  function update(field: string, value: string | number | null) {
    gpuStore.setConfig({ ...cfg(), [field]: value });
  }

  async function handleTest() {
    try {
      await gpuStore.testConnection();
      await gpuStore.fetchServerStatus();
      await gpuStore.saveConfig();
    } catch {
      // Error already in store
    }
  }

  async function handleBrowseKey() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ multiple: false });
      if (selected) update("sshKeyPath", selected as string);
    } catch {
      const path = prompt("SSH key path:");
      if (path) update("sshKeyPath", path);
    }
  }

  return (
    <div class="card">
      <h2 class="card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        GPU Server Connection
      </h2>

      <div style={{ display: "grid", "grid-template-columns": "1fr 100px", gap: "var(--sp-3)" }}>
        <div class="form-group">
          <label>Host</label>
          <input
            type="text"
            placeholder="144.76.60.210"
            value={cfg().host}
            onInput={(e) => update("host", e.currentTarget.value)}
          />
        </div>
        <div class="form-group">
          <label>Port</label>
          <input
            type="number"
            value={cfg().port}
            onInput={(e) => update("port", parseInt(e.currentTarget.value) || 22)}
          />
        </div>
      </div>

      <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--sp-3)" }}>
        <div class="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="freek"
            value={cfg().username}
            onInput={(e) => update("username", e.currentTarget.value)}
          />
        </div>
        <div class="form-group">
          <label>SSH Config Alias (optional)</label>
          <input
            type="text"
            placeholder="hetzner"
            value={cfg().sshConfigHost || ""}
            onInput={(e) =>
              update("sshConfigHost", e.currentTarget.value || null)
            }
          />
        </div>
      </div>

      <div class="form-group">
        <label>SSH Key</label>
        <div class="input-with-button">
          <input
            type="text"
            placeholder="~/.ssh/id_ed25519"
            value={cfg().sshKeyPath}
            onInput={(e) => update("sshKeyPath", e.currentTarget.value)}
          />
          <button class="btn btn-secondary" onClick={handleBrowseKey}>
            Browse
          </button>
        </div>
      </div>

      <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-3)", "margin-top": "var(--sp-3)" }}>
        <button
          class="btn btn-primary"
          onClick={handleTest}
          disabled={gpuStore.connecting()}
        >
          {gpuStore.connecting() ? "Connecting..." : "Test Connection"}
        </button>
        <span
          style={{
            display: "inline-flex",
            "align-items": "center",
            gap: "var(--sp-2)",
          }}
        >
          <span
            class="statusbar-dot"
            style={{
              background: gpuStore.connected()
                ? "var(--success)"
                : gpuStore.connectionError()
                ? "var(--error)"
                : "var(--text-muted)",
            }}
          />
          <span class="text-dim" style={{ "font-size": "0.85rem" }}>
            {gpuStore.connected()
              ? "Connected"
              : gpuStore.connectionError()
              ? "Failed"
              : "Not connected"}
          </span>
        </span>
      </div>

      <Show when={gpuStore.connectionError()}>
        <p
          class="text-dim"
          style={{
            color: "var(--error)",
            "font-size": "0.8rem",
            "margin-top": "var(--sp-2)",
          }}
        >
          {gpuStore.connectionError()}
        </p>
      </Show>
    </div>
  );
}

function ServerStatusPanel() {
  const status = () => gpuStore.serverStatus();

  function vramPercent(): number {
    const s = status();
    if (!s?.gpuVramUsedMb || !s?.gpuVramTotalMb) return 0;
    return Math.round((s.gpuVramUsedMb / s.gpuVramTotalMb) * 100);
  }

  function diskPercent(): number {
    const s = status();
    if (!s?.diskUsedGb || !s?.diskTotalGb) return 0;
    return Math.round((s.diskUsedGb / s.diskTotalGb) * 100);
  }

  return (
    <Show when={gpuStore.connected() && status()}>
      <div class="card">
        <h2 class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
          Server Status
        </h2>

        <Show when={status()?.gpuName}>
          <div class="form-group" style={{ "margin-bottom": "var(--sp-3)" }}>
            <label style={{ "margin-bottom": "var(--sp-1)" }}>
              GPU: {status()!.gpuName}
            </label>
            <div class="progress-bar">
              <div
                class="progress-bar-fill"
                style={{ width: `${vramPercent()}%` }}
              />
            </div>
            <small class="text-muted">
              {status()!.gpuVramUsedMb} / {status()!.gpuVramTotalMb} MB (
              {vramPercent()}%)
            </small>
          </div>
        </Show>

        <Show when={status()?.diskTotalGb}>
          <div class="form-group" style={{ "margin-bottom": "var(--sp-3)" }}>
            <label style={{ "margin-bottom": "var(--sp-1)" }}>Disk</label>
            <div class="progress-bar">
              <div
                class="progress-bar-fill"
                style={{ width: `${diskPercent()}%` }}
              />
            </div>
            <small class="text-muted">
              {status()!.diskUsedGb?.toFixed(0)} /{" "}
              {status()!.diskTotalGb?.toFixed(0)} GB ({diskPercent()}%)
            </small>
          </div>
        </Show>

        <Show when={status()?.uptime}>
          <p class="text-dim" style={{ "font-size": "0.8rem" }}>
            Uptime: {status()!.uptime}
          </p>
        </Show>

        <button
          class="btn btn-secondary"
          style={{ "margin-top": "var(--sp-2)" }}
          onClick={() => gpuStore.fetchServerStatus()}
          disabled={gpuStore.statusLoading()}
        >
          {gpuStore.statusLoading() ? "Loading..." : "Refresh"}
        </button>
      </div>
    </Show>
  );
}

function SyncSessionManager() {
  const [showNew, setShowNew] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [newLocal, setNewLocal] = createSignal("");
  const [newRemote, setNewRemote] = createSignal("");
  const [creating, setCreating] = createSignal(false);
  const [syncError, setSyncError] = createSignal<string | null>(null);

  async function handleBrowseLocal() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) setNewLocal(selected as string);
    } catch {
      const path = prompt("Local folder path:");
      if (path) setNewLocal(path);
    }
  }

  async function handleCreate() {
    if (!newName() || !newLocal() || !newRemote()) return;
    setCreating(true);
    setSyncError(null);
    try {
      await gpuStore.createSyncSession(newName(), newLocal(), newRemote());
      setShowNew(false);
      setNewName("");
      setNewLocal("");
      setNewRemote("");
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  function statusColor(status: SyncStatus): string {
    return syncStatusColor(status);
  }

  return (
    <div class="card">
      <h2 class="card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        Folder Sync Sessions
      </h2>

      <Show when={!gpuStore.hasMutagen() && gpuStore.mutagenChecked()}>
        <div
          class="empty-state"
          style={{
            background: "var(--bg-input)",
            padding: "var(--sp-4)",
            "border-radius": "var(--radius)",
            "margin-bottom": "var(--sp-3)",
          }}
        >
          <p class="text-dim" style={{ "margin-bottom": "var(--sp-2)" }}>
            Mutagen is required for bidirectional folder sync.
          </p>
          <code class="font-mono" style={{ "font-size": "0.8rem", color: "var(--accent)" }}>
            winget install mutagen-io.Mutagen
          </code>
        </div>
      </Show>

      <Show when={gpuStore.syncSessions().length === 0 && !showNew()}>
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <p>No sync sessions</p>
          <small>Create a sync pair to keep folders in sync with the GPU server</small>
        </div>
      </Show>

      <For each={gpuStore.syncSessions()}>
        {(session) => (
          <div class="sync-session-card">
            <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--sp-2)" }}>
              <strong style={{ color: "var(--text-primary)" }}>
                {session.projectName}
              </strong>
              <span style={{ display: "inline-flex", "align-items": "center", gap: "var(--sp-1)" }}>
                <span
                  class="statusbar-dot"
                  style={{ background: statusColor(session.status) }}
                />
                <span class="text-dim" style={{ "font-size": "0.8rem" }}>
                  {syncStatusLabel(session.status)}
                </span>
              </span>
            </div>
            <div class="sync-paths">
              <span class="font-mono text-dim" style={{ "font-size": "0.75rem" }}>
                {session.localPath}
              </span>
              <span style={{ color: "var(--accent)", "font-size": "0.9rem" }}>
                ↕
              </span>
              <span class="font-mono text-dim" style={{ "font-size": "0.75rem" }}>
                {session.remotePath}
              </span>
            </div>
            <div style={{ display: "flex", gap: "var(--sp-2)", "margin-top": "var(--sp-2)" }}>
              <Show when={session.status === "active"}>
                <button
                  class="btn btn-secondary btn-sm"
                  onClick={() => gpuStore.pauseSync(session.projectName)}
                >
                  Pause
                </button>
              </Show>
              <Show when={session.status === "paused"}>
                <button
                  class="btn btn-secondary btn-sm"
                  onClick={() => gpuStore.resumeSync(session.projectName)}
                >
                  Resume
                </button>
              </Show>
              <button
                class="btn btn-secondary btn-sm"
                style={{ color: "var(--error)" }}
                onClick={() => gpuStore.terminateSync(session.projectName)}
              >
                Stop
              </button>
            </div>
          </div>
        )}
      </For>

      <Show when={showNew()}>
        <div
          class="sync-session-card"
          style={{ "border-color": "var(--accent)" }}
        >
          <div class="form-group">
            <label>Project Name</label>
            <input
              type="text"
              placeholder="my-project"
              value={newName()}
              onInput={(e) => setNewName(e.currentTarget.value)}
            />
          </div>
          <div class="form-group">
            <label>Local Folder</label>
            <div class="input-with-button">
              <input
                type="text"
                placeholder="C:\Projects\my-project"
                value={newLocal()}
                onInput={(e) => setNewLocal(e.currentTarget.value)}
              />
              <button class="btn btn-secondary" onClick={handleBrowseLocal}>
                Browse
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Remote Folder</label>
            <input
              type="text"
              placeholder={`/home/${gpuStore.config().username || "user"}/workspaces/my-project`}
              value={newRemote()}
              onInput={(e) => setNewRemote(e.currentTarget.value)}
            />
          </div>

          <Show when={syncError()}>
            <p style={{ color: "var(--error)", "font-size": "0.8rem" }}>
              {syncError()}
            </p>
          </Show>

          <div style={{ display: "flex", gap: "var(--sp-2)", "margin-top": "var(--sp-3)" }}>
            <button
              class="btn btn-primary"
              onClick={handleCreate}
              disabled={creating() || !newName() || !newLocal() || !newRemote()}
            >
              {creating() ? "Starting..." : "Start Sync"}
            </button>
            <button
              class="btn btn-secondary"
              onClick={() => setShowNew(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Show>

      <Show when={gpuStore.hasMutagen() && gpuStore.connected()}>
        <button
          class="btn btn-secondary"
          style={{ "margin-top": "var(--sp-3)", width: "100%" }}
          onClick={() => setShowNew(true)}
          disabled={showNew()}
        >
          + New Sync Pair
        </button>
      </Show>
    </div>
  );
}

function SetupGuide() {
  const [expanded, setExpanded] = createSignal(false);

  return (
    <Show when={!gpuStore.connected()}>
      <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
        <h2
          class="card-title"
          style={{ cursor: "pointer" }}
          onClick={() => setExpanded(!expanded())}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Setup Guide
          <span class="text-muted" style={{ "font-size": "0.75rem", "margin-left": "auto" }}>
            {expanded() ? "collapse" : "expand"}
          </span>
        </h2>

        <Show when={expanded()}>
          <div style={{ "font-size": "0.85rem", "line-height": "1.6" }}>
            <div style={{ "margin-bottom": "var(--sp-3)" }}>
              <strong style={{ color: "var(--accent)" }}>1. Generate an SSH key</strong>
              <p class="text-dim">If you don't have one yet, run in your terminal:</p>
              <code class="font-mono" style={{ display: "block", background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)", "margin-top": "var(--sp-1)", color: "var(--accent)", "font-size": "0.8rem" }}>
                ssh-keygen -t ed25519 -C "your@email.com"
              </code>
            </div>

            <div style={{ "margin-bottom": "var(--sp-3)" }}>
              <strong style={{ color: "var(--accent)" }}>2. Copy your public key to the server</strong>
              <p class="text-dim">Ask your admin to add your key, or if you have access:</p>
              <code class="font-mono" style={{ display: "block", background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)", "margin-top": "var(--sp-1)", color: "var(--accent)", "font-size": "0.8rem" }}>
                ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server
              </code>
            </div>

            <div style={{ "margin-bottom": "var(--sp-3)" }}>
              <strong style={{ color: "var(--accent)" }}>3. Add SSH config alias (optional)</strong>
              <p class="text-dim">Add to <code class="font-mono">~/.ssh/config</code>:</p>
              <pre class="font-mono" style={{ background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)", "margin-top": "var(--sp-1)", color: "var(--text-dim)", "font-size": "0.8rem", "white-space": "pre-wrap" }}>
{`Host my-gpu-server
    HostName 144.76.60.210
    User your-username
    IdentityFile ~/.ssh/id_ed25519`}
              </pre>
            </div>

            <div style={{ "margin-bottom": "var(--sp-3)" }}>
              <strong style={{ color: "var(--accent)" }}>4. Install Mutagen (for folder sync)</strong>
              <p class="text-dim">Required for bidirectional folder synchronization:</p>
              <code class="font-mono" style={{ display: "block", background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)", "margin-top": "var(--sp-1)", color: "var(--accent)", "font-size": "0.8rem" }}>
                winget install mutagen-io.Mutagen
              </code>
            </div>

            <div>
              <strong style={{ color: "var(--accent)" }}>5. Fill in the form above</strong>
              <p class="text-dim">
                Enter your server details and click "Test Connection". If using an SSH config alias,
                you only need to fill in the alias field — host, port and key are read from your config.
              </p>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
}

export function GpuServerPage() {
  onMount(async () => {
    await gpuStore.loadConfig();
    await gpuStore.checkMutagen();
    // Auto-connect if config exists
    if (gpuStore.config().host || gpuStore.config().sshConfigHost) {
      try {
        await gpuStore.testConnection();
        await gpuStore.fetchServerStatus();
      } catch {
        // Not connected, that's fine
      }
    }
  });

  return (
    <div class="content-body">
      <div class="content-scroll">
        <ConnectionConfig />
        <SetupGuide />
        <div style={{ "margin-top": "var(--sp-4)" }}>
          <ServerStatusPanel />
        </div>
        <div style={{ "margin-top": "var(--sp-4)" }}>
          <SyncSessionManager />
        </div>
      </div>
    </div>
  );
}

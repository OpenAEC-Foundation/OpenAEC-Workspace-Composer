import { createSignal, createMemo } from "solid-js";
import type {
  GpuServerConfig,
  GpuServerState,
  SyncSession,
  SyncStatus,
  ServerStatus,
} from "../lib/gpu-types";
import { defaultGpuConfig } from "../lib/gpu-types";

// Connection state
const [config, setConfig] = createSignal<GpuServerConfig>(defaultGpuConfig());
const [connected, setConnected] = createSignal(false);
const [connecting, setConnecting] = createSignal(false);
const [connectionError, setConnectionError] = createSignal<string | null>(null);

// Server status
const [serverStatus, setServerStatus] = createSignal<ServerStatus | null>(null);
const [statusLoading, setStatusLoading] = createSignal(false);

// Sync sessions
const [syncSessions, setSyncSessions] = createSignal<SyncSession[]>([]);

// Mutagen availability
const [mutagenVersion, setMutagenVersion] = createSignal<string | null>(null);
const [mutagenChecked, setMutagenChecked] = createSignal(false);

// Derived
const hasMutagen = createMemo(() => mutagenVersion() !== null);
const activeSyncCount = createMemo(
  () => syncSessions().filter((s) => s.status === "active").length
);

// Actions
async function testConnection() {
  setConnecting(true);
  setConnectionError(null);
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<string>("gpu_test_connection", {
      config: config(),
    });
    setConnected(true);
    setConnectionError(null);
    return result;
  } catch (e) {
    setConnected(false);
    setConnectionError(e instanceof Error ? e.message : String(e));
    throw e;
  } finally {
    setConnecting(false);
  }
}

async function fetchServerStatus() {
  setStatusLoading(true);
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const status = await invoke<ServerStatus>("gpu_server_status", {
      config: config(),
    });
    setServerStatus(status);
    setConnected(true);
  } catch (e) {
    setConnected(false);
    setServerStatus(null);
  } finally {
    setStatusLoading(false);
  }
}

async function checkMutagen() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const version = await invoke<string>("gpu_check_mutagen");
    setMutagenVersion(version);
  } catch {
    setMutagenVersion(null);
  } finally {
    setMutagenChecked(true);
  }
}

async function loadConfig() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const state = await invoke<GpuServerState>("gpu_load_config");
    setConfig(state.config);
    setSyncSessions(state.sync_sessions);
  } catch {
    // First run, no config
  }
}

async function saveConfig() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("gpu_save_config", {
      state: { config: config(), sync_sessions: syncSessions() },
    });
  } catch {
    // Silent fail on save
  }
}

async function createSyncSession(
  projectName: string,
  localPath: string,
  remotePath: string
) {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("gpu_sync_create", {
    config: config(),
    localPath,
    remotePath,
    projectName,
  });

  const session: SyncSession = {
    id: crypto.randomUUID(),
    project_name: projectName,
    local_path: localPath,
    remote_path: remotePath,
    status: "active",
    created_at: new Date().toISOString(),
  };
  setSyncSessions((prev) => [...prev, session]);
  await saveConfig();
}

async function pauseSync(sessionName: string) {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("gpu_sync_pause", { sessionName });
  setSyncSessions((prev) =>
    prev.map((s) =>
      s.project_name === sessionName ? { ...s, status: "paused" as SyncStatus } : s
    )
  );
  await saveConfig();
}

async function resumeSync(sessionName: string) {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("gpu_sync_resume", { sessionName });
  setSyncSessions((prev) =>
    prev.map((s) =>
      s.project_name === sessionName
        ? { ...s, status: "active" as SyncStatus }
        : s
    )
  );
  await saveConfig();
}

async function terminateSync(sessionName: string) {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("gpu_sync_terminate", { sessionName });
  setSyncSessions((prev) =>
    prev.filter((s) => s.project_name !== sessionName)
  );
  await saveConfig();
}

async function listRemoteDirs(path: string): Promise<string[]> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string[]>("gpu_list_remote_dirs", { config: config(), path });
}

export const gpuStore = {
  // State
  config,
  setConfig,
  connected,
  connecting,
  connectionError,
  serverStatus,
  statusLoading,
  syncSessions,
  mutagenVersion,
  mutagenChecked,
  // Derived
  hasMutagen,
  activeSyncCount,
  // Actions
  testConnection,
  fetchServerStatus,
  checkMutagen,
  loadConfig,
  saveConfig,
  createSyncSession,
  pauseSync,
  resumeSync,
  terminateSync,
  listRemoteDirs,
};

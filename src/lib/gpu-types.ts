export interface GpuServerConfig {
  host: string;
  port: number;
  username: string;
  ssh_key_path: string;
  ssh_config_host: string | null;
}

export interface SyncSession {
  id: string;
  project_name: string;
  local_path: string;
  remote_path: string;
  status: SyncStatus;
  created_at: string;
}

export type SyncStatus = "active" | "paused" | "disconnected" | { error: string };

export interface ServerStatus {
  connected: boolean;
  gpu_name: string | null;
  gpu_vram_used_mb: number | null;
  gpu_vram_total_mb: number | null;
  disk_used_gb: number | null;
  disk_total_gb: number | null;
  uptime: string | null;
}

export interface GpuServerState {
  config: GpuServerConfig;
  sync_sessions: SyncSession[];
}

export interface PrerequisiteResult {
  name: string;
  command: string;
  required: boolean;
  found: boolean;
  version: string | null;
  install_hint: string;
}

export interface PrerequisitesReport {
  checks: PrerequisiteResult[];
  all_required_ok: boolean;
}

export interface MutagenSessionInfo {
  name: string;
  status: string;
  local_path: string;
  remote_path: string;
}

export function defaultGpuConfig(): GpuServerConfig {
  return {
    host: "",
    port: 22,
    username: "",
    ssh_key_path: "",
    ssh_config_host: null,
  };
}

export function syncStatusLabel(status: SyncStatus): string {
  if (typeof status === "string") {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  return `Error: ${status.error}`;
}

export function syncStatusColor(status: SyncStatus): string {
  if (status === "active") return "var(--success)";
  if (status === "paused") return "var(--warning, #f59e0b)";
  if (status === "disconnected") return "var(--text-muted)";
  return "var(--error)";
}

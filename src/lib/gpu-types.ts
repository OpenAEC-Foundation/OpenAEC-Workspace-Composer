export interface GpuServerConfig {
  host: string;
  port: number;
  username: string;
  sshKeyPath: string;
  sshConfigHost: string | null;
}

export interface SyncSession {
  id: string;
  projectName: string;
  localPath: string;
  remotePath: string;
  status: SyncStatus;
  createdAt: string;
}

export type SyncStatus = "active" | "paused" | "disconnected" | { error: string };

export interface ServerStatus {
  connected: boolean;
  gpuName: string | null;
  gpuVramUsedMb: number | null;
  gpuVramTotalMb: number | null;
  diskUsedGb: number | null;
  diskTotalGb: number | null;
  uptime: string | null;
}

export interface GpuServerState {
  config: GpuServerConfig;
  syncSessions: SyncSession[];
}

export interface PrerequisiteResult {
  name: string;
  command: string;
  required: boolean;
  found: boolean;
  version: string | null;
  installHint: string;
}

export interface PrerequisitesReport {
  checks: PrerequisiteResult[];
  allRequiredOk: boolean;
}

export interface MutagenSessionInfo {
  name: string;
  status: string;
  localPath: string;
  remotePath: string;
}

export function defaultGpuConfig(): GpuServerConfig {
  return {
    host: "",
    port: 22,
    username: "",
    sshKeyPath: "",
    sshConfigHost: null,
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

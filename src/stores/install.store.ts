import { createSignal, createMemo } from "solid-js";

export type InstallStatus = "idle" | "checking" | "conflicts" | "installing" | "success" | "error";
export type ConflictStrategy = "skip" | "overwrite" | "merge";

export interface InstallStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
}

export interface PrerequisiteCheck {
  id: string;
  name: string;
  required: boolean;
  found: boolean;
  version?: string;
  installHint?: string;
}

export interface Conflict {
  path: string;
  kind: string;
  description: string;
  existingSize: number | null;
}

export interface ConflictScanResult {
  conflicts: Conflict[];
  hasConflicts: boolean;
}

// Install state
const [installStatus, setInstallStatus] = createSignal<InstallStatus>("idle");
const [installProgress, setInstallProgress] = createSignal(0);
const [installSteps, setInstallSteps] = createSignal<InstallStep[]>([]);
const [installError, setInstallError] = createSignal<string | null>(null);
const [installResult, setInstallResult] = createSignal<{
  workspaceFile: string;
  filesCreated: string[];
  filesSkipped: string[];
  packagesInstalled?: string[];
  skillsTotal?: number;
} | null>(null);

// Conflict state
const [conflicts, setConflicts] = createSignal<Conflict[]>([]);
const [conflictStrategy, setConflictStrategy] = createSignal<ConflictStrategy>("merge");

// Install options (toggles)
const [openVscodeAfterInstall, setOpenVscodeAfterInstall] = createSignal(true);
const [gpuSyncAfterInstall, setGpuSyncAfterInstall] = createSignal(false);
const [initGitAfterInstall, setInitGitAfterInstall] = createSignal(true);

// Prerequisites
const [prerequisites, setPrerequisites] = createSignal<PrerequisiteCheck[]>([]);
const [prerequisitesChecked, setPrerequisitesChecked] = createSignal(false);

const allPrerequisitesMet = createMemo(() =>
  prerequisites().filter((p) => p.required).every((p) => p.found)
);

const isInstalling = createMemo(() =>
  installStatus() === "installing" || installStatus() === "checking"
);

function resetInstall() {
  setInstallStatus("idle");
  setInstallProgress(0);
  setInstallSteps([]);
  setInstallError(null);
  setInstallResult(null);
  setConflicts([]);
}

function updateStep(id: string, status: InstallStep["status"]) {
  setInstallSteps((prev) =>
    prev.map((s) => (s.id === id ? { ...s, status } : s))
  );
}

export const installStore = {
  installStatus,
  setInstallStatus,
  installProgress,
  setInstallProgress,
  installSteps,
  setInstallSteps,
  installError,
  setInstallError,
  installResult,
  setInstallResult,
  conflicts,
  setConflicts,
  conflictStrategy,
  setConflictStrategy,
  prerequisites,
  setPrerequisites,
  prerequisitesChecked,
  setPrerequisitesChecked,
  allPrerequisitesMet,
  isInstalling,
  resetInstall,
  updateStep,
  // Install options
  openVscodeAfterInstall,
  setOpenVscodeAfterInstall,
  gpuSyncAfterInstall,
  setGpuSyncAfterInstall,
  initGitAfterInstall,
  setInitGitAfterInstall,
};

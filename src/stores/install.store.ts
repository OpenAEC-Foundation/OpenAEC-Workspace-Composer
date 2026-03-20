import { createSignal, createMemo } from "solid-js";

export type InstallStatus = "idle" | "checking" | "installing" | "success" | "error";

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
}

// Install state
const [installStatus, setInstallStatus] = createSignal<InstallStatus>("idle");
const [installProgress, setInstallProgress] = createSignal(0);
const [installSteps, setInstallSteps] = createSignal<InstallStep[]>([]);
const [installError, setInstallError] = createSignal<string | null>(null);
const [installResult, setInstallResult] = createSignal<{
  workspaceFile: string;
  filesCreated: string[];
  packagesInstalled?: string[];
  skillsTotal?: number;
} | null>(null);

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
  prerequisites,
  setPrerequisites,
  prerequisitesChecked,
  setPrerequisitesChecked,
  allPrerequisitesMet,
  isInstalling,
  resetInstall,
  updateStep,
};

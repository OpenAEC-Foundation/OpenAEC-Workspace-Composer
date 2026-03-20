import { createSignal } from "solid-js";
import type { WorkflowTypeId } from "../lib/workflows";

export type EffortLevel = "low" | "medium" | "high";

// Workspace configuration state
const [workspacePath, setWorkspacePath] = createSignal("");
const [projectName, setProjectName] = createSignal("");
const [effortLevel, setEffortLevel] = createSignal<EffortLevel>("medium");
const [workflowType, setWorkflowType] = createSignal<WorkflowTypeId>("skill-package");

// Version upgrade state
const [sourceVersion, setSourceVersion] = createSignal("");
const [targetVersion, setTargetVersion] = createSignal("");
const [targetRepo, setTargetRepo] = createSignal("");

// Recent workspaces
const [recentWorkspaces, setRecentWorkspaces] = createSignal<string[]>([]);

// Path validation
export interface PathValidation {
  exists: boolean;
  isDir: boolean;
  isWritable: boolean;
  hasClaudeDir: boolean;
}
const [pathValidation, setPathValidation] = createSignal<PathValidation | null>(null);

function resetWorkflow() {
  setWorkflowType("skill-package");
  setSourceVersion("");
  setTargetVersion("");
  setTargetRepo("");
}

export const workspaceStore = {
  // Getters
  workspacePath,
  projectName,
  effortLevel,
  workflowType,
  sourceVersion,
  targetVersion,
  targetRepo,
  recentWorkspaces,
  pathValidation,
  // Setters
  setWorkspacePath,
  setProjectName,
  setEffortLevel,
  setWorkflowType,
  setSourceVersion,
  setTargetVersion,
  setTargetRepo,
  setRecentWorkspaces,
  setPathValidation,
  resetWorkflow,
};

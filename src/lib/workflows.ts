export type WorkflowTypeId = "skill-package" | "version-upgrade";

export interface WorkflowPhase {
  id: string;
  number: number;
  name: string;
  description: string;
}

export interface WorkflowConfigField {
  id: string;
  label: string;
  type: "text" | "select" | "path" | "packages";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface WorkflowType {
  id: WorkflowTypeId;
  name: string;
  description: string;
  icon: string;
  color: string;
  phases: WorkflowPhase[];
  configFields: WorkflowConfigField[];
  outputFiles: string[];
}

const skillPackagePhases: WorkflowPhase[] = [
  { id: "bootstrap", number: 1, name: "Bootstrap & Raw Masterplan", description: "Gather input, create infrastructure, identify topics" },
  { id: "research", number: 2, name: "Deep Research", description: "Systematically investigate every topic" },
  { id: "masterplan", number: 3, name: "Masterplan Refinement", description: "Finalize execution plan with agent prompts" },
  { id: "topic-research", number: 4, name: "Topic Research", description: "Deep-dive research per skill group" },
  { id: "creation", number: 5, name: "Skill Creation", description: "Build skills in parallel agent batches" },
  { id: "validation", number: 6, name: "Validation & Audit", description: "Structural, content, and functional testing" },
  { id: "publication", number: 7, name: "Publication & Release", description: "README, banner, GitHub release, compliance audit" },
];

const versionUpgradePhases: WorkflowPhase[] = [
  { id: "bootstrap", number: 1, name: "Bootstrap & State Assessment", description: "Create workspace, snapshot current state, identify scope" },
  { id: "research", number: 2, name: "Research Breaking Changes", description: "Investigate breaking changes, deprecations, new features" },
  { id: "migration-plan", number: 3, name: "Migration Plan Refinement", description: "Dependency-ordered steps, batch plan, agent prompts" },
  { id: "component-research", number: 4, name: "Component-Specific Research", description: "Per-step deep dives, concurrent with execution" },
  { id: "execution", number: 5, name: "Execute Migration", description: "Migrate in batches with regression gates" },
  { id: "validation", number: 6, name: "Validation & Testing", description: "Tests, compatibility, regression testing" },
  { id: "release", number: 7, name: "Release & Documentation", description: "Migration guide, changelog, release tag" },
];

export const workflowTypes: WorkflowType[] = [
  {
    id: "skill-package",
    name: "Skill Package Workspace",
    description: "Bootstrap a Claude Code workspace with curated skill packages from OpenAEC Foundation",
    icon: "skill-package",
    color: "#F5A623",
    phases: skillPackagePhases,
    configFields: [
      { id: "packages", label: "Skill Packages", type: "packages", required: true },
    ],
    outputFiles: [
      ".code-workspace",
      "CLAUDE.md",
      ".claude/settings.local.json",
      ".gitignore",
    ],
  },
  {
    id: "version-upgrade",
    name: "Version Upgrade Workspace",
    description: "Bootstrap a structured upgrade workspace with migration plan, breaking changes tracker, and rollback procedures",
    icon: "version-upgrade",
    color: "#3498db",
    phases: versionUpgradePhases,
    configFields: [
      { id: "sourceVersion", label: "Source Version", type: "text", required: true, placeholder: "e.g. 1.x" },
      { id: "targetVersion", label: "Target Version", type: "text", required: true, placeholder: "e.g. 2.x" },
      { id: "targetRepo", label: "Target Repository", type: "path", required: false, placeholder: "Path to codebase being upgraded" },
    ],
    outputFiles: [
      ".code-workspace",
      "CLAUDE.md",
      "ROADMAP.md",
      "MIGRATION-PLAN.md",
      "BREAKING-CHANGES.md",
      "ACCEPTANCE-CRITERIA.md",
      "CURRENT-STATE.md",
      "ROLLBACK-PLAN.md",
      "COMPATIBILITY-MATRIX.md",
      "DECISIONS.md",
      "SOURCES.md",
      "WAY_OF_WORK.md",
      "LESSONS.md",
      "CHANGELOG.md",
      ".claude/settings.local.json",
      ".gitignore",
    ],
  },
];

export function getWorkflowType(id: WorkflowTypeId): WorkflowType {
  return workflowTypes.find((w) => w.id === id)!;
}

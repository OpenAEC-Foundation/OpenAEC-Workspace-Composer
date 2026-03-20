export interface SettingsKey {
  key: string;
  label: string;
  description: string;
  type: "boolean" | "string" | "array" | "select";
  default?: any;
  options?: { value: string; label: string }[];
  category: "permissions" | "behavior" | "model" | "environment";
}

export const settingsSchema: SettingsKey[] = [
  // Permissions
  { key: "Bash(npm:*)", label: "npm commands", description: "Allow npm/npx commands", type: "boolean", default: true, category: "permissions" },
  { key: "Bash(cargo:*)", label: "Cargo commands", description: "Allow cargo/rustc commands", type: "boolean", default: true, category: "permissions" },
  { key: "Bash(git:*)", label: "Git commands", description: "Allow git commands", type: "boolean", default: true, category: "permissions" },
  { key: "Bash(docker:*)", label: "Docker commands", description: "Allow docker commands", type: "boolean", default: false, category: "permissions" },
  { key: "Read", label: "Read files", description: "Allow reading files", type: "boolean", default: true, category: "permissions" },
  { key: "Write", label: "Write files", description: "Allow writing new files", type: "boolean", default: true, category: "permissions" },
  { key: "Edit", label: "Edit files", description: "Allow editing existing files", type: "boolean", default: true, category: "permissions" },
  { key: "Glob", label: "Glob search", description: "Allow file pattern matching", type: "boolean", default: true, category: "permissions" },
  { key: "Grep", label: "Content search", description: "Allow searching file contents", type: "boolean", default: true, category: "permissions" },
  { key: "WebFetch", label: "Web fetch", description: "Allow fetching web URLs", type: "boolean", default: true, category: "permissions" },
  { key: "WebSearch", label: "Web search", description: "Allow web searches", type: "boolean", default: true, category: "permissions" },
  { key: "Agent", label: "Sub-agents", description: "Allow spawning sub-agents", type: "boolean", default: true, category: "permissions" },
  { key: "Bash(python:*)", label: "Python commands", description: "Allow python/pip commands", type: "boolean", default: false, category: "permissions" },
  { key: "NotebookEdit", label: "Notebook editing", description: "Allow editing Jupyter notebooks", type: "boolean", default: false, category: "permissions" },
];

export const defaultPermissions = settingsSchema
  .filter(s => s.category === "permissions" && s.default === true)
  .map(s => s.key);

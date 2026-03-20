import { createSignal } from "solid-js";

// Claude Code settings configuration
export interface ClaudeSettings {
  permissions: string[];
  customPermissions: string[];
  env: Record<string, string>;
  model: string;
}

export interface McpServer {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: "stdio" | "sse" | "http";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  envVars: Record<string, string>;
}

export interface Hook {
  id: string;
  event: "PreToolUse" | "PostToolUse" | "Stop" | "SessionStart" | "SessionEnd" | "UserPromptSubmit";
  type: "command" | "intercept";
  matcher?: string;
  command: string;
  enabled: boolean;
}

// CLAUDE.md sections
export interface ClaudeMdSections {
  projectName: string;
  projectDescription: string;
  teamOrg: string;
  docLanguage: "nl" | "en";
  codeLanguage: "en";
  conventionalCommits: boolean;
  customConventions: string;
  protocols: string[];
  customProtocol: string;
}

const defaultClaudeMdSections: ClaudeMdSections = {
  projectName: "",
  projectDescription: "",
  teamOrg: "",
  docLanguage: "en",
  codeLanguage: "en",
  conventionalCommits: true,
  customConventions: "",
  protocols: ["P-001", "P-002", "P-003", "P-004"],
  customProtocol: "",
};

// Settings state
const defaultSettings: ClaudeSettings = {
  permissions: ["Bash(npm:*)", "Bash(cargo:*)", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "WebSearch", "Agent"],
  customPermissions: [],
  env: {},
  model: "",
};

const [settings, setSettings] = createSignal<ClaudeSettings>({ ...defaultSettings });
const [mcpServers, setMcpServers] = createSignal<McpServer[]>([]);
const [hooks, setHooks] = createSignal<Hook[]>([]);

// Core files to generate
export interface CoreFileConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const defaultCoreFiles: CoreFileConfig[] = [
  { id: "claude-md", name: "CLAUDE.md", description: "Project identity and conventions", enabled: true },
  { id: "way-of-work", name: "WAY_OF_WORK.md", description: "Phase methodology and standards", enabled: false },
  { id: "sources", name: "SOURCES.md", description: "Approved documentation sources", enabled: false },
  { id: "decisions", name: "DECISIONS.md", description: "Architectural decision log", enabled: false },
  { id: "lessons", name: "LESSONS.md", description: "Lessons learned during development", enabled: false },
  { id: "gitignore", name: ".gitignore", description: "Git ignore rules", enabled: true },
];

const [coreFiles, setCoreFiles] = createSignal<CoreFileConfig[]>(defaultCoreFiles);

// CLAUDE.md sections
const [claudeMdSections, setClaudeMdSections] = createSignal<ClaudeMdSections>({ ...defaultClaudeMdSections });

function updateClaudeMdSection<K extends keyof ClaudeMdSections>(key: K, value: ClaudeMdSections[K]) {
  setClaudeMdSections((prev) => ({ ...prev, [key]: value }));
}

function toggleCoreFile(id: string) {
  setCoreFiles((prev) =>
    prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
  );
}

function addMcpServer(server: McpServer) {
  setMcpServers((prev) => [...prev, server]);
}

function removeMcpServer(id: string) {
  setMcpServers((prev) => prev.filter((s) => s.id !== id));
}

function toggleMcpServer(id: string) {
  setMcpServers((prev) =>
    prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
  );
}

function updateMcpServerEnvVar(serverId: string, key: string, value: string) {
  setMcpServers((prev) =>
    prev.map((s) =>
      s.id === serverId
        ? { ...s, envVars: { ...s.envVars, [key]: value } }
        : s
    )
  );
}

function addHook(hook: Hook) {
  setHooks((prev) => [...prev, hook]);
}

function removeHook(id: string) {
  setHooks((prev) => prev.filter((h) => h.id !== id));
}

function updateHook(id: string, updates: Partial<Hook>) {
  setHooks((prev) =>
    prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
  );
}

function toggleHookEnabled(id: string) {
  setHooks((prev) =>
    prev.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h))
  );
}

function addCustomPermission(perm: string) {
  setSettings((prev) => ({
    ...prev,
    customPermissions: [...prev.customPermissions, perm],
  }));
}

function removeCustomPermission(perm: string) {
  setSettings((prev) => ({
    ...prev,
    customPermissions: prev.customPermissions.filter((p) => p !== perm),
  }));
}

function resetConfig() {
  setSettings({ ...defaultSettings });
  setMcpServers([]);
  setHooks([]);
  setCoreFiles(defaultCoreFiles);
  setClaudeMdSections({ ...defaultClaudeMdSections });
}

export const configStore = {
  settings,
  setSettings,
  mcpServers,
  setMcpServers,
  hooks,
  setHooks,
  coreFiles,
  setCoreFiles,
  claudeMdSections,
  setClaudeMdSections,
  updateClaudeMdSection,
  toggleCoreFile,
  addMcpServer,
  removeMcpServer,
  toggleMcpServer,
  updateMcpServerEnvVar,
  addHook,
  removeHook,
  updateHook,
  toggleHookEnabled,
  addCustomPermission,
  removeCustomPermission,
  resetConfig,
};

import { createSignal } from "solid-js";

// Claude Code settings configuration
export interface ClaudeSettings {
  permissions: string[];
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
}

export interface Hook {
  id: string;
  event: "PreToolUse" | "PostToolUse" | "Stop" | "SessionStart" | "SessionEnd";
  type: "command" | "intercept";
  matcher?: string;
  command: string;
}

// Settings state
const defaultSettings: ClaudeSettings = {
  permissions: ["Bash(npm:*)", "Bash(cargo:*)", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "WebSearch", "Agent"],
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
const [claudeMdSections, setClaudeMdSections] = createSignal({
  identity: "",
  stack: "",
  conventions: "",
  protocols: "",
  packages: "",
});

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

function addHook(hook: Hook) {
  setHooks((prev) => [...prev, hook]);
}

function removeHook(id: string) {
  setHooks((prev) => prev.filter((h) => h.id !== id));
}

function resetConfig() {
  setSettings({ ...defaultSettings });
  setMcpServers([]);
  setHooks([]);
  setCoreFiles(defaultCoreFiles);
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
  toggleCoreFile,
  addMcpServer,
  removeMcpServer,
  toggleMcpServer,
  addHook,
  removeHook,
  resetConfig,
};

import { createSignal, createMemo } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

// Types matching Rust structs

export interface ManagedProject {
  key: string;
  name: string;
  path: string;
  status: string;
  languages: string[];
  tags: string[];
  description: string;
  has_claude_md: boolean;
  has_status_md: boolean;
  has_todo_md: boolean;
  has_session: boolean;
  session_date: string | null;
  claude_md_size: number | null;
}

export interface Integration {
  from: string;
  to: string;
  description: string;
}

export interface SessionSummary {
  project: string;
  date: string;
  content: string;
}

export interface WorkspaceOverview {
  global_claude_md: string | null;
  projects: ManagedProject[];
  integrations: Integration[];
  lessons_file: string | null;
  sessions: SessionSummary[];
  context_files: string[];
}

// Signals

const [workspace, setWorkspace] = createSignal<WorkspaceOverview | null>(null);
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);
const [selectedProject, setSelectedProject] = createSignal<string | null>(null);
const [searchQuery, setSearchQuery] = createSignal("");
const [statusFilter, setStatusFilter] = createSignal<string>("all");

// Computed

const filteredProjects = createMemo(() => {
  const ws = workspace();
  if (!ws) return [];

  const query = searchQuery().toLowerCase();
  const filter = statusFilter();

  return ws.projects.filter((p) => {
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.key.toLowerCase().includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query));
    const matchesStatus = filter === "all" || p.status === filter;
    return matchesSearch && matchesStatus;
  });
});

const activeProjectCount = createMemo(() => {
  const ws = workspace();
  if (!ws) return 0;
  return ws.projects.filter((p) => p.status === "active").length;
});

const staleSessions = createMemo(() => {
  const ws = workspace();
  if (!ws) return [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return ws.sessions.filter((s) => {
    if (!s.date) return true;
    const sessionDate = new Date(s.date.split(" ")[0]);
    return sessionDate < sevenDaysAgo;
  });
});

// Actions

async function loadWorkspace(): Promise<void> {
  setLoading(true);
  setError(null);
  try {
    const result = await invoke<WorkspaceOverview>("scan_workspace");
    setWorkspace(result);
  } catch (e) {
    setError(String(e));
  } finally {
    setLoading(false);
  }
}

async function readProjectClaudeMd(projectPath: string): Promise<string> {
  return invoke<string>("read_project_claude_md", { projectPath });
}

async function readProjectFile(
  projectPath: string,
  filename: string
): Promise<string> {
  return invoke<string>("read_project_file", { projectPath, filename });
}

async function readSessionSummary(projectKey: string): Promise<string> {
  return invoke<string>("read_session_summary", { projectKey });
}

async function readLessonsLearned(): Promise<string> {
  return invoke<string>("read_lessons_learned");
}

async function readContextFile(filename: string): Promise<string> {
  return invoke<string>("read_context_file", { filename });
}

async function openInTerminal(projectPath: string): Promise<void> {
  try {
    await invoke("open_in_terminal", { projectPath });
  } catch (e) {
    console.error("Failed to open terminal:", e);
  }
}

async function openInExplorer(projectPath: string): Promise<void> {
  try {
    await invoke("open_in_explorer", { projectPath });
  } catch (e) {
    console.error("Failed to open Explorer:", e);
  }
}

export const managerStore = {
  workspace,
  loading,
  error,
  selectedProject,
  setSelectedProject,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filteredProjects,
  activeProjectCount,
  staleSessions,
  loadWorkspace,
  readProjectClaudeMd,
  readProjectFile,
  readSessionSummary,
  readLessonsLearned,
  readContextFile,
  openInTerminal,
  openInExplorer,
};

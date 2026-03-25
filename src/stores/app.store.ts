import { createSignal, createMemo } from "solid-js";

export type AppMode = "simple" | "advanced" | "manage";
export type Theme = "dark" | "light";

const [mode, setMode] = createSignal<AppMode>("simple");

// Simple mode: preset -> path -> install (3 steps)
// Advanced mode: full navigation with all pages
// Manage mode: workspace manager for inspecting orchestrator state
const isAdvanced = createMemo(() => mode() === "advanced");
const isManage = createMemo(() => mode() === "manage");

function toggleMode() {
  setMode((prev) => {
    if (prev === "simple") return "advanced";
    if (prev === "advanced") return "manage";
    return "simple";
  });
}

// Theme: persisted in localStorage, default "dark"
const storedTheme = (typeof localStorage !== "undefined"
  ? localStorage.getItem("openaec-theme")
  : null) as Theme | null;
const [theme, setTheme] = createSignal<Theme>(storedTheme ?? "dark");

// Apply theme attribute on initial load
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", theme());
}

function toggleTheme() {
  const next: Theme = theme() === "dark" ? "light" : "dark";
  setTheme(next);
  localStorage.setItem("openaec-theme", next);
  document.documentElement.setAttribute("data-theme", next);
}

export const appStore = {
  mode,
  setMode,
  isAdvanced,
  isManage,
  toggleMode,
  theme,
  toggleTheme,
};

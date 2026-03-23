import { createSignal, createMemo } from "solid-js";

export type AppMode = "simple" | "advanced";
export type Theme = "dark" | "light";

const [mode, setMode] = createSignal<AppMode>("simple");

// Simple mode: preset → path → install (3 steps)
// Advanced mode: full navigation with all pages
const isAdvanced = createMemo(() => mode() === "advanced");

function toggleMode() {
  setMode((prev) => (prev === "simple" ? "advanced" : "simple"));
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
  toggleMode,
  theme,
  toggleTheme,
};

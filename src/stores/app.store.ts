import { createSignal, createMemo } from "solid-js";

export type AppMode = "simple" | "advanced";

const [mode, setMode] = createSignal<AppMode>("simple");

// Simple mode: preset → path → install (3 steps)
// Advanced mode: full navigation with all pages
const isAdvanced = createMemo(() => mode() === "advanced");

function toggleMode() {
  setMode((prev) => (prev === "simple" ? "advanced" : "simple"));
}

export const appStore = {
  mode,
  setMode,
  isAdvanced,
  toggleMode,
};

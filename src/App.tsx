import { onMount } from "solid-js";
import { packagesStore } from "./stores/packages.store";

/** App initialization — triggers registry fetch on startup */
export function AppInit() {
  onMount(() => {
    packagesStore.loadRegistry();
  });
  return null;
}

// Re-export for backwards compatibility
export default function App() {
  return null;
}

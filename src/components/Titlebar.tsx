export function Titlebar() {
  async function minimize() {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } catch { /* dev mode fallback */ }
  }

  async function maximize() {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      if (await win.isMaximized()) {
        await win.unmaximize();
      } else {
        await win.maximize();
      }
    } catch { /* dev mode fallback */ }
  }

  async function close() {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } catch {
      window.close();
    }
  }

  return (
    <div class="titlebar" data-tauri-drag-region>
      <div class="titlebar-brand" data-tauri-drag-region>
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="14" width="24" height="14" rx="1" stroke="var(--accent)" stroke-width="2" />
          <path d="M2 14L16 4L30 14" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="9" y="18" width="4" height="4" fill="var(--accent)" opacity="0.6" />
          <rect x="19" y="18" width="4" height="4" fill="var(--accent)" opacity="0.6" />
        </svg>
        <span>OpenAEC</span>
        <span style={{ color: "var(--text-muted)", "font-weight": "400", "font-size": "0.75rem" }}>
          Workspace Composer
        </span>
      </div>
      <div class="titlebar-controls">
        <button class="titlebar-btn" onClick={minimize} aria-label="Minimize">
          <svg viewBox="0 0 10 10">
            <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button class="titlebar-btn" onClick={maximize} aria-label="Maximize">
          <svg viewBox="0 0 10 10">
            <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1" />
          </svg>
        </button>
        <button class="titlebar-btn close" onClick={close} aria-label="Close">
          <svg viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.2" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

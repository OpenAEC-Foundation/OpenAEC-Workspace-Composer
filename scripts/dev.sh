#!/bin/bash
# Clean start for OpenAEC Workspace Composer
# Kills zombie Vite/Tauri processes before launching dev mode.

set -e

echo "[dev.sh] Cleaning up zombie processes..."

# Kill any lingering Tauri app process
taskkill //IM "OpenAEC Workspace Composer.exe" //F 2>/dev/null && echo "  Killed Tauri app" || true

# Kill process occupying port 1420 (Vite dev server)
PID=$(netstat -ano 2>/dev/null | grep ":1420 .*LISTENING" | awk '{print $5}' | head -1)
if [ -n "$PID" ] && [ "$PID" != "0" ]; then
    taskkill //PID "$PID" //F 2>/dev/null && echo "  Killed process on port 1420 (PID $PID)" || true
    sleep 1
fi

echo "[dev.sh] Starting Tauri dev..."
export PATH="$HOME/.cargo/bin:$PATH"
npx tauri dev

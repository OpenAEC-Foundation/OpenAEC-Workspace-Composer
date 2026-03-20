#!/bin/bash
# Checks if tauri dev is running. If not, starts it in background.
# Used as a PostToolUse hook for Edit/Write in the Composer workspace.

# Check if vite dev server is responding
if curl -s --max-time 1 http://localhost:1420 > /dev/null 2>&1; then
  exit 0  # Already running
fi

# Not running — start it
cd "$(dirname "$0")/.."
export PATH="$HOME/.cargo/bin:$PATH"
nohup npx tauri dev > /tmp/tauri-dev.log 2>&1 &
echo "Started tauri dev server (PID: $!)" >&2
exit 0

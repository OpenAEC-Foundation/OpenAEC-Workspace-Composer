export interface HookTemplate {
  id: string;
  name: string;
  description: string;
  event: string;
  matcher?: string;
  command: string;
}

export const hookTemplates: HookTemplate[] = [
  {
    id: "lint-on-edit",
    name: "Lint after edit",
    description: "Run linter after file edits",
    event: "PostToolUse",
    matcher: "Edit|Write",
    command: "npm run lint --fix $FILE 2>/dev/null || true",
  },
  {
    id: "format-on-write",
    name: "Format on write",
    description: "Auto-format files after writing",
    event: "PostToolUse",
    matcher: "Write",
    command: "npx prettier --write $FILE 2>/dev/null || true",
  },
  {
    id: "prevent-env-commit",
    name: "Block .env commits",
    description: "Prevent committing .env files",
    event: "PreToolUse",
    matcher: "Bash",
    command: "echo $COMMAND | grep -q 'git add.*\\.env' && echo 'BLOCK: Do not commit .env files' && exit 1 || true",
  },
  {
    id: "test-after-change",
    name: "Run tests after changes",
    description: "Auto-run tests after code changes",
    event: "PostToolUse",
    matcher: "Edit|Write",
    command: "npm test 2>/dev/null || true",
  },
];

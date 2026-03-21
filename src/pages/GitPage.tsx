import { createSignal, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { workspaceStore } from "../stores/workspace.store";
import { TbOutlineGitBranch as GitBranchIcon, TbOutlineFileText as FileText, TbOutlineGitCommit as GitCommitIcon, TbOutlineBolt as Bolt, TbOutlineArrowUp as ArrowUp, TbOutlineInfoCircle as InfoCircle, TbOutlineGitFork as GitFork, TbOutlineCheck as Checkbox, TbOutlineTerminal as Terminal } from "solid-icons/tb";

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface GitBranch {
  name: string;
  current: boolean;
}

interface ShellOutput {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
}

export function GitPage() {
  const [repoStatus, setRepoStatus] = createSignal<"unknown" | "checking" | "valid" | "not-a-repo">("unknown");
  const [currentBranch, setCurrentBranch] = createSignal<string>("");
  const [branches, setBranches] = createSignal<GitBranch[]>([]);
  const [commits, setCommits] = createSignal<GitCommit[]>([]);
  const [changedFiles, setChangedFiles] = createSignal<string[]>([]);
  const [statusMessage, setStatusMessage] = createSignal<string>("");
  const [statusType, setStatusType] = createSignal<"success" | "error" | "info">("info");
  const [pushing, setPushing] = createSignal(false);
  const [issueTitle, setIssueTitle] = createSignal("");
  const [issueBody, setIssueBody] = createSignal("");
  const [showIssueForm, setShowIssueForm] = createSignal(false);
  const [commitMessage, setCommitMessage] = createSignal("");
  const [showCommitForm, setShowCommitForm] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [commandLog, setCommandLog] = createSignal<string[]>([]);

  function workspace() {
    return workspaceStore.workspacePath();
  }

  function log(msg: string) {
    setCommandLog((prev) => [...prev.slice(-19), msg]);
  }

  function showStatus(msg: string, type: "success" | "error" | "info" = "info") {
    setStatusMessage(msg);
    setStatusType(type);
  }

  async function checkRepo() {
    const ws = workspace();
    if (!ws) {
      showStatus("No workspace path set. Go to the Workspace tab first.", "error");
      return;
    }

    setRepoStatus("checking");
    setStatusMessage("");
    try {
      // Get current branch
      const branchResult = await invoke<ShellOutput>("git_branch", { workspace: ws });
      log(`git branch --show-current → ${branchResult.success ? branchResult.stdout.trim() : branchResult.stderr.trim()}`);

      if (branchResult.success && branchResult.stdout.trim()) {
        setCurrentBranch(branchResult.stdout.trim());
        setRepoStatus("valid");
      } else {
        setRepoStatus("not-a-repo");
        showStatus("Not a git repository, or git is not installed.", "error");
        return;
      }

      // Get all branches
      const allBranches = await invoke<ShellOutput>("git_branches", { workspace: ws });
      log(`git branch → ${allBranches.success ? "OK" : allBranches.stderr.trim()}`);
      if (allBranches.success) {
        setBranches(
          allBranches.stdout.trim().split("\n").filter(Boolean).map((line) => {
            const isCurrent = line.endsWith("*");
            return { name: line.replace(" *", "").trim(), current: isCurrent };
          })
        );
      }

      // Get recent commits
      const logResult = await invoke<ShellOutput>("git_log", { workspace: ws });
      log(`git log → ${logResult.success ? "OK" : logResult.stderr.trim()}`);
      if (logResult.success) {
        setCommits(
          logResult.stdout.trim().split("\n").filter(Boolean).map((line) => {
            const parts = line.split("|");
            return {
              hash: parts[0] || "",
              message: parts[1] || "",
              author: parts[2] || "",
              date: parts[3] || "",
            };
          })
        );
      }

      // Get changed files
      const statusResult = await invoke<ShellOutput>("git_status", { workspace: ws });
      log(`git status --short → ${statusResult.success ? statusResult.stdout.trim().split("\n").length + " entries" : statusResult.stderr.trim()}`);
      if (statusResult.success) {
        setChangedFiles(
          statusResult.stdout.trim().split("\n").filter(Boolean)
        );
      }

      showStatus("Repository info refreshed.", "success");
    } catch (e) {
      setRepoStatus("unknown");
      showStatus(`Could not access git: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  }

  async function handleInit() {
    const ws = workspace();
    if (!ws) {
      showStatus("No workspace path set.", "error");
      return;
    }
    setBusy(true);
    try {
      const result = await invoke<ShellOutput>("git_init", { workspace: ws });
      log(`git init → ${result.stdout.trim() || result.stderr.trim()}`);
      if (result.success) {
        showStatus("Repository initialized!", "success");
        await checkRepo();
      } else {
        showStatus(`git init failed: ${result.stderr}`, "error");
      }
    } catch (e) {
      showStatus(`Error: ${e instanceof Error ? e.message : String(e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateGitignore() {
    const ws = workspace();
    if (!ws) {
      showStatus("No workspace path set.", "error");
      return;
    }
    setBusy(true);
    try {
      const path = await invoke<string>("git_create_gitignore", { workspace: ws });
      log(`Created .gitignore → ${path}`);
      showStatus(".gitignore created!", "success");
      if (repoStatus() === "valid") await checkRepo();
    } catch (e) {
      showStatus(`Error: ${e instanceof Error ? e.message : String(e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleStageAll() {
    const ws = workspace();
    if (!ws) {
      showStatus("No workspace path set.", "error");
      return;
    }
    setBusy(true);
    try {
      const result = await invoke<ShellOutput>("git_stage_all", { workspace: ws });
      log(`git add -A → ${result.success ? "OK" : result.stderr.trim()}`);
      if (result.success) {
        showStatus("All changes staged!", "success");
        await checkRepo();
      } else {
        showStatus(`git add failed: ${result.stderr}`, "error");
      }
    } catch (e) {
      showStatus(`Error: ${e instanceof Error ? e.message : String(e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    const ws = workspace();
    const msg = commitMessage().trim();
    if (!ws) {
      showStatus("No workspace path set.", "error");
      return;
    }
    if (!msg) {
      showStatus("Commit message cannot be empty.", "error");
      return;
    }
    setBusy(true);
    try {
      const result = await invoke<ShellOutput>("git_commit", { workspace: ws, message: msg });
      log(`git commit -m "${msg}" → ${result.success ? "OK" : result.stderr.trim()}`);
      if (result.success) {
        showStatus(`Committed: ${msg}`, "success");
        setCommitMessage("");
        setShowCommitForm(false);
        await checkRepo();
      } else {
        showStatus(`Commit failed: ${result.stderr || result.stdout}`, "error");
      }
    } catch (e) {
      showStatus(`Error: ${e instanceof Error ? e.message : String(e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handlePush() {
    const ws = workspace();
    if (!ws) {
      showStatus("No workspace path set.", "error");
      return;
    }
    setPushing(true);
    setStatusMessage("");
    try {
      const result = await invoke<ShellOutput>("git_push", { workspace: ws });
      log(`git push → ${result.success ? "OK" : result.stderr.trim()}`);
      if (result.success) {
        showStatus("Pushed successfully!", "success");
      } else {
        showStatus(`Push failed: ${result.stderr || result.stdout}`, "error");
      }
    } catch (e) {
      showStatus(`Push error: ${e instanceof Error ? e.message : String(e)}`, "error");
    } finally {
      setPushing(false);
    }
  }

  function commitTypeColor(message: string): string {
    if (message.startsWith("feat")) return "var(--success)";
    if (message.startsWith("fix")) return "var(--error)";
    if (message.startsWith("docs")) return "#3498db";
    if (message.startsWith("refactor")) return "var(--accent)";
    if (message.startsWith("test")) return "#9b59b6";
    if (message.startsWith("chore")) return "var(--text-muted)";
    return "var(--text-dim)";
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* No workspace warning */}
        <Show when={!workspace()}>
          <div class="card" style={{
            background: "var(--bg-input)",
            border: "1px solid var(--accent)",
            "text-align": "center",
            padding: "var(--sp-6)",
          }}>
            <p style={{ color: "var(--accent)", "font-weight": "600" }}>
              No workspace path set
            </p>
            <p class="text-dim" style={{ "font-size": "0.85rem" }}>
              Go to the Workspace tab and select a directory first.
            </p>
          </div>
        </Show>

        {/* Repo Status */}
        <Show when={workspace()}>
          <div class="card">
            <h2 class="card-title">
              <GitBranchIcon size={16} />
              Repository Status
            </h2>

            <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-3)", "margin-bottom": "var(--sp-3)" }}>
              <span
                class="statusbar-dot"
                style={{
                  background: repoStatus() === "valid"
                    ? "var(--success)"
                    : repoStatus() === "not-a-repo"
                    ? "var(--error)"
                    : "var(--text-muted)",
                }}
              />
              <div>
                <strong style={{ "font-size": "0.9rem" }}>
                  {repoStatus() === "valid" && `Branch: ${currentBranch()}`}
                  {repoStatus() === "not-a-repo" && "Not a git repository"}
                  {repoStatus() === "checking" && "Checking..."}
                  {repoStatus() === "unknown" && "Click to check repository status"}
                </strong>
                <Show when={repoStatus() === "valid" && changedFiles().length > 0}>
                  <p class="text-dim" style={{ "font-size": "0.8rem", margin: "0" }}>
                    {changedFiles().length} changed file{changedFiles().length !== 1 ? "s" : ""}
                  </p>
                </Show>
              </div>
              <button
                class="btn btn-secondary"
                style={{ "margin-left": "auto" }}
                onClick={checkRepo}
                disabled={repoStatus() === "checking"}
              >
                {repoStatus() === "checking" ? "Checking..." : "Refresh"}
              </button>
            </div>

            <Show when={statusMessage()}>
              <p style={{
                "font-size": "0.8rem",
                color: statusType() === "success" ? "var(--success)" : statusType() === "error" ? "var(--error)" : "var(--text-dim)",
                background: "var(--bg-input)",
                padding: "var(--sp-2)",
                "border-radius": "var(--radius)",
              }}>
                {statusMessage()}
              </p>
            </Show>
          </div>
        </Show>

        {/* Quick Actions — always visible when workspace is set */}
        <Show when={workspace()}>
          <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
            <h2 class="card-title">
              <Bolt size={16} />
              Quick Actions
            </h2>

            <div style={{ display: "flex", gap: "var(--sp-2)", "flex-wrap": "wrap" }}>
              {/* Init Repo */}
              <Show when={repoStatus() !== "valid"}>
                <button
                  class="btn btn-primary"
                  onClick={handleInit}
                  disabled={busy()}
                >
                  <GitBranchIcon size={14} style={{ "margin-right": "var(--sp-1)" }} />
                  Init Repository
                </button>
              </Show>

              {/* Create .gitignore */}
              <button
                class="btn btn-secondary"
                onClick={handleCreateGitignore}
                disabled={busy()}
              >
                Create .gitignore
              </button>

              {/* Stage All */}
              <Show when={repoStatus() === "valid"}>
                <button
                  class="btn btn-secondary"
                  onClick={handleStageAll}
                  disabled={busy()}
                >
                  <Checkbox size={14} style={{ "margin-right": "var(--sp-1)" }} />
                  Stage All Changes
                </button>
              </Show>

              {/* Commit */}
              <Show when={repoStatus() === "valid"}>
                <button
                  class="btn btn-secondary"
                  onClick={() => setShowCommitForm(!showCommitForm())}
                  disabled={busy()}
                >
                  <GitCommitIcon size={14} style={{ "margin-right": "var(--sp-1)" }} />
                  {showCommitForm() ? "Cancel Commit" : "Create Commit"}
                </button>
              </Show>

              {/* Push */}
              <Show when={repoStatus() === "valid"}>
                <button
                  class="btn btn-primary"
                  onClick={handlePush}
                  disabled={pushing() || busy()}
                >
                  <ArrowUp size={14} style={{ "margin-right": "var(--sp-1)" }} />
                  {pushing() ? "Pushing..." : "Push to GitHub"}
                </button>
              </Show>

              {/* Create Issue */}
              <Show when={repoStatus() === "valid"}>
                <button
                  class="btn btn-secondary"
                  onClick={() => setShowIssueForm(!showIssueForm())}
                >
                  <InfoCircle size={14} style={{ "margin-right": "var(--sp-1)" }} />
                  {showIssueForm() ? "Cancel" : "Create Issue"}
                </button>
              </Show>
            </div>

            {/* Commit Form */}
            <Show when={showCommitForm()}>
              <div style={{
                "margin-top": "var(--sp-3)",
                background: "var(--bg-input)",
                padding: "var(--sp-4)",
                "border-radius": "var(--radius)",
                border: "1px solid var(--accent)",
              }}>
                <div class="form-group">
                  <label>Commit Message</label>
                  <input
                    type="text"
                    placeholder="feat: add new feature"
                    value={commitMessage()}
                    onInput={(e) => setCommitMessage(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commitMessage().trim()) handleCommit();
                    }}
                  />
                  <small class="text-dim">Use conventional commits: feat:, fix:, docs:, refactor:, test:, chore:</small>
                </div>
                <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <button
                    class="btn btn-primary"
                    onClick={handleCommit}
                    disabled={!commitMessage().trim() || busy()}
                  >
                    {busy() ? "Committing..." : "Commit"}
                  </button>
                  <button
                    class="btn btn-ghost"
                    style={{ "font-size": "0.8rem" }}
                    onClick={async () => {
                      await handleStageAll();
                      if (commitMessage().trim()) await handleCommit();
                    }}
                    disabled={!commitMessage().trim() || busy()}
                  >
                    Stage All + Commit
                  </button>
                </div>
              </div>
            </Show>

            {/* Issue Form */}
            <Show when={showIssueForm()}>
              <div style={{
                "margin-top": "var(--sp-3)",
                background: "var(--bg-input)",
                padding: "var(--sp-4)",
                "border-radius": "var(--radius)",
                border: "1px solid var(--accent)",
              }}>
                <div class="form-group">
                  <label>Issue Title</label>
                  <input
                    type="text"
                    placeholder="Brief description of the issue"
                    value={issueTitle()}
                    onInput={(e) => setIssueTitle(e.currentTarget.value)}
                  />
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <textarea
                    rows={4}
                    placeholder="Detailed description, steps to reproduce, expected behavior..."
                    value={issueBody()}
                    onInput={(e) => setIssueBody(e.currentTarget.value)}
                    style={{ "font-family": "var(--font-mono)", "font-size": "0.8rem" }}
                  />
                </div>
                <button
                  class="btn btn-primary"
                  disabled={!issueTitle().trim()}
                  onClick={() => {
                    showStatus(`Issue "${issueTitle()}" would be created via gh CLI.`, "info");
                    setShowIssueForm(false);
                    setIssueTitle("");
                    setIssueBody("");
                  }}
                >
                  Create Issue
                </button>
              </div>
            </Show>
          </div>
        </Show>

        {/* Changed Files */}
        <Show when={changedFiles().length > 0}>
          <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
            <h2 class="card-title">
              <FileText size={16} />
              Changed Files ({changedFiles().length})
            </h2>
            <div style={{ "max-height": "200px", overflow: "auto" }}>
              <For each={changedFiles()}>
                {(file) => {
                  const status = file.substring(0, 2).trim();
                  const filename = file.substring(3);
                  const color = status === "M" ? "var(--accent)"
                    : status === "A" || status === "?" ? "var(--success)"
                    : status === "D" ? "var(--error)"
                    : "var(--text-dim)";
                  return (
                    <div style={{
                      display: "flex",
                      "align-items": "center",
                      gap: "var(--sp-2)",
                      padding: "var(--sp-1) 0",
                      "border-bottom": "1px solid var(--border)",
                    }}>
                      <span class="font-mono" style={{ color, "font-size": "0.8rem", "font-weight": "600", width: "20px" }}>
                        {status}
                      </span>
                      <span class="font-mono text-dim" style={{ "font-size": "0.8rem" }}>
                        {filename}
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>

        {/* Recent Commits */}
        <Show when={commits().length > 0}>
          <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
            <h2 class="card-title">
              <GitCommitIcon size={16} />
              Recent Commits
            </h2>
            <For each={commits()}>
              {(commit) => (
                <div style={{
                  display: "flex",
                  "align-items": "flex-start",
                  gap: "var(--sp-3)",
                  padding: "var(--sp-2) 0",
                  "border-bottom": "1px solid var(--border)",
                }}>
                  <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.75rem", "flex-shrink": "0" }}>
                    {commit.hash}
                  </code>
                  <div style={{ flex: "1", "min-width": "0" }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-1)" }}>
                      <span style={{
                        width: "6px",
                        height: "6px",
                        "border-radius": "50%",
                        background: commitTypeColor(commit.message),
                        "flex-shrink": "0",
                      }} />
                      <span style={{ "font-size": "0.85rem", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                        {commit.message}
                      </span>
                    </div>
                    <span class="text-dim" style={{ "font-size": "0.7rem" }}>
                      {commit.author} -- {commit.date}
                    </span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Branches */}
        <Show when={branches().length > 0}>
          <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
            <h2 class="card-title">
              <GitFork size={16} />
              Branches ({branches().length})
            </h2>
            <For each={branches()}>
              {(branch) => (
                <div style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "var(--sp-2)",
                  padding: "var(--sp-2) 0",
                  "border-bottom": "1px solid var(--border)",
                }}>
                  <span style={{
                    width: "6px",
                    height: "6px",
                    "border-radius": "50%",
                    background: branch.current ? "var(--success)" : "var(--text-muted)",
                  }} />
                  <code class="font-mono" style={{
                    "font-size": "0.85rem",
                    color: branch.current ? "var(--accent)" : "var(--text-dim)",
                    "font-weight": branch.current ? "600" : "400",
                  }}>
                    {branch.name}
                  </code>
                  <Show when={branch.current}>
                    <span class="text-dim" style={{ "font-size": "0.7rem" }}>current</span>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Command Log */}
        <Show when={commandLog().length > 0}>
          <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
            <h2 class="card-title">
              <Terminal size={16} />
              Command Log
            </h2>
            <div style={{ "max-height": "150px", overflow: "auto", background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)" }}>
              <For each={commandLog()}>
                {(entry) => (
                  <div class="font-mono text-dim" style={{ "font-size": "0.75rem", padding: "2px 0", "border-bottom": "1px solid var(--border)" }}>
                    $ {entry}
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Empty state when not checked */}
        <Show when={workspace() && repoStatus() === "unknown"}>
          <div class="card" style={{ "margin-top": "var(--sp-4)", "text-align": "center", padding: "var(--sp-8)" }}>
            <div class="empty-state">
              <GitBranchIcon size={40} />
              <p>Click "Refresh" to load repository information</p>
              <small class="text-dim">Reads git status, branches, and recent commits from the workspace</small>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

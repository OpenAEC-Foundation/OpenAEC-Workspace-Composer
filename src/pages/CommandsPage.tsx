import { createSignal, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { workspaceStore } from "../stores/workspace.store";

interface Command {
  id: string;
  name: string;
  content: string;
  saved: boolean;
}

const TEMPLATE_COMMANDS: { name: string; description: string; content: string }[] = [
  {
    name: "start",
    description:
      "Session bootstrap. Reads ROADMAP.md, LESSONS.md, DECISIONS.md, determines current phase, confirms with user before proceeding.",
    content: `Read the following files to understand current project state:
1. ROADMAP.md - current phase and progress
2. LESSONS.md - lessons learned so far
3. DECISIONS.md - architectural decisions made

Then:
- Determine which phase we are in (based on ROADMAP checkboxes)
- Summarize what was done last session
- List the next 3 actionable tasks for this session
- Ask the user to confirm before starting work

Do NOT start any work until the user confirms the plan.`,
  },
  {
    name: "bootstrap",
    description:
      "Setup new skill package. Creates CLAUDE.md with 10 protocols, ROADMAP.md with 7 phases, all core files, .claude/settings.json with full permissions.",
    content: `Bootstrap a new project workspace for the technology specified by the user (e.g. /bootstrap react, /bootstrap python).

Create the following files:

1. **CLAUDE.md** with:
   - Project identity (name, stack, description)
   - 10 protocols (P-001 through P-010): commit conventions, file structure, testing, documentation, error handling, naming, security, performance, accessibility, code review
   - Language settings (documentation language, code language)
   - Build/run commands

2. **ROADMAP.md** with 7 phases:
   - Phase 1: Foundation (project setup, tooling, CI)
   - Phase 2: Core Architecture (data models, API layer)
   - Phase 3: Feature Build (primary features)
   - Phase 4: Integration (external services, auth)
   - Phase 5: Testing (unit, integration, e2e)
   - Phase 6: Polish (UX, performance, docs)
   - Phase 7: Launch (deployment, monitoring)

3. **LESSONS.md** - empty template with header and format example

4. **DECISIONS.md** - empty template with ADR format

5. **SOURCES.md** - list of approved documentation URLs for the chosen technology

6. **.claude/settings.json** with permissions:
   - Bash(npm:*), Bash(cargo:*), Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Agent

7. **.gitignore** - appropriate for the chosen technology

Ask the user which technology/framework before generating.
Use $ARGUMENTS as the technology if provided.`,
  },
  {
    name: "status",
    description: "Quick status check. Reads ROADMAP.md, shows current phase, progress, and next action.",
    content: `Read ROADMAP.md and provide a quick status update:

1. **Current Phase**: Which phase number and name
2. **Progress**: How many tasks are completed vs total (count checkboxes)
3. **Last Completed**: The most recently checked item
4. **Next Up**: The next unchecked item(s)
5. **Blockers**: Any items marked as blocked or dependent

Format as a concise summary, not a full roadmap dump.
Keep it under 15 lines.`,
  },
  {
    name: "validate",
    description:
      "Quality gate check. Validates all SKILL.md files against structure requirements, checks frontmatter, references, examples.",
    content: `Run a validation check on all skill packages in this workspace.

For each SKILL.md file found:
1. Check frontmatter has required fields: name, version, description, author
2. Check that ## sections exist: Overview, Installation, Usage, Configuration, Examples
3. Check that code examples are properly fenced with language tags
4. Check that all referenced files actually exist
5. Check that internal links resolve correctly

Report:
- Total skills found
- Pass/fail per skill with specific issues
- Overall compliance score (percentage)
- Suggested fixes for any failures

Use a table format for the results.`,
  },
  {
    name: "lessons",
    description: "Show or add lessons learned. Reads LESSONS.md, displays recent entries, accepts new lesson input.",
    content: `Manage the lessons learned log (LESSONS.md).

If the user provides a lesson as argument ($ARGUMENTS):
- Append it to LESSONS.md with today's date and a category tag
- Categories: [architecture], [tooling], [process], [bug], [performance], [security], [ux]
- Auto-detect the most appropriate category from the content
- Confirm what was added

If no argument is provided:
- Read LESSONS.md
- Show the 5 most recent entries
- Show a count of lessons per category
- Ask if the user wants to add a new lesson`,
  },
  {
    name: "audit",
    description:
      "Completeness audit. Checks all skill package requirements, scores compliance, suggests improvements.",
    content: `Run a completeness audit on this workspace.

Check for the presence and quality of:

**Required Files:**
- [ ] CLAUDE.md (with project identity, conventions, commands)
- [ ] ROADMAP.md (with phases and checkboxes)
- [ ] LESSONS.md (initialized with format)
- [ ] DECISIONS.md (initialized with ADR format)
- [ ] .claude/settings.json (with permissions)
- [ ] .gitignore (appropriate for stack)

**Configuration Quality:**
- [ ] Permissions are not overly broad
- [ ] MCP servers configured (if applicable)
- [ ] Hooks configured (if applicable)
- [ ] Custom commands present in .claude/commands/

**Documentation Quality:**
- [ ] CLAUDE.md has build/run commands
- [ ] CLAUDE.md has architecture overview
- [ ] All protocols are specific (not generic)

Score each section and provide:
- Overall score out of 100
- Top 3 improvements to make
- Estimated effort for each improvement`,
  },
  {
    name: "mcp-search",
    description:
      "Find MCP servers for a technology. Searches GitHub, npm, and known registries for available MCP server implementations.",
    content: `Search for MCP (Model Context Protocol) server implementations for the technology or service specified by the user.

Use $ARGUMENTS as the search term.

Search strategy:
1. Search GitHub for repos matching "mcp-server-{term}" and "{term}-mcp"
2. Search npm for packages with "mcp" and the search term
3. Check the known MCP registries and awesome-mcp lists

For each result, report:
- Name and URL
- What it provides (tools, resources, prompts)
- Installation command (npx, pip, docker)
- Stars/downloads if available
- Whether it is official or community-maintained

Sort by relevance and quality. Recommend the top 3 options with reasons.
If nothing is found, suggest alternative approaches (custom MCP server, API integration).`,
  },
  {
    name: "session-closure",
    description:
      "End of session checklist. Updates ROADMAP, saves lessons, writes HANDOFF.md, commits changes.",
    content: `Run the end-of-session closure protocol:

1. **Update ROADMAP.md**
   - Check off any tasks that were completed this session
   - Add any new tasks that were discovered
   - Update phase status if a phase was completed

2. **Save Lessons**
   - Review what happened this session
   - Add any lessons learned to LESSONS.md
   - Ask the user if there is anything specific to note

3. **Write HANDOFF.md**
   - Summarize what was accomplished
   - List any open/in-progress items
   - Note any blockers or decisions needed
   - Include context needed for the next session

4. **Commit Changes**
   - Stage all modified documentation files
   - Create a conventional commit: docs: session closure - [brief summary]
   - Do NOT push (let the user decide)

5. **Final Summary**
   - Show what was committed
   - Remind of any pending items
   - Suggest what to tackle next session

Wait for user confirmation before committing.`,
  },
];

export function CommandsPage() {
  const [commands, setCommands] = createSignal<Command[]>([]);
  const [showAddForm, setShowAddForm] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [newContent, setNewContent] = createSignal("");
  const [expandedId, setExpandedId] = createSignal<string | null>(null);
  const [statusMessage, setStatusMessage] = createSignal("");
  const [statusType, setStatusType] = createSignal<"success" | "error" | "info">("info");
  const [previewCommand, setPreviewCommand] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  function workspace() {
    return workspaceStore.workspacePath();
  }

  function showStatus(msg: string, type: "success" | "error" | "info" = "info") {
    setStatusMessage(msg);
    setStatusType(type);
  }

  function addCommand(name: string, content: string) {
    const id = `cmd-${Date.now()}`;
    const trimmedName = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmedName || !content.trim()) return;
    if (commands().some((c) => c.name === trimmedName)) return;
    setCommands([...commands(), { id, name: trimmedName, content: content.trim(), saved: false }]);
    setNewName("");
    setNewContent("");
    setShowAddForm(false);
  }

  function removeCommand(id: string) {
    setCommands(commands().filter((c) => c.id !== id));
  }

  function addFromTemplate(template: (typeof TEMPLATE_COMMANDS)[0]) {
    if (commands().some((c) => c.name === template.name)) return;
    addCommand(template.name, template.content);
  }

  async function saveCommandToWorkspace(cmd: Command) {
    const ws = workspace();
    if (!ws) {
      showStatus("No workspace path set. Go to the Workspace tab first.", "error");
      return;
    }
    setSaving(true);
    try {
      const relativePath = `.claude/commands/${cmd.name}.md`;
      await invoke<string>("write_file", {
        workspace: ws,
        relativePath,
        content: cmd.content,
      });
      // Mark as saved
      setCommands(
        commands().map((c) => c.id === cmd.id ? { ...c, saved: true } : c)
      );
      showStatus(`Saved ${relativePath} to workspace!`, "success");
    } catch (e) {
      showStatus(`Failed to save: ${e instanceof Error ? e.message : String(e)}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveAllToWorkspace() {
    const ws = workspace();
    if (!ws) {
      showStatus("No workspace path set. Go to the Workspace tab first.", "error");
      return;
    }
    setSaving(true);
    let savedCount = 0;
    let errorCount = 0;
    for (const cmd of commands()) {
      if (cmd.saved) continue;
      try {
        const relativePath = `.claude/commands/${cmd.name}.md`;
        await invoke<string>("write_file", {
          workspace: ws,
          relativePath,
          content: cmd.content,
        });
        savedCount++;
      } catch {
        errorCount++;
      }
    }
    // Mark all as saved
    setCommands(commands().map((c) => ({ ...c, saved: true })));
    if (errorCount > 0) {
      showStatus(`Saved ${savedCount} commands, ${errorCount} failed.`, "error");
    } else {
      showStatus(`Saved ${savedCount} command${savedCount !== 1 ? "s" : ""} to .claude/commands/`, "success");
    }
    setSaving(false);
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div class="card">
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Custom Commands
          </h2>
          <p class="text-dim" style={{ "font-size": "0.85rem", "margin-bottom": "var(--sp-3)" }}>
            Custom commands live in <code class="font-mono" style={{ color: "var(--accent)" }}>.claude/commands/</code> and
            can be invoked with <code class="font-mono" style={{ color: "var(--accent)" }}>/command-name</code> in Claude Code.
            Each command is a markdown file with prompt instructions.
          </p>
          <Show when={statusMessage()}>
            <p style={{
              "font-size": "0.8rem",
              color: statusType() === "success" ? "var(--success)" : statusType() === "error" ? "var(--error)" : "var(--text-dim)",
              background: "var(--bg-input)",
              padding: "var(--sp-2)",
              "border-radius": "var(--radius)",
              "margin-top": "var(--sp-2)",
            }}>
              {statusMessage()}
            </p>
          </Show>
        </div>

        {/* Installed Commands */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--sp-3)" }}>
            <h2 class="card-title" style={{ margin: "0" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Installed Commands ({commands().length})
            </h2>
            <div style={{ display: "flex", gap: "var(--sp-2)" }}>
              <Show when={commands().length > 0 && commands().some((c) => !c.saved)}>
                <button
                  class="btn btn-primary"
                  onClick={saveAllToWorkspace}
                  disabled={saving() || !workspace()}
                  title={!workspace() ? "Set a workspace path first" : "Save all unsaved commands to .claude/commands/"}
                >
                  {saving() ? "Saving..." : "Save All to Workspace"}
                </button>
              </Show>
              <button class="btn btn-secondary" onClick={() => setShowAddForm(!showAddForm())}>
                {showAddForm() ? "Cancel" : "+ Add Command"}
              </button>
            </div>
          </div>

          {/* Add form */}
          <Show when={showAddForm()}>
            <div style={{ background: "var(--bg-input)", padding: "var(--sp-4)", "border-radius": "var(--radius)", "margin-bottom": "var(--sp-3)", border: "1px solid var(--accent)" }}>
              <div class="form-group">
                <label>Command Name</label>
                <input
                  type="text"
                  placeholder="e.g. review, deploy, lint-fix"
                  value={newName()}
                  onInput={(e) => setNewName(e.currentTarget.value)}
                />
                <small class="text-dim">Will be available as /command-name in Claude Code</small>
              </div>
              <div class="form-group">
                <label>Prompt Content</label>
                <textarea
                  rows={6}
                  placeholder="Write the prompt instructions for this command..."
                  value={newContent()}
                  onInput={(e) => setNewContent(e.currentTarget.value)}
                  style={{ "font-family": "var(--font-mono)", "font-size": "0.8rem" }}
                />
              </div>
              <button
                class="btn btn-primary"
                onClick={() => addCommand(newName(), newContent())}
                disabled={!newName().trim() || !newContent().trim()}
              >
                Add Command
              </button>
            </div>
          </Show>

          {/* Commands list */}
          <Show
            when={commands().length > 0}
            fallback={
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                <p>No commands installed yet</p>
                <small class="text-dim">Add a custom command above or pick from templates below</small>
              </div>
            }
          >
            <For each={commands()}>
              {(cmd) => (
                <div
                  style={{
                    background: "var(--bg-input)",
                    padding: "var(--sp-3)",
                    "border-radius": "var(--radius)",
                    "margin-bottom": "var(--sp-2)",
                    border: cmd.saved ? "1px solid var(--success)" : "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)" }}>
                      <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.85rem" }}>
                        /{cmd.name}
                      </code>
                      <span class="text-dim" style={{ "font-size": "0.75rem" }}>
                        .claude/commands/{cmd.name}.md
                      </span>
                      <Show when={cmd.saved}>
                        <span style={{
                          "font-size": "0.7rem",
                          color: "var(--success)",
                          background: "rgba(39, 174, 96, 0.1)",
                          padding: "1px 6px",
                          "border-radius": "4px",
                        }}>
                          saved
                        </span>
                      </Show>
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                      <Show when={!cmd.saved}>
                        <button
                          class="btn btn-ghost"
                          style={{ padding: "2px 8px", "font-size": "0.75rem", color: "var(--success)" }}
                          onClick={() => saveCommandToWorkspace(cmd)}
                          disabled={saving() || !workspace()}
                          title={!workspace() ? "Set a workspace path first" : `Save to .claude/commands/${cmd.name}.md`}
                        >
                          Save
                        </button>
                      </Show>
                      <button
                        class="btn btn-ghost"
                        style={{ padding: "2px 8px", "font-size": "0.75rem" }}
                        onClick={() => setExpandedId(expandedId() === cmd.id ? null : cmd.id)}
                      >
                        {expandedId() === cmd.id ? "Collapse" : "View"}
                      </button>
                      <button
                        class="btn btn-ghost"
                        style={{ padding: "2px 8px", "font-size": "0.75rem", color: "var(--error)" }}
                        onClick={() => removeCommand(cmd.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <Show when={expandedId() === cmd.id}>
                    <pre
                      class="font-mono text-dim"
                      style={{
                        "font-size": "0.8rem",
                        "margin-top": "var(--sp-2)",
                        "white-space": "pre-wrap",
                        background: "var(--bg-card)",
                        padding: "var(--sp-3)",
                        "border-radius": "var(--radius)",
                      }}
                    >
                      {cmd.content}
                    </pre>
                  </Show>
                </div>
              )}
            </For>
          </Show>
        </div>

        {/* Template Commands */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Command Templates
          </h2>
          <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-3)" }}>
            Real-world commands from OpenAEC Foundation workflows. Preview the content before adding.
          </p>
          <div class="tile-grid">
            <For each={TEMPLATE_COMMANDS}>
              {(template) => {
                const isAdded = () => commands().some((c) => c.name === template.name);
                const isPreviewing = () => previewCommand() === template.name;
                return (
                  <div class="tile" style={{ opacity: isAdded() ? "0.5" : "1" }}>
                    <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-start", "margin-bottom": "var(--sp-1)" }}>
                      <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.85rem" }}>
                        /{template.name}
                      </code>
                      <Show when={isAdded()}>
                        <span style={{
                          "font-size": "0.65rem",
                          color: "var(--success)",
                          background: "rgba(39, 174, 96, 0.1)",
                          padding: "1px 6px",
                          "border-radius": "4px",
                        }}>
                          added
                        </span>
                      </Show>
                    </div>
                    <p class="text-dim" style={{ "font-size": "0.8rem", "margin-bottom": "var(--sp-2)" }}>
                      {template.description}
                    </p>

                    {/* Preview panel */}
                    <Show when={isPreviewing()}>
                      <div style={{
                        background: "var(--bg-card)",
                        padding: "var(--sp-2)",
                        "border-radius": "var(--radius)",
                        "margin-bottom": "var(--sp-2)",
                        "max-height": "180px",
                        overflow: "auto",
                      }}>
                        <div class="text-dim" style={{ "font-size": "0.7rem", "margin-bottom": "var(--sp-1)", color: "var(--accent)" }}>
                          .claude/commands/{template.name}.md
                        </div>
                        <pre class="font-mono text-dim" style={{ "font-size": "0.7rem", "white-space": "pre-wrap", margin: "0" }}>
                          {template.content}
                        </pre>
                      </div>
                    </Show>

                    <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                      <button
                        class="btn btn-ghost"
                        style={{ flex: "1", "font-size": "0.8rem" }}
                        onClick={() => setPreviewCommand(isPreviewing() ? null : template.name)}
                      >
                        {isPreviewing() ? "Hide" : "Preview"}
                      </button>
                      <button
                        class={`btn ${isAdded() ? "btn-secondary" : "btn-primary"}`}
                        style={{ flex: "1", "font-size": "0.8rem" }}
                        onClick={() => addFromTemplate(template)}
                        disabled={isAdded()}
                      >
                        {isAdded() ? "Added" : "Add Command"}
                      </button>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}

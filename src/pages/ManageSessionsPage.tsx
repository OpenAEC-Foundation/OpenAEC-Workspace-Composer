import { createSignal, createMemo, onMount, Show, For } from "solid-js";
import { managerStore, SessionSummary } from "../stores/manager.store";
import {
  TbOutlineClock,
  TbOutlineChevronDown,
  TbOutlineChevronRight,
  TbOutlineRefresh,
} from "solid-icons/tb";

const STALE_THRESHOLD_DAYS = 7;
const COLLAPSED_MAX_LENGTH = 200;

function isSessionStale(dateStr: string): boolean {
  if (!dateStr) return true;
  const sessionDate = new Date(dateStr.split(" ")[0]);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_THRESHOLD_DAYS);
  return sessionDate < cutoff;
}

function formatSessionDate(dateStr: string): string {
  if (!dateStr) return "Unknown date";
  try {
    const [datePart, timePart] = dateStr.split(" ");
    const date = new Date(datePart);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const formatted = date.toLocaleDateString("en-US", options);
    return timePart ? `${formatted} at ${timePart}` : formatted;
  } catch {
    return dateStr;
  }
}

function daysAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const sessionDate = new Date(dateStr.split(" ")[0]);
    const now = new Date();
    const diffMs = now.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    return `${diffDays} days ago`;
  } catch {
    return "";
  }
}

function truncateContent(content: string): string {
  if (content.length <= COLLAPSED_MAX_LENGTH) return content;
  const truncated = content.slice(0, COLLAPSED_MAX_LENGTH);
  const lastNewline = truncated.lastIndexOf("\n");
  const cutAt = lastNewline > COLLAPSED_MAX_LENGTH * 0.5 ? lastNewline : COLLAPSED_MAX_LENGTH;
  return content.slice(0, cutAt) + "...";
}

function sessionKey(session: SessionSummary): string {
  return `${session.project}::${session.date}`;
}

export function ManageSessionsPage() {
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set());

  onMount(() => {
    if (!managerStore.workspace()) {
      managerStore.loadWorkspace();
    }
  });

  const sortedSessions = createMemo(() => {
    const ws = managerStore.workspace();
    if (!ws) return [];
    return [...ws.sessions].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  });

  const totalCount = createMemo(() => sortedSessions().length);
  const staleCount = createMemo(() => managerStore.staleSessions().length);

  function toggleSession(key: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function isExpanded(key: string): boolean {
    return expanded().has(key);
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div class="card" style={{ padding: "var(--sp-4) var(--sp-5)" }}>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
            }}
          >
            <div>
              <h1
                style={{
                  "font-family": "var(--font-heading)",
                  "font-size": "1.25rem",
                  "margin-bottom": "2px",
                }}
              >
                Session Summaries
              </h1>
              <p class="text-dim" style={{ "font-size": "0.8rem" }}>
                Timeline of session summaries per project
              </p>
            </div>
            <button
              class="btn btn-ghost"
              onClick={() => managerStore.loadWorkspace()}
              disabled={managerStore.loading()}
              title="Refresh workspace data"
            >
              <TbOutlineRefresh size={16} />
            </button>
          </div>
        </div>

        {/* Loading state */}
        <Show when={managerStore.loading()}>
          <div class="manage-loading">Loading sessions...</div>
        </Show>

        {/* Error state */}
        <Show when={managerStore.error()}>
          <div
            class="card"
            style={{ "margin-top": "var(--sp-4)", "border-color": "var(--error)" }}
          >
            <p style={{ color: "var(--error)", "font-size": "0.8125rem" }}>
              {managerStore.error()}
            </p>
          </div>
        </Show>

        {/* Content */}
        <Show when={managerStore.workspace() && !managerStore.loading()}>
          {/* Stats */}
          <div class="manage-stats" style={{ "margin-top": "var(--sp-4)" }}>
            <div class="manage-stat-card">
              <span class="stat-value">{totalCount()}</span>
              <span class="stat-label">Sessions</span>
            </div>
            <div class="manage-stat-card">
              <span
                class="stat-value"
                style={{
                  color:
                    staleCount() > 0
                      ? "var(--warm-gold)"
                      : "var(--text-primary)",
                }}
              >
                {staleCount()}
              </span>
              <span class="stat-label">Stale ({STALE_THRESHOLD_DAYS}+ days)</span>
            </div>
            <div class="manage-stat-card">
              <span class="stat-value" style={{ color: "var(--success)" }}>
                {totalCount() - staleCount()}
              </span>
              <span class="stat-label">Recent</span>
            </div>
          </div>

          {/* Session timeline */}
          <Show
            when={sortedSessions().length > 0}
            fallback={
              <div class="manage-empty" style={{ "margin-top": "var(--sp-8)" }}>
                <div class="manage-empty-icon">
                  <TbOutlineClock size={48} />
                </div>
                <p class="manage-empty-text">
                  No session summaries found. Sessions are created when you
                  end a Claude Code session with the orchestrator active.
                </p>
              </div>
            }
          >
            <div class="session-timeline" style={{ "margin-top": "var(--sp-4)" }}>
              <For each={sortedSessions()}>
                {(session) => {
                  const key = sessionKey(session);
                  const stale = isSessionStale(session.date);
                  return (
                    <div
                      class="card"
                      style={{
                        padding: "0",
                        "border-left": stale
                          ? "3px solid var(--warm-gold)"
                          : "3px solid var(--accent)",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleSession(key)}
                    >
                      {/* Session header */}
                      <div
                        style={{
                          display: "flex",
                          "align-items": "center",
                          gap: "var(--sp-3)",
                          padding: "var(--sp-3) var(--sp-4)",
                        }}
                      >
                        {/* Expand/collapse icon */}
                        <span
                          style={{
                            color: "var(--text-muted)",
                            "flex-shrink": "0",
                            display: "flex",
                            "align-items": "center",
                          }}
                        >
                          <Show
                            when={isExpanded(key)}
                            fallback={<TbOutlineChevronRight size={16} />}
                          >
                            <TbOutlineChevronDown size={16} />
                          </Show>
                        </span>

                        {/* Project name */}
                        <span
                          style={{
                            "font-family": "var(--font-heading)",
                            "font-weight": "600",
                            "font-size": "0.875rem",
                            color: "var(--text-primary)",
                            "min-width": "0",
                            "white-space": "nowrap",
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                          }}
                        >
                          {session.project}
                        </span>

                        {/* Date + stale badge */}
                        <div
                          style={{
                            display: "flex",
                            "align-items": "center",
                            gap: "var(--sp-2)",
                            "margin-left": "auto",
                            "flex-shrink": "0",
                          }}
                        >
                          <span
                            class={
                              stale
                                ? "session-indicator session-indicator--stale"
                                : "session-indicator"
                            }
                          >
                            <TbOutlineClock size={12} />
                            {formatSessionDate(session.date)}
                          </span>

                          <Show when={stale}>
                            <span class="status-badge status-badge--maintenance">
                              stale
                            </span>
                          </Show>
                        </div>
                      </div>

                      {/* Days ago subtitle */}
                      <Show when={daysAgo(session.date)}>
                        <div
                          style={{
                            padding: "0 var(--sp-4)",
                            "padding-left": "calc(var(--sp-4) + 16px + var(--sp-3))",
                            "margin-top": "-4px",
                            "margin-bottom": "var(--sp-2)",
                          }}
                        >
                          <span
                            style={{
                              "font-size": "0.6875rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {daysAgo(session.date)}
                          </span>
                        </div>
                      </Show>

                      {/* Content preview / full content */}
                      <div
                        style={{
                          padding: "0 var(--sp-4) var(--sp-3)",
                          "padding-left": "calc(var(--sp-4) + 16px + var(--sp-3))",
                        }}
                      >
                        <Show
                          when={isExpanded(key)}
                          fallback={
                            <pre
                              class="markdown-preview"
                              style={{
                                "max-height": "4.8em",
                                overflow: "hidden",
                                margin: "0",
                              }}
                            >
                              {truncateContent(session.content)}
                            </pre>
                          }
                        >
                          <pre class="markdown-preview" style={{ margin: "0" }}>
                            {session.content}
                          </pre>
                        </Show>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </Show>

        {/* Empty state — no workspace loaded */}
        <Show
          when={
            !managerStore.workspace() &&
            !managerStore.loading() &&
            !managerStore.error()
          }
        >
          <div class="manage-empty" style={{ "margin-top": "var(--sp-8)" }}>
            <div class="manage-empty-icon">
              <TbOutlineClock size={48} />
            </div>
            <p class="manage-empty-text">
              No orchestrator data found. Make sure
              ~/.claude/orchestrator/project-registry.json exists.
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}

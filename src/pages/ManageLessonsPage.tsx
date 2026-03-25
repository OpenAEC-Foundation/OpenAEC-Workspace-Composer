import { createSignal, createMemo, onMount, Show, For } from "solid-js";
import { managerStore } from "../stores/manager.store";
import {
  TbOutlineBulb,
  TbOutlineSearch,
  TbOutlineChevronDown,
} from "solid-icons/tb";

// --- Types ---

interface ParsedLesson {
  priority: "red" | "yellow" | "green";
  title: string;
  source: string;
  lesson: string;
  category: string;
}

type PriorityFilter = "all" | "red" | "yellow" | "green";

// --- Constants ---

const PRIORITY_MAP: Record<string, ParsedLesson["priority"]> = {
  "\u{1F534}": "red",
  "\u{1F7E1}": "yellow",
  "\u{1F7E2}": "green",
};

const PRIORITY_LABELS: Record<PriorityFilter, string> = {
  all: "Alle",
  red: "Kritiek",
  yellow: "Belangrijk",
  green: "Info",
};

const PRIORITY_COLORS: Record<ParsedLesson["priority"], string> = {
  red: "var(--error)",
  yellow: "var(--warm-gold)",
  green: "var(--success)",
};

// --- Parser ---

function parseLessons(markdown: string): ParsedLesson[] {
  const lessons: ParsedLesson[] = [];
  const lines = markdown.split("\n");

  let currentCategory = "";
  let currentLesson: Partial<ParsedLesson> | null = null;

  for (const line of lines) {
    // Category heading (## ...)
    const categoryMatch = line.match(/^## (.+)$/);
    if (categoryMatch) {
      // Flush any in-progress lesson
      if (currentLesson?.title) {
        lessons.push(currentLesson as ParsedLesson);
        currentLesson = null;
      }
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Lesson heading (### emoji Title)
    const lessonMatch = line.match(/^### (.)\s+(.+)$/);
    if (lessonMatch) {
      // Flush previous lesson
      if (currentLesson?.title) {
        lessons.push(currentLesson as ParsedLesson);
      }

      const emoji = lessonMatch[1];
      const priority = PRIORITY_MAP[emoji] || "green";
      const title = lessonMatch[2].trim();

      currentLesson = {
        priority,
        title,
        source: "",
        lesson: "",
        category: currentCategory,
      };
      continue;
    }

    if (!currentLesson) continue;

    // Source line
    const sourceMatch = line.match(/^\*\*Bron:\*\*\s*(.+)$/);
    if (sourceMatch) {
      currentLesson.source = sourceMatch[1].trim();
      continue;
    }

    // Lesson text line
    const lessonMatch2 = line.match(/^\*\*Les:\*\*\s*(.+)$/);
    if (lessonMatch2) {
      currentLesson.lesson = lessonMatch2[1].trim();
      continue;
    }

    // Continuation lines for lesson text (non-empty, non-heading)
    if (
      currentLesson.lesson &&
      line.trim() &&
      !line.startsWith("#") &&
      !line.startsWith("**Bron:")
    ) {
      currentLesson.lesson += " " + line.trim();
    }
  }

  // Flush last lesson
  if (currentLesson?.title) {
    lessons.push(currentLesson as ParsedLesson);
  }

  return lessons;
}

// --- Component ---

export function ManageLessonsPage() {
  const [lessons, setLessons] = createSignal<ParsedLesson[]>([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [priorityFilter, setPriorityFilter] =
    createSignal<PriorityFilter>("all");
  const [collapsedCategories, setCollapsedCategories] = createSignal<
    Set<string>
  >(new Set());
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [loadingLessons, setLoadingLessons] = createSignal(false);

  onMount(async () => {
    if (!managerStore.workspace()) {
      await managerStore.loadWorkspace();
    }
    await loadLessons();
  });

  async function loadLessons(): Promise<void> {
    setLoadingLessons(true);
    setLoadError(null);
    try {
      const markdown = await managerStore.readLessonsLearned();
      const parsed = parseLessons(markdown);
      setLessons(parsed);
    } catch (e) {
      setLoadError(String(e));
    } finally {
      setLoadingLessons(false);
    }
  }

  // Filtered lessons based on search + priority
  const filteredLessons = createMemo(() => {
    const query = searchQuery().toLowerCase();
    const filter = priorityFilter();

    return lessons().filter((l) => {
      const matchesPriority = filter === "all" || l.priority === filter;
      const matchesSearch =
        !query ||
        l.title.toLowerCase().includes(query) ||
        l.lesson.toLowerCase().includes(query) ||
        l.source.toLowerCase().includes(query) ||
        l.category.toLowerCase().includes(query);
      return matchesPriority && matchesSearch;
    });
  });

  // Group filtered lessons by category
  const groupedLessons = createMemo(() => {
    const groups: Record<string, ParsedLesson[]> = {};
    for (const lesson of filteredLessons()) {
      const key = lesson.category || "Overig";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(lesson);
    }
    return groups;
  });

  // Category names in order
  const categoryNames = createMemo(() => Object.keys(groupedLessons()));

  // Stats
  const totalCount = createMemo(() => lessons().length);
  const redCount = createMemo(
    () => lessons().filter((l) => l.priority === "red").length
  );
  const yellowCount = createMemo(
    () => lessons().filter((l) => l.priority === "yellow").length
  );
  const greenCount = createMemo(
    () => lessons().filter((l) => l.priority === "green").length
  );

  function toggleCategory(category: string): void {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function isCategoryCollapsed(category: string): boolean {
    return collapsedCategories().has(category);
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
                <TbOutlineBulb
                  size={20}
                  style={{ "vertical-align": "text-bottom", "margin-right": "var(--sp-2)" }}
                />
                Lessons Learned
              </h1>
              <p class="text-dim" style={{ "font-size": "0.8rem" }}>
                Overzicht van alle geleerde lessen, gefilterd op prioriteit en categorie
              </p>
            </div>
            <Show when={!loadingLessons()}>
              <div
                style={{
                  display: "flex",
                  gap: "var(--sp-3)",
                  "align-items": "center",
                  "font-size": "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                <span>
                  <strong style={{ color: "var(--text-primary)" }}>{totalCount()}</strong> totaal
                </span>
                <span style={{ color: "var(--error)" }}>{redCount()} kritiek</span>
                <span style={{ color: "var(--warm-gold)" }}>{yellowCount()} belangrijk</span>
                <span style={{ color: "var(--success)" }}>{greenCount()} info</span>
              </div>
            </Show>
          </div>
        </div>

        {/* Loading state */}
        <Show when={loadingLessons()}>
          <div class="manage-loading">Lessons laden...</div>
        </Show>

        {/* Error state */}
        <Show when={loadError()}>
          <div
            class="card"
            style={{ "margin-top": "var(--sp-4)", "border-color": "var(--error)" }}
          >
            <p style={{ color: "var(--error)", "font-size": "0.8125rem" }}>
              {loadError()}
            </p>
          </div>
        </Show>

        {/* Content */}
        <Show when={!loadingLessons() && !loadError() && lessons().length > 0}>
          {/* Search + filter bar */}
          <div
            style={{
              display: "flex",
              gap: "var(--sp-3)",
              "margin-top": "var(--sp-4)",
              "margin-bottom": "var(--sp-4)",
              "align-items": "center",
              "flex-wrap": "wrap",
            }}
          >
            {/* Search input */}
            <div
              style={{
                flex: "1",
                "min-width": "200px",
                position: "relative",
              }}
            >
              <TbOutlineSearch
                size={14}
                style={{
                  position: "absolute",
                  left: "var(--sp-3)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  "pointer-events": "none",
                }}
              />
              <input
                type="text"
                placeholder="Zoek op titel, tekst of categorie..."
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                style={{
                  width: "100%",
                  padding: "var(--sp-2) var(--sp-3) var(--sp-2) var(--sp-7)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  "border-radius": "var(--radius-md)",
                  color: "var(--text-primary)",
                  "font-size": "0.8125rem",
                  "font-family": "var(--font-body)",
                  outline: "none",
                  "box-sizing": "border-box",
                }}
              />
            </div>

            {/* Priority filter buttons */}
            <div
              style={{
                display: "flex",
                gap: "var(--sp-1)",
                "flex-shrink": "0",
              }}
            >
              <For each={Object.keys(PRIORITY_LABELS) as PriorityFilter[]}>
                {(filter) => (
                  <button
                    class={`btn ${priorityFilter() === filter ? "btn-primary" : "btn-ghost"}`}
                    style={{
                      "font-size": "0.75rem",
                      padding: "var(--sp-1) var(--sp-3)",
                    }}
                    onClick={() => setPriorityFilter(filter)}
                  >
                    <Show when={filter !== "all"}>
                      <span
                        class={`priority-dot priority-dot--${filter}`}
                        style={{ "margin-right": "var(--sp-1)" }}
                      />
                    </Show>
                    {PRIORITY_LABELS[filter]}
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Filtered count */}
          <Show when={filteredLessons().length !== lessons().length}>
            <p
              style={{
                "font-size": "0.75rem",
                color: "var(--text-muted)",
                "margin-bottom": "var(--sp-3)",
              }}
            >
              {filteredLessons().length} van {lessons().length} lessons gevonden
            </p>
          </Show>

          {/* Grouped lessons */}
          <div style={{ display: "flex", "flex-direction": "column", gap: "var(--sp-4)" }}>
            <For each={categoryNames()}>
              {(category) => (
                <div>
                  {/* Category header (collapsible) */}
                  <button
                    onClick={() => toggleCategory(category)}
                    style={{
                      display: "flex",
                      "align-items": "center",
                      gap: "var(--sp-2)",
                      width: "100%",
                      padding: "var(--sp-2) 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      "font-family": "var(--font-heading)",
                      "font-size": "0.9375rem",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "text-align": "left",
                    }}
                  >
                    <TbOutlineChevronDown
                      size={16}
                      style={{
                        transform: isCategoryCollapsed(category)
                          ? "rotate(-90deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        "flex-shrink": "0",
                        color: "var(--text-muted)",
                      }}
                    />
                    <span>{category}</span>
                    <span
                      style={{
                        "font-size": "0.6875rem",
                        "font-weight": "400",
                        color: "var(--text-muted)",
                        "margin-left": "var(--sp-1)",
                      }}
                    >
                      ({groupedLessons()[category].length})
                    </span>
                  </button>

                  {/* Lesson cards */}
                  <Show when={!isCategoryCollapsed(category)}>
                    <div
                      style={{
                        display: "flex",
                        "flex-direction": "column",
                        gap: "var(--sp-2)",
                        "margin-top": "var(--sp-1)",
                      }}
                    >
                      <For each={groupedLessons()[category]}>
                        {(lesson) => (
                          <div class="lesson-card">
                            <span
                              class={`priority-dot priority-dot--${lesson.priority}`}
                              style={{ "margin-top": "4px" }}
                              title={PRIORITY_LABELS[lesson.priority]}
                            />
                            <div class="lesson-card-content">
                              <div class="lesson-card-title">{lesson.title}</div>
                              <Show when={lesson.source}>
                                <div class="lesson-card-source">{lesson.source}</div>
                              </Show>
                              <Show when={lesson.lesson}>
                                <div class="lesson-card-text">{lesson.lesson}</div>
                              </Show>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>

          {/* No results after filtering */}
          <Show when={filteredLessons().length === 0 && lessons().length > 0}>
            <div class="manage-empty" style={{ "margin-top": "var(--sp-6)" }}>
              <div class="manage-empty-icon">
                <TbOutlineSearch size={48} />
              </div>
              <p class="manage-empty-text">
                Geen lessons gevonden voor de huidige filters.
              </p>
            </div>
          </Show>
        </Show>

        {/* Empty state (no lessons at all) */}
        <Show when={!loadingLessons() && !loadError() && lessons().length === 0}>
          <div class="manage-empty" style={{ "margin-top": "var(--sp-8)" }}>
            <div class="manage-empty-icon">
              <TbOutlineBulb size={48} />
            </div>
            <p class="manage-empty-text">
              Geen lessons learned gevonden. Controleer of het lessons bestand bestaat in de workspace.
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}

import { createSignal, For, Show, createMemo } from "solid-js";
import { TbOutlineMessage as Message, TbOutlineChevronDown as ChevronDown, TbOutlineCopy as Copy, TbOutlineEdit as Edit } from "solid-icons/tb";

type PromptCategory = "code-review" | "documentation" | "testing" | "refactoring";

interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  description: string;
  prompt: string;
}

const CATEGORIES: { id: PromptCategory; label: string; color: string }[] = [
  { id: "code-review", label: "Code Review", color: "#e74c3c" },
  { id: "documentation", label: "Documentation", color: "#3498db" },
  { id: "testing", label: "Testing", color: "#2ecc71" },
  { id: "refactoring", label: "Refactoring", color: "#f39c12" },
];

const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Code Review
  {
    id: "pr-review",
    name: "Pull Request Review",
    category: "code-review",
    description: "Comprehensive PR review with actionable feedback",
    prompt: `Review this pull request thoroughly:

1. **Summary**: What does this PR do?
2. **Breaking changes**: Are there any?
3. **Code quality**: Follow project conventions, naming, structure
4. **Security**: Any vulnerabilities or data exposure risks?
5. **Performance**: N+1 queries, unnecessary re-renders, memory leaks?
6. **Edge cases**: What could go wrong?
7. **Tests**: Are the changes adequately tested?

For each issue found, specify:
- Severity: critical / warning / suggestion
- File and line number
- Concrete fix suggestion`,
  },
  {
    id: "security-audit",
    name: "Security Audit",
    category: "code-review",
    description: "Find security vulnerabilities in the codebase",
    prompt: `Perform a security audit on the current codebase:

Check for:
- SQL injection, XSS, CSRF vulnerabilities
- Hardcoded secrets, API keys, passwords
- Insecure dependencies (check package.json / Cargo.toml)
- Missing input validation and sanitization
- Improper error handling that leaks information
- Authentication/authorization bypasses
- Insecure file operations

Rate each finding as: CRITICAL / HIGH / MEDIUM / LOW
Provide remediation steps for each.`,
  },
  {
    id: "architecture-review",
    name: "Architecture Review",
    category: "code-review",
    description: "Analyze codebase architecture and suggest improvements",
    prompt: `Analyze the architecture of this codebase:

1. **Module structure**: Is it well-organized? Circular dependencies?
2. **Separation of concerns**: Business logic vs. presentation vs. data
3. **Error handling**: Consistent patterns across the codebase?
4. **State management**: Is state handled predictably?
5. **API design**: Clean interfaces? Over/under-abstraction?
6. **Dependency graph**: Are dependencies reasonable?

Provide a high-level architecture diagram (ASCII) and specific improvement suggestions.`,
  },

  // Documentation
  {
    id: "api-docs",
    name: "API Documentation",
    category: "documentation",
    description: "Generate comprehensive API documentation",
    prompt: `Generate API documentation for all exported functions, types, and classes:

For each export:
- Brief description of purpose
- Parameters with types and descriptions
- Return type and description
- Usage example
- Edge cases / error scenarios

Format as JSDoc/TSDoc comments that can be placed directly in the code.
Follow the project's documentation language setting.`,
  },
  {
    id: "readme-generator",
    name: "README Generator",
    category: "documentation",
    description: "Generate a comprehensive README for the project",
    prompt: `Generate a comprehensive README.md for this project:

Include:
- Project name and description
- Badges (build status, version, license)
- Quick start / installation instructions
- Usage examples
- Configuration options
- Architecture overview
- Contributing guidelines
- License

Use the project's existing stack and structure. Keep it concise but complete.`,
  },
  {
    id: "changelog-entry",
    name: "Changelog Entry",
    category: "documentation",
    description: "Generate changelog entry from recent commits",
    prompt: `Generate a CHANGELOG entry based on recent git commits:

Format:
## [version] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features

Group commits by type using conventional commit prefixes.
Include relevant PR/issue numbers where available.`,
  },

  // Testing
  {
    id: "unit-tests",
    name: "Unit Test Suite",
    category: "testing",
    description: "Generate comprehensive unit tests",
    prompt: `Generate a complete unit test suite for the current file:

Requirements:
- Test each exported function/method independently
- Include happy path, edge cases, and error scenarios
- Mock external dependencies
- Use descriptive test names: "should [expected behavior] when [condition]"
- Use the project's existing test framework
- Aim for >90% code coverage
- Include setup/teardown where needed`,
  },
  {
    id: "integration-tests",
    name: "Integration Tests",
    category: "testing",
    description: "Generate integration test scenarios",
    prompt: `Generate integration tests for the current module/feature:

Focus on:
- End-to-end flows through the module
- Interaction between components
- Database/API integration points
- Error propagation across boundaries
- Concurrent/parallel scenarios
- Cleanup after tests

Use realistic test data. Don't mock internal dependencies.`,
  },
  {
    id: "test-coverage",
    name: "Coverage Analysis",
    category: "testing",
    description: "Analyze test coverage gaps and suggest tests",
    prompt: `Analyze the current test coverage and identify gaps:

1. List all exported functions/methods
2. Mark which ones have tests and which don't
3. For tested functions, identify missing edge cases
4. Prioritize by risk: high-traffic / complex / error-prone
5. Generate the missing tests, ordered by priority

Focus on the most critical paths first.`,
  },

  // Refactoring
  {
    id: "extract-components",
    name: "Extract Components",
    category: "refactoring",
    description: "Identify and extract reusable components",
    prompt: `Analyze the code and identify opportunities to extract reusable components:

Look for:
- Repeated UI patterns that could be shared components
- Duplicated logic that could be utility functions
- Large components that should be split (>150 lines)
- Mixed concerns in a single file

For each extraction:
- Show the before/after
- Name the new component/function
- List all places it would be used
- Ensure no behavior changes`,
  },
  {
    id: "performance-optimize",
    name: "Performance Optimization",
    category: "refactoring",
    description: "Find and fix performance bottlenecks",
    prompt: `Analyze the code for performance issues and optimize:

Check for:
- Unnecessary re-renders (React/Solid)
- Missing memoization (useMemo, createMemo)
- N+1 query patterns
- Large bundle imports (could use dynamic imports)
- Memory leaks (event listeners, intervals, subscriptions)
- Inefficient algorithms (O(n^2) that could be O(n))

For each issue, provide:
- Current performance impact
- Optimized code
- Expected improvement`,
  },
  {
    id: "type-safety",
    name: "Type Safety Audit",
    category: "refactoring",
    description: "Strengthen TypeScript types and remove any/unknown",
    prompt: `Audit the codebase for type safety improvements:

Find and fix:
- Any usage of 'any' type
- Missing return types on exported functions
- Loose union types that could be narrowed
- Missing generic constraints
- Type assertions (as) that could be replaced with type guards
- Missing discriminated unions for tagged types

Replace each 'any' with the correct specific type.
Add type guards where runtime validation is needed.`,
  },
];

export function PromptsPage() {
  const [activeCategory, setActiveCategory] = createSignal<PromptCategory | "all">("all");
  const [expandedId, setExpandedId] = createSignal<string | null>(null);
  const [customName, setCustomName] = createSignal("");
  const [customCategory, setCustomCategory] = createSignal<PromptCategory>("code-review");
  const [customPrompt, setCustomPrompt] = createSignal("");
  const [showBuilder, setShowBuilder] = createSignal(false);
  const [savedPrompts, setSavedPrompts] = createSignal<PromptTemplate[]>([]);
  const [copiedId, setCopiedId] = createSignal<string | null>(null);

  const filteredTemplates = createMemo(() => {
    const cat = activeCategory();
    const all = [...PROMPT_TEMPLATES, ...savedPrompts()];
    if (cat === "all") return all;
    return all.filter((t) => t.category === cat);
  });

  function categoryColor(cat: PromptCategory): string {
    return CATEGORIES.find((c) => c.id === cat)?.color || "var(--text-muted)";
  }

  function copyPrompt(id: string, prompt: string) {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function saveCustomPrompt() {
    if (!customName().trim() || !customPrompt().trim()) return;
    const template: PromptTemplate = {
      id: `custom-${Date.now()}`,
      name: customName().trim(),
      category: customCategory(),
      description: "Custom prompt template",
      prompt: customPrompt().trim(),
    };
    setSavedPrompts([...savedPrompts(), template]);
    setCustomName("");
    setCustomPrompt("");
    setShowBuilder(false);
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Header */}
        <div class="card">
          <h2 class="card-title">
            <Message size={16} />
            Prompt Templates
          </h2>
          <p class="text-dim" style={{ "font-size": "0.85rem" }}>
            Pre-built prompt templates for common development tasks.
            Click to expand and copy to clipboard for use in Claude Code.
          </p>
        </div>

        {/* Category Filter */}
        <div style={{ display: "flex", gap: "var(--sp-2)", "margin-top": "var(--sp-4)", "flex-wrap": "wrap" }}>
          <button
            class={`btn ${activeCategory() === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveCategory("all")}
          >
            All ({PROMPT_TEMPLATES.length + savedPrompts().length})
          </button>
          <For each={CATEGORIES}>
            {(cat) => {
              const count = () => [...PROMPT_TEMPLATES, ...savedPrompts()].filter((t) => t.category === cat.id).length;
              return (
                <button
                  class={`btn ${activeCategory() === cat.id ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span style={{ width: "8px", height: "8px", "border-radius": "50%", background: cat.color, display: "inline-block", "margin-right": "var(--sp-1)" }} />
                  {cat.label} ({count()})
                </button>
              );
            }}
          </For>
        </div>

        {/* Templates List */}
        <div style={{ "margin-top": "var(--sp-4)" }}>
          <For each={filteredTemplates()}>
            {(template) => (
              <div
                class="card"
                style={{ "margin-bottom": "var(--sp-2)", cursor: "pointer" }}
                onClick={() => setExpandedId(expandedId() === template.id ? null : template.id)}
              >
                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                  <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-3)" }}>
                    <span style={{
                      width: "8px",
                      height: "8px",
                      "border-radius": "50%",
                      background: categoryColor(template.category),
                      "flex-shrink": "0",
                    }} />
                    <div>
                      <strong style={{ "font-size": "0.9rem" }}>{template.name}</strong>
                      <p class="text-dim" style={{ "font-size": "0.8rem", margin: "0" }}>{template.description}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", "flex-shrink": "0" }}>
                    <span class="text-dim" style={{ "font-size": "0.7rem" }}>
                      {CATEGORIES.find((c) => c.id === template.category)?.label}
                    </span>
                    <ChevronDown size={14} style={{ transform: expandedId() === template.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  </div>
                </div>
                <Show when={expandedId() === template.id}>
                  <div style={{ "margin-top": "var(--sp-3)" }} onClick={(e) => e.stopPropagation()}>
                    <pre class="font-mono text-dim" style={{
                      "font-size": "0.8rem",
                      "white-space": "pre-wrap",
                      background: "var(--bg-input)",
                      padding: "var(--sp-3)",
                      "border-radius": "var(--radius)",
                      "max-height": "300px",
                      overflow: "auto",
                    }}>
                      {template.prompt}
                    </pre>
                    <button
                      class={`btn ${copiedId() === template.id ? "btn-primary" : "btn-secondary"}`}
                      style={{ "margin-top": "var(--sp-2)" }}
                      onClick={() => copyPrompt(template.id, template.prompt)}
                    >
                      <Copy size={14} style={{ "margin-right": "var(--sp-1)" }} />
                      {copiedId() === template.id ? "Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>

        {/* Custom Prompt Builder */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--sp-3)" }}>
            <h2 class="card-title" style={{ margin: "0" }}>
              <Edit size={16} />
              Custom Prompt Builder
            </h2>
            <button class="btn btn-secondary" onClick={() => setShowBuilder(!showBuilder())}>
              {showBuilder() ? "Cancel" : "+ New Prompt"}
            </button>
          </div>

          <Show when={showBuilder()}>
            <div style={{ background: "var(--bg-input)", padding: "var(--sp-4)", "border-radius": "var(--radius)", border: "1px solid var(--accent)" }}>
              <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--sp-3)" }}>
                <div class="form-group">
                  <label>Template Name</label>
                  <input
                    type="text"
                    placeholder="e.g. My Review Checklist"
                    value={customName()}
                    onInput={(e) => setCustomName(e.currentTarget.value)}
                  />
                </div>
                <div class="form-group">
                  <label>Category</label>
                  <select
                    class="form-input"
                    value={customCategory()}
                    onChange={(e) => setCustomCategory(e.currentTarget.value as PromptCategory)}
                  >
                    <For each={CATEGORIES}>
                      {(cat) => <option value={cat.id}>{cat.label}</option>}
                    </For>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Prompt Content</label>
                <textarea
                  rows={8}
                  placeholder="Write your prompt template here..."
                  value={customPrompt()}
                  onInput={(e) => setCustomPrompt(e.currentTarget.value)}
                  style={{ "font-family": "var(--font-mono)", "font-size": "0.8rem" }}
                />
              </div>
              <button
                class="btn btn-primary"
                onClick={saveCustomPrompt}
                disabled={!customName().trim() || !customPrompt().trim()}
              >
                Save Template
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

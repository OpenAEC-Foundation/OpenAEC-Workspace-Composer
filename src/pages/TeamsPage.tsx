import { createSignal, For, Show, createMemo } from "solid-js";

type TeamStyle = "grid" | "kanban" | "radial" | "timeline";

interface TeamMember {
  id: string;
  role: string;
  icon: string;
  color: string;
  description: string;
  skills: string[];
}

interface Team {
  id: string;
  name: string;
  description: string;
  style: TeamStyle;
  members: TeamMember[];
  accent: string;
}

const ROLE_PALETTE: { role: string; icon: string; color: string; desc: string }[] = [
  { role: "Architect", icon: "\u{1F3D7}", color: "#D97706", desc: "System design, architecture decisions, code structure" },
  { role: "Builder", icon: "\u{1F528}", color: "#22c55e", desc: "Feature implementation, code writing, refactoring" },
  { role: "Reviewer", icon: "\u{1F50D}", color: "#3B82F6", desc: "Code review, quality assurance, security audit" },
  { role: "Tester", icon: "\u{1F9EA}", color: "#A855F7", desc: "Unit tests, integration tests, coverage analysis" },
  { role: "DevOps", icon: "\u{2699}", color: "#EF4444", desc: "CI/CD, Docker, deployment, infrastructure" },
  { role: "Documenter", icon: "\u{1F4DD}", color: "#06B6D4", desc: "API docs, README, changelogs, guides" },
  { role: "Designer", icon: "\u{1F3A8}", color: "#EC4899", desc: "UI/UX, component design, styling, accessibility" },
  { role: "Researcher", icon: "\u{1F4DA}", color: "#F59E0B", desc: "Analysis, benchmarking, dependency evaluation" },
  { role: "Debugger", icon: "\u{1F41B}", color: "#F97316", desc: "Bug hunting, performance profiling, error analysis" },
  { role: "Planner", icon: "\u{1F4CB}", color: "#8B5CF6", desc: "Task breakdown, sprint planning, roadmap" },
];

const PRESET_TEAMS: Team[] = [
  {
    id: "fullstack",
    name: "Full-Stack Squad",
    description: "End-to-end feature development with review and testing",
    style: "grid",
    accent: "#D97706",
    members: [
      { id: "1", role: "Architect", icon: "\u{1F3D7}", color: "#D97706", description: "Designs the solution", skills: ["system-design", "api-design"] },
      { id: "2", role: "Builder", icon: "\u{1F528}", color: "#22c55e", description: "Implements the feature", skills: ["typescript", "rust"] },
      { id: "3", role: "Reviewer", icon: "\u{1F50D}", color: "#3B82F6", description: "Reviews all code", skills: ["code-review", "security"] },
      { id: "4", role: "Tester", icon: "\u{1F9EA}", color: "#A855F7", description: "Writes and runs tests", skills: ["unit-tests", "e2e"] },
    ],
  },
  {
    id: "launch",
    name: "Launch Team",
    description: "Ship to production with confidence",
    style: "kanban",
    accent: "#EF4444",
    members: [
      { id: "1", role: "Builder", icon: "\u{1F528}", color: "#22c55e", description: "Final features", skills: ["implementation"] },
      { id: "2", role: "Tester", icon: "\u{1F9EA}", color: "#A855F7", description: "Regression tests", skills: ["testing"] },
      { id: "3", role: "DevOps", icon: "\u{2699}", color: "#EF4444", description: "Deploy pipeline", skills: ["docker", "ci-cd"] },
      { id: "4", role: "Documenter", icon: "\u{1F4DD}", color: "#06B6D4", description: "Release notes", skills: ["changelog"] },
      { id: "5", role: "Reviewer", icon: "\u{1F50D}", color: "#3B82F6", description: "Final audit", skills: ["security-audit"] },
    ],
  },
  {
    id: "research",
    name: "Research Cell",
    description: "Deep analysis before making big decisions",
    style: "radial",
    accent: "#8B5CF6",
    members: [
      { id: "1", role: "Researcher", icon: "\u{1F4DA}", color: "#F59E0B", description: "Core analysis", skills: ["benchmarking"] },
      { id: "2", role: "Architect", icon: "\u{1F3D7}", color: "#D97706", description: "Architecture eval", skills: ["trade-offs"] },
      { id: "3", role: "Planner", icon: "\u{1F4CB}", color: "#8B5CF6", description: "Roadmap impact", skills: ["planning"] },
    ],
  },
  {
    id: "quality",
    name: "Quality Gate",
    description: "Nothing ships without passing every check",
    style: "timeline",
    accent: "#22c55e",
    members: [
      { id: "1", role: "Reviewer", icon: "\u{1F50D}", color: "#3B82F6", description: "Code review", skills: ["review"] },
      { id: "2", role: "Tester", icon: "\u{1F9EA}", color: "#A855F7", description: "Test coverage", skills: ["tests"] },
      { id: "3", role: "Debugger", icon: "\u{1F41B}", color: "#F97316", description: "Performance check", skills: ["profiling"] },
      { id: "4", role: "Reviewer", icon: "\u{1F50D}", color: "#3B82F6", description: "Security audit", skills: ["security"] },
    ],
  },
];

export function TeamsPage() {
  const [teams, setTeams] = createSignal<Team[]>(PRESET_TEAMS);
  const [activeTeam, setActiveTeam] = createSignal<string | null>(null);
  const [building, setBuilding] = createSignal(false);
  const [buildName, setBuildName] = createSignal("");
  const [buildStyle, setBuildStyle] = createSignal<TeamStyle>("grid");
  const [buildMembers, setBuildMembers] = createSignal<TeamMember[]>([]);

  const selectedTeam = createMemo(() =>
    teams().find((t) => t.id === activeTeam())
  );

  function addMemberToBuilder(role: typeof ROLE_PALETTE[0]) {
    setBuildMembers((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        role: role.role,
        icon: role.icon,
        color: role.color,
        description: role.desc,
        skills: [],
      },
    ]);
  }

  function removeMemberFromBuilder(id: string) {
    setBuildMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function saveTeam() {
    if (!buildName().trim() || buildMembers().length === 0) return;
    const newTeam: Team = {
      id: `custom-${Date.now()}`,
      name: buildName().trim(),
      description: `Custom team with ${buildMembers().length} members`,
      style: buildStyle(),
      accent: buildMembers()[0]?.color || "#D97706",
      members: buildMembers(),
    };
    setTeams((prev) => [...prev, newTeam]);
    setBuilding(false);
    setBuildName("");
    setBuildMembers([]);
    setActiveTeam(newTeam.id);
  }

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Team cards */}
        <div class="team-showcase">
          <For each={teams()}>
            {(team) => (
              <div
                class={`team-card team-card--${team.style} ${activeTeam() === team.id ? "active" : ""}`}
                style={{ "--team-accent": team.accent }}
                onClick={() => setActiveTeam(activeTeam() === team.id ? null : team.id)}
              >
                {/* Header glow */}
                <div class="team-card-glow" />

                <div class="team-card-header">
                  <h3 class="team-card-name">{team.name}</h3>
                  <span class="team-card-count">{team.members.length}</span>
                </div>
                <p class="team-card-desc">{team.description}</p>

                {/* Member visualization — different per style */}
                <div class={`team-viz team-viz--${team.style}`}>
                  <Show when={team.style === "grid"}>
                    <div class="team-grid-viz">
                      <For each={team.members}>
                        {(m) => (
                          <div class="team-member-dot" style={{ background: m.color }} title={m.role}>
                            <span>{m.icon}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>

                  <Show when={team.style === "kanban"}>
                    <div class="team-kanban-viz">
                      <For each={team.members}>
                        {(m, i) => (
                          <div class="team-kanban-lane" style={{ "border-left": `2px solid ${m.color}` }}>
                            <span class="team-kanban-icon">{m.icon}</span>
                            <span class="team-kanban-role">{m.role}</span>
                            <Show when={i() < team.members.length - 1}>
                              <span class="team-kanban-arrow">&rarr;</span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>

                  <Show when={team.style === "radial"}>
                    <div class="team-radial-viz">
                      <div class="team-radial-center">
                        <span style={{ "font-size": "1.2rem" }}>{team.members[0]?.icon}</span>
                      </div>
                      <For each={team.members.slice(1)}>
                        {(m, i) => {
                          const angle = () => ((i() * 360) / (team.members.length - 1)) * (Math.PI / 180);
                          const x = () => 50 + Math.cos(angle()) * 32;
                          const y = () => 50 + Math.sin(angle()) * 32;
                          return (
                            <div
                              class="team-radial-node"
                              style={{
                                left: `${x()}%`,
                                top: `${y()}%`,
                                background: m.color,
                              }}
                              title={m.role}
                            >
                              {m.icon}
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </Show>

                  <Show when={team.style === "timeline"}>
                    <div class="team-timeline-viz">
                      <div class="team-timeline-line" />
                      <For each={team.members}>
                        {(m, i) => (
                          <div class="team-timeline-step" style={{ left: `${((i() + 0.5) / team.members.length) * 100}%` }}>
                            <div class="team-timeline-dot" style={{ background: m.color }}>{m.icon}</div>
                            <span class="team-timeline-label">{m.role}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>

                {/* Style badge */}
                <span class="team-style-badge">{team.style}</span>
              </div>
            )}
          </For>

          {/* Add team button */}
          <div
            class={`team-card team-card--add ${building() ? "active" : ""}`}
            onClick={() => !building() && setBuilding(true)}
          >
            <Show when={!building()}>
              <div style={{ display: "flex", "flex-direction": "column", "align-items": "center", gap: "var(--sp-2)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span class="text-dim" style={{ "font-size": "0.8rem" }}>New Team</span>
              </div>
            </Show>
          </div>
        </div>

        {/* Expanded team detail */}
        <Show when={selectedTeam()}>
          {(team) => (
            <div class="team-detail" style={{ "--team-accent": team().accent }}>
              <div class="team-detail-header">
                <h2>{team().name}</h2>
                <span class="team-style-badge" style={{ "font-size": "0.75rem" }}>{team().style} layout</span>
              </div>
              <div class="team-members-detail">
                <For each={team().members}>
                  {(member) => (
                    <div class="team-member-card" style={{ "--member-color": member.color }}>
                      <div class="member-card-icon">{member.icon}</div>
                      <div class="member-card-info">
                        <strong>{member.role}</strong>
                        <p class="text-dim" style={{ "font-size": "0.75rem", margin: 0 }}>{member.description}</p>
                        <div style={{ display: "flex", gap: "4px", "flex-wrap": "wrap", "margin-top": "var(--sp-1)" }}>
                          <For each={member.skills}>
                            {(skill) => <span class="tag" style={{ "font-size": "0.6rem" }}>{skill}</span>}
                          </For>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </Show>

        {/* Team Builder */}
        <Show when={building()}>
          <div class="team-builder">
            <div class="team-builder-header">
              <h2 style={{ "font-family": "var(--font-heading)", "font-size": "1rem", margin: 0 }}>Team Factory</h2>
              <button class="btn btn-ghost btn-sm" onClick={() => { setBuilding(false); setBuildMembers([]); setBuildName(""); }}>Cancel</button>
            </div>

            <div class="team-builder-config">
              <div class="form-group">
                <label class="form-label">Team Name</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="My Dream Team"
                  value={buildName()}
                  onInput={(e) => setBuildName(e.currentTarget.value)}
                />
              </div>

              <div class="form-group">
                <label class="form-label">Layout Style</label>
                <div class="team-style-selector">
                  {(["grid", "kanban", "radial", "timeline"] as TeamStyle[]).map((style) => (
                    <button
                      class={`team-style-option ${buildStyle() === style ? "active" : ""}`}
                      onClick={() => setBuildStyle(style)}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Role palette */}
            <div class="form-group" style={{ "margin-top": "var(--sp-3)" }}>
              <label class="form-label">Add Members</label>
              <div class="role-palette">
                <For each={ROLE_PALETTE}>
                  {(role) => (
                    <button
                      class="role-chip"
                      style={{ "--chip-color": role.color }}
                      onClick={() => addMemberToBuilder(role)}
                      title={role.desc}
                    >
                      <span>{role.icon}</span>
                      <span>{role.role}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* Build preview */}
            <Show when={buildMembers().length > 0}>
              <div class="team-build-preview">
                <label class="form-label">Team ({buildMembers().length} members)</label>
                <div class="team-build-members">
                  <For each={buildMembers()}>
                    {(m) => (
                      <div class="team-build-member" style={{ "--member-color": m.color }}>
                        <span>{m.icon}</span>
                        <span style={{ "font-size": "0.75rem" }}>{m.role}</span>
                        <button
                          class="team-build-remove"
                          onClick={() => removeMemberFromBuilder(m.id)}
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </For>
                </div>
                <button
                  class="btn btn-generate"
                  style={{ "margin-top": "var(--sp-3)", width: "100%" }}
                  disabled={!buildName().trim()}
                  onClick={saveTeam}
                >
                  Create Team
                </button>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}

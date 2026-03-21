import { createSignal, onMount, For, Show } from "solid-js";

type AuthStatus = "unknown" | "checking" | "authenticated" | "not-authenticated" | "error";
type SubscriptionTier = "free" | "pro" | "team" | "enterprise" | "unknown";

interface PrerequisiteResult {
  name: string;
  command: string;
  required: boolean;
  found: boolean;
  version: string | null;
  installHint: string;
}

interface PrerequisitesReport {
  checks: PrerequisiteResult[];
  allRequiredOk: boolean;
}

export function AuthPage() {
  const [authStatus, setAuthStatus] = createSignal<AuthStatus>("unknown");
  const [subscriptionTier, setSubscriptionTier] = createSignal<SubscriptionTier>("unknown");
  const [authEmail, setAuthEmail] = createSignal<string>("");
  const [errorMessage, setErrorMessage] = createSignal<string>("");
  const [showInstructions, setShowInstructions] = createSignal(false);
  const [prerequisites, setPrerequisites] = createSignal<PrerequisitesReport | null>(null);
  const [prereqLoading, setPrereqLoading] = createSignal(false);
  const [isDesktop, setIsDesktop] = createSignal(false);
  const [copiedCmd, setCopiedCmd] = createSignal<string | null>(null);

  onMount(async () => {
    // Detect Tauri and run prerequisite checks automatically
    try {
      await import("@tauri-apps/api/core");
      setIsDesktop(true);
      await checkPrerequisites();
    } catch {
      setIsDesktop(false);
    }
  });

  async function checkPrerequisites() {
    setPrereqLoading(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const report = await invoke<PrerequisitesReport>("check_prerequisites");
      setPrerequisites(report);

      // If Claude CLI is found, also check auth
      const claudeCheck = report.checks.find((c) => c.name === "Claude Code CLI");
      if (claudeCheck?.found) {
        await checkAuth();
      } else {
        setAuthStatus("not-authenticated");
      }
    } catch (e) {
      console.error("Prerequisites check failed:", e);
      setPrerequisites(null);
    } finally {
      setPrereqLoading(false);
    }
  }

  async function checkAuth() {
    setAuthStatus("checking");
    setErrorMessage("");
    try {
      const { Command } = await import("@tauri-apps/plugin-shell");
      const output = await Command.create("claude-auth-check", ["claude", "auth", "status"]).execute();
      if (output.code === 0) {
        setAuthStatus("authenticated");
        const text = output.stdout || "";
        if (text.includes("pro") || text.includes("Pro")) setSubscriptionTier("pro");
        else if (text.includes("team") || text.includes("Team")) setSubscriptionTier("team");
        else if (text.includes("enterprise") || text.includes("Enterprise")) setSubscriptionTier("enterprise");
        else setSubscriptionTier("free");
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) setAuthEmail(emailMatch[0]);
      } else {
        setAuthStatus("not-authenticated");
      }
    } catch {
      setAuthStatus("unknown");
      setErrorMessage("Could not check auth status. Make sure Claude CLI is installed.");
    }
  }

  function copyCommand(cmd: string) {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    });
  }

  function tierColor(tier: SubscriptionTier): string {
    switch (tier) {
      case "free": return "var(--text-muted)";
      case "pro": return "var(--accent)";
      case "team": return "#3498db";
      case "enterprise": return "#9b59b6";
      default: return "var(--text-muted)";
    }
  }

  function tierLabel(tier: SubscriptionTier): string {
    switch (tier) {
      case "free": return "Free";
      case "pro": return "Pro";
      case "team": return "Team";
      case "enterprise": return "Enterprise";
      default: return "Unknown";
    }
  }

  const requiredChecks = () => prerequisites()?.checks.filter((c) => c.required) ?? [];
  const optionalChecks = () => prerequisites()?.checks.filter((c) => !c.required) ?? [];

  return (
    <div class="content-body">
      <div class="content-scroll">
        {/* Prerequisites Card */}
        <div class="card">
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--sp-3)" }}>
            <h2 class="card-title" style={{ margin: "0" }}>
              <span class="icon-placeholder" />
              Prerequisites
            </h2>
            <button
              class="btn btn-secondary"
              style={{ "font-size": "0.75rem", padding: "4px 12px" }}
              onClick={checkPrerequisites}
              disabled={prereqLoading()}
            >
              {prereqLoading() ? "Checking..." : "Check Again"}
            </button>
          </div>

          <Show when={!isDesktop()}>
            <div style={{
              background: "rgba(230, 126, 34, 0.1)",
              border: "1px solid rgba(230, 126, 34, 0.3)",
              "border-radius": "var(--radius)",
              padding: "var(--sp-3)",
              "margin-bottom": "var(--sp-3)",
            }}>
              <p style={{ "font-size": "0.85rem", margin: "0", color: "var(--warning, #e67e22)" }}>
                This feature requires the desktop app. Prerequisite checks cannot run in browser mode.
              </p>
            </div>
          </Show>

          <Show when={prereqLoading()}>
            <p class="text-dim" style={{ "font-size": "0.85rem" }}>Checking installed tools...</p>
          </Show>

          <Show when={prerequisites() && !prereqLoading()}>
            {/* Summary badge */}
            <div style={{
              display: "flex",
              "align-items": "center",
              gap: "var(--sp-2)",
              "margin-bottom": "var(--sp-3)",
              padding: "var(--sp-2) var(--sp-3)",
              background: prerequisites()!.allRequiredOk ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              "border-radius": "var(--radius)",
              border: prerequisites()!.allRequiredOk ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            }}>
              <Show when={prerequisites()!.allRequiredOk}>
                <span class="icon-placeholder" />
                <span style={{ "font-size": "0.85rem", color: "var(--success)" }}>All required tools are installed</span>
              </Show>
              <Show when={!prerequisites()!.allRequiredOk}>
                <span class="icon-placeholder" />
                <span style={{ "font-size": "0.85rem", color: "var(--error)" }}>
                  Some required tools are missing ({requiredChecks().filter((c) => !c.found).length} of {requiredChecks().length})
                </span>
              </Show>
            </div>

            {/* Required tools */}
            <h3 style={{ "font-size": "0.8rem", "text-transform": "uppercase", "letter-spacing": "0.05em", color: "var(--text-muted)", "margin-bottom": "var(--sp-2)" }}>Required</h3>
            <For each={requiredChecks()}>
              {(check) => (
                <div style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "var(--sp-3)",
                  background: "var(--bg-input)",
                  padding: "var(--sp-2) var(--sp-3)",
                  "border-radius": "var(--radius)",
                  "margin-bottom": "var(--sp-1)",
                  border: `1px solid ${check.found ? "var(--border)" : "rgba(239, 68, 68, 0.3)"}`,
                }}>
                  <Show when={check.found}>
                    <span class="icon-placeholder" />
                  </Show>
                  <Show when={!check.found}>
                    <span class="icon-placeholder" />
                  </Show>
                  <div style={{ flex: "1", "min-width": "0" }}>
                    <strong style={{ "font-size": "0.85rem" }}>{check.name}</strong>
                    <Show when={check.found && check.version}>
                      <span class="text-dim" style={{ "font-size": "0.75rem", "margin-left": "var(--sp-2)" }}>{check.version}</span>
                    </Show>
                    <Show when={!check.found}>
                      <p style={{ "font-size": "0.75rem", margin: "2px 0 0 0", color: "var(--text-muted)" }}>
                        Install: <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.75rem" }}>{check.installHint}</code>
                      </p>
                    </Show>
                  </div>
                </div>
              )}
            </For>

            {/* Optional tools */}
            <h3 style={{ "font-size": "0.8rem", "text-transform": "uppercase", "letter-spacing": "0.05em", color: "var(--text-muted)", "margin-top": "var(--sp-3)", "margin-bottom": "var(--sp-2)" }}>Optional</h3>
            <For each={optionalChecks()}>
              {(check) => (
                <div style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "var(--sp-3)",
                  background: "var(--bg-input)",
                  padding: "var(--sp-2) var(--sp-3)",
                  "border-radius": "var(--radius)",
                  "margin-bottom": "var(--sp-1)",
                  border: "1px solid var(--border)",
                  opacity: check.found ? "1" : "0.7",
                }}>
                  <Show when={check.found}>
                    <span class="icon-placeholder" />
                  </Show>
                  <Show when={!check.found}>
                    <span class="icon-placeholder" />
                  </Show>
                  <div style={{ flex: "1", "min-width": "0" }}>
                    <strong style={{ "font-size": "0.85rem" }}>{check.name}</strong>
                    <Show when={check.found && check.version}>
                      <span class="text-dim" style={{ "font-size": "0.75rem", "margin-left": "var(--sp-2)" }}>{check.version}</span>
                    </Show>
                    <Show when={!check.found}>
                      <p style={{ "font-size": "0.75rem", margin: "2px 0 0 0", color: "var(--text-muted)" }}>
                        {check.installHint}
                      </p>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>

        {/* Auth Status Card */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">
            <span class="icon-placeholder" />
            Authentication Status
          </h2>

          <div style={{
            display: "flex",
            "align-items": "center",
            gap: "var(--sp-4)",
            background: "var(--bg-input)",
            padding: "var(--sp-4)",
            "border-radius": "var(--radius)",
            "margin-bottom": "var(--sp-3)",
          }}>
            {/* Status indicator */}
            <div style={{
              width: "48px",
              height: "48px",
              "border-radius": "50%",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              background: authStatus() === "authenticated"
                ? "rgba(34, 197, 94, 0.15)"
                : authStatus() === "not-authenticated"
                ? "rgba(239, 68, 68, 0.15)"
                : "rgba(245, 240, 235, 0.06)",
              "flex-shrink": "0",
            }}>
              <Show when={authStatus() === "authenticated"}>
                <span class="icon-placeholder" />
              </Show>
              <Show when={authStatus() === "not-authenticated"}>
                <span class="icon-placeholder" />
              </Show>
              <Show when={authStatus() === "checking"}>
                <span class="icon-placeholder" />
              </Show>
              <Show when={authStatus() === "unknown" || authStatus() === "error"}>
                <span class="icon-placeholder" />
              </Show>
            </div>

            <div style={{ flex: "1" }}>
              <strong style={{ "font-size": "0.95rem" }}>
                {authStatus() === "authenticated" && "Authenticated"}
                {authStatus() === "not-authenticated" && "Not Authenticated"}
                {authStatus() === "checking" && "Checking..."}
                {authStatus() === "unknown" && "Status Unknown"}
                {authStatus() === "error" && "Error"}
              </strong>
              <Show when={authStatus() === "authenticated" && authEmail()}>
                <p class="text-dim" style={{ "font-size": "0.8rem", margin: "0" }}>
                  Logged in as <span style={{ color: "var(--accent)" }}>{authEmail()}</span>
                </p>
              </Show>
              <Show when={authStatus() === "not-authenticated"}>
                <p class="text-dim" style={{ "font-size": "0.8rem", margin: "0" }}>
                  Run <code class="font-mono" style={{ color: "var(--accent)" }}>claude login</code> to authenticate
                </p>
              </Show>
              <Show when={errorMessage()}>
                <p style={{ "font-size": "0.8rem", margin: "0", color: "var(--error)" }}>
                  {errorMessage()}
                </p>
              </Show>
            </div>

            <button
              class="btn btn-primary"
              onClick={checkAuth}
              disabled={authStatus() === "checking"}
              style={{ "flex-shrink": "0" }}
            >
              {authStatus() === "checking" ? "Checking..." : "Check Status"}
            </button>
          </div>

          {/* Quick login command */}
          <Show when={authStatus() === "not-authenticated" || authStatus() === "unknown"}>
            <div style={{
              display: "flex",
              "align-items": "center",
              gap: "var(--sp-2)",
              background: "var(--bg-input)",
              padding: "var(--sp-2) var(--sp-3)",
              "border-radius": "var(--radius)",
              "margin-bottom": "var(--sp-3)",
            }}>
              <span class="icon-placeholder" />
              <code class="font-mono" style={{ "font-size": "0.85rem", color: "var(--accent)", flex: "1" }}>claude login</code>
              <button
                class="btn btn-secondary"
                style={{ "font-size": "0.75rem", padding: "2px 10px", "flex-shrink": "0" }}
                onClick={() => copyCommand("claude login")}
              >
                {copiedCmd() === "claude login" ? "Copied!" : "Copy"}
              </button>
            </div>
          </Show>

        </div>

        {/* Login Instructions */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--sp-2)" }}>
            <h2 class="card-title" style={{ margin: "0" }}>
              <span class="icon-placeholder" />
              Login Instructions
            </h2>
            <button class="btn btn-ghost" style={{ "font-size": "0.75rem" }} onClick={() => setShowInstructions(!showInstructions())}>
              {showInstructions() ? "Collapse" : "Expand"}
            </button>
          </div>

          <Show when={showInstructions()}>
            <div style={{ "font-size": "0.85rem", "line-height": "1.6" }}>
              <div style={{ "margin-bottom": "var(--sp-4)" }}>
                <strong style={{ color: "var(--accent)" }}>1. Install Claude CLI</strong>
                <p class="text-dim">Install the Claude Code CLI globally:</p>
                <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)", "margin-top": "var(--sp-1)" }}>
                  <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.8rem", flex: "1" }}>
                    npm install -g @anthropic-ai/claude-code
                  </code>
                  <button class="btn btn-ghost" style={{ "font-size": "0.7rem", padding: "2px 8px" }} onClick={() => copyCommand("npm install -g @anthropic-ai/claude-code")}>
                    {copiedCmd() === "npm install -g @anthropic-ai/claude-code" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div style={{ "margin-bottom": "var(--sp-4)" }}>
                <strong style={{ color: "var(--accent)" }}>2. Authenticate</strong>
                <p class="text-dim">Log in to your Anthropic account:</p>
                <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)", "margin-top": "var(--sp-1)" }}>
                  <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.8rem", flex: "1" }}>
                    claude login
                  </code>
                  <button class="btn btn-ghost" style={{ "font-size": "0.7rem", padding: "2px 8px" }} onClick={() => copyCommand("claude login")}>
                    {copiedCmd() === "claude login" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p class="text-dim" style={{ "margin-top": "var(--sp-1)" }}>
                  This opens a browser window for OAuth authentication. After login, your credentials are stored securely.
                </p>
              </div>

              <div style={{ "margin-bottom": "var(--sp-4)" }}>
                <strong style={{ color: "var(--accent)" }}>3. Verify</strong>
                <p class="text-dim">Confirm authentication is working:</p>
                <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)", "margin-top": "var(--sp-1)" }}>
                  <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.8rem", flex: "1" }}>
                    claude --version
                  </code>
                  <button class="btn btn-ghost" style={{ "font-size": "0.7rem", padding: "2px 8px" }} onClick={() => copyCommand("claude --version")}>
                    {copiedCmd() === "claude --version" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <strong style={{ color: "var(--accent)" }}>4. API Key (Alternative)</strong>
                <p class="text-dim">You can also use an API key instead of OAuth:</p>
                <div style={{ display: "flex", "align-items": "center", gap: "var(--sp-2)", background: "var(--bg-input)", padding: "var(--sp-2)", "border-radius": "var(--radius)", "margin-top": "var(--sp-1)" }}>
                  <code class="font-mono" style={{ color: "var(--accent)", "font-size": "0.8rem", flex: "1" }}>
                    export ANTHROPIC_API_KEY=sk-ant-...
                  </code>
                  <button class="btn btn-ghost" style={{ "font-size": "0.7rem", padding: "2px 8px" }} onClick={() => copyCommand("export ANTHROPIC_API_KEY=sk-ant-...")}>
                    {copiedCmd() === "export ANTHROPIC_API_KEY=sk-ant-..." ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </Show>
        </div>

        {/* Open Source Notice */}
        <div class="card" style={{ "margin-top": "var(--sp-4)" }}>
          <h2 class="card-title">Open Source</h2>
          <p class="text-dim" style={{ "font-size": "0.85rem" }}>
            OpenAEC Workspace Composer is open source software van de OpenAEC Foundation.
            Je hebt een Anthropic account nodig om Claude Code te gebruiken.
            De Composer zelf is gratis.
          </p>
        </div>
      </div>
    </div>
  );
}

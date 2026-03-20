export interface McpServerTemplate {
  id: string;
  name: string;
  description: string;
  publisher: string;
  type: "stdio" | "sse" | "http";
  command?: string;
  args?: string[];
  url?: string;
  envVars?: { key: string; label: string; required: boolean }[];
  category: "development" | "productivity" | "data" | "communication";
}

export const mcpServerTemplates: McpServerTemplate[] = [
  // Development
  {
    id: "github",
    name: "GitHub",
    description: "GitHub integration — repos, issues, PRs, code search",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-github"],
    envVars: [{ key: "GITHUB_TOKEN", label: "GitHub Personal Access Token", required: true }],
    category: "development",
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "GitLab integration — repos, merge requests, pipelines",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-gitlab"],
    envVars: [
      { key: "GITLAB_TOKEN", label: "GitLab Access Token", required: true },
      { key: "GITLAB_URL", label: "GitLab URL", required: false },
    ],
    category: "development",
  },
  {
    id: "playwright",
    name: "Playwright",
    description: "Browser automation and testing",
    publisher: "Community",
    type: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-playwright"],
    category: "development",
  },
  {
    id: "context7",
    name: "Context7",
    description: "Up-to-date documentation for any library",
    publisher: "Community",
    type: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-context7"],
    category: "development",
  },
  // Communication
  {
    id: "slack",
    name: "Slack",
    description: "Slack workspace integration — messages, channels",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-slack"],
    envVars: [{ key: "SLACK_TOKEN", label: "Slack Bot Token", required: true }],
    category: "communication",
  },
  // Productivity
  {
    id: "linear",
    name: "Linear",
    description: "Linear issue tracker integration",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-linear"],
    envVars: [{ key: "LINEAR_API_KEY", label: "Linear API Key", required: true }],
    category: "productivity",
  },
  // Data
  {
    id: "firebase",
    name: "Firebase",
    description: "Firebase/Firestore integration",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-firebase"],
    category: "data",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Supabase database and auth integration",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-supabase"],
    envVars: [
      { key: "SUPABASE_URL", label: "Supabase Project URL", required: true },
      { key: "SUPABASE_KEY", label: "Supabase API Key", required: true },
    ],
    category: "data",
  },
];

export const mcpCategoryLabels: Record<string, string> = {
  development: "Development",
  productivity: "Productivity",
  data: "Data & Storage",
  communication: "Communication",
};

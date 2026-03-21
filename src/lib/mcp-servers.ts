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
  category: "3d-bim" | "erp" | "diagrams" | "ai-agents" | "development" | "productivity" | "data" | "communication";
}

export const mcpServerTemplates: McpServerTemplate[] = [
  // 3D/BIM
  {
    id: "blender-mcp",
    name: "Blender MCP",
    description: "3D modeling, Python execution, scene manipulation, Polyhaven assets",
    publisher: "Community",
    type: "stdio",
    command: "uvx",
    args: ["blender-mcp"],
    envVars: [{ key: "BLENDER_MCP_PORT", label: "Blender MCP Port (default 9876)", required: false }],
    category: "3d-bim",
  },
  {
    id: "freecad-mcp",
    name: "FreeCAD MCP",
    description: "Parametric CAD modeling, Part/PartDesign operations",
    publisher: "Community",
    type: "stdio",
    command: "uvx",
    args: ["freecad-mcp"],
    category: "3d-bim",
  },
  {
    id: "speckle-mcp",
    name: "Speckle MCP",
    description: "Speckle data platform. Stream, receive, and send BIM data",
    publisher: "Community",
    type: "stdio",
    command: "node",
    args: ["mcp-server/index.js"],
    envVars: [
      { key: "SPECKLE_TOKEN", label: "Speckle API Token", required: true },
      { key: "SPECKLE_SERVER_URL", label: "Speckle Server URL", required: true },
    ],
    category: "3d-bim",
  },
  // ERP
  {
    id: "erpnext-frappe",
    name: "ERPNext/Frappe MCP",
    description: "Frappe/ERPNext API. CRUD operations, doctypes, workflows",
    publisher: "Community",
    type: "stdio",
    command: "npx",
    args: ["-y", "frappe-mcp-server@latest"],
    envVars: [
      { key: "FRAPPE_URL", label: "Frappe Site URL", required: true },
      { key: "FRAPPE_API_KEY", label: "Frappe API Key", required: true },
      { key: "FRAPPE_API_SECRET", label: "Frappe API Secret", required: true },
    ],
    category: "erp",
  },
  // Diagrams
  {
    id: "drawio-editor",
    name: "Draw.io Editor",
    description: "Live Draw.io editing via WebSocket on localhost:3000",
    publisher: "Community",
    type: "stdio",
    command: "npx",
    args: ["-y", "drawio-mcp-server", "--editor"],
    category: "diagrams",
  },
  {
    id: "drawio-converter",
    name: "Draw.io Converter",
    description: "Convert between Mermaid, CSV, XML diagram formats",
    publisher: "Community",
    type: "stdio",
    command: "npx",
    args: ["-y", "@drawio/mcp"],
    category: "diagrams",
  },
  // AI/Agents
  {
    id: "open-agents",
    name: "Open-Agents MCP",
    description: "Multi-agent orchestration. Spawn and coordinate AI agents",
    publisher: "OpenAEC",
    type: "stdio",
    command: "python3",
    args: ["-m", "open_agents.mcp_server"],
    category: "ai-agents",
  },
  // Development
  {
    id: "github",
    name: "GitHub",
    description: "GitHub API. Repos, issues, PRs, code search",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    envVars: [{ key: "GITHUB_PERSONAL_ACCESS_TOKEN", label: "GitHub Personal Access Token", required: true }],
    category: "development",
  },
  {
    id: "filesystem",
    name: "Filesystem MCP",
    description: "Filesystem access. Read, write, search files in a directory",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/share"],
    category: "development",
  },
  {
    id: "puppeteer",
    name: "Puppeteer MCP",
    description: "Browser automation. Navigate, screenshot, interact with web pages",
    publisher: "Anthropic",
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
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
    description: "Slack workspace integration for messages and channels",
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
  "3d-bim": "3D / BIM",
  erp: "ERP",
  diagrams: "Diagrams",
  "ai-agents": "AI / Agents",
  development: "Development",
  productivity: "Productivity",
  data: "Data & Storage",
  communication: "Communication",
};

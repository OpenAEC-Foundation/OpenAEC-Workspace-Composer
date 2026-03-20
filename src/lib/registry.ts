/**
 * Live skill package registry — fetches from GitHub, caches locally, falls back to hardcoded.
 *
 * Sources:
 *   1. OpenAEC Foundation org — individual repos matching *Skill-Package* or *Claude-Skill*
 *   2. Anthropic official — anthropics/skills repo with marketplace.json manifest
 */

import { packages as hardcodedPackages, type SkillPackage } from "./packages";

export type Publisher = "openaec" | "anthropic";

export interface RegistryPackage extends SkillPackage {
  publisher: Publisher;
  repoUrl: string;
  updatedAt: string;
  skillsPath: string; // relative path to skills dir in repo
}

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  topics: string[];
}

interface AnthropicMarketplace {
  name: string;
  plugins: {
    name: string;
    description: string;
    skills: string[];
  }[];
}

// Cache duration: 10 minutes
const CACHE_KEY = "openaec-registry-cache";
const CACHE_TTL = 10 * 60 * 1000;

interface CacheEntry {
  packages: RegistryPackage[];
  timestamp: number;
}

function getCached(): RegistryPackage[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.packages;
  } catch {
    return null;
  }
}

function setCache(packages: RegistryPackage[]) {
  try {
    const entry: CacheEntry = { packages, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage not available (e.g. in Tauri webview with restrictions)
  }
}

/** Parse skill count from GitHub description like "27 deterministic Claude AI skills for..." */
function parseSkillCount(description: string | null): number {
  if (!description) return 0;
  const match = description.match(/^(\d+)\s+(deterministic\s+)?/i);
  return match ? parseInt(match[1], 10) : 0;
}

/** Infer category from repo topics or name */
function inferCategory(repo: GitHubRepo): SkillPackage["category"] {
  const name = repo.name.toLowerCase();
  const topics = repo.topics.map((t) => t.toLowerCase());
  const all = [name, ...topics].join(" ");

  if (all.includes("blender") || all.includes("bonsai") || all.includes("ifc") || all.includes("bim") || all.includes("speckle") || all.includes("qgis") || all.includes("thatopen") || all.includes("three")) return "aec-bim";
  if (all.includes("erpnext") || all.includes("nextcloud") || all.includes("n8n")) return "erp-business";
  if (all.includes("docker") || all.includes("draw")) return "devops";
  if (all.includes("cross-tech")) return "cross-tech";
  return "web-dev";
}

/** Infer package ID from repo name */
function repoToId(repoName: string): string {
  return repoName
    .replace(/-Claude-Skill-Package$/i, "")
    .replace(/_Anthropic_Claude_Development_Skill_Package$/i, "")
    .replace(/-ifcOpenshell-Sverchok$/i, "")
    .toLowerCase()
    .replace(/_/g, "-");
}

/** Infer status from skill count and description */
function inferStatus(skillCount: number, description: string | null): SkillPackage["status"] {
  if (skillCount === 0 || !description) return "planned";
  if (skillCount < 10) return "development";
  return "published";
}

/** Fetch OpenAEC Foundation skill packages from GitHub API */
async function fetchOpenAECPackages(): Promise<RegistryPackage[]> {
  const response = await fetch(
    "https://api.github.com/orgs/OpenAEC-Foundation/repos?per_page=100&type=public",
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );
  if (!response.ok) throw new Error(`GitHub API: ${response.status}`);

  const repos: GitHubRepo[] = await response.json();
  const skillRepos = repos.filter(
    (r) => r.name.includes("Skill-Package") || r.name.includes("Claude-Skill")
  );

  // Exclude the template repo
  const filtered = skillRepos.filter(
    (r) => !r.name.includes("Workflow-Template")
  );

  return filtered.map((repo) => {
    const skillCount = parseSkillCount(repo.description);
    const id = repoToId(repo.name);
    return {
      id,
      name: repo.name
        .replace(/-Claude-Skill-Package$/i, "")
        .replace(/_Anthropic_Claude_Development_Skill_Package$/i, "")
        .replace(/-/g, " ")
        .replace(/_/g, " "),
      description: repo.description || "",
      category: inferCategory(repo),
      skillCount,
      repo: repo.full_name,
      repoUrl: repo.html_url,
      status: inferStatus(skillCount, repo.description),
      tags: repo.topics.length > 0 ? repo.topics : [id],
      publisher: "openaec" as Publisher,
      updatedAt: repo.updated_at,
      skillsPath: "skills/source",
    };
  });
}

/** Fetch Anthropic official skills from marketplace.json */
async function fetchAnthropicPackages(): Promise<RegistryPackage[]> {
  const response = await fetch(
    "https://api.github.com/repos/anthropics/skills/contents/.claude-plugin/marketplace.json",
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );
  if (!response.ok) throw new Error(`GitHub API: ${response.status}`);

  const file = await response.json();
  const content = atob(file.content);
  const manifest: AnthropicMarketplace = JSON.parse(content);

  // Also get repo metadata for updated_at
  const repoResponse = await fetch(
    "https://api.github.com/repos/anthropics/skills",
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );
  const repoMeta = repoResponse.ok ? await repoResponse.json() : { updated_at: new Date().toISOString() };

  const packages: RegistryPackage[] = [];

  for (const plugin of manifest.plugins) {
    packages.push({
      id: `anthropic-${plugin.name}`,
      name: `${plugin.name} (Anthropic)`,
      description: plugin.description,
      category: "web-dev" as const,
      skillCount: plugin.skills.length,
      repo: "anthropics/skills",
      repoUrl: "https://github.com/anthropics/skills",
      status: "published" as const,
      tags: plugin.skills.map((s) => s.replace("./skills/", "")),
      publisher: "anthropic" as Publisher,
      updatedAt: repoMeta.updated_at,
      skillsPath: "skills",
    });
  }

  return packages;
}

/**
 * Fetch all packages from all sources.
 * Returns cached data if available, fetches fresh data in background.
 */
export async function fetchRegistry(): Promise<RegistryPackage[]> {
  // Return cache if fresh
  const cached = getCached();
  if (cached) return cached;

  try {
    const [openaec, anthropic] = await Promise.allSettled([
      fetchOpenAECPackages(),
      fetchAnthropicPackages(),
    ]);

    const packages: RegistryPackage[] = [
      ...(openaec.status === "fulfilled" ? openaec.value : []),
      ...(anthropic.status === "fulfilled" ? anthropic.value : []),
    ];

    if (packages.length > 0) {
      setCache(packages);
      return packages;
    }
  } catch {
    // Network error — fall through to hardcoded
  }

  // Fallback: convert hardcoded packages to RegistryPackage format
  return hardcodedPackages.map((p) => ({
    ...p,
    publisher: "openaec" as Publisher,
    repoUrl: p.repo ? `https://github.com/${p.repo}` : "",
    updatedAt: "",
    skillsPath: "skills/source",
  }));
}

/**
 * Get hardcoded packages as RegistryPackage (instant, for initial render).
 */
export function getHardcodedRegistry(): RegistryPackage[] {
  return hardcodedPackages.map((p) => ({
    ...p,
    publisher: "openaec" as Publisher,
    repoUrl: p.repo ? `https://github.com/${p.repo}` : "",
    updatedAt: "",
    skillsPath: "skills/source",
  }));
}

/**
 * Fetch registry via Rust backend (preferred — no CORS, disk cache, higher rate limits)
 */
export async function fetchRegistryBackend(forceRefresh = false): Promise<RegistryPackage[]> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const packages = await invoke<any[]>("fetch_registry", { forceRefresh });
    return packages.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category as SkillPackage["category"],
      skillCount: p.skill_count,
      repo: p.repo,
      repoUrl: p.repo_url,
      status: p.status as SkillPackage["status"],
      tags: p.tags,
      publisher: p.publisher as Publisher,
      updatedAt: p.updated_at,
      skillsPath: p.skills_path,
    }));
  } catch {
    // Fallback to frontend fetch
    return fetchRegistry();
  }
}

/**
 * Get cached registry from Rust backend (instant, for offline/startup)
 */
export async function getCachedRegistryBackend(): Promise<RegistryPackage[]> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const packages = await invoke<any[]>("get_cached_registry");
    return packages.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category as SkillPackage["category"],
      skillCount: p.skill_count,
      repo: p.repo,
      repoUrl: p.repo_url,
      status: p.status as SkillPackage["status"],
      tags: p.tags,
      publisher: p.publisher as Publisher,
      updatedAt: p.updated_at,
      skillsPath: p.skills_path,
    }));
  } catch {
    return getHardcodedRegistry();
  }
}

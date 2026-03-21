export interface SkillInfo {
  name: string;
  description: string;
  path: string;
  has_frontmatter: boolean;
  has_description: boolean;
  has_references: boolean;
  has_scripts: boolean;
  has_examples: boolean;
  line_count: number;
  quality_score: number;
  issues: string[];
}

export interface PackageScanResult {
  package_id: string;
  total_skills: number;
  valid_skills: number;
  average_quality: number;
  skills: SkillInfo[];
}

export function qualityLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Basic";
  return "Minimal";
}

export function qualityColor(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--accent)";
  if (score >= 40) return "var(--warm-gold)";
  return "var(--error)";
}

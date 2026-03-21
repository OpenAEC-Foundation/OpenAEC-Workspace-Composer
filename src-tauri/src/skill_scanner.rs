use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillInfo {
    pub name: String,
    pub description: String,
    pub path: String,
    pub has_frontmatter: bool,
    pub has_description: bool,
    pub has_references: bool,
    pub has_scripts: bool,
    pub has_examples: bool,
    pub line_count: u32,
    pub quality_score: u32,
    pub issues: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageScanResult {
    pub package_id: String,
    pub total_skills: u32,
    pub valid_skills: u32,
    pub average_quality: u32,
    pub skills: Vec<SkillInfo>,
}

/// Parse YAML frontmatter from a SKILL.md file.
/// Returns (name, description) if frontmatter is present.
fn parse_frontmatter(content: &str) -> Option<(String, String)> {
    if !content.starts_with("---") {
        return None;
    }
    let end = content[3..].find("---")?;
    let frontmatter = &content[3..3 + end];

    let mut name = String::new();
    let mut description = String::new();

    for line in frontmatter.lines() {
        let line = line.trim();
        if let Some(rest) = line.strip_prefix("name:") {
            name = rest.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(rest) = line.strip_prefix("description:") {
            let val = rest.trim();
            // Skip multiline YAML indicators
            if !val.starts_with('>') && !val.starts_with('|') {
                description = val.trim_matches('"').trim_matches('\'').to_string();
            }
        }
    }

    Some((name, description))
}

/// Scan a single skill directory containing a SKILL.md file and return quality info.
fn scan_skill(skill_dir: &Path) -> Option<SkillInfo> {
    let skill_md = skill_dir.join("SKILL.md");
    if !skill_md.exists() {
        return None;
    }

    let content = fs::read_to_string(&skill_md).ok()?;
    let line_count = content.lines().count() as u32;

    let (name, description) = parse_frontmatter(&content).unwrap_or_else(|| {
        let dir_name = skill_dir
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        (dir_name, String::new())
    });

    let has_frontmatter = content.starts_with("---");
    let has_description = !description.is_empty();
    let has_references =
        skill_dir.join("reference.md").exists() || skill_dir.join("references").is_dir();
    let has_scripts = skill_dir.join("scripts").is_dir();
    let has_examples =
        skill_dir.join("examples").is_dir() || skill_dir.join("examples.md").exists();

    let mut issues = Vec::new();
    let mut score = 0u32;

    // Scoring: max 100
    if has_frontmatter {
        score += 20;
    } else {
        issues.push("Missing YAML frontmatter".to_string());
    }

    if has_description {
        score += 25;
    } else {
        issues.push("Missing description in frontmatter".to_string());
    }

    if line_count >= 10 {
        score += 20;
    } else if line_count >= 5 {
        score += 10;
        issues.push("Skill content is very short".to_string());
    } else {
        issues.push("Skill content is minimal (< 5 lines)".to_string());
    }

    if has_references {
        score += 15;
    }

    if has_examples {
        score += 10;
    }

    if has_scripts {
        score += 10;
    }

    // Bonus for structured sections (headers)
    let content_lower = content.to_lowercase();
    if content_lower.contains("## ") || content_lower.contains("### ") {
        score = score.min(95) + 5;
    }

    Some(SkillInfo {
        name: if name.is_empty() {
            skill_dir
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        } else {
            name
        },
        description,
        path: skill_dir.to_string_lossy().to_string(),
        has_frontmatter,
        has_description,
        has_references,
        has_scripts,
        has_examples,
        line_count,
        quality_score: score.min(100),
        issues,
    })
}

/// Recursively scan a directory tree for skill directories (those containing SKILL.md).
fn scan_directory_recursive(dir: &Path, skills: &mut Vec<SkillInfo>, depth: u32) {
    if depth > 4 {
        return;
    }

    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_dir() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }
            if path.join("SKILL.md").exists() {
                if let Some(skill) = scan_skill(&path) {
                    skills.push(skill);
                }
            } else {
                scan_directory_recursive(&path, skills, depth + 1);
            }
        }
    }
}

/// Scan an entire skill package directory for all SKILL.md files.
pub fn scan_package(package_dir: &Path, package_id: &str) -> PackageScanResult {
    let mut skills = Vec::new();

    // Look for skills in common locations:
    // 1. skills/source/<group>/<skill>/SKILL.md (OpenAEC format)
    // 2. skills/<skill>/SKILL.md (Anthropic format)
    // 3. <skill>/SKILL.md (flat format)
    let search_dirs = [
        package_dir.join("skills").join("source"),
        package_dir.join("skills"),
        package_dir.to_path_buf(),
    ];

    for search_dir in &search_dirs {
        if !search_dir.is_dir() {
            continue;
        }
        scan_directory_recursive(search_dir, &mut skills, 0);
        if !skills.is_empty() {
            break; // Use the first format that has skills
        }
    }

    let total = skills.len() as u32;
    let valid = skills
        .iter()
        .filter(|s| s.has_frontmatter && s.has_description)
        .count() as u32;
    let avg_quality = if total > 0 {
        skills.iter().map(|s| s.quality_score).sum::<u32>() / total
    } else {
        0
    };

    PackageScanResult {
        package_id: package_id.to_string(),
        total_skills: total,
        valid_skills: valid,
        average_quality: avg_quality,
        skills,
    }
}

/// Tauri command: scan a local skill package directory and return quality results.
#[tauri::command]
pub fn scan_skill_package(path: String) -> Result<PackageScanResult, String> {
    let dir = Path::new(&path);
    if !dir.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let package_id = dir
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    Ok(scan_package(dir, &package_id))
}

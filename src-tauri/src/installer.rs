use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallProgress {
    pub step: String,
    pub current: u32,
    pub total: u32,
    pub percent: u32,
    pub detail: String,
}

/// A single file or directory that would conflict during install
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Conflict {
    pub path: String,
    pub kind: String,        // "file" | "directory" | "skills"
    pub description: String,
    pub existing_size: Option<u64>,
}

/// Result of a pre-install conflict scan
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictScanResult {
    pub conflicts: Vec<Conflict>,
    pub has_conflicts: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallRequest {
    pub workflow_type: String,
    pub path: String,
    pub name: String,
    pub effort: String,
    pub packages: Option<Vec<String>>,
    pub source_version: Option<String>,
    pub target_version: Option<String>,
    pub target_repo: Option<String>,
    pub init_git: Option<bool>,
    pub open_vscode: Option<bool>,
    pub core_files: Option<Vec<String>>,
    pub permissions: Option<Vec<String>>,
    /// How to handle conflicts: "skip" | "overwrite" | "merge"
    pub conflict_strategy: Option<String>,
    /// GPU server sync: create Mutagen session after install
    pub gpu_sync: Option<GpuSyncConfig>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuSyncConfig {
    pub enabled: bool,
    pub ssh_target: String,
    pub remote_base_path: String, // e.g. /home/freek/workspaces
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub workspace_file: String,
    pub files_created: Vec<String>,
    pub files_skipped: Vec<String>,
    pub packages_installed: Vec<String>,
    pub skills_total: u32,
}

fn emit_progress(app: &AppHandle, step: &str, current: u32, total: u32, detail: &str) {
    let progress = InstallProgress {
        step: step.to_string(),
        current,
        total,
        percent: if total > 0 { (current * 100) / total } else { 0 },
        detail: detail.to_string(),
    };
    let _ = app.emit("install-progress", progress);
}

/// Map package ID to the repo directory name on disk
fn package_repo_dir(package_id: &str) -> &str {
    match package_id {
        "blender-bonsai" => "Blender-Bonsai-ifcOpenshell-Sverchok-Claude-Skill-Package",
        "frappe" | "erpnext" => "ERPNext_Anthropic_Claude_Development_Skill_Package",
        "open-pdf-studio" => "Open-PDF-Studio-Claude-Skill-Package",
        "tauri-2" => "Tauri-2-Claude-Skill-Package",
        "react" => "React-Claude-Skill-Package",
        "solidjs" => "SolidJS-Claude-Skill-Package",
        "nextcloud" => "Nextcloud-Claude-Skill-Package",
        "vite" => "Vite-Claude-Skill-Package",
        "docker" => "Docker-Claude-Skill-Package",
        "n8n" => "n8n-Claude-Skill-Package",
        "drawio" => "Draw.io-Claude-Skill-Package",
        "pdfjs" => "PDFjs-Claude-Skill-Package",
        "pdf-lib" => "pdf-lib-Claude-Skill-Package",
        "fluent-i18n" => "Fluent-i18n-Claude-Skill-Package",
        "threejs" | "three.js" => "Three.js-Claude-Skill-Package",
        "qgis" => "QGIS-Claude-Skill-Package",
        "thatopen" => "ThatOpen-Claude-Skill-Package",
        "speckle" => "Speckle-Claude-Skill-Package",
        "cross-tech" | "cross-tech-aec" => "Cross-Tech-AEC-Claude-Skill-Package",
        _ => package_id,
    }
}

/// Skill info returned from scanning a package
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub path: String,
}

/// List all skills inside a package. Tries local first, falls back to GitHub API.
#[tauri::command]
pub async fn list_package_skills(package_id: String) -> Result<Vec<SkillInfo>, String> {
    // Strategy 1: Local scan
    let repo_dir_name = package_repo_dir(&package_id);
    let home = std::env::var("USERPROFILE").unwrap_or_default();
    let base = std::path::PathBuf::from(&home)
        .join("Documents")
        .join("GitHub")
        .join(repo_dir_name);

    let skills_dir = if base.join("skills").join("source").exists() {
        Some(base.join("skills").join("source"))
    } else if base.join("skills").exists() {
        Some(base.join("skills"))
    } else {
        None
    };

    if let Some(dir) = skills_dir {
        let mut skills = Vec::new();
        scan_skills_recursive(&dir, "", &mut skills);
        skills.sort_by(|a, b| a.id.cmp(&b.id));
        return Ok(skills);
    }

    // Strategy 2: GitHub API tree scan (known packages)
    if let Some(repo_url) = package_repo_url(&package_id) {
        let repo_path = repo_url
            .trim_end_matches(".git")
            .replace("https://github.com/", "");
        return fetch_skills_from_github(&repo_path).await;
    }

    // Strategy 3: Try the package_id as a GitHub path directly (custom repos)
    // e.g. "Claude-Skills-Org/skills-main" or "claude-skills-org-skills-main"
    if package_id.contains('/') || package_id.contains("--") {
        let repo_path = package_id.replace("--", "/");
        return fetch_skills_from_github(&repo_path).await;
    }

    Err(format!("Package {} not found locally and no GitHub repo configured", package_id))
}

/// Fetch skill directories from GitHub API using the git tree endpoint
async fn fetch_skills_from_github(repo: &str) -> Result<Vec<SkillInfo>, String> {
    let tree_url = format!(
        "https://api.github.com/repos/{}/git/trees/main?recursive=1",
        repo
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&tree_url)
        .header("Accept", "application/vnd.github.v3+json")
        .header("User-Agent", "OpenAEC-Workspace-Composer")
        .send()
        .await
        .map_err(|e| format!("GitHub API request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API returned {}", response.status()));
    }

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse GitHub response: {}", e))?;

    let tree = body["tree"]
        .as_array()
        .ok_or("Invalid GitHub tree response")?;

    // Find all SKILL.md files in the tree (any depth, any structure)
    let mut skills = Vec::new();
    for entry in tree {
        let path = entry["path"].as_str().unwrap_or("");
        if !path.ends_with("SKILL.md") {
            continue;
        }

        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() < 2 {
            continue; // Root SKILL.md, skip
        }

        let skill_name = parts[parts.len() - 2]; // directory containing SKILL.md

        // Skip meta directories
        if skill_name == "source" || skill_name == "skills" || skill_name == ".claude-plugin" || skill_name == "template-skill" {
            continue;
        }

        // Category: look 2 levels up if available, otherwise empty
        let category = if parts.len() >= 3 {
            let parent = parts[parts.len() - 3];
            // Don't use "source", "skills", or root as category
            if parent == "source" || parent == "skills" { "" } else { parent }
        } else {
            ""
        };

        skills.push(SkillInfo {
            id: skill_name.to_string(),
            name: skill_name.replace('-', " "),
            description: String::new(),
            category: category.to_string(),
            path: path.to_string(),
        });
    }

    skills.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(skills)
}

fn scan_skills_recursive(dir: &std::path::Path, category: &str, skills: &mut Vec<SkillInfo>) {
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.') || name == "references" {
            continue;
        }

        if path.is_dir() {
            let skill_md = path.join("SKILL.md");
            if skill_md.exists() {
                // This is a skill directory
                let (desc, parsed_name) = parse_skill_md_header(&skill_md);
                skills.push(SkillInfo {
                    id: name.clone(),
                    name: parsed_name.unwrap_or_else(|| name.clone()),
                    description: desc,
                    category: category.to_string(),
                    path: path.to_string_lossy().to_string(),
                });
            } else {
                // This is a category directory, recurse
                scan_skills_recursive(&path, &name, skills);
            }
        }
    }
}

fn parse_skill_md_header(path: &std::path::Path) -> (String, Option<String>) {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return (String::new(), None),
    };

    let mut name = None;
    let mut description = String::new();
    let mut in_frontmatter = false;

    for line in content.lines().take(20) {
        let trimmed = line.trim();
        if trimmed == "---" {
            in_frontmatter = !in_frontmatter;
            continue;
        }
        if in_frontmatter {
            if trimmed.starts_with("name:") {
                name = Some(trimmed.trim_start_matches("name:").trim().to_string());
            }
            if trimmed.starts_with("description:") {
                let desc = trimmed.trim_start_matches("description:").trim();
                if desc.starts_with('>') || desc.starts_with('|') {
                    continue; // multiline, skip
                }
                description = desc.trim_matches('"').trim_matches('\'').to_string();
            }
        }
    }

    // Truncate description to first sentence
    if let Some(dot_pos) = description.find(". ") {
        description = description[..=dot_pos].to_string();
    }
    if description.len() > 120 {
        description = format!("{}...", &description[..117]);
    }

    (description, name)
}

/// Map package ID to GitHub repo URL
fn package_repo_url(package_id: &str) -> Option<String> {
    let dir = package_repo_dir(package_id);
    if dir == package_id {
        return None; // Unknown package
    }
    Some(format!("https://github.com/OpenAEC-Foundation/{}.git", dir))
}

/// Find the skill source directory for a package.
/// First checks local GitHub directory, then falls back to git clone.
fn resolve_skill_source(
    package_id: &str,
    _app: &AppHandle,
) -> Result<PathBuf, String> {
    let repo_dir_name = package_repo_dir(package_id);

    // Strategy 1: Check if repo is already cloned locally in Documents/GitHub/
    let home = std::env::var("USERPROFILE").unwrap_or_default();
    let local_repo = PathBuf::from(&home)
        .join("Documents")
        .join("GitHub")
        .join(&repo_dir_name);

    let skills_source = local_repo.join("skills").join("source");
    if skills_source.exists() {
        eprintln!("[install] {} → found local at {}", package_id, skills_source.display());
        return Ok(skills_source);
    }

    let skills_flat = local_repo.join("skills");
    if skills_flat.exists() && skills_flat.is_dir() {
        eprintln!("[install] {} → found local at {}", package_id, skills_flat.display());
        return Ok(skills_flat);
    }

    // Strategy 2: Git clone to temp directory
    eprintln!("[install] {} → not found locally, cloning from GitHub...", package_id);
    let repo_url = package_repo_url(package_id)
        .ok_or_else(|| format!("Unknown package: {}", package_id))?;

    let temp_dir = std::env::temp_dir().join("openaec-skills");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let clone_target = temp_dir.join(repo_dir_name);

    if clone_target.exists() {
        // Already cloned, try pull
        let _ = Command::new("git")
            .args(["pull", "--quiet"])
            .current_dir(&clone_target)
            .output();
    } else {
        let output = Command::new("git")
            .args(["clone", "--depth", "1", &repo_url, clone_target.to_str().unwrap_or("")])
            .output()
            .map_err(|e| format!("Git clone failed: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Git clone failed for {}: {}", package_id, stderr));
        }
    }

    let cloned_source = clone_target.join("skills").join("source");
    if cloned_source.exists() {
        return Ok(cloned_source);
    }

    let cloned_flat = clone_target.join("skills");
    if cloned_flat.exists() {
        return Ok(cloned_flat);
    }

    Err(format!("No skills directory found for {}", package_id))
}

/// Recursively copy a directory, respecting conflict strategy.
/// strategy: "overwrite" (default), "skip" (skip existing), "merge" (skip existing files, recurse dirs)
fn copy_dir_recursive(src: &Path, dst: &Path, strategy: &str, skipped: &mut Vec<String>) -> Result<u32, String> {
    fs::create_dir_all(dst).map_err(|e| format!("mkdir failed: {}", e))?;
    let mut count = 0u32;

    let entries = fs::read_dir(src).map_err(|e| format!("read_dir failed: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let src_path = entry.path();
        let file_name = entry.file_name();
        let dst_path = dst.join(&file_name);

        if src_path.is_dir() {
            if file_name == ".git" {
                continue;
            }
            count += copy_dir_recursive(&src_path, &dst_path, strategy, skipped)?;
        } else {
            if dst_path.exists() && strategy != "overwrite" {
                skipped.push(dst_path.to_string_lossy().to_string());
                continue;
            }
            fs::copy(&src_path, &dst_path).map_err(|e| format!("copy failed: {}", e))?;
            if file_name == "SKILL.md" {
                count += 1;
            }
        }
    }

    Ok(count)
}

/// Install skills from a package into .claude/skills/{package-id}--{skill-name}/
/// Each skill directory (containing a SKILL.md) gets its own namespaced folder
/// to follow the official Claude Code skill format and avoid conflicts.
fn install_skills_to_workspace(
    package_id: &str,
    skills_source: &Path,
    workspace_path: &Path,
    strategy: &str,
    skipped: &mut Vec<String>,
) -> Result<u32, String> {
    let skills_base = workspace_path.join(".claude").join("skills");
    fs::create_dir_all(&skills_base)
        .map_err(|e| format!("Failed to create .claude/skills/: {}", e))?;

    // Discover all skill directories (dirs containing SKILL.md)
    let mut skill_dirs = Vec::new();
    find_skill_dirs(skills_source, &mut skill_dirs, 0);

    if skill_dirs.is_empty() {
        // Fallback: copy entire source as a single skill directory
        let target = skills_base.join(package_id);
        return copy_dir_recursive(skills_source, &target, strategy, skipped);
    }

    let mut total_count = 0u32;
    for skill_dir in &skill_dirs {
        let skill_name = skill_dir
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        // Target: .claude/skills/<package-id>--<skill-name>/
        let target_name = format!("{}--{}", package_id, skill_name);
        let target = skills_base.join(&target_name);

        // For "skip" strategy, skip if target already exists
        if target.exists() && strategy == "skip" {
            skipped.push(format!(".claude/skills/{}/", target_name));
            continue;
        }

        match copy_dir_recursive(skill_dir, &target, strategy, skipped) {
            Ok(count) => total_count += count,
            Err(e) => {
                eprintln!(
                    "[install] Warning: failed to copy skill {}: {}",
                    target_name, e
                );
            }
        }
    }

    Ok(total_count)
}

/// Recursively find all directories containing a SKILL.md file.
fn find_skill_dirs(dir: &Path, results: &mut Vec<PathBuf>, depth: u32) {
    if depth > 5 {
        return;
    }
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if !path.is_dir() || name.starts_with('.') || name == "references" {
            continue;
        }
        if path.join("SKILL.md").exists() {
            results.push(path);
        } else {
            find_skill_dirs(&path, results, depth + 1);
        }
    }
}

/// Scan workspace for files that would conflict with installation
#[tauri::command]
pub async fn scan_conflicts(
    path: String,
    packages: Vec<String>,
    name: String,
) -> Result<ConflictScanResult, String> {
    let workspace_path = PathBuf::from(&path);
    let mut conflicts = Vec::new();

    if !workspace_path.exists() {
        return Ok(ConflictScanResult { conflicts, has_conflicts: false });
    }

    // Check CLAUDE.md
    let claude_md = workspace_path.join("CLAUDE.md");
    if claude_md.exists() {
        let size = fs::metadata(&claude_md).map(|m| m.len()).ok();
        conflicts.push(Conflict {
            path: "CLAUDE.md".to_string(),
            kind: "file".to_string(),
            description: "Project configuration file already exists".to_string(),
            existing_size: size,
        });
    }

    // Check .claude/settings.local.json
    let settings = workspace_path.join(".claude").join("settings.local.json");
    if settings.exists() {
        let size = fs::metadata(&settings).map(|m| m.len()).ok();
        conflicts.push(Conflict {
            path: ".claude/settings.local.json".to_string(),
            kind: "file".to_string(),
            description: "Claude settings already configured".to_string(),
            existing_size: size,
        });
    }

    // Check .code-workspace file
    let ws_name = if name.is_empty() {
        workspace_path.file_name().unwrap_or_default().to_string_lossy().to_string()
    } else {
        name
    };
    let ws_file = format!("{}.code-workspace", ws_name.to_lowercase().replace(' ', "-"));
    let ws_path = workspace_path.join(&ws_file);
    if ws_path.exists() {
        let size = fs::metadata(&ws_path).map(|m| m.len()).ok();
        conflicts.push(Conflict {
            path: ws_file,
            kind: "file".to_string(),
            description: "VS Code workspace file already exists".to_string(),
            existing_size: size,
        });
    }

    // Check skill directories (new format: <package-id>--<skill-name>/)
    let skills_dir = workspace_path.join(".claude").join("skills");
    if skills_dir.exists() {
        for pkg_id in &packages {
            let prefix = format!("{}--", pkg_id);
            if let Ok(entries) = fs::read_dir(&skills_dir) {
                for entry in entries.flatten() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    if name.starts_with(&prefix) && entry.path().is_dir() {
                        let file_count = count_files_recursive(&entry.path());
                        conflicts.push(Conflict {
                            path: format!(".claude/skills/{}/", name),
                            kind: "skills".to_string(),
                            description: format!("Skill directory exists ({} files)", file_count),
                            existing_size: None,
                        });
                    }
                }
            }
            // Also check legacy format (just package-id)
            let legacy_dir = skills_dir.join(pkg_id);
            if legacy_dir.exists() {
                let skill_count = count_files_recursive(&legacy_dir);
                conflicts.push(Conflict {
                    path: format!(".claude/skills/{}/", pkg_id),
                    kind: "skills".to_string(),
                    description: format!("Legacy skills directory exists ({} files)", skill_count),
                    existing_size: None,
                });
            }
        }
    }

    // Check .gitignore
    let gitignore = workspace_path.join(".gitignore");
    if gitignore.exists() {
        let size = fs::metadata(&gitignore).map(|m| m.len()).ok();
        conflicts.push(Conflict {
            path: ".gitignore".to_string(),
            kind: "file".to_string(),
            description: "Git ignore rules already exist".to_string(),
            existing_size: size,
        });
    }

    let has_conflicts = !conflicts.is_empty();
    Ok(ConflictScanResult { conflicts, has_conflicts })
}

/// Count files recursively in a directory
fn count_files_recursive(dir: &Path) -> u32 {
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                count += count_files_recursive(&path);
            } else {
                count += 1;
            }
        }
    }
    count
}

/// Write a file respecting conflict strategy. Returns true if written, false if skipped.
fn write_with_strategy(path: &Path, content: &str, strategy: &str) -> Result<bool, String> {
    if path.exists() && strategy == "skip" {
        return Ok(false);
    }
    // "overwrite" and "merge" both write config files (merge only skips skills)
    fs::write(path, content).map_err(|e| format!("Failed to write {}: {}", path.display(), e))?;
    Ok(true)
}

#[tauri::command]
pub async fn install_workspace(
    app: AppHandle,
    request: InstallRequest,
) -> Result<InstallResult, String> {
    let workspace_path = PathBuf::from(&request.path);
    let packages = request.packages.unwrap_or_default();
    let permissions = request.permissions.unwrap_or_default();
    let strategy = request.conflict_strategy.as_deref().unwrap_or("overwrite");
    let total_steps = 4 + packages.len() as u32;

    // Step 1: Create workspace directory
    emit_progress(&app, "Preparing workspace", 1, total_steps, "Creating directories...");
    fs::create_dir_all(&workspace_path)
        .map_err(|e| format!("Failed to create workspace: {}", e))?;

    let claude_skills_dir = workspace_path.join(".claude").join("skills");
    fs::create_dir_all(&claude_skills_dir)
        .map_err(|e| format!("Failed to create .claude/skills/: {}", e))?;

    let mut files_created = Vec::new();
    let mut files_skipped = Vec::new();
    let mut packages_installed = Vec::new();
    let mut skills_total = 0u32;

    // Step 2: Install each skill package
    for (i, pkg_id) in packages.iter().enumerate() {
        let step = 2 + i as u32;
        emit_progress(
            &app,
            &format!("Installing {}", pkg_id),
            step,
            total_steps,
            &format!("Resolving {}...", pkg_id),
        );

        // Note: per-skill skip logic is handled inside install_skills_to_workspace

        match resolve_skill_source(pkg_id, &app) {
            Ok(source_dir) => {
                let method = if source_dir.to_string_lossy().contains("Documents") {
                    "local"
                } else {
                    "cloned"
                };
                emit_progress(
                    &app,
                    &format!("Installing {}", pkg_id),
                    step,
                    total_steps,
                    &format!("Installing {} ({}) → .claude/skills/{}--*/", pkg_id, method, pkg_id),
                );

                let mut pkg_skipped = Vec::new();
                match install_skills_to_workspace(pkg_id, &source_dir, &workspace_path, strategy, &mut pkg_skipped) {
                    Ok(count) => {
                        skills_total += count;
                        packages_installed.push(pkg_id.clone());
                        files_created.push(format!(".claude/skills/{}/", pkg_id));
                        if !pkg_skipped.is_empty() {
                            emit_progress(
                                &app,
                                &format!("Installing {}", pkg_id),
                                step,
                                total_steps,
                                &format!("{}: {} new, {} skipped", pkg_id, count, pkg_skipped.len()),
                            );
                        }
                        files_skipped.extend(pkg_skipped);
                    }
                    Err(e) => {
                        emit_progress(
                            &app,
                            &format!("Warning: {}", pkg_id),
                            step,
                            total_steps,
                            &format!("Copy failed: {}", e),
                        );
                    }
                }
            }
            Err(e) => {
                emit_progress(
                    &app,
                    &format!("Warning: {}", pkg_id),
                    step,
                    total_steps,
                    &format!("Not found: {}", e),
                );
            }
        }
    }

    // Step 3: Generate CLAUDE.md
    let claude_step = 2 + packages.len() as u32;
    emit_progress(&app, "Generating CLAUDE.md", claude_step, total_steps, "Writing project configuration...");
    match generate_claude_md(&workspace_path, &request.name, &packages_installed, &request.effort, strategy) {
        Ok(Some(f)) => files_created.push(f),
        Ok(None) => files_skipped.push("CLAUDE.md".to_string()),
        Err(_) => {}
    }

    // Step 4: Generate .claude/settings.local.json
    emit_progress(&app, "Generating settings", claude_step + 1, total_steps, "Writing .claude/settings.local.json...");
    match generate_settings_json(&workspace_path, &permissions, strategy) {
        Ok(Some(f)) => files_created.push(f),
        Ok(None) => files_skipped.push(".claude/settings.local.json".to_string()),
        Err(_) => {}
    }

    // Step 5: Generate .code-workspace file
    emit_progress(&app, "Generating workspace file", claude_step + 2, total_steps, "Writing .code-workspace...");
    match generate_workspace_file(&workspace_path, &request.name, &packages_installed, strategy) {
        Ok(Some(f)) => {
            files_created.push(f.clone());
        }
        Ok(None) => {
            // skipped, but we still need a workspace_file name for the result
        }
        Err(e) => return Err(e),
    }

    // Generate .gitignore (always skip-if-exists)
    if let Ok(Some(g)) = generate_gitignore(&workspace_path) {
        files_created.push(g);
    }

    // Optional: init git
    if request.init_git.unwrap_or(false) {
        let _ = Command::new("git")
            .args(["init"])
            .current_dir(&workspace_path)
            .output();
    }

    // Optional: open in VS Code
    let ws_name = if request.name.is_empty() {
        workspace_path.file_name().unwrap_or_default().to_string_lossy().to_string()
    } else {
        request.name.clone()
    };
    let workspace_file = format!("{}.code-workspace", ws_name.to_lowercase().replace(' ', "-"));

    // GPU server sync: create Mutagen session if configured
    if let Some(ref gpu) = request.gpu_sync {
        if gpu.enabled && !gpu.ssh_target.is_empty() {
            emit_progress(&app, "GPU Sync", total_steps - 1, total_steps,
                &format!("Setting up sync to {}...", gpu.ssh_target));

            let project_dir_name = workspace_path.file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let remote_path = format!("{}/{}", gpu.remote_base_path.trim_end_matches('/'), project_dir_name);

            // Create remote directory via SSH
            let _ = Command::new("ssh")
                .args(["-o", "BatchMode=yes", "-o", "ConnectTimeout=10",
                       &gpu.ssh_target, &format!("mkdir -p {}", remote_path)])
                .output();

            // Create Mutagen sync session
            let mutagen_path = crate::gpu_server::mutagen::find_mutagen_path();
            let session_name = format!("openaec-{}", project_dir_name.to_lowercase().replace(' ', "-"));
            let remote_target = format!("{}:{}", gpu.ssh_target, remote_path);

            let sync_result = Command::new(&mutagen_path)
                .args(["sync", "create",
                       &workspace_path.to_string_lossy(),
                       &remote_target,
                       &format!("--name={}", session_name),
                       "--ignore-vcs",
                       "--default-directory-mode=0755",
                       "--default-file-mode=0644"])
                .output();

            match sync_result {
                Ok(output) if output.status.success() => {
                    files_created.push(format!("GPU sync: {} -> {}", project_dir_name, remote_path));
                }
                Ok(output) => {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    emit_progress(&app, "GPU Sync Warning", total_steps - 1, total_steps,
                        &format!("Sync setup failed: {}", stderr.lines().next().unwrap_or("")));
                }
                Err(e) => {
                    emit_progress(&app, "GPU Sync Warning", total_steps - 1, total_steps,
                        &format!("Mutagen not available: {}", e));
                }
            }
        }
    }

    // Open in VS Code (last step, after everything is ready)
    if request.open_vscode.unwrap_or(false) {
        let ws_file = workspace_path.join(&workspace_file);
        emit_progress(&app, "Opening VS Code", total_steps, total_steps, "Launching workspace...");
        let _ = shell_spawn("code", &[&ws_file.to_string_lossy()]);
    }

    // Save to recent workspaces
    let _ = crate::workspace::save_recent_workspace(request.path.clone());

    let skipped_count = files_skipped.len();
    emit_progress(&app, "Complete", total_steps, total_steps, &format!(
        "Done! {} skills from {} packages. {} files skipped.",
        skills_total,
        packages_installed.len(),
        skipped_count,
    ));

    Ok(InstallResult {
        workspace_file,
        files_created,
        files_skipped,
        packages_installed,
        skills_total,
    })
}

fn generate_claude_md(
    workspace_path: &Path,
    name: &str,
    packages: &[String],
    effort: &str,
    strategy: &str,
) -> Result<Option<String>, String> {
    let file_path = workspace_path.join("CLAUDE.md");

    // For "merge" strategy: append skill package references to existing CLAUDE.md
    if file_path.exists() && strategy == "merge" {
        let existing = fs::read_to_string(&file_path).unwrap_or_default();
        if !packages.is_empty() {
            let mut append = String::from("\n\n## Installed Skill Packages (OpenAEC)\n\n");
            append.push_str("Skills installed by OpenAEC Workspace Composer in `.claude/skills/`.\n\n");
            for pkg in packages {
                if !existing.contains(&format!(".claude/skills/{}--", pkg)) {
                    append.push_str(&format!("- **{}** — `.claude/skills/{}--*/`\n", pkg, pkg));
                }
            }
            let merged = format!("{}{}", existing.trim_end(), append);
            fs::write(&file_path, merged)
                .map_err(|e| format!("Failed to write CLAUDE.md: {}", e))?;
        }
        return Ok(Some("CLAUDE.md (merged)".to_string()));
    }

    if file_path.exists() && strategy == "skip" {
        return Ok(None);
    }

    let ws_name = if name.is_empty() { "My Project" } else { name };

    // Build the stack description from installed packages
    let stack_list: Vec<String> = packages.iter().map(|p| {
        p.replace('-', " ")
         .split_whitespace()
         .map(|w| {
             let mut c = w.chars();
             match c.next() {
                 None => String::new(),
                 Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
             }
         })
         .collect::<Vec<_>>()
         .join(" ")
    }).collect();

    let mut content = String::new();

    // Header
    content.push_str(&format!("# {}\n\n", ws_name));

    // What this workspace is for
    content.push_str("## What to build\n\n");
    content.push_str("Describe your project here. Claude will use this context to understand what you're building and make better decisions.\n\n");
    content.push_str(&format!("**Project**: {}\n", ws_name));
    content.push_str("**Goal**: [Describe what you want to build]\n");
    content.push_str("**Target users**: [Who is this for?]\n\n");

    // Available stack
    if !stack_list.is_empty() {
        content.push_str("## Available Stack\n\n");
        content.push_str("This workspace has skill packages installed that give Claude deep knowledge of:\n\n");
        for s in &stack_list {
            content.push_str(&format!("- {}\n", s));
        }
        content.push_str("\nClaude automatically loads the relevant skills based on what you're working on. You don't need to do anything special.\n\n");
    }

    // How to work
    content.push_str("## How to work\n\n");
    content.push_str("- Tell Claude what you want to build. Be specific about functionality, not implementation.\n");
    content.push_str("- Claude knows your stack. Ask it to use the installed technologies.\n");
    content.push_str("- Start simple. Get something working first, then iterate.\n");
    content.push_str("- Review what Claude builds. Ask questions if something is unclear.\n\n");

    // Conventions
    content.push_str("## Conventions\n\n");
    content.push_str("- Documentation language: Nederlands\n");
    content.push_str("- Code and configs: English\n");
    content.push_str("- Commit style: Conventional Commits (feat:, fix:, docs:, refactor:, test:, chore:)\n");

    // Protocols for high effort
    if effort == "high" {
        content.push_str("\n## Protocols\n\n");
        content.push_str("- Always verify before destructive operations\n");
        content.push_str("- Read files before modifying them\n");
        content.push_str("- Use dedicated tools over Bash equivalents\n");
        content.push_str("- Research before implementing. Check existing code first.\n");
    }

    // Technical reference
    if !packages.is_empty() {
        content.push_str("\n## Installed skill packages\n\n");
        content.push_str("Auto-discovered from `.claude/skills/`. Do not edit these manually.\n\n");
        for pkg in packages {
            content.push_str(&format!("- {}\n", pkg));
        }
    }

    fs::write(&file_path, &content).map_err(|e| format!("Failed to write CLAUDE.md: {}", e))?;
    Ok(Some("CLAUDE.md".to_string()))
}

fn generate_settings_json(
    workspace_path: &Path,
    permissions: &[String],
    strategy: &str,
) -> Result<Option<String>, String> {
    let claude_dir = workspace_path.join(".claude");
    fs::create_dir_all(&claude_dir).map_err(|e| format!("Failed to create .claude: {}", e))?;

    let file_path = claude_dir.join("settings.local.json");

    if file_path.exists() && (strategy == "skip" || strategy == "merge") {
        return Ok(None);
    }

    let perms: Vec<String> = if permissions.is_empty() {
        vec![
            "Bash(npm run *)".to_string(),
            "Bash(npx *)".to_string(),
            "Bash(cargo *)".to_string(),
            "Bash(git *)".to_string(),
            "Read".to_string(),
            "Write".to_string(),
            "Edit".to_string(),
            "Glob".to_string(),
            "Grep".to_string(),
            "WebFetch".to_string(),
            "WebSearch".to_string(),
            "Agent".to_string(),
        ]
    } else {
        permissions.to_vec()
    };

    let settings = serde_json::json!({
        "permissions": {
            "allow": perms
        }
    });

    let json = serde_json::to_string_pretty(&settings).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&file_path, json).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(Some(".claude/settings.local.json".to_string()))
}

fn generate_workspace_file(
    workspace_path: &Path,
    name: &str,
    packages: &[String],
    strategy: &str,
) -> Result<Option<String>, String> {
    let ws_name = if name.is_empty() {
        workspace_path.file_name().unwrap_or_default().to_string_lossy().to_string()
    } else {
        name.to_string()
    };

    let file_name = format!("{}.code-workspace", ws_name.to_lowercase().replace(' ', "-"));
    let file_path = workspace_path.join(&file_name);

    if file_path.exists() && strategy == "skip" {
        return Ok(None);
    }

    let mut folders = vec![serde_json::json!({
        "name": ws_name,
        "path": "."
    })];

    if !packages.is_empty() {
        folders.push(serde_json::json!({
            "name": "Skills (auto-discovered)",
            "path": ".claude/skills"
        }));
    }

    let workspace = serde_json::json!({
        "folders": folders,
        "settings": {
            "files.associations": {
                "CLAUDE.md": "markdown",
                "SKILL.md": "markdown"
            }
        }
    });

    let json = serde_json::to_string_pretty(&workspace).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&file_path, json).map_err(|e| format!("Failed to write workspace file: {}", e))?;
    Ok(Some(file_name))
}

fn generate_gitignore(workspace_path: &Path) -> Result<Option<String>, String> {
    let gitignore_path = workspace_path.join(".gitignore");
    if gitignore_path.exists() {
        return Ok(None);
    }

    let content = "\
node_modules/
dist/
target/
.env
*.local
PROMPTS.md
.claude/settings.local.json
";
    fs::write(&gitignore_path, content)
        .map_err(|e| format!("Failed to write .gitignore: {}", e))?;
    Ok(Some(".gitignore".to_string()))
}

/// Spawn a command, using cmd /C on Windows to handle .cmd scripts (code, npm, claude, etc.)
fn shell_spawn(cmd: &str, args: &[&str]) -> Result<std::process::Child, std::io::Error> {
    if cfg!(target_os = "windows") {
        let mut full_args = vec!["/C", cmd];
        full_args.extend_from_slice(args);
        Command::new("cmd").args(&full_args).spawn()
    } else {
        Command::new(cmd).args(args).spawn()
    }
}

#[tauri::command]
pub async fn open_in_vscode(path: String) -> Result<(), String> {
    shell_spawn("code", &[&path])
        .map_err(|e| format!("Failed to open VS Code: {}", e))?;
    Ok(())
}

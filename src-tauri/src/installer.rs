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
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub workspace_file: String,
    pub files_created: Vec<String>,
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
        "erpnext" => "ERPNext_Anthropic_Claude_Development_Skill_Package",
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

/// Recursively copy a directory, preserving structure
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<u32, String> {
    fs::create_dir_all(dst).map_err(|e| format!("mkdir failed: {}", e))?;
    let mut count = 0u32;

    let entries = fs::read_dir(src).map_err(|e| format!("read_dir failed: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let src_path = entry.path();
        let file_name = entry.file_name();
        let dst_path = dst.join(&file_name);

        if src_path.is_dir() {
            // Skip .git directories
            if file_name == ".git" {
                continue;
            }
            count += copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path).map_err(|e| format!("copy failed: {}", e))?;
            if file_name == "SKILL.md" {
                count += 1;
            }
        }
    }

    Ok(count)
}

/// Install skills from a package into .claude/skills/{package-id}/
fn install_skills_to_workspace(
    package_id: &str,
    skills_source: &Path,
    workspace_path: &Path,
) -> Result<u32, String> {
    let target = workspace_path
        .join(".claude")
        .join("skills")
        .join(package_id);

    copy_dir_recursive(skills_source, &target)
}

#[tauri::command]
pub async fn install_workspace(
    app: AppHandle,
    request: InstallRequest,
) -> Result<InstallResult, String> {
    let workspace_path = PathBuf::from(&request.path);
    let packages = request.packages.unwrap_or_default();
    let permissions = request.permissions.unwrap_or_default();
    let total_steps = 4 + packages.len() as u32;

    // Step 1: Create workspace directory
    emit_progress(&app, "Preparing workspace", 1, total_steps, "Creating directories...");
    fs::create_dir_all(&workspace_path)
        .map_err(|e| format!("Failed to create workspace: {}", e))?;

    // Create .claude/skills/ directory
    let claude_skills_dir = workspace_path.join(".claude").join("skills");
    fs::create_dir_all(&claude_skills_dir)
        .map_err(|e| format!("Failed to create .claude/skills/: {}", e))?;

    let mut files_created = Vec::new();
    let mut packages_installed = Vec::new();
    let mut skills_total = 0u32;

    // Step 2: Install each skill package into .claude/skills/
    for (i, pkg_id) in packages.iter().enumerate() {
        let step = 2 + i as u32;
        emit_progress(
            &app,
            &format!("Installing {}", pkg_id),
            step,
            total_steps,
            &format!("Resolving {}...", pkg_id),
        );

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
                    &format!("Installing {} ({}) → .claude/skills/{}/", pkg_id, method, pkg_id),
                );

                match install_skills_to_workspace(pkg_id, &source_dir, &workspace_path) {
                    Ok(count) => {
                        skills_total += count;
                        packages_installed.push(pkg_id.clone());
                        files_created.push(format!(".claude/skills/{}/", pkg_id));
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
    if let Ok(f) = generate_claude_md(&workspace_path, &request.name, &packages_installed, &request.effort) {
        files_created.push(f);
    }

    // Step 4: Generate .claude/settings.local.json
    emit_progress(&app, "Generating settings", claude_step + 1, total_steps, "Writing .claude/settings.local.json...");
    if let Ok(f) = generate_settings_json(&workspace_path, &permissions) {
        files_created.push(f);
    }

    // Step 5: Generate .code-workspace file
    emit_progress(&app, "Generating workspace file", claude_step + 2, total_steps, "Writing .code-workspace...");
    let workspace_file = generate_workspace_file(&workspace_path, &request.name, &packages_installed)?;
    files_created.push(workspace_file.clone());

    // Generate .gitignore
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
    if request.open_vscode.unwrap_or(false) {
        let ws_file = workspace_path.join(&workspace_file);
        let _ = Command::new("code")
            .arg(ws_file.to_string_lossy().to_string())
            .spawn();
    }

    // Save to recent workspaces
    let _ = crate::workspace::save_recent_workspace(request.path.clone());

    emit_progress(&app, "Complete", total_steps, total_steps, &format!(
        "Workspace ready! {} skills from {} packages installed to .claude/skills/",
        skills_total,
        packages_installed.len()
    ));

    Ok(InstallResult {
        workspace_file,
        files_created,
        packages_installed,
        skills_total,
    })
}

fn generate_claude_md(
    workspace_path: &Path,
    name: &str,
    packages: &[String],
    effort: &str,
) -> Result<String, String> {
    let ws_name = if name.is_empty() { "Workspace" } else { name };
    let mut content = format!("# {}\n\n", ws_name);
    content.push_str("## Identity\n");
    content.push_str("Project workspace configured by OpenAEC Workspace Composer.\n\n");

    if !packages.is_empty() {
        content.push_str("## Installed Skill Packages\n\n");
        content.push_str("Skills are installed in `.claude/skills/` and auto-discovered by Claude Code.\n\n");
        for pkg in packages {
            content.push_str(&format!("- **{}** — `.claude/skills/{}/`\n", pkg, pkg));
        }
        content.push('\n');
    }

    content.push_str("## Conventions\n\n");
    content.push_str("- Documentation: Nederlands\n");
    content.push_str("- Code & configs: English\n");
    content.push_str("- Conventional Commits: feat:, fix:, docs:, refactor:, test:, chore:\n");

    if effort == "high" {
        content.push_str("\n## Protocols\n\n");
        content.push_str("- P-001: Always verify before destructive operations\n");
        content.push_str("- P-002: Read files before modifying\n");
        content.push_str("- P-003: Use dedicated tools over Bash equivalents\n");
    }

    let file_path = workspace_path.join("CLAUDE.md");
    fs::write(&file_path, &content).map_err(|e| format!("Failed to write CLAUDE.md: {}", e))?;
    Ok("CLAUDE.md".to_string())
}

fn generate_settings_json(
    workspace_path: &Path,
    permissions: &[String],
) -> Result<String, String> {
    let claude_dir = workspace_path.join(".claude");
    fs::create_dir_all(&claude_dir).map_err(|e| format!("Failed to create .claude: {}", e))?;

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

    let file_path = claude_dir.join("settings.local.json");
    let json = serde_json::to_string_pretty(&settings).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&file_path, json).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(".claude/settings.local.json".to_string())
}

fn generate_workspace_file(
    workspace_path: &Path,
    name: &str,
    packages: &[String],
) -> Result<String, String> {
    let ws_name = if name.is_empty() {
        workspace_path.file_name().unwrap_or_default().to_string_lossy().to_string()
    } else {
        name.to_string()
    };

    let mut folders = vec![serde_json::json!({
        "name": ws_name,
        "path": "."
    })];

    // Add .claude/skills as a browsable folder
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

    let file_name = format!("{}.code-workspace", ws_name.to_lowercase().replace(' ', "-"));
    let file_path = workspace_path.join(&file_name);
    let json = serde_json::to_string_pretty(&workspace).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&file_path, json).map_err(|e| format!("Failed to write workspace file: {}", e))?;
    Ok(file_name)
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

#[tauri::command]
pub async fn open_in_vscode(path: String) -> Result<(), String> {
    Command::new("code")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open VS Code: {}", e))?;
    Ok(())
}

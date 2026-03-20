use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
pub struct InstallProgress {
    pub step: String,
    pub current: u32,
    pub total: u32,
    pub percent: u32,
    pub detail: String,
}

#[derive(Deserialize)]
pub struct InstallRequest {
    pub workflow_type: String,
    pub path: String,
    pub name: String,
    pub effort: String,
    pub packages: Option<Vec<String>>,
    pub source_version: Option<String>,
    pub target_version: Option<String>,
    pub target_repo: Option<String>,
    // New config options
    pub init_git: Option<bool>,
    pub open_vscode: Option<bool>,
    pub core_files: Option<Vec<String>>,
    pub permissions: Option<Vec<String>>,
}

#[derive(Serialize)]
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
        percent: if total > 0 {
            (current * 100) / total
        } else {
            0
        },
        detail: detail.to_string(),
    };
    let _ = app.emit("install-progress", progress);
}

fn clone_skill_package(
    repo_url: &str,
    target_dir: &Path,
    package_name: &str,
) -> Result<PathBuf, String> {
    let package_dir = target_dir.join(package_name);

    if package_dir.exists() {
        // Already cloned, do a pull instead
        Command::new("git")
            .args(["pull", "--quiet"])
            .current_dir(&package_dir)
            .output()
            .map_err(|e| format!("Git pull failed: {}", e))?;
        return Ok(package_dir);
    }

    // Clone with depth 1 (shallow) for speed
    let output = Command::new("git")
        .args([
            "clone",
            "--depth",
            "1",
            "--filter=blob:none",
            "--sparse",
            repo_url,
            package_dir.to_str().unwrap_or(package_name),
        ])
        .current_dir(target_dir)
        .output()
        .map_err(|e| format!("Git clone failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Git clone failed: {}", stderr));
    }

    // Set up sparse checkout for skills/ directory only
    let _ = Command::new("git")
        .args(["sparse-checkout", "set", "skills"])
        .current_dir(&package_dir)
        .output();

    Ok(package_dir)
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

    content.push_str("## Active Skill Packages\n");
    for pkg in packages {
        content.push_str(&format!("- {}\n", pkg));
    }
    content.push('\n');

    content.push_str("## Conventions\n");
    content.push_str("- Documentation: Nederlands\n");
    content.push_str("- Code & configs: English\n");
    content.push_str("- Conventional Commits: feat:, fix:, docs:, refactor:, test:, chore:\n");

    if effort == "high" {
        content.push_str("\n## Protocols\n");
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
            "Bash(npm:*)".to_string(),
            "Bash(cargo:*)".to_string(),
            "Bash(git:*)".to_string(),
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
    let json =
        serde_json::to_string_pretty(&settings).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&file_path, json).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(".claude/settings.local.json".to_string())
}

fn generate_workspace_file(
    workspace_path: &Path,
    name: &str,
    package_dirs: &[PathBuf],
) -> Result<String, String> {
    let ws_name = if name.is_empty() {
        workspace_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    } else {
        name.to_string()
    };

    let mut folders = vec![serde_json::json!({
        "name": ws_name,
        "path": "."
    })];

    for dir in package_dirs {
        if let Some(dir_name) = dir.file_name() {
            let skills_path = dir.join("skills");
            if skills_path.exists() {
                folders.push(serde_json::json!({
                    "name": format!("{} (skills)", dir_name.to_string_lossy()),
                    "path": skills_path.to_string_lossy()
                }));
            }
        }
    }

    let workspace = serde_json::json!({
        "folders": folders,
        "settings": {}
    });

    let file_name = format!(
        "{}.code-workspace",
        ws_name.to_lowercase().replace(' ', "-")
    );
    let file_path = workspace_path.join(&file_name);
    let json =
        serde_json::to_string_pretty(&workspace).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&file_path, json).map_err(|e| format!("Failed to write workspace file: {}", e))?;
    Ok(file_name)
}

fn generate_gitignore(workspace_path: &Path) -> Result<Option<String>, String> {
    let gitignore_path = workspace_path.join(".gitignore");
    if gitignore_path.exists() {
        return Ok(None); // Don't overwrite
    }

    let content = "node_modules/\ndist/\ntarget/\n.env\n*.local\nPROMPTS.md\n.claude/\n";
    fs::write(&gitignore_path, content)
        .map_err(|e| format!("Failed to write .gitignore: {}", e))?;
    Ok(Some(".gitignore".to_string()))
}

// Map package IDs to GitHub repo URLs
fn package_repo_url(package_id: &str) -> Option<String> {
    let repo = match package_id {
        "blender-bonsai" => {
            "OpenAEC-Foundation/Blender-Bonsai-ifcOpenshell-Sverchok-Claude-Skill-Package"
        }
        "erpnext" => "OpenAEC-Foundation/ERPNext_Anthropic_Claude_Development_Skill_Package",
        "tauri-2" => "OpenAEC-Foundation/Tauri-2-Claude-Skill-Package",
        "react" => "OpenAEC-Foundation/React-Claude-Skill-Package",
        "solidjs" => "OpenAEC-Foundation/SolidJS-Claude-Skill-Package",
        "nextcloud" => "OpenAEC-Foundation/Nextcloud-Claude-Skill-Package",
        "vite" => "OpenAEC-Foundation/Vite-Claude-Skill-Package",
        "docker" => "OpenAEC-Foundation/Docker-Claude-Skill-Package",
        "n8n" => "OpenAEC-Foundation/n8n-Claude-Skill-Package",
        "drawio" => "OpenAEC-Foundation/Draw.io-Claude-Skill-Package",
        "pdfjs" => "OpenAEC-Foundation/PDFjs-Claude-Skill-Package",
        "pdf-lib" => "OpenAEC-Foundation/pdf-lib-Claude-Skill-Package",
        "fluent-i18n" => "OpenAEC-Foundation/Fluent-i18n-Claude-Skill-Package",
        "threejs" | "three.js" => "OpenAEC-Foundation/Three.js-Claude-Skill-Package",
        "qgis" => "OpenAEC-Foundation/QGIS-Claude-Skill-Package",
        "thatopen" => "OpenAEC-Foundation/ThatOpen-Claude-Skill-Package",
        "cross-tech" | "cross-tech-aec" => {
            "OpenAEC-Foundation/Cross-Tech-AEC-Claude-Skill-Package"
        }
        _ => return None,
    };
    Some(format!("https://github.com/{}.git", repo))
}

#[tauri::command]
pub async fn install_workspace(
    app: AppHandle,
    request: InstallRequest,
) -> Result<InstallResult, String> {
    let workspace_path = PathBuf::from(&request.path);
    let packages = request.packages.unwrap_or_default();
    let permissions = request.permissions.unwrap_or_default();
    let total_steps = 4 + packages.len() as u32; // validate + clone each + claude.md + settings + workspace file

    // Step 1: Validate & create workspace directory
    emit_progress(
        &app,
        "Preparing workspace",
        1,
        total_steps,
        "Creating directories...",
    );
    fs::create_dir_all(&workspace_path)
        .map_err(|e| format!("Failed to create workspace: {}", e))?;

    let mut files_created = Vec::new();
    let mut package_dirs = Vec::new();
    let mut packages_installed = Vec::new();
    let mut skills_total = 0u32;

    // Step 2: Clone skill packages
    let skills_dir = workspace_path.join(".skills");
    if !packages.is_empty() {
        fs::create_dir_all(&skills_dir)
            .map_err(|e| format!("Failed to create .skills: {}", e))?;
    }

    for (i, pkg_id) in packages.iter().enumerate() {
        let step = 2 + i as u32;
        emit_progress(
            &app,
            &format!("Installing {}", pkg_id),
            step,
            total_steps,
            &format!("Cloning {}...", pkg_id),
        );

        if let Some(repo_url) = package_repo_url(pkg_id) {
            match clone_skill_package(&repo_url, &skills_dir, pkg_id) {
                Ok(dir) => {
                    // Count skills in the cloned package
                    let skills_path = dir.join("skills");
                    if skills_path.exists() {
                        if let Ok(entries) = fs::read_dir(&skills_path) {
                            skills_total += entries
                                .filter_map(|e| e.ok())
                                .filter(|e| e.path().is_dir())
                                .count() as u32;
                        }
                    }
                    package_dirs.push(dir);
                    packages_installed.push(pkg_id.clone());
                }
                Err(e) => {
                    // Non-fatal: log and continue
                    emit_progress(
                        &app,
                        &format!("Warning: {}", pkg_id),
                        step,
                        total_steps,
                        &format!("Clone failed: {}", e),
                    );
                }
            }
        } else {
            emit_progress(
                &app,
                &format!("Skipped {}", pkg_id),
                step,
                total_steps,
                "No repository URL found",
            );
        }
    }

    // Step 3: Generate CLAUDE.md
    let claude_step = 2 + packages.len() as u32;
    emit_progress(
        &app,
        "Generating CLAUDE.md",
        claude_step,
        total_steps,
        "Writing project configuration...",
    );
    if let Ok(f) = generate_claude_md(&workspace_path, &request.name, &packages, &request.effort) {
        files_created.push(f);
    }

    // Step 4: Generate settings
    emit_progress(
        &app,
        "Generating settings",
        claude_step + 1,
        total_steps,
        "Writing .claude/settings.local.json...",
    );
    if let Ok(f) = generate_settings_json(&workspace_path, &permissions) {
        files_created.push(f);
    }

    // Step 5: Generate workspace file
    emit_progress(
        &app,
        "Generating workspace file",
        claude_step + 2,
        total_steps,
        "Writing .code-workspace...",
    );
    let workspace_file =
        generate_workspace_file(&workspace_path, &request.name, &package_dirs)?;
    files_created.push(workspace_file.clone());

    // Step 6: Generate .gitignore
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

    emit_progress(
        &app,
        "Complete",
        total_steps,
        total_steps,
        "Workspace ready!",
    );

    Ok(InstallResult {
        workspace_file,
        files_created,
        packages_installed,
        skills_total,
    })
}

#[tauri::command]
pub async fn open_in_vscode(path: String) -> Result<(), String> {
    Command::new("code")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open VS Code: {}", e))?;
    Ok(())
}

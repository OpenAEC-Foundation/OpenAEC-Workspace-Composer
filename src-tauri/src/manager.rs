use serde::Serialize;
use std::fs;
use std::path::PathBuf;

// --- Data types ---

#[derive(Serialize, Clone)]
pub struct ManagedProject {
    pub key: String,
    pub name: String,
    pub path: String,
    pub status: String,
    pub languages: Vec<String>,
    pub tags: Vec<String>,
    pub description: String,
    pub has_claude_md: bool,
    pub has_status_md: bool,
    pub has_todo_md: bool,
    pub has_session: bool,
    pub session_date: Option<String>,
    pub claude_md_size: Option<u64>,
}

#[derive(Serialize, Clone)]
pub struct Integration {
    pub from: String,
    pub to: String,
    pub description: String,
}

#[derive(Serialize, Clone)]
pub struct SessionSummary {
    pub project: String,
    pub date: String,
    pub content: String,
}

#[derive(Serialize)]
pub struct WorkspaceOverview {
    pub global_claude_md: Option<String>,
    pub projects: Vec<ManagedProject>,
    pub integrations: Vec<Integration>,
    pub lessons_file: Option<String>,
    pub sessions: Vec<SessionSummary>,
    pub context_files: Vec<String>,
}

// --- Helpers ---

fn get_claude_home() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|h| h.join(".claude"))
        .ok_or_else(|| "Could not determine home directory".to_string())
}

fn get_orchestrator_dir() -> Result<PathBuf, String> {
    get_claude_home().map(|h| h.join("orchestrator"))
}

/// Get a string field from a JSON value, trying multiple key names (EN/NL).
fn get_str<'a>(val: &'a serde_json::Value, keys: &[&str]) -> Option<&'a str> {
    for key in keys {
        if let Some(s) = val.get(*key).and_then(|v| v.as_str()) {
            return Some(s);
        }
    }
    None
}

/// Get a string array field from a JSON value, trying multiple key names.
fn get_str_array(val: &serde_json::Value, keys: &[&str]) -> Vec<String> {
    for key in keys {
        if let Some(arr) = val.get(*key).and_then(|v| v.as_array()) {
            return arr
                .iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect();
        }
    }
    Vec::new()
}

/// Extract date from session markdown.
/// Supports both Dutch ("**Datum:**") and English ("**Date:**") formats.
fn extract_session_date(content: &str) -> Option<String> {
    for line in content.lines() {
        for prefix in &["**Datum:**", "**Date:**"] {
            if let Some(rest) = line.strip_prefix(prefix) {
                return Some(rest.trim().to_string());
            }
        }
    }
    None
}

// --- Tauri Commands ---

/// Scan the orchestrator workspace and build a complete overview.
/// Reads project-registry.json, sessions, context files, and global CLAUDE.md.
/// Supports both Dutch and English field names in the registry JSON.
#[tauri::command]
pub fn scan_workspace() -> Result<WorkspaceOverview, String> {
    let claude_home = get_claude_home()?;
    let orchestrator = get_orchestrator_dir()?;
    let registry_path = orchestrator.join("project-registry.json");

    // Read global CLAUDE.md
    let global_claude_md_path = claude_home.join("CLAUDE.md");
    let global_claude_md = fs::read_to_string(&global_claude_md_path).ok();

    // Parse registry
    let mut projects = Vec::new();
    let mut integrations = Vec::new();

    if registry_path.exists() {
        let registry_content = fs::read_to_string(&registry_path)
            .map_err(|e| format!("Failed to read registry: {}", e))?;
        let registry: serde_json::Value = serde_json::from_str(&registry_content)
            .map_err(|e| format!("Failed to parse registry: {}", e))?;

        // Parse projects — supports both EN and NL field names
        if let Some(proj_map) = registry.get("projects").and_then(|p| p.as_object()) {
            for (key, val) in proj_map {
                let path_str = get_str(val, &["path", "pad"])
                    .unwrap_or("")
                    .to_string();

                let project_path = PathBuf::from(&path_str);
                let claude_md_path = project_path.join("CLAUDE.md");
                let has_claude_md = claude_md_path.exists();
                let has_status_md = project_path.join("STATUS.md").exists();
                let has_todo_md = project_path.join("TODO.md").exists();
                let claude_md_size = if has_claude_md {
                    fs::metadata(&claude_md_path).ok().map(|m| m.len())
                } else {
                    None
                };

                // Check for session summary
                let session_path = orchestrator
                    .join("sessions")
                    .join(format!("{}_latest.md", key));
                let has_session = session_path.exists();
                let session_date = if has_session {
                    fs::read_to_string(&session_path)
                        .ok()
                        .and_then(|c| extract_session_date(&c))
                } else {
                    None
                };

                let languages = get_str_array(val, &["languages", "taal"]);
                let tags = get_str_array(val, &["tags"]);

                projects.push(ManagedProject {
                    key: key.clone(),
                    name: get_str(val, &["name", "naam"])
                        .unwrap_or(key)
                        .to_string(),
                    path: path_str,
                    status: get_str(val, &["status"])
                        .unwrap_or("unknown")
                        .to_string(),
                    languages,
                    tags,
                    description: get_str(val, &["description", "beschrijving"])
                        .unwrap_or("")
                        .to_string(),
                    has_claude_md,
                    has_status_md,
                    has_todo_md,
                    has_session,
                    session_date,
                    claude_md_size,
                });
            }
        }

        // Parse integrations — supports both EN and NL field names
        let int_arr = registry
            .get("integrations")
            .or_else(|| registry.get("integraties"))
            .and_then(|i| i.as_array());

        if let Some(int_arr) = int_arr {
            for int_val in int_arr {
                integrations.push(Integration {
                    from: get_str(int_val, &["from", "van"])
                        .unwrap_or("")
                        .to_string(),
                    to: get_str(int_val, &["to", "naar"])
                        .unwrap_or("")
                        .to_string(),
                    description: get_str(int_val, &["description", "beschrijving"])
                        .unwrap_or("")
                        .to_string(),
                });
            }
        }
    }

    // Sort projects by name
    projects.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    // Scan sessions directory
    let mut sessions = Vec::new();
    let sessions_dir = orchestrator.join("sessions");
    if sessions_dir.exists() {
        if let Ok(entries) = fs::read_dir(&sessions_dir) {
            for entry in entries.flatten() {
                let filename = entry.file_name().to_string_lossy().to_string();
                if filename.ends_with("_latest.md") {
                    let project_key = filename.trim_end_matches("_latest.md").to_string();
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        let date = extract_session_date(&content).unwrap_or_default();
                        sessions.push(SessionSummary {
                            project: project_key,
                            date,
                            content,
                        });
                    }
                }
            }
        }
    }
    // Sort sessions by date descending
    sessions.sort_by(|a, b| b.date.cmp(&a.date));

    // List context files
    let mut context_files = Vec::new();
    let context_dir = orchestrator.join("context");
    if context_dir.exists() {
        if let Ok(entries) = fs::read_dir(&context_dir) {
            for entry in entries.flatten() {
                let filename = entry.file_name().to_string_lossy().to_string();
                if filename.ends_with(".md") {
                    context_files.push(filename);
                }
            }
        }
    }
    context_files.sort();

    // Find lessons learned file path
    let lessons_file = find_lessons_file(&orchestrator);

    Ok(WorkspaceOverview {
        global_claude_md,
        projects,
        integrations,
        lessons_file,
        sessions,
        context_files,
    })
}

/// Try to locate the lessons learned file.
/// Checks the orchestrator pointer file for a path reference.
fn find_lessons_file(orchestrator: &PathBuf) -> Option<String> {
    // Check for a lessons-learned pointer/file
    for filename in &["lessons-learned.md", "lessons_learned.md"] {
        let pointer_path = orchestrator.join(filename);
        if pointer_path.exists() {
            if let Ok(content) = fs::read_to_string(&pointer_path) {
                // Try to find a file path reference in the content
                for line in content.lines() {
                    let trimmed = line.trim();
                    if (trimmed.contains(":\\") || trimmed.starts_with('/'))
                        && trimmed.ends_with(".md")
                    {
                        let path = PathBuf::from(trimmed);
                        if path.exists() {
                            return Some(trimmed.to_string());
                        }
                    }
                }
                // If the file itself has substantial content, use it directly
                if content.len() > 50 {
                    return Some(pointer_path.to_string_lossy().to_string());
                }
            }
        }
    }

    None
}

/// Read CLAUDE.md from a specific project path.
#[tauri::command]
pub fn read_project_claude_md(project_path: String) -> Result<String, String> {
    read_project_file(project_path, "CLAUDE.md".to_string())
}

/// Read any file from a project root directory.
/// Only allows .md files to prevent reading sensitive content.
#[tauri::command]
pub fn read_project_file(project_path: String, filename: String) -> Result<String, String> {
    // Only allow markdown files
    if !filename.ends_with(".md") {
        return Err("Only .md files can be read".to_string());
    }
    let file_path = PathBuf::from(&project_path).join(&filename);
    if !file_path.exists() {
        return Err(format!(
            "{} not found at: {}",
            filename,
            file_path.display()
        ));
    }
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read {}: {}", filename, e))
}

/// Read the latest session summary for a project.
#[tauri::command]
pub fn read_session_summary(project_key: String) -> Result<String, String> {
    let orchestrator = get_orchestrator_dir()?;
    let session_path = orchestrator
        .join("sessions")
        .join(format!("{}_latest.md", project_key));
    if !session_path.exists() {
        return Err(format!(
            "Session summary not found for: {}",
            project_key
        ));
    }
    fs::read_to_string(&session_path)
        .map_err(|e| format!("Failed to read session summary: {}", e))
}

/// Read the lessons learned file.
/// Follows the pointer in orchestrator/lessons-learned.md if present.
#[tauri::command]
pub fn read_lessons_learned() -> Result<String, String> {
    let orchestrator = get_orchestrator_dir()?;

    // Check for pointer/content files
    for filename in &["lessons-learned.md", "lessons_learned.md"] {
        let pointer_path = orchestrator.join(filename);
        if pointer_path.exists() {
            let pointer_content = fs::read_to_string(&pointer_path)
                .map_err(|e| format!("Failed to read lessons file: {}", e))?;

            // Try to find and read the actual file from a path reference
            for line in pointer_content.lines() {
                let trimmed = line.trim();
                if (trimmed.contains(":\\") || trimmed.starts_with('/'))
                    && trimmed.ends_with(".md")
                {
                    let path = PathBuf::from(trimmed);
                    if path.exists() {
                        return fs::read_to_string(&path)
                            .map_err(|e| format!("Failed to read lessons file: {}", e));
                    }
                }
            }

            // If the file itself has substantial content, return it
            if pointer_content.len() > 50 {
                return Ok(pointer_content);
            }
        }
    }

    Err("Lessons learned file not found in orchestrator directory".to_string())
}

/// Read a context file from orchestrator/context/.
#[tauri::command]
pub fn read_context_file(filename: String) -> Result<String, String> {
    let orchestrator = get_orchestrator_dir()?;
    let file_path = orchestrator.join("context").join(&filename);
    if !file_path.exists() {
        return Err(format!("Context file not found: {}", filename));
    }
    fs::read_to_string(&file_path).map_err(|e| format!("Failed to read context file: {}", e))
}

/// Open Windows Terminal at the project path.
#[tauri::command]
pub fn open_in_terminal(project_path: String) -> Result<(), String> {
    let path = PathBuf::from(&project_path);
    if !path.exists() {
        return Err(format!("Path does not exist: {}", project_path));
    }

    std::process::Command::new("wt.exe")
        .arg("-d")
        .arg(&project_path)
        .spawn()
        .map_err(|e| format!("Failed to open terminal: {}", e))?;
    Ok(())
}

/// Open Windows Explorer at the project path.
#[tauri::command]
pub fn open_in_explorer(project_path: String) -> Result<(), String> {
    let path = PathBuf::from(&project_path);
    if !path.exists() {
        return Err(format!("Path does not exist: {}", project_path));
    }

    std::process::Command::new("explorer.exe")
        .arg(&project_path)
        .spawn()
        .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    Ok(())
}

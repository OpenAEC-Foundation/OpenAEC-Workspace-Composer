use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize)]
pub struct PathValidation {
    pub exists: bool,
    pub is_dir: bool,
    pub is_writable: bool,
    pub has_claude_dir: bool,
    pub has_workspace_file: bool,
}

#[tauri::command]
pub fn validate_path(path: String) -> Result<PathValidation, String> {
    let p = Path::new(&path);
    let exists = p.exists();
    let is_dir = p.is_dir();
    let is_writable = if exists && is_dir {
        // Try creating a temp file to check writability
        let test_file = p.join(".openaec-write-test");
        match fs::write(&test_file, "") {
            Ok(_) => {
                let _ = fs::remove_file(&test_file);
                true
            }
            Err(_) => false,
        }
    } else {
        false
    };
    let has_claude_dir = p.join(".claude").is_dir();
    let has_workspace_file = if exists && is_dir {
        fs::read_dir(p)
            .map(|entries| {
                entries.filter_map(|e| e.ok()).any(|e| {
                    e.path()
                        .extension()
                        .map_or(false, |ext| ext == "code-workspace")
                })
            })
            .unwrap_or(false)
    } else {
        false
    };

    Ok(PathValidation {
        exists,
        is_dir,
        is_writable,
        has_claude_dir,
        has_workspace_file,
    })
}

#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub fn list_recent_workspaces() -> Result<Vec<String>, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not determine config directory")?
        .join("openaec-composer");
    let recent_file = config_dir.join("recent.json");

    if !recent_file.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&recent_file)
        .map_err(|e| format!("Failed to read recent workspaces: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse recent workspaces: {}", e))
}

#[tauri::command]
pub fn save_recent_workspace(path: String) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not determine config directory")?
        .join("openaec-composer");

    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let recent_file = config_dir.join("recent.json");
    let mut recent: Vec<String> = if recent_file.exists() {
        let content = fs::read_to_string(&recent_file).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        vec![]
    };

    // Remove if already exists, then add to front
    recent.retain(|p| p != &path);
    recent.insert(0, path);
    recent.truncate(10); // Keep max 10

    let json = serde_json::to_string_pretty(&recent)
        .map_err(|e| format!("Failed to serialize: {}", e))?;

    fs::write(&recent_file, json)
        .map_err(|e| format!("Failed to save recent workspaces: {}", e))
}

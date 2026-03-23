use std::fs;
use std::path::PathBuf;

/// Write .claude/settings.local.json to the workspace directory.
/// Creates parent directories if they don't exist.
#[tauri::command]
pub fn write_settings_json(path: String, settings: serde_json::Value) -> Result<(), String> {
    let claude_dir = PathBuf::from(&path).join(".claude");
    fs::create_dir_all(&claude_dir)
        .map_err(|e| format!("Failed to create .claude directory at {}: {}", claude_dir.display(), e))?;

    let file_path = claude_dir.join("settings.local.json");
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings JSON: {}", e))?;

    fs::write(&file_path, &json)
        .map_err(|e| format!("Failed to write {}: {}", file_path.display(), e))?;

    Ok(())
}

/// Write .mcp.json to the workspace directory.
/// Creates parent directories if they don't exist.
#[tauri::command]
pub fn write_mcp_json(path: String, config: serde_json::Value) -> Result<(), String> {
    let workspace_path = PathBuf::from(&path);
    fs::create_dir_all(&workspace_path)
        .map_err(|e| format!("Failed to create workspace directory at {}: {}", workspace_path.display(), e))?;

    let file_path = workspace_path.join(".mcp.json");
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize MCP config JSON: {}", e))?;

    fs::write(&file_path, &json)
        .map_err(|e| format!("Failed to write {}: {}", file_path.display(), e))?;

    Ok(())
}

/// Write CLAUDE.md to the workspace directory.
/// Creates parent directories if they don't exist.
#[tauri::command]
pub fn write_claude_md(path: String, content: String) -> Result<(), String> {
    let workspace_path = PathBuf::from(&path);
    fs::create_dir_all(&workspace_path)
        .map_err(|e| format!("Failed to create workspace directory at {}: {}", workspace_path.display(), e))?;

    let file_path = workspace_path.join("CLAUDE.md");
    fs::write(&file_path, &content)
        .map_err(|e| format!("Failed to write {}: {}", file_path.display(), e))?;

    Ok(())
}

/// Read .claude/settings.local.json from the workspace directory.
/// Returns the parsed JSON value, or an error if the file doesn't exist or is invalid.
#[tauri::command]
pub fn read_settings_json(path: String) -> Result<serde_json::Value, String> {
    let file_path = PathBuf::from(&path)
        .join(".claude")
        .join("settings.local.json");

    if !file_path.exists() {
        return Err(format!("Settings file not found: {}", file_path.display()));
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read {}: {}", file_path.display(), e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse {}: {}", file_path.display(), e))
}

/// Read .mcp.json from the workspace directory.
/// Returns the parsed JSON value, or an error if the file doesn't exist or is invalid.
#[tauri::command]
pub fn read_mcp_json(path: String) -> Result<serde_json::Value, String> {
    let file_path = PathBuf::from(&path).join(".mcp.json");

    if !file_path.exists() {
        return Err(format!("MCP config file not found: {}", file_path.display()));
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read {}: {}", file_path.display(), e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse {}: {}", file_path.display(), e))
}

/// Read CLAUDE.md from the workspace directory.
/// Returns the file content as a string, or an error if the file doesn't exist.
#[tauri::command]
pub fn read_claude_md(path: String) -> Result<String, String> {
    let file_path = PathBuf::from(&path).join("CLAUDE.md");

    if !file_path.exists() {
        return Err(format!("CLAUDE.md not found: {}", file_path.display()));
    }

    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read {}: {}", file_path.display(), e))
}

/// Write an arbitrary file to the workspace directory.
/// `relative_path` is relative to the workspace root. Creates parent directories.
#[tauri::command]
pub fn write_workspace_file(workspace: String, relative_path: String, content: String) -> Result<(), String> {
    let file_path = PathBuf::from(&workspace).join(&relative_path);

    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories for {}: {}", file_path.display(), e))?;
    }

    fs::write(&file_path, &content)
        .map_err(|e| format!("Failed to write {}: {}", file_path.display(), e))
}

/// Read an arbitrary file from the workspace directory.
/// `relative_path` is relative to the workspace root.
#[tauri::command]
pub fn read_workspace_file(workspace: String, relative_path: String) -> Result<String, String> {
    let file_path = PathBuf::from(&workspace).join(&relative_path);

    if !file_path.exists() {
        return Err(format!("File not found: {}", file_path.display()));
    }

    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read {}: {}", file_path.display(), e))
}

/// Get the user's home directory path.
#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

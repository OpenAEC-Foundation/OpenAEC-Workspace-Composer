use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct GenerateResult {
    pub workspace_file: String,
    pub files_created: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct GenerateRequest {
    pub workflow_type: String,
    pub path: String,
    pub name: String,
    pub effort: String,
    // Skill-package specific
    pub packages: Option<Vec<String>>,
    // Version-upgrade specific
    pub source_version: Option<String>,
    pub target_version: Option<String>,
    pub target_repo: Option<String>,
}

pub fn generate_settings_json() -> String {
    r#"{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(cargo *)",
      "Bash(git *)",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "WebFetch",
      "WebSearch",
      "Agent"
    ]
  }
}"#
    .to_string()
}

pub fn generate_gitignore() -> String {
    "node_modules/\ndist/\n.env\n*.local\nPROMPTS.md\n".to_string()
}

pub fn resolve_workspace_name(path: &Path, name: &str) -> String {
    if name.is_empty() {
        path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "workspace".to_string())
    } else {
        name.to_string()
    }
}

pub fn write_file(path: &Path, content: &str, files_created: &mut Vec<String>) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())?;
    files_created.push(path.to_string_lossy().to_string());
    Ok(())
}

pub fn write_file_if_missing(path: &Path, content: &str, files_created: &mut Vec<String>) -> Result<(), String> {
    if !path.exists() {
        write_file(path, content, files_created)?;
    }
    Ok(())
}

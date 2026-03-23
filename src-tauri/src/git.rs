use serde::Serialize;
use std::path::Path;
use std::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub code: Option<i32>,
}

/// Run a git command in the given workspace directory
fn run_git(workspace: &str, args: &[&str]) -> Result<ShellOutput, String> {
    let path = Path::new(workspace);
    if !path.exists() {
        return Err(format!("Workspace path does not exist: {}", workspace));
    }

    let output = if cfg!(target_os = "windows") {
        let mut cmd_args = vec!["/C", "git"];
        cmd_args.extend_from_slice(args);
        Command::new("cmd")
            .args(&cmd_args)
            .current_dir(path)
            .output()
    } else {
        Command::new("git")
            .args(args)
            .current_dir(path)
            .output()
    };

    match output {
        Ok(o) => Ok(ShellOutput {
            success: o.status.success(),
            stdout: String::from_utf8_lossy(&o.stdout).to_string(),
            stderr: String::from_utf8_lossy(&o.stderr).to_string(),
            code: o.status.code(),
        }),
        Err(e) => Err(format!("Failed to run git: {}", e)),
    }
}

#[tauri::command]
pub fn git_init(workspace: String) -> Result<ShellOutput, String> {
    run_git(&workspace, &["init"])
}

#[tauri::command]
pub fn git_status(workspace: String) -> Result<ShellOutput, String> {
    run_git(&workspace, &["status", "--short"])
}

#[tauri::command]
pub fn git_stage_all(workspace: String) -> Result<ShellOutput, String> {
    run_git(&workspace, &["add", "-A"])
}

#[tauri::command]
pub fn git_commit(workspace: String, message: String) -> Result<ShellOutput, String> {
    if message.trim().is_empty() {
        return Err("Commit message cannot be empty".to_string());
    }
    run_git(&workspace, &["commit", "-m", &message])
}

#[tauri::command]
pub fn git_push(workspace: String) -> Result<ShellOutput, String> {
    run_git(&workspace, &["push"])
}

#[tauri::command]
pub fn git_log(workspace: String) -> Result<ShellOutput, String> {
    run_git(&workspace, &["log", "--oneline", "-10", "--format=%h|%s|%an|%ar"])
}

#[tauri::command]
pub fn git_branch(workspace: String) -> Result<ShellOutput, String> {
    run_git(&workspace, &["branch", "--show-current"])
}

#[tauri::command]
pub fn git_branches(workspace: String) -> Result<ShellOutput, String> {
    run_git(&workspace, &["branch", "--format=%(refname:short) %(HEAD)"])
}

#[tauri::command]
pub fn git_create_gitignore(workspace: String) -> Result<String, String> {
    let path = Path::new(&workspace).join(".gitignore");
    let content = "\
node_modules/
dist/
target/
.env
*.local
PROMPTS.md
.claude/settings.local.json
";
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write .gitignore: {}", e))?;
    Ok(path.to_string_lossy().to_string())
}

/// Write a file to an arbitrary path inside a workspace
#[tauri::command]
pub fn write_file(workspace: String, relative_path: String, content: String) -> Result<String, String> {
    let ws = Path::new(&workspace);
    if !ws.exists() {
        return Err(format!("Workspace path does not exist: {}", workspace));
    }

    // Security: ensure relative_path doesn't escape workspace
    let full_path = ws.join(&relative_path);
    let canonical_ws = ws.canonicalize().map_err(|e| e.to_string())?;
    // Create parent directories
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    // Write the file first so canonicalize works
    std::fs::write(&full_path, &content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    let canonical_full = full_path.canonicalize().map_err(|e| e.to_string())?;
    if !canonical_full.starts_with(&canonical_ws) {
        // Clean up the escaped file
        let _ = std::fs::remove_file(&canonical_full);
        return Err("Path traversal detected: relative path escapes workspace".to_string());
    }

    Ok(full_path.to_string_lossy().to_string())
}

use super::GpuServerConfig;
use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
pub struct MutagenSessionInfo {
    pub name: String,
    pub status: String,
    pub local_path: String,
    pub remote_path: String,
}

fn run_mutagen(args: &[&str]) -> Result<String, String> {
    let output = Command::new("mutagen")
        .args(args)
        .output()
        .map_err(|e| format!("Mutagen not found or failed to start: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Err(format!(
            "Mutagen error: {}",
            if stderr.is_empty() { &stdout } else { &stderr }
        ))
    }
}

#[tauri::command]
pub fn gpu_check_mutagen() -> Result<String, String> {
    run_mutagen(&["version"])
}

#[tauri::command]
pub fn gpu_sync_create(
    config: GpuServerConfig,
    local_path: String,
    remote_path: String,
    project_name: String,
) -> Result<String, String> {
    let remote = format!("{}:{}", config.ssh_target(), remote_path);

    // Create the remote directory first
    Command::new("ssh")
        .arg("-o").arg("BatchMode=yes")
        .arg("-o").arg("ConnectTimeout=10")
        .arg(&config.ssh_target())
        .arg(format!("mkdir -p {}", remote_path))
        .output()
        .ok();

    // Create mutagen sync session
    let output = run_mutagen(&[
        "sync",
        "create",
        &local_path,
        &remote,
        &format!("--name={}", project_name),
        "--ignore-vcs",
        "--default-directory-mode=0755",
        "--default-file-mode=0644",
    ])?;

    Ok(output)
}

#[tauri::command]
pub fn gpu_sync_pause(session_name: String) -> Result<(), String> {
    run_mutagen(&["sync", "pause", &session_name])?;
    Ok(())
}

#[tauri::command]
pub fn gpu_sync_resume(session_name: String) -> Result<(), String> {
    run_mutagen(&["sync", "resume", &session_name])?;
    Ok(())
}

#[tauri::command]
pub fn gpu_sync_terminate(session_name: String) -> Result<(), String> {
    run_mutagen(&["sync", "terminate", &session_name])?;
    Ok(())
}

#[tauri::command]
pub fn gpu_sync_list() -> Result<Vec<MutagenSessionInfo>, String> {
    let output = run_mutagen(&["sync", "list"])?;

    if output.is_empty() || output.contains("No sessions found") {
        return Ok(Vec::new());
    }

    // Parse mutagen sync list output
    // Format is structured text blocks separated by "---"
    let mut sessions = Vec::new();
    let mut current_name = String::new();
    let mut current_status = String::new();
    let mut current_alpha = String::new();
    let mut current_beta = String::new();

    for line in output.lines() {
        let line = line.trim();
        if line.starts_with("Name:") {
            current_name = line.trim_start_matches("Name:").trim().to_string();
        } else if line.starts_with("Status:") {
            current_status = line.trim_start_matches("Status:").trim().to_string();
        } else if line.starts_with("Alpha:") {
            current_alpha = line.trim_start_matches("Alpha:").trim().to_string();
        } else if line.starts_with("Beta:") {
            current_beta = line.trim_start_matches("Beta:").trim().to_string();
        } else if line == "---" || line.starts_with("----------") {
            if !current_name.is_empty() {
                sessions.push(MutagenSessionInfo {
                    name: current_name.clone(),
                    status: current_status.clone(),
                    local_path: current_alpha.clone(),
                    remote_path: current_beta.clone(),
                });
                current_name.clear();
                current_status.clear();
                current_alpha.clear();
                current_beta.clear();
            }
        }
    }
    // Don't forget the last session
    if !current_name.is_empty() {
        sessions.push(MutagenSessionInfo {
            name: current_name,
            status: current_status,
            local_path: current_alpha,
            remote_path: current_beta,
        });
    }

    Ok(sessions)
}

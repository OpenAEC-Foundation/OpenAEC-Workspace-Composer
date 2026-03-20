use super::{GpuServerConfig, ServerStatus};
use std::process::Command;

fn run_ssh(config: &GpuServerConfig, remote_cmd: &str) -> Result<String, String> {
    let target = config.ssh_target();
    if target.is_empty() || target == "@" {
        return Err(format!(
            "No SSH target configured. host='{}', username='{}', alias={:?}",
            config.host, config.username, config.ssh_config_host
        ));
    }

    let mut cmd = Command::new("ssh");
    cmd.arg("-o").arg("BatchMode=yes");
    cmd.arg("-o").arg("ConnectTimeout=10");

    // Add key and port when not using an alias
    let using_alias = config.ssh_config_host.as_deref().unwrap_or("").len() > 0;
    if !using_alias {
        if !config.ssh_key_path.is_empty() {
            cmd.arg("-i").arg(&config.ssh_key_path);
        }
        if config.port != 22 {
            cmd.arg("-p").arg(config.port.to_string());
        }
    }

    cmd.arg(&target);
    cmd.arg(remote_cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("SSH failed to start: {}. Is ssh.exe on your PATH?", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        // On usage error, include debug info
        if stderr.contains("usage:") {
            Err(format!(
                "SSH argument error. target='{}', using_alias={}, debug: host='{}', user='{}', alias={:?}",
                target, using_alias, config.host, config.username, config.ssh_config_host
            ))
        } else {
            Err(format!("SSH error: {}", if stderr.is_empty() { &stdout } else { &stderr }))
        }
    }
}

#[tauri::command]
pub fn gpu_test_connection(config: GpuServerConfig) -> Result<String, String> {
    run_ssh(&config, "echo connected && hostname && whoami")
}

#[tauri::command]
pub fn gpu_server_status(config: GpuServerConfig) -> Result<ServerStatus, String> {
    let script = r#"echo "---GPU---"
nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null || echo "NO_GPU"
echo "---DISK---"
df -BG /home 2>/dev/null | tail -1
echo "---UPTIME---"
uptime -p 2>/dev/null || uptime"#;

    let output = run_ssh(&config, script)?;

    let mut gpu_name = None;
    let mut gpu_vram_used = None;
    let mut gpu_vram_total = None;
    let mut disk_used = None;
    let mut disk_total = None;
    let mut uptime_str = None;

    let mut section = "";
    for line in output.lines() {
        let line = line.trim();
        if line == "---GPU---" {
            section = "gpu";
            continue;
        }
        if line == "---DISK---" {
            section = "disk";
            continue;
        }
        if line == "---UPTIME---" {
            section = "uptime";
            continue;
        }

        match section {
            "gpu" if line != "NO_GPU" && !line.is_empty() => {
                let parts: Vec<&str> = line.split(", ").collect();
                if parts.len() >= 3 {
                    gpu_name = Some(parts[0].to_string());
                    gpu_vram_used = parts[1].trim().parse::<u64>().ok();
                    gpu_vram_total = parts[2].trim().parse::<u64>().ok();
                }
            }
            "disk" if !line.is_empty() => {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 4 {
                    disk_total = parts[1].trim_end_matches('G').parse::<f64>().ok();
                    disk_used = parts[2].trim_end_matches('G').parse::<f64>().ok();
                }
            }
            "uptime" if !line.is_empty() => {
                uptime_str = Some(line.to_string());
            }
            _ => {}
        }
    }

    Ok(ServerStatus {
        connected: true,
        gpu_name,
        gpu_vram_used_mb: gpu_vram_used,
        gpu_vram_total_mb: gpu_vram_total,
        disk_used_gb: disk_used,
        disk_total_gb: disk_total,
        uptime: uptime_str,
    })
}

#[tauri::command]
pub fn gpu_list_remote_dirs(config: GpuServerConfig, path: String) -> Result<Vec<String>, String> {
    let cmd = format!(
        "ls -1d {}/*/ 2>/dev/null | sed 's|/$||'",
        path.trim_end_matches('/')
    );
    let output = run_ssh(&config, &cmd)?;
    Ok(output
        .lines()
        .filter(|l| !l.is_empty())
        .map(|l| l.to_string())
        .collect())
}

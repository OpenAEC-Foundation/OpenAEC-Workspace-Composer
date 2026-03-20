use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrerequisiteResult {
    pub name: String,
    pub command: String,
    pub required: bool,
    pub found: bool,
    pub version: Option<String>,
    pub install_hint: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrerequisitesReport {
    pub checks: Vec<PrerequisiteResult>,
    pub all_required_ok: bool,
}

fn check_tool(name: &str, cmd: &str, args: &[&str], required: bool, install_hint: &str) -> PrerequisiteResult {
    let result = Command::new(cmd).args(args).output();

    let (found, version) = match result {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let ver = if stdout.is_empty() { stderr } else { stdout };
            // Extract first line only
            let first_line = ver.lines().next().unwrap_or("").to_string();
            (true, Some(first_line))
        }
        _ => (false, None),
    };

    PrerequisiteResult {
        name: name.to_string(),
        command: format!("{} {}", cmd, args.join(" ")),
        required,
        found,
        version,
        install_hint: install_hint.to_string(),
    }
}

#[tauri::command]
pub fn check_prerequisites() -> PrerequisitesReport {
    let checks = vec![
        check_tool(
            "Claude Code CLI",
            "claude",
            &["--version"],
            true,
            "npm install -g @anthropic-ai/claude-code",
        ),
        check_tool(
            "Node.js",
            "node",
            &["--version"],
            true,
            "https://nodejs.org/ or winget install OpenJS.NodeJS.LTS",
        ),
        check_tool(
            "Git",
            "git",
            &["--version"],
            true,
            "https://git-scm.com/ or winget install Git.Git",
        ),
        check_tool(
            "VS Code",
            "code",
            &["--version"],
            true,
            "https://code.visualstudio.com/ or winget install Microsoft.VisualStudioCode",
        ),
        check_tool(
            "Rust",
            "rustc",
            &["--version"],
            false,
            "https://rustup.rs/ or winget install Rustlang.Rustup",
        ),
        check_tool(
            "Docker",
            "docker",
            &["--version"],
            false,
            "https://docker.com/ or winget install Docker.DockerDesktop",
        ),
        check_tool(
            "Mutagen",
            "mutagen",
            &["version"],
            false,
            "https://mutagen.io/ or winget install mutagen-io.Mutagen",
        ),
        check_tool(
            "SSH",
            "ssh",
            &["-V"],
            false,
            "OpenSSH is included with Windows 10+",
        ),
    ];

    let all_required_ok = checks.iter().all(|c| !c.required || c.found);

    PrerequisitesReport {
        checks,
        all_required_ok,
    }
}

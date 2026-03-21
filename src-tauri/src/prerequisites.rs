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
    pub min_version: Option<String>,
    pub version_ok: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrerequisitesReport {
    pub checks: Vec<PrerequisiteResult>,
    pub all_required_ok: bool,
    pub platform: String,
}

fn current_platform() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
}

/// Platform-aware install hints
fn install_hint(tool: &str) -> String {
    let platform = current_platform();
    match (tool, platform) {
        // Node.js
        ("node", "windows") => "winget install OpenJS.NodeJS.LTS\nor download from https://nodejs.org/".to_string(),
        ("node", "macos") => "brew install node\nor download from https://nodejs.org/".to_string(),
        ("node", _) => "sudo apt install nodejs npm\nor use nvm: https://github.com/nvm-sh/nvm".to_string(),

        // npm
        ("npm", _) => "Included with Node.js. Reinstall Node if missing.".to_string(),

        // Git
        ("git", "windows") => "winget install Git.Git\nor download from https://git-scm.com/".to_string(),
        ("git", "macos") => "xcode-select --install\nor brew install git".to_string(),
        ("git", _) => "sudo apt install git".to_string(),

        // Claude Code CLI
        ("claude", "windows") => "irm https://claude.ai/install.ps1 | iex".to_string(),
        ("claude", "macos") | ("claude", _) => "curl -fsSL https://claude.ai/install.sh | bash".to_string(),

        // VS Code
        ("code", "windows") => "winget install Microsoft.VisualStudioCode\nor download from https://code.visualstudio.com/".to_string(),
        ("code", "macos") => "brew install --cask visual-studio-code\nor download from https://code.visualstudio.com/".to_string(),
        ("code", _) => "sudo snap install code --classic\nor download from https://code.visualstudio.com/".to_string(),

        // Rust
        ("rustc", "windows") => "winget install Rustlang.Rustup\nor visit https://rustup.rs/".to_string(),
        ("rustc", _) => "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh".to_string(),

        // Docker
        ("docker", "windows") => "winget install Docker.DockerDesktop\nor download from https://docker.com/".to_string(),
        ("docker", "macos") => "brew install --cask docker\nor download from https://docker.com/".to_string(),
        ("docker", _) => "sudo apt install docker.io docker-compose\nor visit https://docs.docker.com/engine/install/".to_string(),

        // SSH
        ("ssh", "windows") => "Included with Windows 10+. Enable via Settings > Apps > Optional Features > OpenSSH Client.".to_string(),
        ("ssh", "macos") => "Pre-installed on macOS.".to_string(),
        ("ssh", _) => "sudo apt install openssh-client".to_string(),

        // Mutagen
        ("mutagen", "windows") => "Download from https://github.com/mutagen-io/mutagen/releases\nPlace mutagen.exe in a PATH directory.".to_string(),
        ("mutagen", "macos") => "brew install mutagen-io/mutagen/mutagen".to_string(),
        ("mutagen", _) => "Download from https://github.com/mutagen-io/mutagen/releases".to_string(),

        _ => format!("Search for '{}' installation instructions for your platform.", tool),
    }
}

fn check_tool(name: &str, cmd: &str, args: &[&str], required: bool, min_version: Option<&str>) -> PrerequisiteResult {
    // On Windows, tools like npm/claude/code are .cmd scripts that need cmd /C
    // Also check common non-PATH locations
    let result = if cfg!(target_os = "windows") {
        let full_cmd = format!("{} {}", cmd, args.join(" "));
        Command::new("cmd").args(["/C", &full_cmd]).output()
    } else {
        Command::new(cmd).args(args).output()
    };

    // If not found in PATH, try common locations
    let result = match &result {
        Ok(output) if output.status.success() => result,
        _ => try_common_paths(cmd, args),
    };

    let (found, version) = match result {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let ver = if stdout.is_empty() { stderr } else { stdout };
            let first_line = ver.lines().next().unwrap_or("").to_string();
            (true, Some(first_line))
        }
        _ => (false, None),
    };

    // Check minimum version if specified
    let version_ok = if found {
        match (min_version, &version) {
            (Some(min), Some(ver)) => check_min_version(ver, min),
            _ => true, // No min version required, or no version detected
        }
    } else {
        false
    };

    PrerequisiteResult {
        name: name.to_string(),
        command: format!("{} {}", cmd, args.join(" ")),
        required,
        found,
        version,
        install_hint: install_hint(cmd),
        min_version: min_version.map(|v| v.to_string()),
        version_ok,
    }
}

/// Try common installation paths when tool is not in PATH
fn try_common_paths(cmd: &str, args: &[&str]) -> std::io::Result<std::process::Output> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_default();

    let extra_paths: Vec<String> = match cmd {
        "rustc" | "cargo" => vec![
            format!("{}/.cargo/bin/{}", home, cmd),
        ],
        "mutagen" => vec![
            format!("{}/.cargo/bin/mutagen", home),
            format!("{}/bin/mutagen", home),
        ],
        "node" | "npm" | "npx" => {
            if cfg!(target_os = "windows") {
                vec![
                    format!("{}/AppData/Roaming/nvm/current/{}.cmd", home, cmd),
                    format!("C:/Program Files/nodejs/{}.cmd", cmd),
                ]
            } else {
                vec![
                    format!("{}/.nvm/versions/node/*/bin/{}", home, cmd),
                    format!("/usr/local/bin/{}", cmd),
                ]
            }
        }
        "code" => {
            if cfg!(target_os = "macos") {
                vec!["/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code".to_string()]
            } else {
                vec![]
            }
        }
        _ => vec![],
    };

    for path in extra_paths {
        if std::path::Path::new(&path).exists() {
            let result = if cfg!(target_os = "windows") {
                let full_cmd = format!("{} {}", path, args.join(" "));
                Command::new("cmd").args(["/C", &full_cmd]).output()
            } else {
                Command::new(&path).args(args).output()
            };
            if let Ok(ref output) = result {
                if output.status.success() {
                    return result;
                }
            }
        }
    }

    // Return a not-found error
    Command::new("__nonexistent_tool__").output()
}

/// Simple semver check: extract major.minor from version string and compare
fn check_min_version(version_str: &str, min_version: &str) -> bool {
    let extract_numbers = |s: &str| -> (u32, u32) {
        let nums: Vec<u32> = s.chars()
            .filter(|c| c.is_ascii_digit() || *c == '.')
            .collect::<String>()
            .split('.')
            .filter_map(|n| n.parse::<u32>().ok())
            .collect();
        (nums.first().copied().unwrap_or(0), nums.get(1).copied().unwrap_or(0))
    };

    let (ver_major, ver_minor) = extract_numbers(version_str);
    let (min_major, min_minor) = extract_numbers(min_version);

    if ver_major > min_major { return true; }
    if ver_major == min_major && ver_minor >= min_minor { return true; }
    false
}

#[tauri::command]
pub fn check_prerequisites() -> PrerequisitesReport {
    let checks = vec![
        // === Required ===
        check_tool("Node.js", "node", &["--version"], true, Some("18.0")),
        check_tool("npm", "npm", &["--version"], true, None),
        check_tool("Git", "git", &["--version"], true, Some("2.0")),
        check_tool("Claude Code CLI", "claude", &["--version"], true, None),
        check_tool("VS Code", "code", &["--version"], true, None),
        // === Optional ===
        check_tool("Rust", "rustc", &["--version"], false, None),
        check_tool("Docker", "docker", &["--version"], false, None),
        check_tool("SSH", "ssh", &["-V"], false, None),
        check_tool("Mutagen", "mutagen", &["version"], false, None),
    ];

    let all_required_ok = checks.iter().all(|c| !c.required || (c.found && c.version_ok));

    PrerequisitesReport {
        checks,
        all_required_ok,
        platform: current_platform().to_string(),
    }
}

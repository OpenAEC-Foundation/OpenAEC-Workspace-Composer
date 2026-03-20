use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize)]
struct GenerateResult {
    workspace_file: String,
    files_created: Vec<String>,
}

#[tauri::command]
fn generate_workspace(path: String, name: String, packages: Vec<String>) -> Result<GenerateResult, String> {
    let workspace_path = Path::new(&path);

    // Create directories
    let claude_dir = workspace_path.join(".claude");
    fs::create_dir_all(&claude_dir).map_err(|e| e.to_string())?;

    // Generate .code-workspace file
    let workspace_name = if name.is_empty() {
        workspace_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "workspace".to_string())
    } else {
        name.clone()
    };

    let workspace_file = workspace_path.join(format!("{}.code-workspace", workspace_name));
    let workspace_content = generate_workspace_json(&workspace_name, &packages);
    fs::write(&workspace_file, workspace_content).map_err(|e| e.to_string())?;

    // Generate settings.local.json
    let settings_file = claude_dir.join("settings.local.json");
    let settings_content = generate_settings_json();
    fs::write(&settings_file, settings_content).map_err(|e| e.to_string())?;

    // Generate CLAUDE.md
    let claude_md_file = workspace_path.join("CLAUDE.md");
    let claude_md_content = generate_claude_md(&workspace_name, &packages);
    fs::write(&claude_md_file, claude_md_content).map_err(|e| e.to_string())?;

    let mut files_created = vec![
        workspace_file.to_string_lossy().to_string(),
        settings_file.to_string_lossy().to_string(),
        claude_md_file.to_string_lossy().to_string(),
    ];

    // Generate .gitignore if it doesn't exist
    let gitignore_file = workspace_path.join(".gitignore");
    if !gitignore_file.exists() {
        let gitignore_content = "node_modules/\ndist/\n.env\n*.local\nPROMPTS.md\n";
        fs::write(&gitignore_file, gitignore_content).map_err(|e| e.to_string())?;
        files_created.push(gitignore_file.to_string_lossy().to_string());
    }

    Ok(GenerateResult {
        workspace_file: workspace_file.to_string_lossy().to_string(),
        files_created,
    })
}

fn generate_workspace_json(name: &str, packages: &[String]) -> String {
    let skill_folders: Vec<String> = packages
        .iter()
        .map(|p| {
            let repo_name = package_id_to_repo_name(p);
            format!(
                r#"    {{
      "name": "{p} [skills]",
      "path": "../{repo_name}/skills"
    }}"#
            )
        })
        .collect();

    let folders_str = skill_folders.join(",\n");

    format!(
        r#"{{
  "folders": [
    {{
      "name": "{name}",
      "path": "."
    }},
{folders_str}
  ],
  "settings": {{
    "files.associations": {{
      "CLAUDE.md": "markdown",
      "SKILL.md": "markdown"
    }}
  }}
}}"#
    )
}

fn generate_settings_json() -> String {
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

fn generate_claude_md(name: &str, packages: &[String]) -> String {
    let package_list: Vec<String> = packages
        .iter()
        .map(|p| format!("- **{}**", p))
        .collect();

    format!(
        r#"# {name}

## Active Skill Packages

{package_list}

## Conventions

- Documentation: Nederlands
- Code & configs: Engels
- Conventional Commits: feat:, fix:, docs:, refactor:, test:, chore:
"#,
        package_list = package_list.join("\n")
    )
}

fn package_id_to_repo_name(id: &str) -> String {
    match id {
        "blender-bonsai" => "Blender-Bonsai-ifcOpenshell-Sverchok-Claude-Skill-Package".to_string(),
        "erpnext" => "ERPNext_Anthropic_Claude_Development_Skill_Package".to_string(),
        "tauri-2" => "Tauri-2-Claude-Skill-Package".to_string(),
        "solidjs" => "SolidJS-Claude-Skill-Package".to_string(),
        "react" => "React-Claude-Skill-Package".to_string(),
        "vite" => "Vite-Claude-Skill-Package".to_string(),
        "docker" => "Docker-Claude-Skill-Package".to_string(),
        "nextcloud" => "Nextcloud-Claude-Skill-Package".to_string(),
        "n8n" => "n8n-Claude-Skill-Package".to_string(),
        "pdfjs" => "PDFjs-Claude-Skill-Package".to_string(),
        "pdf-lib" => "pdf-lib-Claude-Skill-Package".to_string(),
        "fluent-i18n" => "Fluent-i18n-Claude-Skill-Package".to_string(),
        "drawio" => "Draw.io-Claude-Skill-Package".to_string(),
        "thatopen" => "ThatOpenCompany".to_string(),
        _ => format!("{}-Claude-Skill-Package", id),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![generate_workspace])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

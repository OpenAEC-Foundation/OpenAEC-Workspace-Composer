use std::fs;
use std::path::Path;

use super::common::{self, GenerateRequest, GenerateResult};

pub fn generate(request: &GenerateRequest) -> Result<GenerateResult, String> {
    let workspace_path = Path::new(&request.path);
    let packages = request.packages.as_deref().unwrap_or(&[]);

    // Create directories
    let claude_dir = workspace_path.join(".claude");
    fs::create_dir_all(&claude_dir).map_err(|e| e.to_string())?;

    let workspace_name = common::resolve_workspace_name(workspace_path, &request.name);
    let mut files_created: Vec<String> = Vec::new();

    // Generate .code-workspace
    let workspace_file = workspace_path.join(format!("{}.code-workspace", workspace_name));
    let workspace_content = generate_workspace_json(&workspace_name, packages);
    common::write_file(&workspace_file, &workspace_content, &mut files_created)?;

    // Generate settings.local.json
    let settings_file = claude_dir.join("settings.local.json");
    common::write_file(&settings_file, &common::generate_settings_json(), &mut files_created)?;

    // Generate CLAUDE.md
    let claude_md_file = workspace_path.join("CLAUDE.md");
    let claude_md_content = generate_claude_md(&workspace_name, packages);
    common::write_file(&claude_md_file, &claude_md_content, &mut files_created)?;

    // Generate .gitignore if missing
    let gitignore_file = workspace_path.join(".gitignore");
    common::write_file_if_missing(&gitignore_file, &common::generate_gitignore(), &mut files_created)?;

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

fn generate_claude_md(name: &str, packages: &[String]) -> String {
    let package_list: Vec<String> = packages.iter().map(|p| format!("- **{}**", p)).collect();

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

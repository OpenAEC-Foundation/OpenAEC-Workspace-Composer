mod generators;

use generators::common::{GenerateRequest, GenerateResult};

#[tauri::command]
fn generate_workspace(request: GenerateRequest) -> Result<GenerateResult, String> {
    match request.workflow_type.as_str() {
        "skill-package" => generators::skill_package::generate(&request),
        "version-upgrade" => generators::version_upgrade::generate(&request),
        _ => Err(format!("Unknown workflow type: {}", request.workflow_type)),
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

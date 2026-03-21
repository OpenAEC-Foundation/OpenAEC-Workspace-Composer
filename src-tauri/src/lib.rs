mod config_writer;
mod generators;
mod git;
mod gpu_server;
mod installer;
mod prerequisites;
mod registry;
mod skill_scanner;
mod workspace;

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
        .invoke_handler(tauri::generate_handler![
            generate_workspace,
            prerequisites::check_prerequisites,
            gpu_server::config::gpu_load_config,
            gpu_server::config::gpu_save_config,
            gpu_server::ssh::gpu_test_connection,
            gpu_server::ssh::gpu_server_status,
            gpu_server::ssh::gpu_list_remote_dirs,
            gpu_server::mutagen::gpu_check_mutagen,
            gpu_server::mutagen::gpu_sync_create,
            gpu_server::mutagen::gpu_sync_pause,
            gpu_server::mutagen::gpu_sync_resume,
            gpu_server::mutagen::gpu_sync_terminate,
            gpu_server::mutagen::gpu_sync_list,
            gpu_server::provisioning::gpu_provision_user,
            workspace::validate_path,
            workspace::create_directory,
            workspace::list_recent_workspaces,
            workspace::save_recent_workspace,
            registry::fetch_registry,
            registry::get_cached_registry,
            installer::list_package_skills,
            installer::scan_conflicts,
            installer::install_workspace,
            installer::open_in_vscode,
            config_writer::write_settings_json,
            config_writer::write_mcp_json,
            config_writer::write_claude_md,
            config_writer::read_settings_json,
            config_writer::read_mcp_json,
            config_writer::read_claude_md,
            config_writer::write_workspace_file,
            config_writer::read_workspace_file,
            config_writer::get_home_dir,
            git::git_init,
            git::git_status,
            git::git_stage_all,
            git::git_commit,
            git::git_push,
            git::git_log,
            git::git_branch,
            git::git_branches,
            git::git_create_gitignore,
            git::write_file,
            skill_scanner::scan_skill_package,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

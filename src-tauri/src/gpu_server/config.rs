use super::GpuServerState;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("gpu-server.json"))
}

#[tauri::command]
pub fn gpu_load_config(app: tauri::AppHandle) -> Result<GpuServerState, String> {
    let path = config_path(&app)?;
    if !path.exists() {
        return Ok(GpuServerState::default());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| format!("Invalid config: {}", e))
}

#[tauri::command]
pub fn gpu_save_config(app: tauri::AppHandle, state: GpuServerState) -> Result<(), String> {
    let path = config_path(&app)?;
    let json = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

pub mod config;
pub mod mutagen;
pub mod provisioning;
pub mod ssh;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuServerConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub ssh_key_path: String,
    /// Optional SSH config alias (e.g. "hetzner")
    pub ssh_config_host: Option<String>,
}

impl Default for GpuServerConfig {
    fn default() -> Self {
        Self {
            host: String::new(),
            port: 22,
            username: String::new(),
            ssh_key_path: String::new(),
            ssh_config_host: None,
        }
    }
}

impl GpuServerConfig {
    /// Build SSH target: either the alias or user@host
    pub fn ssh_target(&self) -> String {
        if let Some(alias) = &self.ssh_config_host {
            if !alias.is_empty() {
                return alias.clone();
            }
        }
        format!("{}@{}", self.username, self.host)
    }

    /// Build SSH command args (key + port + target)
    pub fn ssh_args(&self) -> Vec<String> {
        let mut args = vec![
            "-o".to_string(),
            "BatchMode=yes".to_string(),
            "-o".to_string(),
            "ConnectTimeout=10".to_string(),
        ];
        // Only add explicit key/port if not using alias
        if self.ssh_config_host.as_deref().unwrap_or("").is_empty() {
            if !self.ssh_key_path.is_empty() {
                args.push("-i".to_string());
                args.push(self.ssh_key_path.clone());
            }
            if self.port != 22 {
                args.push("-p".to_string());
                args.push(self.port.to_string());
            }
        }
        args.push(self.ssh_target());
        args
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncSession {
    pub id: String,
    pub project_name: String,
    pub local_path: String,
    pub remote_path: String,
    pub status: SyncStatus,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SyncStatus {
    Active,
    Paused,
    Disconnected,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatus {
    pub connected: bool,
    pub gpu_name: Option<String>,
    pub gpu_vram_used_mb: Option<u64>,
    pub gpu_vram_total_mb: Option<u64>,
    pub disk_used_gb: Option<f64>,
    pub disk_total_gb: Option<f64>,
    pub uptime: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuServerState {
    pub config: GpuServerConfig,
    pub sync_sessions: Vec<SyncSession>,
}

impl Default for GpuServerState {
    fn default() -> Self {
        Self {
            config: GpuServerConfig::default(),
            sync_sessions: Vec::new(),
        }
    }
}

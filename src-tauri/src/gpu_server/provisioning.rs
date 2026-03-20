use super::GpuServerConfig;
use std::process::Command;

#[tauri::command]
pub fn gpu_provision_user(
    config: GpuServerConfig,
    new_username: String,
    ssh_public_key: String,
) -> Result<String, String> {
    // This requires root access on the server
    let script = format!(
        r#"
set -e
USERNAME="{username}"
PUBKEY="{pubkey}"

# Create user if not exists
if id "$USERNAME" &>/dev/null; then
    echo "User $USERNAME already exists"
else
    useradd -m -s /bin/bash "$USERNAME"
    echo "User $USERNAME created"
fi

# Create workspace structure
mkdir -p "/home/$USERNAME/workspaces"
mkdir -p "/home/$USERNAME/.ssh"

# Install SSH key (append, don't overwrite)
if ! grep -qF "$PUBKEY" "/home/$USERNAME/.ssh/authorized_keys" 2>/dev/null; then
    echo "$PUBKEY" >> "/home/$USERNAME/.ssh/authorized_keys"
    echo "SSH key installed"
else
    echo "SSH key already present"
fi

# Fix permissions
chmod 700 "/home/$USERNAME/.ssh"
chmod 600 "/home/$USERNAME/.ssh/authorized_keys"
chown -R "$USERNAME:$USERNAME" "/home/$USERNAME"

echo "OK: User $USERNAME provisioned with workspace at /home/$USERNAME/workspaces/"
"#,
        username = new_username.replace('"', ""),
        pubkey = ssh_public_key.replace('"', ""),
    );

    let output = Command::new("ssh")
        .arg("-o").arg("BatchMode=yes")
        .arg("-o").arg("ConnectTimeout=10")
        .arg(&config.ssh_target())
        .arg(&script)
        .output()
        .map_err(|e| format!("SSH failed: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(format!("Provisioning failed: {}", stderr))
    }
}

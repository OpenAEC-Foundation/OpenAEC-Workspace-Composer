# tauri-impl-build-deploy: Working Examples

All examples based on Tauri 2 documentation and tauri-action GitHub repository.
Sources: https://v2.tauri.app/distribute/, https://github.com/tauri-apps/tauri-action

---

## Example 1: Minimal Production Build Configuration

```json
{
  "identifier": "com.example.myapp",
  "build": {
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "My App",
        "width": 800,
        "height": 600
      }
    ]
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

---

## Example 2: Resource Bundling with Sidecar

```json
{
  "bundle": {
    "resources": {
      "assets/fonts/": "fonts/",
      "assets/templates/": "templates/",
      "config/defaults.toml": "config/defaults.toml"
    },
    "externalBin": [
      "binaries/ffmpeg",
      "binaries/imagemagick"
    ]
  }
}
```

Access at runtime:

```typescript
import { resolveResource } from '@tauri-apps/api/path';
import { Command } from '@tauri-apps/plugin-shell';

// Access bundled resource
const fontPath = await resolveResource('fonts/Inter.ttf');

// Spawn sidecar binary
const output = await Command.sidecar('binaries/ffmpeg', [
  '-i', 'input.mp4', '-o', 'output.webm'
]).execute();
```

---

## Example 3: Windows NSIS Installer with Code Signing

```json
{
  "bundle": {
    "targets": ["nsis"],
    "windows": {
      "certificateThumbprint": "A1B1A2B2A3B3A4B4A5B5A6B6A7B7A8B8A9B9A0B0",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.comodoca.com",
      "nsis": {
        "displayLanguageSelector": true,
        "installerIcon": "icons/icon.ico",
        "headerImage": "icons/nsis-header.bmp",
        "sidebarImage": "icons/nsis-sidebar.bmp"
      },
      "webviewInstallMode": "downloadBootstrapper",
      "allowDowngrades": false
    }
  }
}
```

---

## Example 4: Azure Key Vault Signing (Windows)

```json
{
  "bundle": {
    "windows": {
      "signCommand": "relic sign --file %1 --key azure --config relic.conf"
    }
  }
}
```

---

## Example 5: macOS Signing with Notarization

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Example Inc (TEAMID123)",
      "hardenedRuntime": true,
      "minimumSystemVersion": "10.13",
      "dmg": {
        "appPosition": { "x": 180, "y": 170 },
        "applicationFolderPosition": { "x": 480, "y": 170 },
        "windowSize": { "width": 660, "height": 400 }
      }
    }
  }
}
```

Environment variables for notarization:

```bash
export APPLE_API_ISSUER="your-issuer-id"
export APPLE_API_KEY="your-key-id"
export APPLE_API_KEY_PATH="/path/to/AuthKey_XXXX.p8"
```

---

## Example 6: Complete Auto-Updater Setup

**tauri.conf.json:**

```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmls...",
      "endpoints": [
        "https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

**Rust initialization (lib.rs):**

```rust
use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Some(update) = handle.updater().unwrap().check().await.unwrap() {
                    update.download_and_install(
                        |chunk, total| println!("Progress: {chunk}/{total:?}"),
                        || println!("Done"),
                    ).await.unwrap();
                    handle.restart();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

**JavaScript update check with UI feedback:**

```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

async function checkForUpdates() {
  const update = await check();
  if (!update) {
    console.log('No update available');
    return;
  }

  console.log(`Update ${update.version} available`);

  let totalBytes = 0;
  let downloadedBytes = 0;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        totalBytes = event.data.contentLength ?? 0;
        break;
      case 'Progress':
        downloadedBytes += event.data.chunkLength;
        const percent = totalBytes > 0
          ? Math.round((downloadedBytes / totalBytes) * 100)
          : 0;
        console.log(`Progress: ${percent}%`);
        break;
      case 'Finished':
        console.log('Download complete, restarting...');
        break;
    }
  });

  await relaunch();
}
```

---

## Example 7: Static Update Server Response (GitHub Releases)

```json
{
  "version": "2.0.0",
  "notes": "New features and bug fixes",
  "pub_date": "2026-03-15T10:30:00Z",
  "platforms": {
    "linux-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://github.com/user/repo/releases/download/v2.0.0/app_2.0.0_amd64.AppImage.tar.gz"
    },
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://github.com/user/repo/releases/download/v2.0.0/app_2.0.0_x64-setup.exe"
    },
    "darwin-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://github.com/user/repo/releases/download/v2.0.0/app_2.0.0_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://github.com/user/repo/releases/download/v2.0.0/app_2.0.0_aarch64.app.tar.gz"
    }
  }
}
```

---

## Example 8: Windows Code Signing in GitHub Actions

```yaml
- name: Import Windows certificate
  if: matrix.platform == 'windows-latest'
  env:
    WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
    WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
  run: |
    New-Item -ItemType directory -Path certificate
    Set-Content -Path certificate/tempCert.txt -Value $env:WINDOWS_CERTIFICATE
    certutil -decode certificate/tempCert.txt certificate/certificate.pfx
    Import-PfxCertificate -FilePath certificate/certificate.pfx -CertStoreLocation Cert:\CurrentUser\My -Password (ConvertTo-SecureString -String $env:WINDOWS_CERTIFICATE_PASSWORD -Force -AsPlainText)
```

---

## Example 9: Updater Capability Configuration

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "updater-capability",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": [
    "updater:default",
    "process:allow-restart"
  ]
}
```

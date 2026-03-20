# tauri-errors-build: Working Build Configurations

All examples verified against Tauri 2.x documentation.
Sources: v2.tauri.app/distribute/, vooronderzoek-tauri.md sections 6, 7

---

## Example 1: Minimal Viable tauri.conf.json

```json
{
  "$schema": "./gen/schemas/desktop-schema.json",
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

## Example 2: Cargo.toml for Mobile-Ready Project

```toml
[package]
name = "app"
version = "0.1.0"
edition = "2021"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"
tokio = { version = "1", features = ["full"] }
```

---

## Example 3: GitHub Actions Cross-Platform Build

```yaml
name: Release
on:
  push:
    branches: [release]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: --target aarch64-apple-darwin
          - platform: macos-latest
            args: --target x86_64-apple-darwin
          - platform: ubuntu-22.04
            args: ''
          - platform: windows-latest
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Install Linux dependencies
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Install frontend dependencies
        run: npm install

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: app-v__VERSION__
          releaseName: 'App v__VERSION__'
          releaseBody: 'See the assets to download and install.'
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

---

## Example 4: Windows Code Signing Configuration

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "A1B1A2B2A3B3A4B4A5B5A6B6A7B7A8B8A9B9A0B0",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.comodoca.com"
    }
  }
}
```

GitHub Actions certificate import step:

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

## Example 5: macOS Signing and Notarization

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAMID)",
      "hardenedRuntime": true,
      "minimumSystemVersion": "10.13"
    }
  }
}
```

Required CI environment variables:
- `APPLE_CERTIFICATE` (base64 .p12)
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `KEYCHAIN_PASSWORD`
- `APPLE_API_ISSUER` + `APPLE_API_KEY` + `APPLE_API_KEY_PATH` (for notarization)

Ad-hoc signing for testing (no Apple Developer account):

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "-"
    }
  }
}
```

---

## Example 6: Auto-Updater Configuration

```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "endpoints": [
        "https://releases.myapp.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

Generate signing keys:

```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

Set in CI:

```bash
export TAURI_SIGNING_PRIVATE_KEY="content-or-path-to-key"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
```

---

## Example 7: Resource Bundling with External Binaries

```json
{
  "bundle": {
    "resources": {
      "models/": "models/",
      "config.toml": "config.toml"
    },
    "externalBin": [
      "binaries/ffmpeg"
    ]
  }
}
```

Access bundled resources at runtime:

```rust
use tauri::Manager;

.setup(|app| {
    let resource_path = app.path().resource_dir()?.join("models/default.bin");
    Ok(())
})
```

---

## Example 8: Mobile-Ready Entry Points

```rust
// src-tauri/src/lib.rs
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```rust
// src-tauri/src/main.rs
fn main() {
    app_lib::run();
}
```

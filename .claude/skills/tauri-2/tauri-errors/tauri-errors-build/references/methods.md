# tauri-errors-build: Build Commands & Configuration Reference

Sources: v2.tauri.app/start/prerequisites/, v2.tauri.app/distribute/, vooronderzoek-tauri.md sections 6, 7

---

## CLI Build Commands

| Command | Purpose |
|---------|---------|
| `tauri build` | Full production build (frontend + Rust + bundler) |
| `tauri build --no-bundle` | Compile without creating installers |
| `tauri build --debug` | Debug build with devtools enabled |
| `tauri build --target <triple>` | Cross-compile for specific target |
| `tauri bundle --bundles app,dmg` | Bundle specific formats only |
| `tauri bundle --config path/alt.conf.json` | Use alternate config |
| `tauri android build` | Android production build |
| `tauri ios build` | iOS production build |
| `tauri android init` | Initialize Android project structure |
| `tauri ios init` | Initialize iOS project structure |
| `tauri info` | Print environment diagnostics |
| `tauri signer generate -- -w path/key` | Generate updater signing keypair |

---

## Environment Variables

### Code Signing

| Variable | Platform | Purpose |
|----------|----------|---------|
| `APPLE_SIGNING_IDENTITY` | macOS | Code signing identity string |
| `APPLE_CERTIFICATE` | macOS CI | Base64-encoded .p12 certificate |
| `APPLE_CERTIFICATE_PASSWORD` | macOS CI | Certificate export password |
| `KEYCHAIN_PASSWORD` | macOS CI | Temporary keychain password |
| `APPLE_API_ISSUER` | macOS | App Store Connect API issuer ID |
| `APPLE_API_KEY` | macOS | App Store Connect API key ID |
| `APPLE_API_KEY_PATH` | macOS | Path to .p8 API key file |
| `APPLE_ID` | macOS | Apple ID for notarization (legacy) |
| `APPLE_PASSWORD` | macOS | App-specific password (legacy) |
| `APPLE_TEAM_ID` | macOS | Apple Developer team ID |
| `WINDOWS_CERTIFICATE` | Windows CI | Base64-encoded .pfx certificate |
| `WINDOWS_CERTIFICATE_PASSWORD` | Windows CI | PFX export password |

### Updater

| Variable | Purpose |
|----------|---------|
| `TAURI_SIGNING_PRIVATE_KEY` | Path or content of updater private key |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the private key |

---

## tauri.conf.json Build Section

```json
{
  "build": {
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "beforeBundleCommand": "",
    "features": [],
    "additionalWatchFolders": [],
    "removeUnusedCommands": false
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `devUrl` | `string` | Dev server URL for `tauri dev` |
| `frontendDist` | `string` | Path to compiled frontend assets for production |
| `beforeDevCommand` | `string \| object` | Shell command before `tauri dev` |
| `beforeBuildCommand` | `string \| object` | Shell command before `tauri build` |
| `beforeBundleCommand` | `string \| object` | Shell command before bundling phase |
| `features` | `string[]` | Cargo feature flags to enable |
| `removeUnusedCommands` | `boolean` | Strip unused commands based on ACL config |

---

## Bundle Section

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"],
    "identifier": "com.example.myapp",
    "resources": {},
    "externalBin": [],
    "createUpdaterArtifacts": false,
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "",
      "webviewInstallMode": "downloadBootstrapper",
      "signCommand": null
    },
    "macOS": {
      "hardenedRuntime": true,
      "minimumSystemVersion": "10.13",
      "signingIdentity": null
    },
    "linux": {
      "deb": {},
      "rpm": {},
      "appimage": { "bundleMediaFramework": false }
    },
    "iOS": { "minimumSystemVersion": "14.0" },
    "android": { "minSdkVersion": 24 }
  }
}
```

---

## Platform Bundle Formats

| Platform | Format | File Extension | Tool |
|----------|--------|---------------|------|
| Windows | NSIS installer | `.exe` | NSIS |
| Windows | MSI installer | `.msi` | WiX Toolset |
| macOS | App bundle | `.app` | Xcode tools |
| macOS | DMG disk image | `.dmg` | hdiutil |
| Linux | AppImage | `.AppImage` | appimagetool |
| Linux | Debian package | `.deb` | dpkg-deb |
| Linux | RPM package | `.rpm` | rpmbuild |
| Android | APK | `.apk` | Android SDK |
| Android | App Bundle | `.aab` | Android SDK |
| iOS | IPA | `.ipa` | Xcode |

---

## Updater Artifact Signatures

| Platform | Update Artifact | Signature File |
|----------|----------------|----------------|
| Linux | `.AppImage.tar.gz` | `.AppImage.tar.gz.sig` |
| macOS | `.app.tar.gz` | `.app.tar.gz.sig` |
| Windows | `.exe` or `.msi` | `.exe.sig` or `.msi.sig` |

---

## Required Linux System Dependencies

### Ubuntu/Debian

```bash
sudo apt-get install -y \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    libfuse2
```

### Required Rust Targets by Platform

| Platform | Rust Target Triple |
|----------|-------------------|
| macOS (Apple Silicon) | `aarch64-apple-darwin` |
| macOS (Intel) | `x86_64-apple-darwin` |
| Linux (x86_64) | `x86_64-unknown-linux-gnu` |
| Linux (ARM64) | `aarch64-unknown-linux-gnu` |
| Windows (x86_64) | `x86_64-pc-windows-msvc` |
| Android (ARM64) | `aarch64-linux-android` |
| Android (ARMv7) | `armv7-linux-androideabi` |
| Android (x86) | `i686-linux-android` |
| Android (x86_64) | `x86_64-linux-android` |
| iOS (ARM64) | `aarch64-apple-ios` |
| iOS (Simulator ARM) | `aarch64-apple-ios-sim` |
| iOS (Simulator Intel) | `x86_64-apple-ios` |

---

## Mobile Prerequisites

### Android

- Android Studio with: SDK Platform, Platform-Tools, NDK, Build-Tools, Command-line Tools
- Environment: `JAVA_HOME`, `ANDROID_HOME`, `NDK_HOME`
- Cargo.toml: `crate-type = ["staticlib", "cdylib", "rlib"]`

### iOS (macOS only)

- Full Xcode installation (not just Command Line Tools)
- Cocoapods: `brew install cocoapods`
- Cargo.toml: `crate-type = ["staticlib", "cdylib", "rlib"]`

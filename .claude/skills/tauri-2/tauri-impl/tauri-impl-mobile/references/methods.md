# tauri-impl-mobile: API & CLI Reference

Sources: https://v2.tauri.app/start/prerequisites/,
https://v2.tauri.app/develop/mobile/,
vooronderzoek-tauri.md Section 7

---

## CLI Commands

### Initialization

```bash
# Initialize Android project (generates src-tauri/gen/android/)
tauri android init

# Initialize iOS project (generates src-tauri/gen/apple/)
# Requires macOS with Xcode
tauri ios init
```

### Development

```bash
# Run on Android emulator or connected device
tauri android dev

# Run on iOS simulator or connected device
tauri ios dev

# Specify a device
tauri android dev --device <device-id>
tauri ios dev --device <device-id>

# Open in Android Studio / Xcode for native debugging
tauri android dev --open
tauri ios dev --open
```

### Production Builds

```bash
# Build Android APK/AAB
tauri android build

# Build iOS IPA
tauri ios build

# Build for specific architecture
tauri android build --target aarch64
tauri ios build --target aarch64-apple-ios
```

---

## Rust cfg Attributes

### Platform Groups

```rust
// Matches Android and iOS
#[cfg(mobile)]

// Matches Windows, macOS, Linux
#[cfg(desktop)]
```

### Specific OS Targets

```rust
#[cfg(target_os = "android")]
#[cfg(target_os = "ios")]
#[cfg(target_os = "windows")]
#[cfg(target_os = "macos")]
#[cfg(target_os = "linux")]
```

### Conditional Attribute Application

```rust
// Apply mobile_entry_point only on mobile targets
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() { /* ... */ }
```

### Conditional Compilation in generate_handler

```rust
tauri::generate_handler![
    shared_command,
    #[cfg(desktop)]
    desktop_only_command,
    #[cfg(mobile)]
    mobile_only_command,
]
```

### Conditional Dependencies in Cargo.toml

```toml
[target.'cfg(target_os = "android")'.dependencies]
jni = "0.21"

[target.'cfg(target_os = "ios")'.dependencies]
objc = "0.2"
```

---

## Cargo.toml Configuration

### Library Section

```toml
[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

| Crate Type | Output | Required For |
|------------|--------|--------------|
| `staticlib` | `.a` (static archive) | iOS static linking |
| `cdylib` | `.so` / `.dylib` (C dynamic lib) | Android JNI loading |
| `rlib` | Rust lib (internal) | Desktop `main.rs` import |

---

## Entry Points

### lib.rs (Shared Entry Point)

```rust
// src-tauri/src/lib.rs
// The #[cfg_attr] applies tauri::mobile_entry_point ONLY on mobile builds
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![/* commands */])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### main.rs (Desktop Entry Point)

```rust
// src-tauri/src/main.rs
// Prevents console window on Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
```

The `app_lib` name matches `[lib] name = "app_lib"` in `Cargo.toml`.

---

## tauri.conf.json — Mobile Bundle Configuration

### iOS Configuration

```json
{
  "bundle": {
    "iOS": {
      "minimumSystemVersion": "14.0"
    }
  }
}
```

### Android Configuration

```json
{
  "bundle": {
    "android": {
      "minSdkVersion": 24,
      "versionCode": 1
    }
  }
}
```

---

## Rust Targets for Cross-Compilation

### Android Targets

| Target Triple | Architecture | Devices |
|---------------|-------------|---------|
| `aarch64-linux-android` | ARM64 | Modern phones/tablets |
| `armv7-linux-androideabi` | ARM32 | Older devices |
| `i686-linux-android` | x86 | Some emulators |
| `x86_64-linux-android` | x86_64 | Most emulators |

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### iOS Targets

| Target Triple | Architecture | Devices |
|---------------|-------------|---------|
| `aarch64-apple-ios` | ARM64 | Physical iPhones/iPads |
| `x86_64-apple-ios` | x86_64 | Intel Mac simulator |
| `aarch64-apple-ios-sim` | ARM64 | Apple Silicon simulator |

```bash
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
```

---

## Environment Variables

### Android

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `JAVA_HOME` | `/usr/lib/jvm/java-17-openjdk` | JDK location |
| `ANDROID_HOME` | `~/Android/Sdk` | Android SDK root |
| `NDK_HOME` | `$ANDROID_HOME/ndk/26.1.10909125` | NDK location |

### iOS

No special environment variables required. Xcode must be installed and selected:

```bash
xcode-select --install
sudo xcode-select --switch /Applications/Xcode.app
```

---

## Mobile-Specific Plugins

Some official plugins have mobile-specific capabilities:

| Plugin | Mobile Feature |
|--------|---------------|
| `tauri-plugin-barcode-scanner` | QR/barcode scanning (camera) |
| `tauri-plugin-biometric` | Fingerprint/face authentication |
| `tauri-plugin-geolocation` | GPS location tracking |
| `tauri-plugin-haptics` | Vibration/haptic feedback |
| `tauri-plugin-nfc` | NFC tag read/write |
| `tauri-plugin-notification` | Push notifications (with channels on Android) |

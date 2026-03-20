# tauri-impl-mobile: Anti-Patterns

These are confirmed error patterns from Tauri 2 mobile development. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/start/prerequisites/
- https://v2.tauri.app/develop/mobile/
- vooronderzoek-tauri.md Section 7, Section 10

---

## AP-001: No lib.rs Split for Mobile

**WHY this is wrong**: Mobile platforms (Android, iOS) load the Tauri app as a library, not as a standalone binary. Without `lib.rs`, the mobile runtime has no entry point to call. The project compiles for desktop but fails on mobile.

```
// WRONG -- desktop-only structure
src-tauri/src/
  main.rs    # All logic here, no lib.rs
```

```
// CORRECT -- split structure
src-tauri/src/
  lib.rs     # All shared logic, with #[cfg_attr(mobile, tauri::mobile_entry_point)]
  main.rs    # Minimal: fn main() { app_lib::run(); }
```

ALWAYS restructure into `lib.rs` + `main.rs` when targeting mobile.

---

## AP-002: Missing crate-type in Cargo.toml

**WHY this is wrong**: Without the correct `crate-type` array, the Rust compiler does not produce the output format needed by each platform. iOS needs `staticlib`, Android needs `cdylib`, desktop needs `rlib`.

```toml
# WRONG -- no [lib] section or incomplete crate-type
[lib]
name = "app_lib"
crate-type = ["rlib"]  # Missing staticlib and cdylib!
```

```toml
# CORRECT -- all three types
[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

ALWAYS include all three crate types: `staticlib`, `cdylib`, `rlib`.

---

## AP-003: Missing mobile_entry_point Attribute

**WHY this is wrong**: The `#[cfg_attr(mobile, tauri::mobile_entry_point)]` attribute generates the platform-specific entry point that Android/iOS use to start the application. Without it, the mobile app compiles but crashes on startup with no clear error.

```rust
// WRONG -- missing the attribute
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error");
}
```

```rust
// CORRECT -- attribute present
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error");
}
```

ALWAYS add `#[cfg_attr(mobile, tauri::mobile_entry_point)]` to the `run()` function in `lib.rs`.

---

## AP-004: Using Desktop-Only Features Without cfg Guards

**WHY this is wrong**: Features like system tray, global shortcuts, and window decorations are not available on mobile platforms. Using them without `#[cfg(desktop)]` guards causes compilation errors on mobile targets.

```rust
// WRONG -- compiles on desktop, fails on mobile
use tauri::tray::TrayIconBuilder;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            TrayIconBuilder::new().build(app)?; // Not available on mobile!
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error");
}
```

```rust
// CORRECT -- guarded with cfg
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::tray::TrayIconBuilder;
                TrayIconBuilder::new().build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error");
}
```

ALWAYS guard desktop-only code with `#[cfg(desktop)]` or `#[cfg(not(mobile))]`.

---

## AP-005: Not Installing Rust Targets Before Building

**WHY this is wrong**: Without the correct Rust cross-compilation targets installed, `tauri android dev` or `tauri ios dev` fails with cryptic linker errors about missing targets.

```bash
# WRONG -- running mobile build without targets
tauri android dev
# Error: target 'aarch64-linux-android' not found
```

```bash
# CORRECT -- install targets first
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# Then build
tauri android dev
tauri ios dev
```

ALWAYS install the required Rust targets before running mobile builds.

---

## AP-006: Missing Environment Variables for Android

**WHY this is wrong**: The Android build toolchain requires `JAVA_HOME`, `ANDROID_HOME`, and `NDK_HOME` to locate the JDK, SDK, and NDK respectively. Missing variables cause build failures with unhelpful errors about missing tools.

```bash
# WRONG -- no environment variables set
tauri android dev
# Error: could not find Android SDK or NDK
```

```bash
# CORRECT -- set all required variables
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk"
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/26.1.10909125"

# Verify
echo $JAVA_HOME $ANDROID_HOME $NDK_HOME

# Then build
tauri android dev
```

ALWAYS configure `JAVA_HOME`, `ANDROID_HOME`, and `NDK_HOME` before Android development.

---

## AP-007: Using Desktop Window Features on Mobile

**WHY this is wrong**: Mobile apps do not support multiple windows, window repositioning, system tray, or custom window decorations. Calling these APIs on mobile either fails silently or throws errors.

```rust
// WRONG -- desktop window API on mobile
#[tauri::command]
fn resize_window(window: tauri::WebviewWindow) {
    window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(800.0, 600.0))).unwrap();
    window.center().unwrap(); // No effect or error on mobile
}
```

```rust
// CORRECT -- guard with platform check
#[tauri::command]
fn resize_window(window: tauri::WebviewWindow) -> Result<(), String> {
    #[cfg(desktop)]
    {
        window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(800.0, 600.0)))
            .map_err(|e| e.to_string())?;
        window.center().map_err(|e| e.to_string())?;
    }

    #[cfg(mobile)]
    {
        // Mobile: window is always fullscreen, nothing to do
    }

    Ok(())
}
```

ALWAYS use `#[cfg(desktop)]` guards around window manipulation that is not meaningful on mobile.

---

## AP-008: Running ios Commands on Non-macOS

**WHY this is wrong**: iOS development requires macOS with Xcode. Running `tauri ios init` or `tauri ios dev` on Linux or Windows fails. There is no workaround -- iOS builds require a Mac.

```bash
# WRONG -- running on Windows/Linux
tauri ios init
# Error: iOS development requires macOS
```

ALWAYS use macOS for iOS development. There is no cross-platform alternative for iOS builds.

---

## AP-009: Forgetting to Run tauri android/ios init

**WHY this is wrong**: The `init` command generates platform-specific project files (Android Gradle project, iOS Xcode project) in `src-tauri/gen/`. Without these files, `dev` and `build` commands have no project to build.

```bash
# WRONG -- skipping init
tauri android dev
# Error: Android project not found
```

```bash
# CORRECT -- init first, then dev
tauri android init
tauri android dev
```

ALWAYS run `tauri android init` / `tauri ios init` before the first `dev` or `build`.

---

## AP-010: Mismatched lib name Between Cargo.toml and main.rs

**WHY this is wrong**: The `name` in `[lib]` determines the crate name used in `main.rs`. A mismatch causes "unresolved import" compilation errors.

```toml
# Cargo.toml
[lib]
name = "app_lib"
```

```rust
// WRONG -- using wrong crate name in main.rs
fn main() {
    my_app::run(); // Error: unresolved import `my_app`
}
```

```rust
// CORRECT -- matches Cargo.toml [lib] name
fn main() {
    app_lib::run();
}
```

ALWAYS ensure `main.rs` imports match the `[lib] name` in `Cargo.toml`.

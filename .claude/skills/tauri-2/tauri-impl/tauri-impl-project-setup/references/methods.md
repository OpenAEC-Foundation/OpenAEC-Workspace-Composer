# tauri-impl-project-setup: CLI Commands and Configuration Reference

Sources: https://v2.tauri.app/start/create-project/,
https://v2.tauri.app/reference/config/,
https://v2.tauri.app/develop/

---

## Tauri CLI Commands

**Installation:** `npm install -D @tauri-apps/cli` (included in scaffolded projects)

### Development

```bash
tauri dev [OPTIONS]
```

Starts the app in development mode with hot-reload.

| Option | Description |
|--------|-------------|
| `--release` | Run in release mode |
| `--target <TARGET>` | Cargo build target triple |
| `--features <FEATURES>` | Cargo feature flags |
| `--no-watch` | Disable file watching |
| `--port <PORT>` | Override devUrl port |
| `--host <HOST>` | Override devUrl host |
| `--no-dev-server-wait` | Do not wait for dev server to start |

### Building

```bash
tauri build [OPTIONS]
```

Builds the app for production distribution.

| Option | Description |
|--------|-------------|
| `--debug` | Build with debug symbols |
| `--target <TARGET>` | Target triple (e.g., `x86_64-pc-windows-msvc`) |
| `--features <FEATURES>` | Cargo feature flags |
| `--bundles <BUNDLES>` | Specific bundle types: `deb`, `rpm`, `appimage`, `msi`, `nsis`, `dmg`, `app` |
| `--ci` | Skip signing in CI |
| `--no-bundle` | Skip bundling step |
| `--config <CONFIG>` | JSON config string or path to merge |

### Icon Generation

```bash
tauri icon [OPTIONS] <INPUT>
```

Generates all required icon sizes from a source image (1024x1024 PNG recommended).

| Option | Description |
|--------|-------------|
| `-o, --output <DIR>` | Output directory (default: `src-tauri/icons`) |
| `-p, --png <SIZES>` | PNG sizes to generate |

### Plugin Management

```bash
tauri plugin add <PLUGIN>     # Add a plugin
tauri plugin new <NAME>       # Create a new plugin project
tauri plugin init             # Initialize plugin in current dir
```

### Signer

```bash
tauri signer generate         # Generate signing keypair
tauri signer sign <FILE>      # Sign a file
```

### Other Commands

```bash
tauri info                    # Show environment info (useful for debugging)
tauri init                    # Initialize Tauri in an existing project
tauri completions <SHELL>     # Generate shell completions
tauri migrate                 # Migrate from Tauri v1 to v2
```

---

## create-tauri-app Options

The scaffolding tool supports these frontend frameworks:

| Template | Language | Bundler | Dev Server Port |
|----------|----------|---------|-----------------|
| `vanilla` | JS/TS | Vite | 5173 |
| `react` | JS/TS | Vite | 5173 |
| `vue` | JS/TS | Vite | 5173 |
| `svelte` | JS/TS | Vite | 5173 |
| `solid` | JS/TS | Vite | 5173 |
| `angular` | TS | Angular CLI | 4200 |
| `preact` | JS/TS | Vite | 5173 |
| `next` | JS/TS | Next.js | 3000 |
| `leptos` | Rust | Trunk | 8080 |
| `sycamore` | Rust | Trunk | 8080 |
| `yew` | Rust | Trunk | 8080 |

---

## Cargo.toml Reference

### Required Sections

```toml
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

# Required for mobile builds
[lib]
name = "my_app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

### Crate Types Explained

| Type | Purpose |
|------|---------|
| `staticlib` | iOS builds (static library) |
| `cdylib` | Android builds (dynamic library) |
| `rlib` | Desktop builds (Rust library) |

### Common Tauri Features

```toml
[dependencies]
tauri = { version = "2", features = [
    "devtools",        # Enable DevTools in debug builds
    "tray-icon",       # System tray support
    "image-png",       # PNG image support for tray/menus
    "image-ico",       # ICO image support
] }
```

### Common Plugin Dependencies

```toml
[dependencies]
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
tauri-plugin-http = "2"
tauri-plugin-shell = "2"
tauri-plugin-notification = "2"
tauri-plugin-os = "2"
tauri-plugin-process = "2"
tauri-plugin-opener = "2"
tauri-plugin-store = "2"
tauri-plugin-updater = "2"
```

---

## tauri.conf.json Schema

### Top Level

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `$schema` | `string` | No | -- | JSON schema for IDE support |
| `identifier` | `string` | **Yes** | -- | Reverse-domain app ID |
| `productName` | `string` | No | `null` | Display name |
| `version` | `string` | No | `null` | Semver or path to package.json |
| `mainBinaryName` | `string` | No | `null` | Override binary filename |
| `build` | `object` | No | `{}` | Build configuration |
| `app` | `object` | No | `{}` | Runtime configuration |
| `bundle` | `object` | No | `{}` | Distribution configuration |
| `plugins` | `object` | No | `{}` | Plugin configuration |

### build Section

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `devUrl` | `string` | `null` | Dev server URL |
| `frontendDist` | `string\|string[]` | `null` | Built frontend asset path |
| `beforeDevCommand` | `string\|object` | `""` | Command before tauri dev |
| `beforeBuildCommand` | `string\|object` | `""` | Command before tauri build |
| `beforeBundleCommand` | `string\|object` | `""` | Command before bundling |
| `features` | `string[]` | `null` | Cargo features |
| `additionalWatchFolders` | `string[]` | `[]` | Extra paths to watch in dev |

### app Section

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `windows` | `WindowConfig[]` | `[]` | Startup windows |
| `security` | `SecurityConfig` | `{}` | CSP, capabilities, patterns |
| `trayIcon` | `TrayIconConfig` | `null` | System tray configuration |
| `withGlobalTauri` | `boolean` | `false` | Inject `window.__TAURI__` |
| `enableGTKAppId` | `boolean` | `false` | Use identifier as GTK app ID |
| `macOSPrivateApi` | `boolean` | `false` | macOS private APIs |

### bundle Section

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `active` | `boolean` | `true` | Enable bundling |
| `targets` | `string\|string[]` | `"all"` | Target platforms |
| `icon` | `string[]` | `[]` | Icon file paths |
| `resources` | `object` | `{}` | Extra files to bundle |
| `externalBin` | `string[]` | `[]` | Sidecar binaries |
| `category` | `string` | `""` | App store category |
| `identifier` | `string` | -- | Bundle identifier |
| `createUpdaterArtifacts` | `boolean\|string` | `false` | Generate update signatures |

---

## build.rs Reference

### Default build.rs

```rust
fn main() {
    tauri_build::build();
}
```

### With Plugin Permission Generation

```rust
const COMMANDS: &[&str] = &["my_command", "another_command"];

fn main() {
    tauri_build::build();
}
```

### With Custom Plugin

```rust
fn main() {
    tauri_plugin::Builder::new(&["do_something", "get_status"])
        .build();
}
```

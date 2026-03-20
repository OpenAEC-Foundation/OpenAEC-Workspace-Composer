# tauri-impl-build-deploy: API Method Reference

Sources: https://v2.tauri.app/distribute/, https://v2.tauri.app/plugin/updater/,
https://github.com/tauri-apps/tauri-action

---

## Build CLI Commands

### tauri build

```bash
tauri build                    # Full production build with bundling
tauri build --no-bundle        # Compile only, skip installer creation
tauri build --debug            # Build with debug profile
tauri build --target <triple>  # Cross-compile (e.g., aarch64-apple-darwin)
tauri build --config <path>    # Use alternate tauri.conf.json
tauri build --features <list>  # Enable Cargo feature flags
```

### tauri bundle

```bash
tauri bundle --bundles app            # macOS .app only
tauri bundle --bundles dmg            # macOS DMG
tauri bundle --bundles app,dmg        # Multiple formats
tauri bundle --bundles nsis           # Windows NSIS installer
tauri bundle --bundles msi            # Windows MSI (WiX)
tauri bundle --bundles deb            # Linux Debian package
tauri bundle --bundles rpm            # Linux RPM package
tauri bundle --bundles appimage       # Linux AppImage
```

### tauri signer

```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key    # Generate keypair
npm run tauri signer sign <file> -- -k <private-key>      # Sign a file
```

---

## Bundle Configuration (tauri.conf.json)

### Top-Level Bundle Properties

| Property | Type | Description |
|----------|------|-------------|
| `active` | `boolean` | Enable/disable bundling |
| `targets` | `string \| string[]` | `"all"`, or specific: `"nsis"`, `"msi"`, `"dmg"`, `"app"`, `"deb"`, `"rpm"`, `"appimage"` |
| `icon` | `string[]` | Icon file paths (multiple sizes required) |
| `resources` | `object` | Additional files/directories to bundle (key=source, value=dest) |
| `externalBin` | `string[]` | External binaries to embed as sidecars |
| `identifier` | `string` | Reverse domain identifier |
| `category` | `string` | App category (e.g., `"Utility"`, `"Productivity"`) |
| `copyright` | `string` | Copyright notice |
| `publisher` | `string` | Publisher name |
| `license` | `string` | SPDX license identifier |
| `licenseFile` | `string` | Path to license file |
| `createUpdaterArtifacts` | `boolean \| "v1Compatible"` | Generate update signatures |
| `fileAssociations` | `array` | File type associations |

### Windows Bundle Properties (`bundle.windows`)

| Property | Type | Description |
|----------|------|-------------|
| `certificateThumbprint` | `string \| null` | Certificate thumbprint for Authenticode |
| `digestAlgorithm` | `string` | Hash algorithm (typically `"sha256"`) |
| `timestampUrl` | `string` | Timestamp server URL |
| `signCommand` | `string` | Custom signing command (`%1` = file path placeholder) |
| `webviewInstallMode` | `string` | `"downloadBootstrapper"` or `"offlineInstallerFromUrl"` |
| `allowDowngrades` | `boolean` | Permit version downgrades |
| `nsis` | `object` | NSIS installer configuration |
| `wix` | `object` | WiX (MSI) configuration |

### macOS Bundle Properties (`bundle.macOS`)

| Property | Type | Description |
|----------|------|-------------|
| `signingIdentity` | `string \| null` | Code signing identity (or `"-"` for ad-hoc) |
| `hardenedRuntime` | `boolean` | Enable hardened runtime (default: true) |
| `minimumSystemVersion` | `string` | Minimum macOS version (default: `"10.13"`) |
| `dmg` | `object` | DMG configuration (window size, positions) |

### Linux Bundle Properties (`bundle.linux`)

| Property | Type | Description |
|----------|------|-------------|
| `deb` | `object` | Debian package configuration |
| `rpm` | `object` | RPM package configuration |
| `appimage.bundleMediaFramework` | `boolean` | Bundle GStreamer (default: false) |

---

## Updater Plugin API

### JavaScript API (`@tauri-apps/plugin-updater`)

```typescript
import { check } from '@tauri-apps/plugin-updater';

// check() options
interface CheckOptions {
  proxy?: string;
  timeout?: number;
  headers?: Record<string, string>;
  target?: string;
}

// Update object returned by check()
interface Update {
  version: string;
  date?: string;
  body?: string;
  downloadAndInstall(onEvent?: (event: DownloadEvent) => void): Promise<void>;
}

// Download events
type DownloadEvent =
  | { event: 'Started'; data: { contentLength?: number } }
  | { event: 'Progress'; data: { chunkLength: number } }
  | { event: 'Finished' };
```

### Rust API (`tauri-plugin-updater`)

```rust
use tauri_plugin_updater::UpdaterExt;

// Check for update
let update = app.updater()?.check().await?;

// Download and install
update.download_and_install(
    |chunk_length, content_length| { /* progress */ },
    || { /* finished */ },
).await?;

// Restart the app
app.restart();
```

### Updater Configuration (`plugins.updater` in tauri.conf.json)

| Property | Type | Description |
|----------|------|-------------|
| `pubkey` | `string` | Public key for signature verification |
| `endpoints` | `string[]` | Update server URLs (supports `{{target}}`, `{{arch}}`, `{{current_version}}`) |
| `windows.installMode` | `string` | `"passive"` (default), `"basicUi"`, `"quiet"` |

---

## tauri-action (GitHub Actions)

### Key Inputs

| Input | Description |
|-------|-------------|
| `tagName` | Git tag name (`__VERSION__` auto-replaced) |
| `releaseName` | GitHub release title |
| `releaseBody` | Release description |
| `releaseDraft` | Create as draft (boolean) |
| `prerelease` | Mark as pre-release (boolean) |
| `args` | Additional CLI arguments (e.g., `--target aarch64-apple-darwin`) |
| `projectPath` | Path to Tauri project root |
| `tauriScript` | Custom tauri command (default: `npx tauri`) |

### Required Environment Variables

| Variable | Platform | Purpose |
|----------|----------|---------|
| `GITHUB_TOKEN` | All | GitHub API authentication |
| `TAURI_SIGNING_PRIVATE_KEY` | All (updater) | Updater artifact signing |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | All (updater) | Signing key password |
| `WINDOWS_CERTIFICATE` | Windows | Base64-encoded `.pfx` file |
| `WINDOWS_CERTIFICATE_PASSWORD` | Windows | Certificate export password |
| `APPLE_CERTIFICATE` | macOS | Base64-encoded `.p12` file |
| `APPLE_CERTIFICATE_PASSWORD` | macOS | Certificate password |
| `APPLE_SIGNING_IDENTITY` | macOS | Signing identity string |
| `KEYCHAIN_PASSWORD` | macOS | Temporary keychain password |
| `APPLE_API_ISSUER` | macOS (notarization) | App Store Connect API issuer |
| `APPLE_API_KEY` | macOS (notarization) | API key ID |
| `APPLE_API_KEY_PATH` | macOS (notarization) | Path to `.p8` key file |

---

## Linux Build Dependencies

ALWAYS install these before building on Linux:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
```

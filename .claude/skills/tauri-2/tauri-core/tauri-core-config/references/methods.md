# Complete tauri.conf.json Schema Reference (Tauri 2.x)

## Root Object

```
{
    "$schema": string,              // Path to JSON schema for IDE validation
    "identifier": string,           // REQUIRED. Reverse domain notation
    "productName": string | null,   // Display name of the application
    "version": string | null,       // Semver version or path to package.json
    "mainBinaryName": string | null,// Override compiled binary filename
    "build": BuildConfig,           // Build configuration
    "app": AppConfig,               // Application runtime configuration
    "bundle": BundleConfig,         // Bundling and distribution
    "plugins": { [key: string]: object } // Per-plugin configuration
}
```

---

## BuildConfig

```
{
    "devUrl": string | null,
        // Dev server URL. Example: "http://localhost:5173"
        // Used during `tauri dev`. Null means no dev server.

    "frontendDist": string | string[] | null,
        // Path to compiled frontend assets. Example: "../dist"
        // Relative to src-tauri/. Can be a custom protocol URL.
        // Array form for multiple paths (rare).

    "beforeDevCommand": string | BeforeCommand | null,
        // Shell command to run before `tauri dev`.
        // Example: "npm run dev"

    "beforeBuildCommand": string | BeforeCommand | null,
        // Shell command to run before `tauri build`.
        // Example: "npm run build"

    "beforeBundleCommand": string | BeforeCommand | null,
        // Shell command to run before the bundling phase.

    "features": string[] | null,
        // Cargo feature flags to enable during build.

    "additionalWatchFolders": string[],
        // Extra paths to watch during `tauri dev`.
        // Default: []

    "removeUnusedCommands": boolean
        // Remove unused commands during build based on ACL config.
        // Default: false
}
```

### BeforeCommand (object form)

```
{
    "script": string,   // The shell command to run
    "cwd": string,      // Working directory (relative to project root)
    "wait": boolean      // Wait for command to finish before continuing
}
```

---

## AppConfig

```
{
    "windows": WindowConfig[],
        // Windows created at startup. Default: []

    "security": SecurityConfig,
        // Security settings (CSP, capabilities, asset protocol)

    "trayIcon": TrayIconConfig | null,
        // System tray icon configuration. Default: null

    "withGlobalTauri": boolean,
        // Inject Tauri API on window.__TAURI__. Default: false

    "enableGTKAppId": boolean,
        // Set identifier as GTK app ID (Linux only). Default: false

    "macOSPrivateApi": boolean
        // Enable transparent background and fullscreen on macOS. Default: false
}
```

---

## WindowConfig

```
{
    "label": string,
        // Unique window identifier. Default: "main"
        // Used for IPC targeting and window lookup.

    "title": string,
        // Window title bar text.

    "url": string,
        // URL or path to load. Default: "/"
        // Relative paths load from frontendDist.
        // Absolute URLs load external content (requires remote capability).

    "width": number,
        // Width in logical pixels.

    "height": number,
        // Height in logical pixels.

    "x": number | null,
        // Window X position in logical pixels. Default: null (OS decides)

    "y": number | null,
        // Window Y position in logical pixels. Default: null (OS decides)

    "minWidth": number | null,
        // Minimum width in logical pixels. Default: null (no minimum)

    "minHeight": number | null,
        // Minimum height in logical pixels. Default: null (no minimum)

    "maxWidth": number | null,
        // Maximum width in logical pixels. Default: null (no maximum)

    "maxHeight": number | null,
        // Maximum height in logical pixels. Default: null (no maximum)

    "resizable": boolean,
        // Allow window resizing. Default: true

    "fullscreen": boolean,
        // Start in fullscreen mode. Default: false

    "focus": boolean,
        // Focus window on creation. Default: true

    "create": boolean,
        // Create window at startup. Default: true
        // Set false for windows created programmatically.

    "transparent": boolean,
        // Enable window transparency. Default: false
        // Requires platform support and macOSPrivateApi on macOS.

    "decorations": boolean,
        // Show title bar and borders. Default: true
        // Set false for custom title bar implementations.

    "alwaysOnTop": boolean,
        // Stay above other windows. Default: false

    "center": boolean,
        // Center window on screen. Default: false

    "maximized": boolean,
        // Start maximized. Default: false

    "visible": boolean,
        // Show window on creation. Default: true

    "dragDropEnabled": boolean,
        // Enable file drag-and-drop. Default: true

    "acceptFirstMouse": boolean,
        // Accept first mouse click (macOS). Default: false

    "tabbingIdentifier": string | null,
        // Tabbing identifier for macOS window tabs. Default: null

    "additionalBrowserArgs": string | null,
        // Additional args for the webview. Default: null (Windows only)

    "windowClassname": string | null,
        // Custom window class name (Windows only). Default: null

    "contentProtected": boolean,
        // Prevent content capture (screenshots). Default: false

    "useHttpsScheme": boolean | null,
        // Use https instead of http for custom protocol. Default: null
}
```

---

## SecurityConfig

```
{
    "csp": string | { [directive: string]: string } | null,
        // Content Security Policy. Default: null
        // String form: "default-src 'self'; script-src 'self'"
        // Object form: { "default-src": "'self'", "script-src": "'self'" }
        // null = no CSP (DANGEROUS in production)

    "capabilities": string[],
        // Explicit capability file paths. Default: []
        // When non-empty, auto-discovery of capabilities/ dir is DISABLED.

    "freezePrototype": boolean,
        // Freeze JavaScript Object.prototype. Default: false
        // SHOULD be true in production to prevent prototype pollution.

    "dangerousDisableAssetCspModification": boolean | string[],
        // Disable automatic CSP nonce injection. Default: false
        // true = disable for all directives
        // string[] = disable for specific directives

    "assetProtocol": {
        "enable": boolean,
            // Enable the asset:// protocol. Default: false
        "scope": string[]
            // Allowed paths for asset://. Default: []
    },

    "pattern": {
        "use": "brownfield" | "isolation",
            // Application pattern. Default: "brownfield"
            // "isolation" adds an isolation layer for maximum security.
        "options": {
            "dir": string
                // Directory for isolation app (only with "isolation" pattern)
        }
    },

    "headers": { [key: string]: string } | null
        // Custom HTTP headers for responses. Default: null
}
```

---

## BundleConfig

```
{
    "active": boolean,
        // Enable/disable bundling. Default: true

    "targets": string | string[],
        // Target platforms/formats.
        // Values: "all", "deb", "rpm", "appimage", "nsis", "msi", "dmg", "app", "ios", "android"
        // Default: "all"

    "icon": string[],
        // Icon file paths relative to src-tauri/.
        // Required formats: 32x32.png, 128x128.png, 128x128@2x.png, icon.icns, icon.ico

    "identifier": string,
        // Bundle identifier. Defaults to root identifier.

    "resources": { [dest: string]: string | string[] } | string[],
        // Additional files/directories to bundle.
        // Object form: { "target-dir": "source-pattern" }
        // Array form: ["path/to/file", "glob/pattern/**"]

    "externalBin": string[],
        // External binaries to embed as sidecars.
        // Architecture suffix is auto-appended.

    "fileAssociations": FileAssociation[],
        // File type associations.

    "category": string,
        // App category. Values: "Business", "Developer Tool", "Education",
        // "Entertainment", "Finance", "Game", "Graphics & Design",
        // "Healthcare & Fitness", "Lifestyle", "Medical", "Music",
        // "News", "Photography", "Productivity", "Reference",
        // "Social Networking", "Sports", "Travel", "Utility", "Video", "Weather"

    "copyright": string,
        // Copyright notice.

    "shortDescription": string,
        // Short description (max ~80 chars).

    "longDescription": string,
        // Long description for store listings.

    "publisher": string,
        // Publisher name.

    "license": string,
        // SPDX license identifier (e.g., "MIT", "Apache-2.0").

    "licenseFile": string,
        // Path to license file.

    "createUpdaterArtifacts": boolean | "v1Compatible",
        // Generate update signatures.
        // true = v2 format
        // "v1Compatible" = backward-compatible with v1 updater
        // Requires TAURI_SIGNING_PRIVATE_KEY env var.

    "homepage": string,
        // Homepage URL.

    "windows": WindowsBundleConfig,
    "macOS": MacOSBundleConfig,
    "linux": LinuxBundleConfig,
    "iOS": IOSBundleConfig,
    "android": AndroidBundleConfig
}
```

---

## WindowsBundleConfig

```
{
    "nsis": {
        "template": string | null,          // Custom NSIS template path
        "headerImage": string | null,       // Header image path (150x57px BMP)
        "sidebarImage": string | null,      // Sidebar image path (164x314px BMP)
        "installerIcon": string | null,     // Installer icon path
        "installMode": "currentUser" | "perMachine" | "both",
        "languages": string[] | null,       // NSIS language identifiers
        "displayLanguageSelector": boolean, // Show language selection dialog
        "compression": "zlib" | "lzma" | "none" // Default: "lzma"
    },

    "wix": {
        "template": string | null,          // Custom WiX template path
        "language": string | string[],      // WiX language identifier(s)
        "skipWebviewInstall": boolean,      // Skip WebView2 installation
        "bannerPath": string | null,        // Banner image path (493x58px BMP)
        "dialogImagePath": string | null    // Dialog image path (493x312px BMP)
    },

    "webviewInstallMode": "downloadBootstrapper" | "offlineInstaller" | "fixedRuntime" | "skip",
        // How to install WebView2.
        // "downloadBootstrapper" = small download at install time (default)
        // "skip" = assume WebView2 is already installed

    "signCommand": string | null,
        // Custom signing command. %1 = file path placeholder.

    "certificateThumbprint": string | null,
        // Certificate thumbprint for Authenticode signing.

    "digestAlgorithm": string,
        // Hash algorithm. Default: "sha256"

    "timestampUrl": string,
        // Timestamp server URL for code signing.

    "tsp": boolean,
        // Use RFC 3161 time-stamp protocol. Default: false

    "allowDowngrades": boolean
        // Permit version downgrades. Default: false
}
```

---

## MacOSBundleConfig

```
{
    "dmg": {
        "appPosition": { "x": number, "y": number },
        "applicationFolderPosition": { "x": number, "y": number },
        "windowWidth": number,
        "windowHeight": number,
        "background": string | null
    },

    "hardenedRuntime": boolean,
        // Enable hardened runtime. Default: true

    "minimumSystemVersion": string,
        // Minimum macOS version. Default: "10.13"

    "signingIdentity": string | null,
        // Code signing identity. null = ad-hoc signing.

    "providerShortName": string | null,
        // Notarization provider short name.

    "entitlements": string | null,
        // Path to entitlements.plist file.

    "exceptionDomain": string | null,
        // Exception domain for network access.

    "frameworks": string[],
        // Additional frameworks to bundle.

    "files": { [dest: string]: string }
        // Additional files for the .app bundle.
}
```

---

## LinuxBundleConfig

```
{
    "deb": {
        "depends": string[],               // Package dependencies
        "recommends": string[],            // Recommended packages
        "provides": string[],              // Virtual packages provided
        "conflicts": string[],             // Conflicting packages
        "replaces": string[],              // Packages replaced
        "desktopTemplate": string | null,  // Custom .desktop template
        "section": string,                 // Debian section (e.g., "utils")
        "priority": string,               // Package priority
        "preInstallScript": string | null, // Pre-install script path
        "postInstallScript": string | null,// Post-install script path
        "files": { [dest: string]: string }// Additional files
    },

    "rpm": {
        "depends": string[],               // Package dependencies
        "recommends": string[],            // Recommended packages
        "provides": string[],              // Virtual packages provided
        "conflicts": string[],             // Conflicting packages
        "obsoletes": string[],             // Obsoleted packages
        "release": string,                 // RPM release number
        "epoch": number,                   // RPM epoch
        "desktopTemplate": string | null,  // Custom .desktop template
        "preInstallScript": string | null,
        "postInstallScript": string | null
    },

    "appimage": {
        "bundleMediaFramework": boolean,   // Bundle GStreamer. Default: false
        "files": { [dest: string]: string } // Additional files
    }
}
```

---

## IOSBundleConfig

```
{
    "minimumSystemVersion": string,
        // Minimum iOS version. Default: "14.0"

    "developmentTeam": string | null,
        // Apple development team identifier.

    "codeSignIdentity": string | null,
        // Code sign identity.

    "provisioningProfileUUID": string | null,
        // Provisioning profile UUID.

    "frameworks": string[]
        // Additional frameworks to embed.
}
```

---

## AndroidBundleConfig

```
{
    "minSdkVersion": number,
        // Minimum Android SDK version. Default: 24

    "versionCode": number | null,
        // Android version code. Auto-calculated from semver if null.

    "autoIncrementVersionCode": boolean
        // Increment version code on each build. Default: false
}
```

---

## FileAssociation

```
{
    "ext": string[],
        // File extensions (without dot). Example: ["txt", "md"]

    "name": string,
        // Display name for the file type.

    "mimeType": string,
        // MIME type. Example: "text/plain"

    "role": "Editor" | "Viewer" | "Shell" | "QLGenerator" | "None"
        // Application role for this file type. Default: "Editor"
}
```

---

## TrayIconConfig

```
{
    "id": string | null,
        // Unique tray icon identifier. Default: null (auto-generated)

    "iconPath": string,
        // Path to the tray icon image.

    "iconAsTemplate": boolean,
        // Treat icon as template image (macOS). Default: false

    "menuOnLeftClick": boolean,
        // Show menu on left click. Default: true

    "title": string | null,
        // Tray icon title (macOS only). Default: null

    "tooltip": string | null
        // Tray icon tooltip. Default: null
}
```

---

## PluginsConfig

Plugins are configured as key-value pairs where the key is the plugin name (without `tauri-plugin-` prefix):

```
{
    "plugins": {
        "<plugin-name>": {
            // Plugin-specific configuration
        }
    }
}
```

### Common Plugin Configurations

#### fs (File System)
```json
{
    "fs": {
        "scope": {
            "allow": ["$APPDATA/**", "$HOME/Documents/**"],
            "deny": ["$HOME/.ssh/**"]
        }
    }
}
```

#### http
```json
{
    "http": {
        "scope": {
            "allow": ["https://api.example.com/*"],
            "deny": []
        }
    }
}
```

#### shell
```json
{
    "shell": {
        "scope": {
            "allow": [
                { "name": "run-script", "cmd": "bash", "args": ["-c", "echo hello"] }
            ]
        }
    }
}
```

#### updater
```json
{
    "updater": {
        "endpoints": ["https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"],
        "pubkey": "YOUR_PUBLIC_KEY",
        "windows": {
            "installMode": "passive"
        }
    }
}
```

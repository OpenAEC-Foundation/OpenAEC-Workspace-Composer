# Configuration Examples (Tauri 2.x)

## Example 1: Minimal Viable Config

The smallest working `tauri.conf.json`:

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

## Example 2: Full Production Config

A complete configuration for a production desktop application:

```json
{
    "$schema": "./gen/schemas/desktop-schema.json",
    "productName": "My Production App",
    "version": "1.0.0",
    "identifier": "com.mycompany.myproductionapp",
    "build": {
        "devUrl": "http://localhost:5173",
        "frontendDist": "../dist",
        "beforeDevCommand": "npm run dev",
        "beforeBuildCommand": "npm run build",
        "features": []
    },
    "app": {
        "windows": [
            {
                "label": "main",
                "title": "My Production App",
                "url": "/",
                "width": 1200,
                "height": 800,
                "minWidth": 800,
                "minHeight": 600,
                "resizable": true,
                "fullscreen": false,
                "decorations": true,
                "transparent": false,
                "alwaysOnTop": false,
                "focus": true,
                "center": true
            }
        ],
        "security": {
            "csp": {
                "default-src": "'self' customprotocol: asset:",
                "script-src": "'self'",
                "style-src": "'self' 'unsafe-inline'",
                "img-src": "'self' asset: https://cdn.example.com",
                "connect-src": "'self' https://api.example.com"
            },
            "freezePrototype": true,
            "dangerousDisableAssetCspModification": false,
            "pattern": {
                "use": "brownfield"
            }
        },
        "withGlobalTauri": false
    },
    "bundle": {
        "active": true,
        "targets": "all",
        "icon": [
            "icons/32x32.png",
            "icons/128x128.png",
            "icons/128x128@2x.png",
            "icons/icon.icns",
            "icons/icon.ico"
        ],
        "category": "Productivity",
        "copyright": "Copyright (c) 2026 My Company",
        "publisher": "My Company",
        "license": "MIT",
        "shortDescription": "A production-ready Tauri application",
        "longDescription": "A full-featured desktop application built with Tauri 2.",
        "createUpdaterArtifacts": true,
        "windows": {
            "certificateThumbprint": null,
            "digestAlgorithm": "sha256",
            "webviewInstallMode": "downloadBootstrapper",
            "allowDowngrades": false,
            "nsis": {
                "installMode": "both",
                "compression": "lzma"
            }
        },
        "macOS": {
            "hardenedRuntime": true,
            "minimumSystemVersion": "10.15",
            "signingIdentity": null
        },
        "linux": {
            "deb": {
                "depends": ["libwebkit2gtk-4.1-0", "libgtk-3-0"]
            },
            "appimage": {
                "bundleMediaFramework": false
            }
        }
    },
    "plugins": {}
}
```

---

## Example 3: Multi-Window Application

```json
{
    "$schema": "./gen/schemas/desktop-schema.json",
    "identifier": "com.example.multiwindow",
    "build": {
        "devUrl": "http://localhost:5173",
        "frontendDist": "../dist",
        "beforeDevCommand": "npm run dev",
        "beforeBuildCommand": "npm run build"
    },
    "app": {
        "windows": [
            {
                "label": "main",
                "title": "Main Window",
                "url": "/",
                "width": 1000,
                "height": 700,
                "center": true
            },
            {
                "label": "settings",
                "title": "Settings",
                "url": "/settings.html",
                "width": 600,
                "height": 400,
                "resizable": false,
                "create": false
            },
            {
                "label": "about",
                "title": "About",
                "url": "/about.html",
                "width": 400,
                "height": 300,
                "resizable": false,
                "decorations": false,
                "create": false
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

## Example 4: Application with System Tray

```json
{
    "$schema": "./gen/schemas/desktop-schema.json",
    "identifier": "com.example.trayapp",
    "build": {
        "devUrl": "http://localhost:5173",
        "frontendDist": "../dist",
        "beforeDevCommand": "npm run dev",
        "beforeBuildCommand": "npm run build"
    },
    "app": {
        "windows": [
            {
                "label": "main",
                "title": "Tray App",
                "width": 800,
                "height": 600,
                "visible": false
            }
        ],
        "trayIcon": {
            "iconPath": "icons/tray-icon.png",
            "iconAsTemplate": true,
            "tooltip": "My Tray App"
        }
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

## Example 5: Application with Plugins

```json
{
    "$schema": "./gen/schemas/desktop-schema.json",
    "identifier": "com.example.pluginapp",
    "build": {
        "devUrl": "http://localhost:5173",
        "frontendDist": "../dist",
        "beforeDevCommand": "npm run dev",
        "beforeBuildCommand": "npm run build"
    },
    "app": {
        "windows": [
            {
                "title": "Plugin App",
                "width": 900,
                "height": 700
            }
        ],
        "security": {
            "csp": "default-src 'self'; connect-src 'self' https://api.example.com",
            "freezePrototype": true
        }
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
    },
    "plugins": {
        "fs": {
            "scope": {
                "allow": ["$APPDATA/**", "$HOME/Documents/**"],
                "deny": ["$HOME/.ssh/**", "$HOME/.gnupg/**"]
            }
        },
        "http": {
            "scope": {
                "allow": ["https://api.example.com/*"]
            }
        },
        "shell": {
            "scope": {
                "allow": [
                    {
                        "name": "open-url",
                        "cmd": "open",
                        "args": [{ "validator": "^https?://.*$" }]
                    }
                ]
            }
        }
    }
}
```

Corresponding `src-tauri/capabilities/default.json`:

```json
{
    "$schema": "../gen/schemas/desktop-schema.json",
    "identifier": "default",
    "description": "Default capabilities for the main window",
    "windows": ["main"],
    "permissions": [
        "core:default",
        "fs:default",
        "fs:allow-read",
        "http:default",
        "shell:default",
        "dialog:default"
    ]
}
```

---

## Example 6: Platform-Specific Windows Bundle

```json
{
    "bundle": {
        "active": true,
        "targets": ["nsis", "msi"],
        "icon": [
            "icons/icon.ico"
        ],
        "windows": {
            "webviewInstallMode": "downloadBootstrapper",
            "certificateThumbprint": "ABCDEF1234567890",
            "digestAlgorithm": "sha256",
            "timestampUrl": "http://timestamp.digicert.com",
            "allowDowngrades": false,
            "nsis": {
                "installMode": "both",
                "displayLanguageSelector": true,
                "languages": ["English", "Dutch"],
                "compression": "lzma",
                "headerImage": "icons/nsis-header.bmp",
                "sidebarImage": "icons/nsis-sidebar.bmp"
            },
            "wix": {
                "language": ["en-US", "nl-NL"]
            }
        }
    }
}
```

---

## Example 7: Platform-Specific macOS Bundle

```json
{
    "bundle": {
        "active": true,
        "targets": ["dmg", "app"],
        "icon": [
            "icons/icon.icns"
        ],
        "macOS": {
            "hardenedRuntime": true,
            "minimumSystemVersion": "11.0",
            "signingIdentity": "Developer ID Application: My Company (TEAMID)",
            "providerShortName": "TEAMID",
            "entitlements": "Entitlements.plist",
            "dmg": {
                "windowWidth": 660,
                "windowHeight": 400,
                "appPosition": { "x": 180, "y": 170 },
                "applicationFolderPosition": { "x": 480, "y": 170 }
            }
        }
    }
}
```

---

## Example 8: Application with Updater

```json
{
    "$schema": "./gen/schemas/desktop-schema.json",
    "identifier": "com.example.updatable",
    "version": "1.2.3",
    "build": {
        "devUrl": "http://localhost:5173",
        "frontendDist": "../dist",
        "beforeDevCommand": "npm run dev",
        "beforeBuildCommand": "npm run build"
    },
    "app": {
        "windows": [
            {
                "title": "Auto-Updating App",
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
        ],
        "createUpdaterArtifacts": true
    },
    "plugins": {
        "updater": {
            "endpoints": [
                "https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"
            ],
            "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWdu...",
            "windows": {
                "installMode": "passive"
            }
        }
    }
}
```

---

## Example 9: Application with File Associations

```json
{
    "bundle": {
        "fileAssociations": [
            {
                "ext": ["myf"],
                "name": "My Custom Format",
                "mimeType": "application/x-myformat",
                "role": "Editor"
            },
            {
                "ext": ["txt", "md"],
                "name": "Text Files",
                "mimeType": "text/plain",
                "role": "Editor"
            }
        ]
    }
}
```

---

## Example 10: Application with Sidecar Binary

```json
{
    "bundle": {
        "externalBin": [
            "binaries/ffmpeg"
        ],
        "resources": {
            "models/": "resources/models/**"
        }
    }
}
```

The `externalBin` expects architecture-suffixed binaries:
- `binaries/ffmpeg-x86_64-pc-windows-msvc.exe` (Windows x64)
- `binaries/ffmpeg-aarch64-apple-darwin` (macOS ARM)
- `binaries/ffmpeg-x86_64-unknown-linux-gnu` (Linux x64)

---

## Example 11: Vite Frontend with Custom Working Directory

```json
{
    "build": {
        "devUrl": "http://localhost:3000",
        "frontendDist": "../frontend/dist",
        "beforeDevCommand": {
            "script": "npm run dev",
            "cwd": "../frontend",
            "wait": false
        },
        "beforeBuildCommand": {
            "script": "npm run build",
            "cwd": "../frontend",
            "wait": true
        },
        "additionalWatchFolders": ["../frontend/src"]
    }
}
```

---

## Example 12: Security-Hardened Config

```json
{
    "app": {
        "security": {
            "csp": {
                "default-src": "'self'",
                "script-src": "'self'",
                "style-src": "'self' 'unsafe-inline'",
                "img-src": "'self' asset: blob: data:",
                "font-src": "'self' data:",
                "connect-src": "'self' https://api.example.com",
                "frame-src": "'none'",
                "object-src": "'none'",
                "base-uri": "'self'"
            },
            "freezePrototype": true,
            "dangerousDisableAssetCspModification": false,
            "pattern": {
                "use": "isolation",
                "options": {
                    "dir": "../isolation-app"
                }
            }
        },
        "withGlobalTauri": false
    }
}
```

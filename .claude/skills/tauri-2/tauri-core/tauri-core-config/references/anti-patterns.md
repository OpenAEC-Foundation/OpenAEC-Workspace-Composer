# Config Anti-Patterns (Tauri 2.x)

## 1. Missing Unique Identifier

```json
// WRONG: Generic identifier causes conflicts with other apps
{
    "identifier": "tauri-app"
}

// WRONG: Non-reverse-domain format
{
    "identifier": "my-app"
}

// CORRECT: Unique reverse-domain notation
{
    "identifier": "com.mycompany.myapp"
}
```

**WHY**: The identifier is used for app data directories, system registration, and bundle identifiers. A non-unique value causes data conflicts with other Tauri applications on the same system. It MUST contain at least one period.

---

## 2. devUrl Without beforeDevCommand

```json
// WRONG: Dev server won't start automatically
{
    "build": {
        "devUrl": "http://localhost:5173"
    }
}

// CORRECT: Pair devUrl with beforeDevCommand
{
    "build": {
        "devUrl": "http://localhost:5173",
        "beforeDevCommand": "npm run dev"
    }
}
```

**WHY**: When you run `tauri dev`, Tauri tries to connect to `devUrl` immediately. Without `beforeDevCommand`, the dev server is not running and the app shows a blank page or connection error.

---

## 3. Missing beforeBuildCommand

```json
// WRONG: Frontend assets won't be compiled
{
    "build": {
        "frontendDist": "../dist"
    }
}

// CORRECT: Always include the build command
{
    "build": {
        "frontendDist": "../dist",
        "beforeBuildCommand": "npm run build"
    }
}
```

**WHY**: `tauri build` bundles whatever is in `frontendDist`. Without `beforeBuildCommand`, stale or missing frontend assets are bundled, producing a broken application.

---

## 4. CSP Set to null in Production

```json
// WRONG: Disables all content security restrictions
{
    "app": {
        "security": {
            "csp": null
        }
    }
}

// CORRECT: Define a restrictive CSP
{
    "app": {
        "security": {
            "csp": {
                "default-src": "'self'",
                "script-src": "'self'",
                "style-src": "'self' 'unsafe-inline'",
                "connect-src": "'self' https://api.example.com"
            }
        }
    }
}
```

**WHY**: Without CSP, the webview has no restrictions on loading scripts, styles, or connections. This leaves the application vulnerable to XSS attacks, especially if any user-provided content is rendered.

---

## 5. Not Enabling freezePrototype

```json
// WRONG: Prototype pollution attacks are possible
{
    "app": {
        "security": {
            "freezePrototype": false
        }
    }
}

// CORRECT: Enable in production
{
    "app": {
        "security": {
            "freezePrototype": true
        }
    }
}
```

**WHY**: Without frozen prototypes, malicious scripts can modify `Object.prototype`, `Array.prototype`, etc., potentially intercepting IPC calls or modifying application behavior.

---

## 6. Using dangerousDisableAssetCspModification

```json
// WRONG: Removes automatic CSP nonce injection
{
    "app": {
        "security": {
            "dangerousDisableAssetCspModification": true
        }
    }
}

// CORRECT: Leave it disabled (default)
{
    "app": {
        "security": {
            "dangerousDisableAssetCspModification": false
        }
    }
}
```

**WHY**: Tauri automatically injects CSP nonces for inline scripts and styles. Disabling this removes an important security layer. Only use when you have a specific, well-understood reason.

---

## 7. Wildcard Window Permissions with Broad Access

In the capability file (`src-tauri/capabilities/default.json`):

```json
// WRONG: All windows get all permissions
{
    "identifier": "default",
    "windows": ["*"],
    "permissions": [
        "fs:default",
        "shell:default",
        "http:default"
    ]
}

// CORRECT: Specific windows get specific permissions
{
    "identifier": "main-capability",
    "windows": ["main"],
    "permissions": [
        "core:default",
        "fs:default"
    ]
}
```

**WHY**: Using `"windows": ["*"]` grants permissions to ALL windows, including any that might load untrusted content. ALWAYS scope permissions to specific window labels.

---

## 8. Not Committing Cargo.lock

```
# WRONG: .gitignore includes Cargo.lock
src-tauri/Cargo.lock

# CORRECT: Cargo.lock must be committed
# (do NOT add Cargo.lock to .gitignore)
```

**WHY**: Without `Cargo.lock` in version control, different developers and CI environments may resolve different dependency versions. This causes non-deterministic builds and hard-to-debug failures.

---

## 9. Wrong frontendDist Path

```json
// WRONG: Path is relative to project root
{
    "build": {
        "frontendDist": "dist"
    }
}

// CORRECT: Path is relative to src-tauri/
{
    "build": {
        "frontendDist": "../dist"
    }
}
```

**WHY**: `frontendDist` is resolved relative to `src-tauri/`, not the project root. If your build output is at `project-root/dist/`, you need `../dist` to traverse up one level.

---

## 10. Duplicate Window Labels

```json
// WRONG: Two windows with the same label
{
    "app": {
        "windows": [
            { "label": "main", "title": "Window 1" },
            { "label": "main", "title": "Window 2" }
        ]
    }
}

// CORRECT: Each window must have a unique label
{
    "app": {
        "windows": [
            { "label": "main", "title": "Window 1" },
            { "label": "secondary", "title": "Window 2" }
        ]
    }
}
```

**WHY**: Window labels are used as unique identifiers for IPC targeting, event routing, and programmatic access via `get_webview_window()`. Duplicate labels cause unpredictable behavior.

---

## 11. Missing Plugin Permissions

```json
// WRONG: Plugin installed but no capability configured
// Cargo.toml has tauri-plugin-fs, but no permission in capabilities/default.json
// Results in "command not allowed" runtime errors

// CORRECT: Add permissions to capability file
// src-tauri/capabilities/default.json
{
    "identifier": "default",
    "windows": ["main"],
    "permissions": [
        "core:default",
        "fs:default",
        "fs:allow-read"
    ]
}
```

**WHY**: In Tauri 2, installing a plugin does NOT automatically grant permissions. Every plugin API call requires an explicit permission in a capability file. This is the most common source of "command not allowed" errors.

---

## 12. Updater Without Signing Keys

```json
// WRONG: Will fail at build time
{
    "bundle": {
        "createUpdaterArtifacts": true
    }
}
// Error: TAURI_SIGNING_PRIVATE_KEY not set!

// CORRECT: Set environment variable before building
// export TAURI_SIGNING_PRIVATE_KEY="your-private-key"
// export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="your-password"
```

**WHY**: The updater requires a signing key to create signed update artifacts. Without the `TAURI_SIGNING_PRIVATE_KEY` environment variable, the build fails.

---

## 13. Using v1Compatible for New Projects

```json
// WRONG: Only needed for v1 migration
{
    "bundle": {
        "createUpdaterArtifacts": "v1Compatible"
    }
}

// CORRECT: Use true for new projects
{
    "bundle": {
        "createUpdaterArtifacts": true
    }
}
```

**WHY**: `"v1Compatible"` generates artifacts in the legacy v1 format for backward compatibility during migration. New projects should use `true` for the v2 format, which is more efficient.

---

## 14. Unsigned macOS Builds

```json
// WRONG: No signing identity -- app will be quarantined by Gatekeeper
{
    "bundle": {
        "macOS": {
            "signingIdentity": null
        }
    }
}

// CORRECT: At minimum, use ad-hoc signing for development
{
    "bundle": {
        "macOS": {
            "signingIdentity": "-",
            "hardenedRuntime": true
        }
    }
}
```

**WHY**: macOS Gatekeeper quarantines unsigned applications. Users see a scary warning and may not be able to open the app at all. Use `"-"` for ad-hoc signing during development, and a proper Developer ID for distribution.

---

## 15. Shell Plugin Without Scope Restrictions

```json
// WRONG: Allows arbitrary command execution
{
    "plugins": {
        "shell": {}
    }
}

// CORRECT: Define explicit command scopes
{
    "plugins": {
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

**WHY**: Without scope restrictions, the shell plugin can execute any system command, which is a critical security vulnerability. ALWAYS define exactly which commands and arguments are allowed.

---

## 16. Mixing Up Permissions File Formats

```
// WRONG: Application permissions in JSON format
src-tauri/permissions/my-perms.json  -- JSON not supported here!

// CORRECT: Application permissions must be TOML
src-tauri/permissions/my-perms.toml

// Capabilities can be JSON or TOML
src-tauri/capabilities/default.json   -- OK
src-tauri/capabilities/default.toml   -- also OK
```

**WHY**: Application-level permission definitions only support TOML format. Using JSON for permissions silently fails -- the permissions are never loaded.

---

## 17. Forgetting Core Permissions

```json
// WRONG: Missing core permissions -- basic features won't work
{
    "permissions": [
        "fs:default"
    ]
}

// CORRECT: Always include core:default
{
    "permissions": [
        "core:default",
        "fs:default"
    ]
}
```

**WHY**: In Tauri 2, core features (window management, events, paths, app info) require explicit `core:*` permissions. Without `core:default`, basic operations like `getCurrentWindow()` or `emit()` fail with "command not allowed" errors.

---

## 18. Using withGlobalTauri Unnecessarily

```json
// WRONG: Exposes entire Tauri API on window.__TAURI__
{
    "app": {
        "withGlobalTauri": true
    }
}

// CORRECT: Use module imports instead (default behavior)
{
    "app": {
        "withGlobalTauri": false
    }
}
```

```typescript
// CORRECT: Import from @tauri-apps/api modules
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
```

**WHY**: `withGlobalTauri` injects the entire API onto `window.__TAURI__`, which increases the attack surface. Use ES module imports for tree-shaking and better security. Only enable `withGlobalTauri` when you cannot use a bundler (e.g., vanilla HTML without build tools).

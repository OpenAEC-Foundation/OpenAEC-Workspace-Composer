# Examples — Environment Variables

## 1. Basic .env Files

### .env (committed, all modes)

```bash
# Base configuration shared across all environments
VITE_APP_TITLE=My Application
VITE_DEFAULT_LOCALE=en
```

### .env.local (gitignored, all modes)

```bash
# Local developer overrides — NEVER commit this file
VITE_API_URL=http://localhost:3000
```

### .env.development (committed, dev only)

```bash
# Development-specific settings
VITE_API_URL=http://localhost:8080/api
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### .env.production (committed, build only)

```bash
# Production settings
VITE_API_URL=https://api.production.example.com
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

### .env.staging (committed, custom mode)

```bash
# Staging settings — use with: vite build --mode staging
VITE_API_URL=https://api.staging.example.com
VITE_DEBUG=true
VITE_LOG_LEVEL=warn
```

---

## 2. Accessing Env Variables in Client Code

```typescript
// All values are strings — ALWAYS parse non-string types explicitly
const apiUrl: string = import.meta.env.VITE_API_URL
const isDebug: boolean = import.meta.env.VITE_DEBUG === 'true'
const logLevel: string = import.meta.env.VITE_LOG_LEVEL

// Built-in constants
if (import.meta.env.DEV) {
  console.log('Running in development mode')
}

if (import.meta.env.PROD) {
  // Enable production-only features
  initAnalytics()
}

console.log(`Mode: ${import.meta.env.MODE}`)
console.log(`Base URL: ${import.meta.env.BASE_URL}`)
```

---

## 3. TypeScript IntelliSense Setup

### Step 1: Create or update src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_SENTRY_DSN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Step 2: Ensure tsconfig.json includes the declaration file

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

The `/// <reference types="vite/client" />` directive provides types for:
- All five built-in constants (MODE, BASE_URL, PROD, DEV, SSR)
- The `import.meta.hot` HMR API
- Asset import types (`.svg`, `.png`, `.css`, etc.)

ALWAYS add every custom `VITE_*` variable to `ImportMetaEnv`. This provides autocomplete and catches typos at compile time.

---

## 4. HTML Template Env Replacement

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" href="%BASE_URL%favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>%VITE_APP_TITLE%</title>
</head>
<body>
  <div id="app"></div>
  <!-- Built-in constants work too -->
  <!-- Running in %MODE% mode -->
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

Rules:
- Use `%VARIABLE_NAME%` syntax (percent signs around the variable name)
- All `import.meta.env` properties are available (built-in + VITE_-prefixed)
- Non-existent variables are silently ignored — no error, no replacement, the `%VAR%` text remains
- Replacement is static at build time

---

## 5. Custom Modes

### Setting up a staging environment

1. Create `.env.staging`:

```bash
VITE_API_URL=https://api.staging.example.com
VITE_APP_TITLE=My App (Staging)
VITE_ENABLE_ANALYTICS=false
```

2. Add a script to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:qa": "vite build --mode qa",
    "preview": "vite preview"
  }
}
```

3. Use in code — mode is available at runtime:

```typescript
if (import.meta.env.MODE === 'staging') {
  enableStagingBanner()
}
```

### Multiple custom modes

Create separate `.env.[mode]` files for each environment:

```
.env                    # Shared defaults
.env.development        # Local dev
.env.staging            # Staging server
.env.qa                 # QA testing
.env.production         # Production
```

---

## 6. Variable Expansion

### .env with variable expansion

```bash
# Base values
VITE_DOMAIN=example.com
VITE_PROTOCOL=https

# Expanded values
VITE_BASE_URL=$VITE_PROTOCOL://$VITE_DOMAIN
VITE_API_URL=$VITE_BASE_URL/api/v1
VITE_WS_URL=wss://$VITE_DOMAIN/ws

# Escape dollar sign for literal $
VITE_PRICE=\$9.99
```

Result:
- `VITE_BASE_URL` = `https://example.com`
- `VITE_API_URL` = `https://example.com/api/v1`
- `VITE_WS_URL` = `wss://example.com/ws`
- `VITE_PRICE` = `$9.99`

---

## 7. loadEnv() in Config Files

### Basic usage

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      port: parseInt(env.VITE_PORT) || 5173,
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.APP_VERSION),
    },
  }
})
```

### Conditional plugin loading based on env

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      env.VITE_ENABLE_ANALYTICS === 'true' && analyticsPlugin(),
    ].filter(Boolean),
  }
})
```

### Using loadEnv with custom envDir

```typescript
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, 'config/env')
  const env = loadEnv(mode, envDir)

  return {
    envDir,  // ALWAYS set envDir in config too if using custom directory
  }
})
```

---

## 8. Recommended .gitignore Entries

```gitignore
# Environment files with local overrides
.env.local
.env.*.local

# NEVER gitignore .env, .env.development, .env.production
# These contain non-secret defaults and should be committed
```

---

## Official Sources

- https://vite.dev/guide/env-and-mode
- https://vite.dev/config/shared-options#envdir
- https://vite.dev/config/shared-options#envprefix

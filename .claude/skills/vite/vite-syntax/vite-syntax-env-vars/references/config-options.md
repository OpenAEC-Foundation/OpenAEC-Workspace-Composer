# Config Options Reference — Environment Variables

## envDir

| Property | Value |
|----------|-------|
| Type | `string \| false` |
| Default | `root` (project root directory) |
| CLI flag | N/A |

Specifies the directory from which `.env` files are loaded. Can be an absolute path or a path relative to the project root.

Set to `false` to disable `.env` file loading entirely:

```typescript
export default defineConfig({
  envDir: false,  // No .env files loaded at all
})
```

Custom directory example:

```typescript
export default defineConfig({
  envDir: './config/env',  // Load .env files from ./config/env/
})
```

---

## envPrefix

| Property | Value |
|----------|-------|
| Type | `string \| string[]` |
| Default | `"VITE_"` |
| CLI flag | N/A |

Controls which environment variables are exposed to client code via `import.meta.env`.

### Single prefix (default)

```typescript
// Default behavior — only VITE_* exposed
export default defineConfig({
  envPrefix: 'VITE_',
})
```

### Multiple prefixes

```typescript
// Expose both VITE_* and PUBLIC_* variables
export default defineConfig({
  envPrefix: ['VITE_', 'PUBLIC_'],
})
```

### Security constraint

> **NEVER** set `envPrefix` to `''` (empty string). This exposes ALL environment variables including `DB_PASSWORD`, `AWS_SECRET_ACCESS_KEY`, `SESSION_SECRET`, and any other secret on the server.

---

## .env File Loading — Complete Precedence Table

When Vite starts, it loads `.env` files in this EXACT order. Later files override earlier ones. OS environment variables override ALL `.env` files.

### For mode = "development" (vite dev)

| Load Order | File | Purpose |
|------------|------|---------|
| 1 | `.env` | Base defaults for all modes |
| 2 | `.env.local` | Local overrides (gitignored) |
| 3 | `.env.development` | Development-specific values |
| 4 | `.env.development.local` | Local dev overrides (gitignored) |
| 5 | OS env vars | Highest priority, overrides everything |

### For mode = "production" (vite build)

| Load Order | File | Purpose |
|------------|------|---------|
| 1 | `.env` | Base defaults for all modes |
| 2 | `.env.local` | Local overrides (gitignored) |
| 3 | `.env.production` | Production-specific values |
| 4 | `.env.production.local` | Local prod overrides (gitignored) |
| 5 | OS env vars | Highest priority, overrides everything |

### For custom mode (vite build --mode staging)

| Load Order | File | Purpose |
|------------|------|---------|
| 1 | `.env` | Base defaults for all modes |
| 2 | `.env.local` | Local overrides (gitignored) |
| 3 | `.env.staging` | Staging-specific values |
| 4 | `.env.staging.local` | Local staging overrides (gitignored) |
| 5 | OS env vars | Highest priority, overrides everything |

### Key rules

- If the same variable appears in multiple files, the higher-priority file wins
- `.local` files ALWAYS have higher priority than their non-local counterpart
- Mode-specific files ALWAYS have higher priority than generic `.env` files
- OS environment variables ALWAYS win over any `.env` file
- ALWAYS add `.env.local` and `.env.*.local` to `.gitignore`

---

## loadEnv()

### Signature

```typescript
function loadEnv(
  mode: string,
  envDir: string,
  prefixes?: string | string[]
): Record<string, string>
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `string` | — | Mode name (determines which `.env.[mode]` files to load) |
| `envDir` | `string` | — | Directory containing `.env` files |
| `prefixes` | `string \| string[]` | `"VITE_"` | Prefix filter. Pass `""` to load ALL variables |

### Return value

Returns a `Record<string, string>` containing all matched env variables. Values are ALWAYS strings.

### Behavior

1. Loads `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local` from `envDir`
2. Filters variables by `prefixes` parameter
3. Merges with `process.env` (OS vars take priority)
4. Returns flat key-value object

### Usage in vite.config.ts

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load only VITE_-prefixed vars (default)
  const env = loadEnv(mode, process.cwd())
  // env.VITE_API_URL === "https://api.example.com"

  // Load ALL vars (no prefix filter)
  const allEnv = loadEnv(mode, process.cwd(), '')
  // allEnv.DB_HOST === "localhost" (non-prefixed vars included)

  // Load vars with custom prefix
  const publicEnv = loadEnv(mode, process.cwd(), ['VITE_', 'PUBLIC_'])

  return {
    define: {
      __APP_VERSION__: JSON.stringify(allEnv.APP_VERSION),
    },
  }
})
```

---

## mode Config Option

| Property | Value |
|----------|-------|
| Type | `string` |
| Default | `"development"` for `vite`, `"production"` for `vite build` |
| CLI flag | `--mode <mode>` |

Overrides the default mode. This affects:
- Which `.env.[mode]` files are loaded
- The value of `import.meta.env.MODE`

Does NOT affect `NODE_ENV` or `import.meta.env.PROD`/`DEV`.

### NODE_ENV vs Mode — Complete Matrix

| Scenario | NODE_ENV | import.meta.env.MODE | PROD | DEV |
|----------|----------|---------------------|------|-----|
| `vite` | `"development"` | `"development"` | `false` | `true` |
| `vite --mode custom` | `"development"` | `"custom"` | `false` | `true` |
| `vite build` | `"production"` | `"production"` | `true` | `false` |
| `vite build --mode staging` | `"production"` | `"staging"` | `true` | `false` |
| `vite build --mode development` | `"production"` | `"development"` | `true` | `false` |
| `vite preview` | `"production"` | `"production"` | `true` | `false` |

Key insight: `import.meta.env.PROD` and `import.meta.env.DEV` are driven by NODE_ENV (set by the command), NOT by mode. A `vite build --mode development` produces a PRODUCTION build (PROD=true) that loads `.env.development` files.

---

## Official Sources

- https://vite.dev/guide/env-and-mode
- https://vite.dev/config/shared-options#envdir
- https://vite.dev/config/shared-options#envprefix
- https://vite.dev/config/shared-options#mode

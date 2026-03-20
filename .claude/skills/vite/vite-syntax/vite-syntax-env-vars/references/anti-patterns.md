# Anti-Patterns — Environment Variables

## AP-001: Setting envPrefix to Empty String

### Problem

```typescript
// DANGEROUS — exposes ALL server env vars to client
export default defineConfig({
  envPrefix: '',
})
```

### Why it fails

This exposes EVERY environment variable (including `DB_PASSWORD`, `AWS_SECRET_ACCESS_KEY`, `SESSION_SECRET`, `PRIVATE_KEY`) to client-side code. These values are embedded in the JavaScript bundle and visible to anyone who opens browser DevTools.

### Correct approach

```typescript
// ALWAYS use a meaningful prefix
export default defineConfig({
  envPrefix: 'VITE_',  // Default — only VITE_* exposed
})

// Or multiple prefixes if needed
export default defineConfig({
  envPrefix: ['VITE_', 'PUBLIC_'],
})
```

---

## AP-002: Storing Secrets in VITE_ Variables

### Problem

```bash
# .env.production
VITE_STRIPE_SECRET_KEY=sk_live_abc123def456
VITE_DATABASE_URL=postgres://user:password@host:5432/db
VITE_JWT_SECRET=my-super-secret-key
```

### Why it fails

Any `VITE_`-prefixed variable is statically replaced in the client bundle at build time. The secret value appears in plain text in the output JavaScript. Anyone can find it by viewing the page source or inspecting network traffic.

### Correct approach

```bash
# .env.production
VITE_STRIPE_PUBLIC_KEY=pk_live_xyz789          # Public key only — safe
VITE_API_URL=https://api.example.com           # URL only — safe

# Server-side only (NOT prefixed with VITE_)
STRIPE_SECRET_KEY=sk_live_abc123def456         # Never reaches the client
DATABASE_URL=postgres://user:password@host/db  # Never reaches the client
```

ALWAYS use a backend API to proxy requests that require secrets. NEVER embed secrets in client-side code.

---

## AP-003: Accessing process.env in Client Code

### Problem

```typescript
// Client-side code
const apiUrl = process.env.VITE_API_URL  // undefined in browser
const nodeEnv = process.env.NODE_ENV     // May work but is NOT the Vite way
```

### Why it fails

`process.env` is a Node.js construct. It does not exist in the browser. Vite does NOT automatically replace `process.env.*` references (unlike some other bundlers). Using `process.env.NODE_ENV` may work because some plugins or frameworks add a define replacement for it, but this is unreliable and inconsistent.

### Correct approach

```typescript
// ALWAYS use import.meta.env in client code
const apiUrl = import.meta.env.VITE_API_URL
const isProd = import.meta.env.PROD
const mode = import.meta.env.MODE
```

---

## AP-004: Confusing Mode with NODE_ENV

### Problem

```typescript
// .env.staging
NODE_ENV=staging  // This does NOT work as expected
```

```typescript
// Client code
if (import.meta.env.MODE === 'staging') {
  // Developer expects PROD to be false, but...
  console.log(import.meta.env.PROD)  // true! (because vite build sets NODE_ENV=production)
}
```

### Why it fails

`NODE_ENV` and `mode` are independent. `vite build --mode staging` sets MODE to `"staging"` but NODE_ENV remains `"production"`. Setting `NODE_ENV=staging` in a `.env` file does NOT change how Vite determines `PROD`/`DEV` — the command (`vite` vs `vite build`) controls NODE_ENV.

### Correct approach

```typescript
// Use MODE for environment detection (staging, qa, etc.)
if (import.meta.env.MODE === 'staging') {
  showStagingBanner()
}

// Use PROD/DEV for build-type detection (optimized vs debug)
if (import.meta.env.DEV) {
  enableDevTools()
}
```

NEVER rely on NODE_ENV in `.env` files. ALWAYS use `--mode` for custom environments.

---

## AP-005: Expecting Runtime Env Variable Changes

### Problem

```typescript
// Developer expects this to change when server env changes
const apiUrl = import.meta.env.VITE_API_URL
```

### Why it fails

Vite replaces `import.meta.env.VITE_*` references with their literal values at BUILD time. The output JavaScript contains hardcoded strings, not runtime lookups. Changing server environment variables after the build has no effect on the client bundle.

### Correct approach

For build-time static values (most cases):
```typescript
const apiUrl = import.meta.env.VITE_API_URL  // Fine for static config
```

For runtime-configurable values, use a server-rendered config:
```html
<!-- Injected by server at request time -->
<script>
  window.__CONFIG__ = { apiUrl: "https://api.example.com" }
</script>
```

```typescript
const apiUrl = window.__CONFIG__.apiUrl  // Runtime value
```

---

## AP-006: Forgetting to Restart Dev Server After .env Changes

### Problem

```bash
# Developer edits .env, expects changes immediately
echo "VITE_NEW_VAR=hello" >> .env
# Refreshes browser — VITE_NEW_VAR is still undefined
```

### Why it fails

Vite loads `.env` files when the dev server starts. Changes to `.env` files do NOT trigger HMR or automatic reloading. The dev server must be restarted to pick up new or changed env variables.

### Correct approach

ALWAYS restart the Vite dev server after modifying any `.env` file. There is no workaround for this — it is by design.

---

## AP-007: Missing TypeScript Declarations for Custom Env Vars

### Problem

```typescript
// TypeScript shows: Property 'VITE_API_URL' does not exist on type 'ImportMetaEnv'
const url = import.meta.env.VITE_API_URL
```

### Why it fails

Without a type declaration, TypeScript does not know about custom `VITE_*` variables. The code works at runtime but IDE autocomplete is broken and TypeScript may report errors.

### Correct approach

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
  // Add ALL custom VITE_* variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

ALWAYS keep `ImportMetaEnv` in sync with your actual `.env` files. NEVER omit the `/// <reference types="vite/client" />` directive.

---

## AP-008: Using .env Variables Without VITE_ Prefix in Client Code

### Problem

```bash
# .env
API_URL=https://api.example.com
APP_SECRET=mysecret
```

```typescript
// Client code — both are undefined
console.log(import.meta.env.API_URL)     // undefined
console.log(import.meta.env.APP_SECRET)  // undefined
```

### Why it fails

Vite intentionally filters out non-prefixed variables to prevent accidental exposure of server-side secrets. Only `VITE_`-prefixed variables (or variables matching custom `envPrefix`) are included in the client bundle.

### Correct approach

```bash
# .env — prefix client-facing vars with VITE_
VITE_API_URL=https://api.example.com

# Server-only vars — no prefix needed
APP_SECRET=mysecret
```

---

## AP-009: Comparing Env Variables as Non-Strings

### Problem

```typescript
// WRONG — env vars are ALWAYS strings
if (import.meta.env.VITE_PORT === 3000) {        // Always false
  // ...
}
if (import.meta.env.VITE_DEBUG === true) {        // Always false
  // ...
}
if (import.meta.env.VITE_RETRIES > 3) {           // String comparison, not numeric
  // ...
}
```

### Why it fails

All `import.meta.env` values are strings. `"3000" === 3000` is `false`. `"true" === true` is `false`. String comparison of numbers uses lexicographic order, not numeric order.

### Correct approach

```typescript
// ALWAYS compare as strings or parse explicitly
if (import.meta.env.VITE_DEBUG === 'true') { /* ... */ }
if (parseInt(import.meta.env.VITE_PORT, 10) === 3000) { /* ... */ }
if (Number(import.meta.env.VITE_RETRIES) > 3) { /* ... */ }
```

---

## Official Sources

- https://vite.dev/guide/env-and-mode
- https://vite.dev/config/shared-options#envprefix

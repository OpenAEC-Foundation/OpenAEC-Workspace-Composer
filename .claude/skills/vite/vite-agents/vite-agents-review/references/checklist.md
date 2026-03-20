# Vite Review Checklist — Detailed Pass/Fail Criteria

## How to Use

For each check, verify the **Expected State** column. If the code matches, mark PASS. If it violates the rule, mark FAIL and apply the **Fix Action**.

---

## 1. Configuration

### C-01: defineConfig() Usage
- **Verify**: Config file exports via `defineConfig()` wrapper
- **PASS**: `export default defineConfig({ ... })` or `export default defineConfig(({ command, mode }) => ({ ... }))`
- **FAIL**: `export default { ... }` (raw object export)
- **Fix**: Wrap with `import { defineConfig } from 'vite'` and `defineConfig()`

### C-02: Bundler Options Match Version
- **Verify**: Correct bundler options key for target Vite version
- **PASS (v8)**: Uses `build.rolldownOptions`
- **PASS (v6-v7)**: Uses `build.rollupOptions`
- **FAIL**: `rollupOptions` on v8 (deprecated) or `rolldownOptions` on v6-v7 (does not exist)
- **Fix**: Rename the key to match the target version

### C-03: Transform Config Matches Version
- **Verify**: Correct transform engine configuration
- **PASS (v8)**: Uses `oxc` option for JSX/TS configuration
- **PASS (v6-v7)**: Uses `esbuild` option
- **FAIL**: `esbuild` option on v8 (deprecated, converted internally) or `oxc` on v6-v7 (invalid)
- **Fix**: Use the correct option key for the target version

### C-04: envPrefix Safety
- **Verify**: `envPrefix` option value
- **PASS**: Not set (uses default `'VITE_'`) OR set to a non-empty string/array
- **FAIL**: `envPrefix: ''` — exposes ALL environment variables to client code
- **Fix**: Remove the option (use default) or set a meaningful prefix

### C-05: appType Matches Usage
- **Verify**: `appType` value aligns with application architecture
- **PASS (SPA)**: `appType: 'spa'` (default) with single-page app
- **PASS (MPA)**: `appType: 'mpa'` with multiple HTML entry points
- **PASS (SSR)**: `appType: 'custom'` with `server.middlewareMode: true`
- **FAIL**: `appType: 'spa'` with middleware mode (SPA fallback conflicts with custom routing)
- **Fix**: Set `appType: 'custom'` when using middleware mode

### C-06: Build Target
- **Verify**: `build.target` value is appropriate for production
- **PASS**: `'baseline-widely-available'`, explicit browser list, or `'es2015'`+
- **FAIL**: `'esnext'` for production (breaks older browsers)
- **Fix**: Set explicit target matching deployment requirements

### C-07: Environment Variables in Config
- **Verify**: How env vars are accessed inside `vite.config.ts`
- **PASS**: `const env = loadEnv(mode, process.cwd(), '')`
- **FAIL**: `import.meta.env.VITE_*` used inside config file
- **Fix**: Use `loadEnv()` from `'vite'` import

### C-08: Conditional Config Form
- **Verify**: Config uses function form when command/mode matters
- **PASS**: `defineConfig(({ command, mode }) => ({ ... }))`
- **FAIL**: Static object when different dev/build configs are needed
- **Fix**: Convert to function form with destructured `command` and `mode`

---

## 2. Plugins

### P-01: Factory Function Pattern
- **Verify**: Plugin is exported as a function
- **PASS**: `export default function myPlugin(options = {}) { return { name: '...', ... } }`
- **FAIL**: `export default { name: '...', ... }` (plain object)
- **Fix**: Wrap in a factory function that accepts options

### P-02: Plugin Name Property
- **Verify**: Plugin object includes `name` string
- **PASS**: `{ name: 'vite-plugin-my-feature', ... }`
- **FAIL**: Plugin object without `name` property
- **Fix**: Add `name` property following convention: `vite-plugin-{feature}`

### P-03: config Hook Return
- **Verify**: `config` hook returns partial config or mutates in place
- **PASS**: Returns `{ resolve: { alias: { ... } } }` (partial, deep-merged)
- **PASS**: Mutates `config.root = 'foo'` directly (no return)
- **FAIL**: Returns full config object that overwrites user settings
- **Fix**: Return only the properties you want to add/override

### P-04: configResolved Storage
- **Verify**: Resolved config stored in closure for later hooks
- **PASS**: `let config; return { configResolved(c) { config = c }, transform() { /* uses config */ } }`
- **FAIL**: Trying to access resolved config outside the hook without storing it
- **Fix**: Declare variable in closure scope, assign in `configResolved`

### P-05: configureServer Middleware
- **Verify**: Middleware added correctly to dev server
- **PASS (pre)**: `configureServer(server) { server.middlewares.use(handler) }`
- **PASS (post)**: `configureServer(server) { return () => { server.middlewares.use(handler) } }`
- **FAIL**: Adding post-middleware without returning a function
- **Fix**: Return a function from `configureServer` for post-internal middleware

### P-06: transformIndexHtml Order
- **Verify**: HTML transform hook uses `order` property (not deprecated `enforce`)
- **PASS**: `transformIndexHtml: { order: 'pre', handler(html) { ... } }`
- **FAIL**: Using `enforce` or `transform` properties (removed in v7)
- **Fix**: Replace `enforce`/`transform` with `order`/`handler`

### P-07: handleHotUpdate Return Type
- **Verify**: Hook returns correct type
- **PASS**: Returns `ModuleNode[]` to narrow update scope
- **PASS**: Returns `[]` to prevent HMR update (handles custom event instead)
- **PASS**: Returns `void`/`undefined` for default behavior
- **FAIL**: Returns non-array value or invalid module references
- **Fix**: Return filtered `ctx.modules` array or empty array

### P-08: enforce Property
- **Verify**: Plugin ordering matches intended behavior
- **PASS**: `enforce: 'pre'` for plugins that must run before Vite core (e.g., alias resolution)
- **PASS**: `enforce: 'post'` for plugins that must run after build plugins (e.g., minification)
- **PASS**: No `enforce` for standard plugin ordering
- **FAIL**: Missing `enforce` when plugin depends on running before/after core plugins
- **Fix**: Add appropriate `enforce` value

### P-09: Virtual Module Prefixes
- **Verify**: Virtual modules use convention prefixes
- **PASS**: User import: `virtual:my-module` / Resolved ID: `\0virtual:my-module`
- **FAIL**: Missing `virtual:` prefix (confusing to users)
- **FAIL**: Missing `\0` prefix on resolved ID (other plugins process the module)
- **Fix**: Add both prefixes following the convention

### P-10: moduleParsed in Dev
- **Verify**: Code does NOT depend on `moduleParsed` hook during development
- **PASS**: `moduleParsed` only used in build, or not used at all
- **FAIL**: Logic depends on `moduleParsed` running during dev server
- **Fix**: Move logic to `transform` hook or another dev-compatible hook

### P-11: moduleType for Non-JS (v8)
- **Verify**: `load` and `transform` hooks set `moduleType: 'js'` when returning non-JS content
- **PASS (v8)**: `return { code: cssAsJs, moduleType: 'js' }`
- **PASS (v6-v7)**: Not applicable (Rollup does not require this)
- **FAIL (v8)**: Returning transformed non-JS content without `moduleType`
- **Fix**: Add `moduleType: 'js'` to the return object

---

## 3. HMR

### H-01: import.meta.hot Guard
- **Verify**: All HMR API calls wrapped in conditional
- **PASS**: `if (import.meta.hot) { import.meta.hot.accept(...) }`
- **FAIL**: `import.meta.hot.accept(...)` without guard
- **Fix**: Wrap all HMR code in `if (import.meta.hot) { ... }`

### H-02: accept() Whitespace
- **Verify**: No space between `accept` and opening parenthesis
- **PASS**: `import.meta.hot.accept(callback)`
- **FAIL**: `import.meta.hot.accept (callback)` — space breaks static analysis
- **Fix**: Remove space: `accept(`

### H-03: hot.data Mutation
- **Verify**: `hot.data` is mutated via property assignment
- **PASS**: `import.meta.hot.data.count = 0`
- **FAIL**: `import.meta.hot.data = { count: 0 }` — reassignment is not supported
- **Fix**: Assign individual properties, NEVER reassign the object

### H-04: accept() Before invalidate()
- **Verify**: Module calls `accept()` before any `invalidate()` call
- **PASS**: `accept((mod) => { if (bad) { invalidate() } })`
- **FAIL**: `invalidate()` without prior `accept()` — no HMR boundary established
- **Fix**: Add `accept()` call that conditionally calls `invalidate()`

### H-05: dispose() Cleanup
- **Verify**: Side effects are cleaned up on module replacement
- **PASS**: `import.meta.hot.dispose(() => { clearInterval(timer) })`
- **FAIL**: Timers, event listeners, or connections created without dispose cleanup
- **Fix**: Register cleanup in `dispose()` callback

### H-06: prune() for Module Removal
- **Verify**: Resources cleaned up when module is removed from graph
- **PASS**: `import.meta.hot.prune(() => { cleanup() })` for dynamic modules
- **FAIL**: Persistent resources left behind when module is no longer imported
- **Fix**: Register cleanup in `prune()` callback

---

## 4. Environment Variables

### E-01: VITE_ Prefix
- **Verify**: Client-side code only accesses `VITE_`-prefixed variables
- **PASS**: `import.meta.env.VITE_API_URL`
- **FAIL**: `import.meta.env.API_URL` (undefined in client), `import.meta.env.DB_PASSWORD`
- **Fix**: Rename variable with `VITE_` prefix in `.env` file

### E-02: No Secrets in VITE_*
- **Verify**: No sensitive data in VITE_-prefixed variables
- **PASS**: `VITE_API_URL=https://api.example.com` (public endpoint)
- **FAIL**: `VITE_SECRET_KEY=sk_live_...`, `VITE_DB_PASSWORD=...`
- **Fix**: Move secrets to server-only variables (no VITE_ prefix)

### E-03: TypeScript ImportMetaEnv
- **Verify**: Custom env vars have type declarations
- **PASS**: `src/vite-env.d.ts` contains `interface ImportMetaEnv { readonly VITE_*: string }`
- **FAIL**: Missing type declarations — all VITE_* vars are `any`
- **Fix**: Create or update `src/vite-env.d.ts` with `ImportMetaEnv` interface

### E-04: loadEnv in Config
- **Verify**: Config file uses `loadEnv()` for env access
- **PASS**: `import { loadEnv } from 'vite'` + `loadEnv(mode, root, '')`
- **FAIL**: `process.env.VITE_*` in config (works but inconsistent with .env loading)
- **FAIL**: `import.meta.env.VITE_*` in config (undefined)
- **Fix**: Use `loadEnv()` from Vite

### E-05: .env.local in .gitignore
- **Verify**: Local env files are gitignored
- **PASS**: `.gitignore` contains `.env*.local` or equivalent patterns
- **FAIL**: `.env.local` or `.env.*.local` committed to repository
- **Fix**: Add `.env*.local` to `.gitignore`

---

## 5. Build

### B-01: Build Target
- **Verify**: `build.target` matches deployment requirements
- **PASS**: Explicit target or default `'baseline-widely-available'`
- **FAIL**: `'esnext'` for public-facing production sites
- **Fix**: Set appropriate target for audience browsers

### B-02: Sourcemap Exposure
- **Verify**: Sourcemaps not publicly accessible in production
- **PASS**: `build.sourcemap: false` or `'hidden'`
- **FAIL**: `build.sourcemap: true` deployed publicly
- **Fix**: Use `'hidden'` (generates maps for error tracking, no browser reference)

### B-03: CSS Code Splitting
- **Verify**: CSS splitting is enabled
- **PASS**: Default `true` or explicitly `build.cssCodeSplit: true`
- **FAIL**: `build.cssCodeSplit: false` without deliberate reason
- **Fix**: Remove the override or set to `true`

### B-04: Library Mode — UMD Name
- **Verify**: `build.lib.name` set when UMD/IIFE format included
- **PASS**: `build.lib: { entry: '...', name: 'MyLib', formats: ['es', 'umd'] }`
- **FAIL**: UMD format without `name` — build fails
- **Fix**: Add `name` property to `build.lib`

### B-05: Library Mode — Externals
- **Verify**: Framework/peer dependencies are externalized
- **PASS**: `rolldownOptions: { external: ['react', 'react-dom'] }` (v8)
- **FAIL**: Peer dependencies bundled into library output
- **Fix**: Add peer deps to `external` array in bundler options

### B-06: Library Mode — Package Exports
- **Verify**: `package.json` has correct export fields
- **PASS**: `"exports": { ".": { "import": "./dist/lib.js", "require": "./dist/lib.cjs" } }`
- **FAIL**: Missing `exports`, `main`, or `module` fields
- **Fix**: Add proper export map to `package.json`

### B-07: Minification Config
- **Verify**: `build.minify` appropriate for context
- **PASS (client v8)**: `'oxc'` (default) or `'terser'` (with terser installed)
- **PASS (SSR)**: `false` (default for SSR builds)
- **FAIL**: `'terser'` without `terser` package installed
- **Fix**: Install terser or use default minifier

### B-08: Chunk Size
- **Verify**: No chunks exceed warning limit without investigation
- **PASS**: All chunks under 500 KiB or deliberately configured
- **FAIL**: Warning ignored, large chunks shipped
- **Fix**: Split via dynamic imports or adjust `build.chunkSizeWarningLimit` after investigation

---

## 6. SSR

### S-01: Middleware Mode + appType
- **Verify**: Middleware mode paired with custom appType
- **PASS**: `{ server: { middlewareMode: true }, appType: 'custom' }`
- **FAIL**: `middlewareMode: true` without `appType: 'custom'`
- **Fix**: Add `appType: 'custom'` to config

### S-02: ssr.noExternal
- **Verify**: Dependencies needing Vite transforms are listed
- **PASS**: CSS-importing or JSX deps in `ssr.noExternal: ['my-ui-lib']`
- **FAIL**: Deps with CSS/JSX imports externalized — Node.js crashes on import
- **Fix**: Add problematic deps to `ssr.noExternal`

### S-03: ssrFixStacktrace
- **Verify**: Error handler calls `ssrFixStacktrace`
- **PASS**: `catch (e) { vite.ssrFixStacktrace(e); next(e) }`
- **FAIL**: Error rethrown without stack trace fix
- **Fix**: Add `vite.ssrFixStacktrace(e)` before error handling

### S-04: SSR Conditional Logic
- **Verify**: Server/client branching uses `import.meta.env.SSR`
- **PASS**: `if (import.meta.env.SSR) { /* server */ }`
- **FAIL**: `if (typeof window === 'undefined')` — unreliable in edge runtimes
- **Fix**: Use `import.meta.env.SSR` (statically replaced, tree-shakeable)

### S-05: SSR Build Flag
- **Verify**: SSR build uses `--ssr` CLI flag
- **PASS**: `vite build --ssr src/entry-server.js`
- **FAIL**: Building server entry without `--ssr` flag
- **Fix**: Add `--ssr` flag to build command

### S-06: SSR Manifest
- **Verify**: Client build generates SSR manifest for preload hints
- **PASS**: `vite build --outDir dist/client --ssrManifest`
- **FAIL**: No SSR manifest — preload directives missing
- **Fix**: Add `--ssrManifest` to client build command

---

## 7. Security

### X-01: envPrefix Empty String
- **Verify**: `envPrefix` is not empty string
- **PASS**: Default `'VITE_'` or custom non-empty prefix
- **FAIL**: `envPrefix: ''` — ALL env vars exposed to client
- **Severity**: CRITICAL — blocks deployment
- **Fix**: Remove the option or set a meaningful prefix

### X-02: server.fs.strict
- **Verify**: Filesystem restriction enabled
- **PASS**: Default `true` or explicitly `server.fs.strict: true`
- **FAIL**: `server.fs.strict: false` without documented security reason
- **Severity**: HIGH — dev server can serve any file
- **Fix**: Remove the override or add documented justification

### X-03: server.allowedHosts
- **Verify**: Allowed hosts configured when server exposed to network
- **PASS**: `server.allowedHosts: ['myapp.local']` or only used on localhost
- **FAIL**: Server bound to `0.0.0.0` without `allowedHosts` restriction
- **Severity**: HIGH — DNS rebinding attack vector
- **Fix**: Add explicit host allowlist

### X-04: Client Code Secrets
- **Verify**: No credentials in client-accessible code
- **PASS**: All secrets server-side only
- **FAIL**: Secrets in `VITE_*` vars, `define` replacements, or hardcoded in source
- **Severity**: CRITICAL — blocks deployment
- **Fix**: Move secrets to server-only environment variables

### X-05: Production Sourcemaps
- **Verify**: Source maps restricted in production
- **PASS**: `false` or `'hidden'`
- **FAIL**: `true` or `'inline'` in production build
- **Severity**: MEDIUM — exposes source code
- **Fix**: Use `'hidden'` for error tracking without public exposure

### X-06: server.fs.deny Patterns
- **Verify**: Default deny patterns preserved
- **PASS**: Default `['.env', '.env.*', '*.{crt,pem}', '**/.git/**']` or superset
- **FAIL**: Deny list cleared or sensitive patterns removed
- **Severity**: HIGH — secrets and certificates accessible via dev server
- **Fix**: Restore default deny patterns

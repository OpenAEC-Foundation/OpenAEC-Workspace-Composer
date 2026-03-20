# Vite Anti-Patterns — Consolidated Reference

Every anti-pattern listed here is verified against official Vite documentation. Organized by area with severity, detection method, and fix.

---

## Configuration Anti-Patterns

### AP-C01: Raw Object Config Export
- **Severity**: LOW
- **Pattern**: `export default { ... }` without `defineConfig()`
- **Why it fails**: No TypeScript type inference, no IDE autocomplete, typos in option names go undetected
- **Detection**: Check if config file imports `defineConfig` from `'vite'`
- **Fix**: Wrap export with `defineConfig()`

### AP-C02: Wrong Bundler Options for Version
- **Severity**: HIGH
- **Pattern**: Using `build.rollupOptions` on Vite 8, or `build.rolldownOptions` on Vite 6-7
- **Why it fails**: v8 deprecated `rollupOptions` (converted internally with warnings); v6-7 does not recognize `rolldownOptions`
- **Detection**: Check Vite version in `package.json` against config option names
- **Fix**: Use the correct option key for the target version

### AP-C03: import.meta.env in Config File
- **Severity**: HIGH
- **Pattern**: `import.meta.env.VITE_*` accessed inside `vite.config.ts`
- **Why it fails**: `import.meta.env` is populated by Vite AFTER config is resolved — it is `undefined` during config resolution
- **Detection**: Search config file for `import.meta.env`
- **Fix**: Use `loadEnv(mode, process.cwd(), '')` from Vite

### AP-C04: Static Config for Multi-Mode Projects
- **Severity**: MEDIUM
- **Pattern**: Single object config when dev and build need different settings
- **Why it fails**: Same proxy, sourcemap, and optimization settings apply to all modes
- **Detection**: Check if config needs different behavior for `serve` vs `build`
- **Fix**: Use function form: `defineConfig(({ command, mode }) => ({...}))`

### AP-C05: Empty envPrefix
- **Severity**: CRITICAL
- **Pattern**: `envPrefix: ''`
- **Why it fails**: Exposes ALL environment variables (including `DB_PASSWORD`, `SECRET_KEY`) to client-side code via `import.meta.env`
- **Detection**: Search config for `envPrefix`
- **Fix**: Remove the option (defaults to `'VITE_'`) or use a non-empty prefix

---

## Plugin Anti-Patterns

### AP-P01: Plugin as Plain Object
- **Severity**: MEDIUM
- **Pattern**: Exporting `{ name: '...', transform() {...} }` directly
- **Why it fails**: Cannot accept configuration options, cannot maintain closure state
- **Detection**: Check if plugin export is a function call or plain object
- **Fix**: Wrap in factory function: `function myPlugin(options = {}) { return { ... } }`

### AP-P02: Missing Plugin Name
- **Severity**: MEDIUM
- **Pattern**: Plugin object without `name` property
- **Why it fails**: Errors and warnings from this plugin are untraceable in logs
- **Detection**: Check all plugin objects for `name` property
- **Fix**: Add `name` following convention: `vite-plugin-{feature}`

### AP-P03: Relying on moduleParsed in Dev
- **Severity**: HIGH
- **Pattern**: Using `moduleParsed` hook for logic that must run during development
- **Why it fails**: Vite skips `moduleParsed` during dev for performance — code silently never executes
- **Detection**: Search for `moduleParsed` in plugin code
- **Fix**: Move logic to `transform` or `load` hook

### AP-P04: Virtual Module Without \0 Prefix
- **Severity**: MEDIUM
- **Pattern**: `resolveId` returns `'virtual:my-module'` without `\0` prefix
- **Why it fails**: Other plugins attempt to resolve and process the virtual module ID as a file path
- **Detection**: Check `resolveId` return values for virtual modules
- **Fix**: Prefix resolved ID with `\0`: `return '\0virtual:my-module'`

### AP-P05: Config Hook Returns Full Config
- **Severity**: MEDIUM
- **Pattern**: `config()` hook returns a complete config object instead of partial
- **Why it fails**: Deep merge means partial is additive; full object can set unexpected defaults
- **Detection**: Check `config` hook return size — should be minimal
- **Fix**: Return only the properties you need to add or override

### AP-P06: Deprecated transformIndexHtml Properties (v7+)
- **Severity**: HIGH
- **Pattern**: Using `enforce` or `transform` properties on `transformIndexHtml` hook
- **Why it fails**: Removed in Vite 7 — hook-level `enforce`/`transform` no longer recognized
- **Detection**: Search for `enforce` or `transform` on `transformIndexHtml` objects
- **Fix**: Use `order: 'pre'|'post'` and `handler` properties

### AP-P07: Missing moduleType in v8 Plugin
- **Severity**: HIGH (v8 only)
- **Pattern**: `load` or `transform` hook returns non-JS content without `moduleType: 'js'`
- **Why it fails**: Rolldown cannot determine module type — build fails or produces incorrect output
- **Detection**: Check `load`/`transform` returns for non-JS transformations
- **Fix**: Add `moduleType: 'js'` to return object

---

## HMR Anti-Patterns

### AP-H01: Unguarded HMR Code
- **Severity**: MEDIUM
- **Pattern**: `import.meta.hot.accept(...)` without `if (import.meta.hot)` wrapper
- **Why it fails**: HMR code cannot be tree-shaken in production build, increases bundle size
- **Detection**: Search for `import.meta.hot.` without preceding `if` guard
- **Fix**: Wrap ALL HMR code in `if (import.meta.hot) { ... }`

### AP-H02: Space in accept() Call
- **Severity**: HIGH
- **Pattern**: `import.meta.hot.accept (callback)` with space before `(`
- **Why it fails**: Vite's static analysis requires exact `accept(` string match — HMR silently stops working
- **Detection**: Regex search for `\.accept\s+\(`
- **Fix**: Remove space: `.accept(`

### AP-H03: Reassigning hot.data
- **Severity**: HIGH
- **Pattern**: `import.meta.hot.data = { count: 0 }`
- **Why it fails**: The `data` object reference is managed by Vite — reassignment is silently ignored
- **Detection**: Search for `hot.data =` (assignment to `data` itself, not to `data.property`)
- **Fix**: Mutate properties: `import.meta.hot.data.count = 0`

### AP-H04: invalidate() Without accept()
- **Severity**: HIGH
- **Pattern**: Calling `import.meta.hot.invalidate()` without first calling `accept()`
- **Why it fails**: Without `accept()`, no HMR boundary is established — `invalidate()` has nothing to propagate from
- **Detection**: Check if module calls `invalidate` without `accept`
- **Fix**: Call `accept()` first, then conditionally `invalidate()` inside the callback

### AP-H05: Missing dispose() Cleanup
- **Severity**: MEDIUM
- **Pattern**: Creating persistent resources (timers, listeners, connections) without `dispose()` cleanup
- **Why it fails**: Resources from previous module version accumulate on each HMR update — memory leaks, duplicate handlers
- **Detection**: Check for `setInterval`, `addEventListener`, `new WebSocket` without corresponding `dispose()` cleanup
- **Fix**: Register cleanup in `import.meta.hot.dispose(cb)`

---

## Environment Variable Anti-Patterns

### AP-E01: Non-Prefixed Client Variables
- **Severity**: HIGH
- **Pattern**: `.env` file has `API_URL=...` and client code accesses `import.meta.env.API_URL`
- **Why it fails**: Only `VITE_`-prefixed variables are exposed to client code — `API_URL` is `undefined`
- **Detection**: Cross-reference `import.meta.env.*` usage against `.env` file entries
- **Fix**: Rename to `VITE_API_URL` in `.env` and source code

### AP-E02: Secrets in VITE_ Variables
- **Severity**: CRITICAL
- **Pattern**: `VITE_SECRET_KEY=sk_live_...` or `VITE_DB_PASSWORD=admin`
- **Why it fails**: ALL `VITE_*` variables are embedded in client JavaScript — visible in browser source
- **Detection**: Search `.env` files for `VITE_` vars containing keywords: secret, password, key, token, credential
- **Fix**: Remove `VITE_` prefix — access server-side only

### AP-E03: Missing TypeScript Env Declarations
- **Severity**: LOW
- **Pattern**: Using `import.meta.env.VITE_*` without `ImportMetaEnv` interface
- **Why it fails**: All environment variables typed as `any` — no autocompletion, no typo detection
- **Detection**: Check for `src/vite-env.d.ts` with `ImportMetaEnv` interface
- **Fix**: Create `src/vite-env.d.ts` with typed interface

### AP-E04: .env.local Committed to Git
- **Severity**: HIGH
- **Pattern**: `.env.local` or `.env.*.local` files tracked in version control
- **Why it fails**: Local development secrets (personal API keys, local DB passwords) exposed in repository
- **Detection**: Check `.gitignore` for `.env*.local` pattern
- **Fix**: Add `.env*.local` to `.gitignore`, remove from tracking with `git rm --cached`

---

## Build Anti-Patterns

### AP-B01: esnext Target for Production
- **Severity**: MEDIUM
- **Pattern**: `build.target: 'esnext'` for public-facing applications
- **Why it fails**: Latest syntax features break in browsers that have not yet implemented them
- **Detection**: Check `build.target` value
- **Fix**: Use `'baseline-widely-available'` (v7+/v8 default) or explicit browser list

### AP-B02: Public Sourcemaps
- **Severity**: MEDIUM
- **Pattern**: `build.sourcemap: true` with `.map` files deployed
- **Why it fails**: Source code, file structure, and comments visible to anyone with browser DevTools
- **Detection**: Check `build.sourcemap` value and deployment config
- **Fix**: Use `'hidden'` (generates maps for error tracking without browser reference)

### AP-B03: Library Without Externals
- **Severity**: HIGH
- **Pattern**: Library mode without `external` for framework peer dependencies
- **Why it fails**: Framework code (React, Vue) bundled into library — consumer app loads framework twice
- **Detection**: Check `rolldownOptions.external` (v8) or `rollupOptions.external` (v6-v7) in library config
- **Fix**: Add all peer dependencies to `external` array

### AP-B04: Library Without Package Exports
- **Severity**: HIGH
- **Pattern**: `package.json` missing `exports`, `main`, and `module` fields
- **Why it fails**: Bundlers and Node.js cannot resolve the library entry point
- **Detection**: Check `package.json` for export fields
- **Fix**: Add proper `exports` map with `import` and `require` conditions

### AP-B05: UMD Build Without Name
- **Severity**: HIGH
- **Pattern**: Library with UMD format but no `build.lib.name`
- **Why it fails**: Build fails — UMD requires a global variable name
- **Detection**: Check if `formats` includes `'umd'` or `'iife'` and `name` is set
- **Fix**: Add `name` to `build.lib` configuration

### AP-B06: Ignoring Chunk Size Warnings
- **Severity**: MEDIUM
- **Pattern**: Chunks exceeding 500 KiB without investigation
- **Why it fails**: Large chunks increase initial load time and hurt Core Web Vitals
- **Detection**: Build output shows chunk size warnings
- **Fix**: Split with dynamic imports, or adjust limit after deliberate analysis

---

## SSR Anti-Patterns

### AP-S01: Middleware Mode Without Custom AppType
- **Severity**: HIGH
- **Pattern**: `server: { middlewareMode: true }` without `appType: 'custom'`
- **Why it fails**: Default `'spa'` appType adds HTML fallback middleware that conflicts with custom SSR routing
- **Detection**: Check config for `middlewareMode: true` without `appType: 'custom'`
- **Fix**: Add `appType: 'custom'` to config

### AP-S02: Missing ssrFixStacktrace
- **Severity**: MEDIUM
- **Pattern**: SSR error handler without `vite.ssrFixStacktrace(e)` call
- **Why it fails**: Error stack traces reference transformed/bundled code instead of original source files
- **Detection**: Search SSR catch blocks for `ssrFixStacktrace`
- **Fix**: Add `vite.ssrFixStacktrace(e)` before logging or passing to error handler

### AP-S03: typeof window for SSR Detection
- **Severity**: MEDIUM
- **Pattern**: `if (typeof window === 'undefined')` for server/client branching
- **Why it fails**: Edge runtimes may have partial `window` objects; not statically analyzable for tree-shaking
- **Detection**: Search for `typeof window` checks
- **Fix**: Use `import.meta.env.SSR` — statically replaced during build, enables dead-code elimination

### AP-S04: Missing ssr.noExternal for UI Libraries
- **Severity**: HIGH
- **Pattern**: UI library with CSS imports externalized during SSR
- **Why it fails**: Node.js cannot process CSS `import` statements — crashes at runtime
- **Detection**: SSR runtime errors mentioning CSS or non-JS imports
- **Fix**: Add the dependency to `ssr.noExternal` array

---

## Security Anti-Patterns

### AP-X01: Empty envPrefix (CRITICAL)
- **Severity**: CRITICAL
- **Pattern**: `envPrefix: ''`
- **Impact**: ALL environment variables exposed to client JavaScript, including database credentials, API secrets, cloud keys
- **Detection**: Search config for `envPrefix: ''`
- **Fix**: Remove the option or set a non-empty prefix

### AP-X02: Disabled Filesystem Restriction
- **Severity**: HIGH
- **Pattern**: `server.fs.strict: false`
- **Impact**: Dev server can serve ANY file on the machine — source code, credentials, SSH keys
- **Detection**: Search config for `fs.strict: false` or `fs: { strict: false }`
- **Fix**: Keep default `true`; use `server.fs.allow` for specific directories

### AP-X03: Network-Exposed Server Without Host Restriction
- **Severity**: HIGH
- **Pattern**: `server.host: '0.0.0.0'` or `server.host: true` without `server.allowedHosts`
- **Impact**: DNS rebinding attacks can access dev server endpoints from any hostname
- **Detection**: Check for network binding without `allowedHosts`
- **Fix**: Add `server.allowedHosts: ['trusted.hostname']`

### AP-X04: Removed fs.deny Patterns
- **Severity**: HIGH
- **Pattern**: Overriding `server.fs.deny` without preserving defaults
- **Impact**: `.env` files, SSL certificates, and `.git` directory accessible via dev server
- **Detection**: Check if `server.fs.deny` is set and includes default patterns
- **Fix**: ALWAYS include defaults: `['.env', '.env.*', '*.{crt,pem}', '**/.git/**']`

### AP-X05: Secrets in Client Code
- **Severity**: CRITICAL
- **Pattern**: Credentials in `VITE_*` vars, `define` replacements, or hardcoded in source
- **Impact**: API keys, tokens, and passwords visible to every user in browser DevTools
- **Detection**: Audit `VITE_*` variables, `define` config, and source code for credential patterns
- **Fix**: Move all secrets to server-side environment variables (no `VITE_` prefix)

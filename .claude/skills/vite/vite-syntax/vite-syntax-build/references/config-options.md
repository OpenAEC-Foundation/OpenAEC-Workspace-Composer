# Build Configuration Options — Complete Reference

> All options listed under the `build` key in `vite.config.ts`.
> Version annotations: **v6** = Vite 6, **v7** = Vite 7, **v8** = Vite 8+.

---

## build.target

- **Type**: `string | string[]`
- **Default**:
  - v8+: `'baseline-widely-available'` → `['chrome111', 'edge111', 'firefox114', 'safari16.4']`
  - v7: `'baseline-widely-available'` → `['chrome107', 'edge107', 'firefox104', 'safari16.0']`
  - v6: `'modules'` (native ESM browser support)
- **Description**: Browser compatibility target for the production build. Vite handles syntax transforms only — no polyfills. Use `'esnext'` for minimal transpiling (assumes native dynamic import support). Custom targets: `'es2015'`, `'chrome58'`, etc.
- **Versions**: All (default value changed in v7)

## build.modulePreload

- **Type**: `boolean | { polyfill?: boolean, resolveDependencies?: (filename: string, deps: string[], context: { hostId: string, hostType: 'html' | 'js' }) => string[] }`
- **Default**: `{ polyfill: true }`
- **Description**: Controls `<link rel="modulepreload">` directive generation. Set `polyfill: false` to skip the polyfill. Use `resolveDependencies` to customize which dependencies get preloaded.
- **Versions**: All

## build.outDir

- **Type**: `string`
- **Default**: `'dist'`
- **Description**: Output directory for the production build. Relative to project root. Emptied before build if inside root (controlled by `build.emptyOutDir`).
- **Versions**: All

## build.assetsDir

- **Type**: `string`
- **Default**: `'assets'`
- **Description**: Directory for generated assets (JS, CSS, images) relative to `outDir`. NEVER used in Library Mode — library output filenames are controlled by `build.lib.fileName`.
- **Versions**: All

## build.assetsInlineLimit

- **Type**: `number | ((filePath: string, content: Buffer) => boolean | undefined)`
- **Default**: `4096` (4 KiB)
- **Description**: Assets smaller than this threshold (in bytes) are inlined as base64 data URLs. Set `0` to disable inlining entirely. The function form allows per-file decisions: return `true` to force inline, `false` to force file, `undefined` to fall back to size check. Git LFS placeholders are ALWAYS excluded from inlining.
- **Versions**: All (function form added in v5.x)

## build.cssCodeSplit

- **Type**: `boolean`
- **Default**: `true`
- **Description**: When enabled, CSS from async chunks is extracted into separate `.css` files that load automatically via `<link>` tags before chunk execution. Set `false` to bundle ALL CSS into a single file.
- **Versions**: All

## build.cssTarget

- **Type**: `string | string[]`
- **Default**: Same as `build.target`
- **Description**: Separate browser target specifically for CSS minification. Use when CSS target differs from JS target (e.g., targeting Android WeChat WebView which supports modern JS but not CSS `color: oklch()`).
- **Versions**: All

## build.cssMinify

- **Type**: `boolean | 'lightningcss' | 'esbuild'`
- **Default**:
  - v8+ client: `'lightningcss'`
  - v8+ SSR: `'lightningcss'`
  - v6-v7 client: Same as `build.minify` (esbuild)
  - v6-v7 SSR: `'esbuild'` (v6 enabled by default; v5 was false)
- **Description**: CSS minification engine. Can differ from JS minification.
- **Versions**: All (Lightning CSS default in v8)

## build.sourcemap

- **Type**: `boolean | 'inline' | 'hidden'`
- **Default**: `false`
- **Description**: Source map generation. `true` generates separate `.map` files. `'inline'` embeds maps as data URIs in output files. `'hidden'` generates `.map` files but suppresses `//# sourceMappingURL` comments — use for error tracking services that consume maps server-side.
- **Versions**: All

## build.rolldownOptions (v8+)

- **Type**: `RolldownOptions`
- **Default**: `{}`
- **Description**: Direct Rolldown bundle configuration. Merge with internal Rolldown config. Use for `input` (multi-page apps), `external` (library mode), `output` (format, globals, manualChunks).
- **Versions**: v8+ only
- **Note**: Replaces `build.rollupOptions`

## build.rollupOptions (v6-v7, deprecated in v8)

- **Type**: `RollupOptions` (v6-v7) / `RolldownOptions` (v8 alias)
- **Default**: `{}`
- **Description**: Direct Rollup bundle configuration for v6-v7. In v8+, this is a deprecated alias for `build.rolldownOptions`. ALWAYS use `build.rolldownOptions` in v8+ projects.
- **Versions**: v6-v7 (deprecated in v8)

## build.lib

- **Type**: `false | { entry: string | string[] | Record<string, string>, name?: string, formats?: ('es' | 'cjs' | 'umd' | 'iife')[], fileName?: string | ((format: string, entryName: string) => string), cssFileName?: string }`
- **Default**: `false`
- **Description**: Library mode configuration.
  - `entry` — REQUIRED. Library entry point(s).
  - `name` — Global variable name for UMD/IIFE builds. Required when formats include UMD or IIFE.
  - `formats` — Default `['es', 'umd']` for single entry, `['es', 'cjs']` for multiple entries.
  - `fileName` — Output filename. Auto-appends format-appropriate extension.
  - `cssFileName` — Custom CSS output filename (v6+). In v6+, CSS filename defaults to `package.json` name instead of `style.css`.
- **Versions**: All

## build.manifest

- **Type**: `boolean | string`
- **Default**: `false`
- **Description**: Generates a `.vite/manifest.json` file mapping original source filenames to their hashed output filenames. Used for backend integration (server-side rendering of correct asset URLs). String value specifies custom manifest filename.
- **Versions**: All

## build.ssrManifest

- **Type**: `boolean | string`
- **Default**: `false`
- **Description**: Generates `.vite/ssr-manifest.json` containing module-to-chunk mappings for SSR preloading. String value specifies custom filename.
- **Versions**: All

## build.ssr

- **Type**: `boolean | string`
- **Default**: `false`
- **Description**: Produce SSR-oriented build. String value specifies the SSR entry point. When `true`, SSR entry must be specified via `rolldownOptions.input` (v8+) or `rollupOptions.input` (v6-v7).
- **Versions**: All

## build.minify

- **Type**: `boolean | 'oxc' | 'terser' | 'esbuild'`
- **Default**:
  - v8+ client: `'oxc'`
  - v8+ SSR: `false`
  - v6-v7 client: `'esbuild'`
  - v6-v7 SSR: `false`
- **Description**: Minification engine.
  - `'oxc'` — v8+ default. 30-90x faster than Terser. Built into Rolldown.
  - `'esbuild'` — v6-v7 default. Fast but less aggressive compression. In v8+, esbuild is no longer a direct dependency — install manually if needed.
  - `'terser'` — Maximum compression. Requires `npm install -D terser`. Slower than oxc/esbuild.
  - `false` — Disable minification entirely (default for SSR builds).
- **Versions**: All (oxc added in v8)

## build.write

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Controls whether the build output is written to disk. Set `false` when using programmatic `build()` API and you need to post-process the bundle before writing.
- **Versions**: All

## build.emptyOutDir

- **Type**: `boolean`
- **Default**: `true` if `outDir` is inside project `root`, `false` otherwise
- **Description**: Empty the output directory before building. Vite emits a warning and skips when `outDir` is outside root to prevent accidental deletion. Set `true` explicitly to force emptying even outside root.
- **Versions**: All

## build.copyPublicDir

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Copy files from `publicDir` into `outDir` during build. Set `false` if you handle public assets separately.
- **Versions**: All

## build.reportCompressedSize

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Report gzip-compressed sizes in the build output summary. ALWAYS disable for large projects — the compression calculation can slow down builds significantly.
- **Versions**: All

## build.chunkSizeWarningLimit

- **Type**: `number`
- **Default**: `500` (KiB, uncompressed)
- **Description**: Chunk size limit (in KiB) that triggers warnings. Increase if large chunks are expected, or refactor code splitting to reduce chunk sizes.
- **Versions**: All

## build.watch

- **Type**: `WatcherOptions | null`
- **Default**: `null`
- **Description**: File system watcher options for watch mode. Set `{}` to enable basic watch mode. Pass chokidar-compatible watcher options for customization. Also available via `vite build --watch` CLI flag.
- **Versions**: All (v8 removed `chokidar` sub-option from `rollupOptions.watch`)

## build.license (v8+)

- **Type**: `boolean | { fileName?: string }`
- **Default**: `false`
- **Description**: Generate a license file containing bundled dependency licenses. Default output: `.vite/license.md`. Customize filename via `{ fileName: 'custom-license.md' }`.
- **Versions**: v8+ only

---

## Version Migration Quick Reference

### v6 → v7

| Change | v6 | v7 |
|--------|----|----|
| `build.target` default | `'modules'` | `'baseline-widely-available'` |
| `splitVendorChunkPlugin` | Available | **Removed** |
| Node.js requirement | 18+ | 20.19+ or 22.12+ |

### v7 → v8

| Change | v7 | v8 |
|--------|----|----|
| Bundler options key | `build.rollupOptions` | `build.rolldownOptions` |
| Default minifier | `'esbuild'` | `'oxc'` |
| CSS minifier | esbuild | Lightning CSS |
| `build.target` browsers | Chrome 107+ | Chrome 111+ |
| `build.license` | Not available | Available |
| esbuild dependency | Built-in | Optional (install manually) |
| `build.rollupOptions.watch.chokidar` | Available | **Removed** |
| `output.manualChunks` object form | Available | **Removed** (use function) |
| `build()` API errors | Raw error | `BundleError` with `.errors` array |

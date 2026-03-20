# Config Options Reference — resolve.*, css.*, json.*, html.*

## resolve.* Options

### resolve.alias

- **Type**: `Record<string, string> | Array<{ find: string | RegExp, replacement: string }>`
- **Default**: —

Defines path aliases for import resolution. Object format maps string prefixes to replacement paths. Array format supports regex patterns in the `find` field.

When using the object format, keys are matched as path prefixes. When using the array format, entries are checked in order — first match wins.

ALWAYS use absolute paths (via `resolve()` or `import.meta.dirname`) for replacement values to avoid resolution ambiguity.

### resolve.dedupe

- **Type**: `string[]`
- **Default**: —

Forces Vite to resolve listed dependencies to the same copy (single instance). ALWAYS use in monorepos where multiple packages depend on the same library to prevent duplicate module instances.

```typescript
resolve: {
  dedupe: ['react', 'react-dom'],
}
```

### resolve.conditions

- **Type**: `string[]`
- **Default (client)**: `['module', 'browser', 'development|production']`
- **Default (SSR)**: `['module', 'node', 'development|production']`

Additional conditions for resolving Conditional Exports from `package.json`. The `'development|production'` token is replaced automatically based on the current `NODE_ENV` value.

### resolve.mainFields

- **Type**: `string[]`
- **Default**: `['browser', 'module', 'jsnext:main', 'jsnext']`

Fields in `package.json` tried when resolving package entry points. These have LOWER precedence than the `exports` field in `package.json`.

### resolve.extensions

- **Type**: `string[]`
- **Default**: `['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']`

File extensions tried for imports that omit extensions. NEVER add custom extensions like `.vue` here — the Vite team recommends importing those with explicit extensions for clarity and IDE support.

### resolve.preserveSymlinks

- **Type**: `boolean`
- **Default**: `false`

When `true`, file identity is determined by the original path (before following symlinks) rather than the real path. Maps to the same-named option in Node.js and Rolldown/Rollup.

### resolve.tsconfigPaths

- **Type**: `boolean`
- **Default**: `false`

Enables resolution of TypeScript `paths` from `tsconfig.json`. The TypeScript team discourages this due to performance costs. Prefer explicit `resolve.alias` entries when possible.

---

## css.* Options

### css.modules

- **Type**: `CSSModulesOptions`
- **Default**: —

Configures CSS Modules behavior. Passed to `postcss-modules` internally. Has NO effect when `css.transformer` is `'lightningcss'` — use `css.lightningcss.cssModules` instead.

#### css.modules.scopeBehaviour

- **Type**: `'global' | 'local'`
- **Default**: `'local'`

Controls whether CSS classes are scoped locally by default.

#### css.modules.globalModulePaths

- **Type**: `RegExp[]`
- **Default**: —

Paths matching these patterns are treated as global CSS (not scoped).

#### css.modules.exportGlobals

- **Type**: `boolean`
- **Default**: `false`

When `true`, `:global(...)` classes are also exported from the module.

#### css.modules.generateScopedName

- **Type**: `string | ((name: string, filename: string, css: string) => string)`
- **Default**: —

Pattern or function for generating scoped class names. String format supports `[name]`, `[local]`, `[hash]` placeholders.

#### css.modules.hashPrefix

- **Type**: `string`
- **Default**: —

Prefix added to the hash to reduce class name collisions.

#### css.modules.localsConvention

- **Type**: `'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly' | null`
- **Default**: —

Controls class name export convention:
- `'camelCase'`: exports both original and camelCase
- `'camelCaseOnly'`: exports only camelCase version
- `'dashes'`: exports both original and dashed-to-camelCase
- `'dashesOnly'`: exports only dashed-to-camelCase version

#### css.modules.getJSON

- **Type**: `(cssFileName: string, json: Record<string, string>, outputFileName: string) => void`
- **Default**: —

Callback for custom handling of the CSS Modules JSON output.

### css.postcss

- **Type**: `string | (postcss.ProcessOptions & { plugins?: postcss.AcceptedPlugin[] })`
- **Default**: —

When a string, specifies the directory to search for a PostCSS config file. When an object, provides inline PostCSS configuration with `plugins` array and processing options.

If not set, Vite auto-detects PostCSS config from standard config files (`postcss.config.js`, `.postcssrc.json`, etc.) via `postcss-load-config`.

### css.preprocessorOptions

- **Type**: `Record<string, object>`
- **Default**: —

Options passed to CSS preprocessors. Keys are the preprocessor name (`scss`, `sass`, `less`, `styl`, `stylus`).

Common sub-options:
- `scss.additionalData`: String prepended to every SCSS file before processing
- `less.math`: Math mode (`'parens-division'` recommended)
- `stylus.define`: Variables defined globally

### css.preprocessorMaxWorkers

- **Type**: `number | true`
- **Default**: `true` (number of CPUs minus 1)

Maximum number of worker threads for CSS preprocessor execution. Set to `0` to disable workers entirely. Set to `true` for automatic detection (CPUs - 1).

### css.devSourcemap

- **Type**: `boolean`
- **Default**: `false`
- **Status**: Experimental

Enables CSS sourcemaps during development.

### css.transformer

- **Type**: `'postcss' | 'lightningcss'`
- **Default**: `'postcss'`
- **Status**: Experimental

Selects the CSS processing engine:
- `'postcss'`: Standard PostCSS pipeline with plugin support
- `'lightningcss'`: Lightning CSS for faster processing with built-in modern CSS features

### css.lightningcss

- **Type**: `LightningCSSOptions`
- **Default**: —
- **Status**: Experimental

Configuration for Lightning CSS when `css.transformer: 'lightningcss'` is set.

#### css.lightningcss.targets

Browser targets for CSS feature transformation. Use `browserslistToTargets()` from the `lightningcss` package to convert browserslist queries.

#### css.lightningcss.include

CSS features to explicitly enable (even if targets would not require them).

#### css.lightningcss.exclude

CSS features to explicitly disable (even if targets would compile them).

#### css.lightningcss.drafts

Enable draft CSS features:
- `customMedia`: Enable `@custom-media` rules

#### css.lightningcss.nonStandard

Enable non-standard CSS features.

#### css.lightningcss.cssModules

CSS Modules configuration for Lightning CSS. ALWAYS use this instead of `css.modules` when using Lightning CSS transformer.

#### css.lightningcss.pseudoClasses

Custom pseudo-class handling.

#### css.lightningcss.unusedSymbols

List of symbols considered unused for dead-code elimination.

---

## json.* Options

### json.namedExports

- **Type**: `boolean`
- **Default**: `true`

Enables named imports from `.json` files for tree-shaking:

```typescript
import { version } from './package.json'
```

When `false`, only default imports work.

### json.stringify

- **Type**: `boolean | 'auto'`
- **Default**: `'auto'`

Controls whether imported JSON is converted to `export default JSON.parse("...")` for faster runtime parsing.

- `'auto'`: Stringifies JSON files larger than 10kB. Disables named exports for stringified files.
- `true`: ALWAYS stringify (faster parsing, but no named exports)
- `false`: NEVER stringify

---

## html.* Options

### html.cspNonce

- **Type**: `string`
- **Default**: —

Nonce value placeholder added to all generated `<script>` and `<style>` tags. Vite also generates a `<meta property="csp-nonce" nonce="PLACEHOLDER" />` tag in the HTML output.

ALWAYS replace the placeholder with a unique cryptographic nonce per HTTP request on the server side.

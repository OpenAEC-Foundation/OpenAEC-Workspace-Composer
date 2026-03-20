# Migration Anti-Patterns

Common mistakes during Vite version migration and how to avoid them.

---

## Anti-Pattern 1: Skipping Major Versions Without Sequential Review

**Mistake**: Jumping from Vite 5 to 8 and only reading the v7-to-v8 migration guide.

**Why it fails**: Each major version introduces breaking changes that compound. Skipping the intermediate guides causes missed deprecations, removed APIs, and subtle behavior changes.

**Correct approach**: ALWAYS review breaking changes for EVERY major version in the path. Apply changes sequentially (v5->v6, v6->v7, v7->v8), even if upgrading directly.

---

## Anti-Pattern 2: Not Checking Node.js Version Before Upgrade

**Mistake**: Running `npm install vite@7` on Node.js 18.

**Why it fails**: Vite 7+ requires Node.js 20.19+ or 22.12+. The install may succeed but Vite will crash at runtime with cryptic errors about unsupported features.

**Correct approach**: ALWAYS check `node --version` before upgrading. Upgrade Node.js first if needed.

```bash
# Check first
node --version
# Then upgrade Vite
npm install vite@latest
```

---

## Anti-Pattern 3: Keeping Legacy Sass API References in v7+

**Mistake**: Leaving `api: 'legacy'` in the config after upgrading to Vite 7.

```javascript
// WRONG: This option is completely removed in v7
css: {
  preprocessorOptions: {
    scss: { api: 'legacy' },
  },
}
```

**Why it fails**: The option is silently ignored or throws an error. Sass files using `@import` may compile differently or fail under the modern API.

**Correct approach**: ALWAYS migrate Sass files to use `@use`/`@forward` before upgrading to v7. Remove all `api: 'legacy'` references.

---

## Anti-Pattern 4: Using Object Form of manualChunks in v8

**Mistake**: Keeping the object form of `manualChunks` when upgrading to Vite 8.

```javascript
// WRONG: Object form removed in v8
output: {
  manualChunks: {
    vendor: ['react', 'react-dom'],
  },
}
```

**Why it fails**: Rolldown does not support the object form. Build will fail with a configuration error.

**Correct approach**: ALWAYS convert to function form:

```javascript
output: {
  manualChunks(id) {
    if (id.includes('react')) return 'vendor'
  },
}
```

---

## Anti-Pattern 5: Forgetting moduleType in Plugin Hooks

**Mistake**: Migrating a Vite plugin to v8 without adding `moduleType: 'js'` to load/transform hooks that return transformed content.

```javascript
// WRONG: Missing moduleType in v8
transform(code, id) {
  if (id.endsWith('.graphql')) {
    return { code: `export default ${JSON.stringify(parse(code))}` }
  }
}
```

**Why it fails**: Rolldown needs to know the output module type. Without `moduleType`, the transformed content may be misinterpreted, causing silent failures or incorrect bundling.

**Correct approach**: ALWAYS add `moduleType: 'js'` when transforming non-JS content to JS:

```javascript
transform(code, id) {
  if (id.endsWith('.graphql')) {
    return {
      code: `export default ${JSON.stringify(parse(code))}`,
      moduleType: 'js',
    }
  }
}
```

---

## Anti-Pattern 6: Assuming rollupOptions and rolldownOptions Are Identical

**Mistake**: Renaming `rollupOptions` to `rolldownOptions` without reviewing the option differences.

**Why it fails**: While most options are compatible, Rolldown has differences in supported features. Some Rollup-specific options (like `watch.chokidar`, object `manualChunks`) are removed, and new Rolldown-specific options are available.

**Correct approach**: ALWAYS review the Rolldown documentation for option compatibility. Test the build output after migration.

---

## Anti-Pattern 7: Not Updating Plugin Dependencies

**Mistake**: Upgrading Vite but keeping old plugin versions.

```json
{
  "vite": "^8.0.0",
  "@vitejs/plugin-react": "^3.0.0"
}
```

**Why it fails**: Older plugins may use deprecated APIs, incompatible hook signatures, or missing `moduleType` declarations. This causes build failures or incorrect behavior.

**Correct approach**: ALWAYS update all Vite-related plugins to their latest versions when upgrading Vite:

```bash
npm install vite@latest @vitejs/plugin-react@latest @vitejs/plugin-vue@latest
```

---

## Anti-Pattern 8: Ignoring build.target Default Changes

**Mistake**: Not noticing that `build.target` changed between versions, then receiving bug reports from users on older browsers.

**Why it fails**: The default target moves forward with each major version. Code that worked for your users on v6 (`'modules'` / es2020) may use newer syntax on v7 (`'baseline-widely-available'` / Chrome 107+) that older browsers do not support.

**Correct approach**: ALWAYS explicitly set `build.target` if you need to support specific browser versions:

```javascript
export default defineConfig({
  build: {
    target: ['chrome90', 'firefox88', 'safari14'],
  },
})
```

---

## Anti-Pattern 9: Using ts-node for PostCSS Config in v6+

**Mistake**: Keeping `ts-node` as the loader for PostCSS TypeScript configs after upgrading to Vite 6.

**Why it fails**: `postcss-load-config` v6 (used by Vite 6+) dropped `ts-node` support. PostCSS config will fail to load.

**Correct approach**: ALWAYS switch to `tsx` or `jiti`:

```bash
npm uninstall ts-node
npm install -D tsx
```

---

## Anti-Pattern 10: Catching Build Errors Without BundleError Check in v8

**Mistake**: Using a generic try/catch for `build()` in Vite 8 without checking for the `BundleError` type.

```javascript
// WRONG: Misses structured error information
try {
  await build()
} catch (e) {
  console.error(e.message) // May miss individual error details
}
```

**Why it fails**: `BundleError` contains an `errors` array with individual error codes, messages, and locations. A generic catch loses this structured information.

**Correct approach**: ALWAYS check for the `errors` property:

```javascript
try {
  await build()
} catch (e) {
  if (e.errors) {
    for (const err of e.errors) {
      console.error(`[${err.code}] ${err.message}`)
    }
  } else {
    console.error(e)
  }
}
```

---

## Anti-Pattern 11: Not Testing CJS Dependencies After v8 Upgrade

**Mistake**: Assuming all CommonJS dependencies will work identically after upgrading to Vite 8.

**Why it fails**: Rolldown handles CJS interop differently from Rollup. The `default` import from CJS modules may resolve differently, and the format sniffing heuristic between `browser`/`module` fields is removed.

**Correct approach**: ALWAYS test imports from CJS dependencies after upgrading. If a CJS dependency breaks, check:
1. Whether it has proper `exports` field in `package.json`
2. Whether it needs to be added to `optimizeDeps.include`
3. Whether the `default` import needs adjustment

---

## Anti-Pattern 12: Using import.meta.url in UMD/IIFE Library Builds on v8

**Mistake**: Relying on `import.meta.url` in a library that builds to UMD or IIFE format.

```javascript
// WRONG: No longer polyfilled in UMD/IIFE on v8
const workerUrl = new URL('./worker.js', import.meta.url)
```

**Why it fails**: Vite 8 no longer polyfills `import.meta.url` for UMD/IIFE output. The reference will be `undefined` at runtime.

**Correct approach**: For UMD/IIFE builds, ALWAYS pass URLs as parameters or use an alternative resolution strategy:

```javascript
// Pass URL as parameter
export function createWorker(workerUrl) {
  return new Worker(workerUrl)
}
```

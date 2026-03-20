# Anti-Patterns — Resolve and CSS Mistakes

## Resolve Anti-Patterns

### AP-001: Using Relative Paths in Alias Values

**WRONG:**

```typescript
resolve: {
  alias: {
    '@': './src',
    '@utils': '../utils',
  },
}
```

**WHY**: Relative paths resolve differently depending on the importing file's location. This causes inconsistent behavior across the project.

**CORRECT:**

```typescript
import { resolve } from 'path'

resolve: {
  alias: {
    '@': resolve(import.meta.dirname, 'src'),
    '@utils': resolve(import.meta.dirname, 'utils'),
  },
}
```

ALWAYS use absolute paths via `resolve()` or `import.meta.dirname` in alias replacements.

---

### AP-002: Adding .vue to resolve.extensions

**WRONG:**

```typescript
resolve: {
  extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
}
```

**WHY**: The Vite team explicitly recommends AGAINST adding custom types like `.vue` to resolve.extensions. It hurts IDE support and makes imports ambiguous. A `.vue` import without the extension looks like a JavaScript module.

**CORRECT:**

```typescript
// Keep default extensions, import .vue files explicitly
import MyComponent from './MyComponent.vue'
```

---

### AP-003: Using resolve.tsconfigPaths Without Considering Performance

**WRONG:**

```typescript
resolve: {
  tsconfigPaths: true,  // "it's convenient"
}
```

**WHY**: The TypeScript team discourages this feature due to performance overhead. Every module resolution requires reading and processing tsconfig paths.

**CORRECT:**

```typescript
// Explicit aliases — faster and clearer
resolve: {
  alias: {
    '@': resolve(import.meta.dirname, 'src'),
    '@lib': resolve(import.meta.dirname, 'lib'),
  },
}
```

Mirror these aliases in `tsconfig.json` `paths` for TypeScript IDE support.

---

### AP-004: Using Object Format for Regex Aliases

**WRONG:**

```typescript
resolve: {
  alias: {
    '/^@lib\/(.*)/': './lib/$1',  // This is a string key, NOT a regex
  },
}
```

**WHY**: Object keys are ALWAYS strings. Regex patterns require the array format.

**CORRECT:**

```typescript
resolve: {
  alias: [
    { find: /^@lib\/(.*)/, replacement: resolve(import.meta.dirname, 'lib/$1') },
  ],
}
```

---

### AP-005: Missing resolve.dedupe in Monorepos

**WRONG:**

```typescript
// Monorepo with shared React — no dedupe configured
export default defineConfig({
  resolve: {
    alias: { '@shared': '../../packages/shared/src' },
  },
})
```

**WHY**: Without `dedupe`, multiple copies of React can be bundled when different packages resolve to different `node_modules` directories. This causes "Invalid Hook Call" errors and runtime crashes.

**CORRECT:**

```typescript
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: { '@shared': resolve(import.meta.dirname, '../../packages/shared/src') },
  },
})
```

---

## CSS Anti-Patterns

### AP-006: Installing Vite Plugins for CSS Preprocessors

**WRONG:**

```bash
npm add -D sass vite-plugin-sass
```

```typescript
import sass from 'vite-plugin-sass'
export default defineConfig({
  plugins: [sass()],
})
```

**WHY**: Vite has BUILT-IN support for Sass, Less, and Stylus. No plugins needed. Third-party plugins can conflict with Vite's internal CSS pipeline.

**CORRECT:**

```bash
npm add -D sass-embedded  # Just the preprocessor, nothing else
```

No plugin configuration in vite.config.ts.

---

### AP-007: Using css.modules with Lightning CSS Transformer

**WRONG:**

```typescript
export default defineConfig({
  css: {
    transformer: 'lightningcss',
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
})
```

**WHY**: When `css.transformer` is `'lightningcss'`, the `css.modules` option is completely ignored. Lightning CSS has its own CSS Modules implementation.

**CORRECT:**

```typescript
export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      cssModules: {
        pattern: '[name]_[local]_[hash]',
      },
    },
  },
})
```

---

### AP-008: Missing build.cssMinify with Lightning CSS

**WRONG:**

```typescript
export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: { /* ... */ },
  },
  // No build.cssMinify — production uses default PostCSS minification
})
```

**WHY**: Without `build.cssMinify: 'lightningcss'`, development uses Lightning CSS but production minification falls back to the default engine. This causes inconsistent CSS output between dev and build.

**CORRECT:**

```typescript
export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: { /* ... */ },
  },
  build: {
    cssMinify: 'lightningcss',
  },
})
```

---

### AP-009: Using @import with Preprocessor Variables

**WRONG:**

```scss
/* main.scss */
$primary: blue;

/* component.scss */
@import './main.scss';  /* Works, but pulls in ALL of main.scss */
.btn { color: $primary; }
```

**WHY**: Sass `@import` is deprecated and inlines the entire file every time. This leads to duplicated CSS output and slow compilation.

**CORRECT:**

```typescript
// vite.config.ts — inject shared variables globally
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *;`,
      },
    },
  },
})
```

```scss
/* component.scss — $primary is available without @import */
.btn { color: $primary; }
```

---

### AP-010: Expecting .css Files to Be CSS Modules

**WRONG:**

```typescript
// This does NOT work as a CSS Module
import styles from './Button.css'
console.log(styles.primary)  // undefined
```

**WHY**: Only files with the `.module.css` suffix are treated as CSS Modules. Regular `.css` files are injected globally.

**CORRECT:**

```typescript
// Rename to .module.css
import styles from './Button.module.css'
console.log(styles.primary)  // "Button_primary_a1b2c3"
```

---

### AP-011: Setting html.cspNonce to a Static Value in Production

**WRONG:**

```typescript
export default defineConfig({
  html: {
    cspNonce: 'abc123',  // Same nonce for every request
  },
})
```

**WHY**: CSP nonces MUST be unique per request. A static nonce provides zero security benefit — attackers can predict and reuse it.

**CORRECT:**

```typescript
// Use a placeholder in Vite config
export default defineConfig({
  html: {
    cspNonce: '**CSP_NONCE**',
  },
})

// Replace per-request on the server
app.get('*', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('base64')
  const html = template.replaceAll('**CSP_NONCE**', nonce)
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`)
  res.send(html)
})
```

---

### AP-012: Setting json.stringify to true with Named Imports

**WRONG:**

```typescript
// vite.config.ts
export default defineConfig({
  json: {
    stringify: true,
  },
})
```

```typescript
// Source file — will FAIL or lose tree-shaking
import { version } from './package.json'
```

**WHY**: When `json.stringify` is `true`, JSON is converted to `export default JSON.parse("...")`. Named exports are NOT available — only default import works.

**CORRECT:**

```typescript
// Use 'auto' (default) — only stringifies files > 10kB
export default defineConfig({
  json: {
    stringify: 'auto',
  },
})

// OR use default import when stringify is true
import pkg from './package.json'
const { version } = pkg
```

# Examples — Aliases, CSS Modules, Preprocessors, Lightning CSS, PostCSS

## Resolve Alias Examples

### Object Format — Standard Project

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@components': resolve(import.meta.dirname, 'src/components'),
      '@utils': resolve(import.meta.dirname, 'src/utils'),
      '@assets': resolve(import.meta.dirname, 'src/assets'),
      '@styles': resolve(import.meta.dirname, 'src/styles'),
    },
  },
})
```

Usage in source files:

```typescript
import { Button } from '@components/Button'
import { formatDate } from '@utils/date'
import logo from '@assets/logo.svg'
import '@styles/global.css'
```

### Array Format — With Regex Matching

```typescript
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: resolve(import.meta.dirname, 'src') },
      // Redirect .js imports to .alias files
      { find: /^(.*)\.js$/, replacement: '$1.alias' },
      // Remap a package to a local fork
      { find: 'some-package', replacement: resolve(import.meta.dirname, 'lib/some-package-fork') },
    ],
  },
})
```

### Monorepo — Dedupe Shared Dependencies

```typescript
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react'],
    alias: {
      '@shared': resolve(import.meta.dirname, '../../packages/shared/src'),
    },
  },
})
```

### TypeScript Path Aliases (Two Approaches)

**Approach 1 — Explicit alias (recommended):**

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
})
```

```json
// tsconfig.json — must mirror vite aliases for IDE support
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Approach 2 — tsconfigPaths (convenience, slower):**

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
})
```

```json
// tsconfig.json — Vite reads paths from here
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@lib/*": ["./lib/*"]
    }
  }
}
```

---

## CSS Modules Examples

### Basic CSS Module

```css
/* Button.module.css */
.primary {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}

.secondary {
  background-color: #6b7280;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}
```

```typescript
import classes from './Button.module.css'

function createButton(variant: 'primary' | 'secondary') {
  const btn = document.createElement('button')
  btn.className = classes[variant]
  return btn
}
```

### CSS Module with Sass

```scss
/* Card.module.scss */
$radius: 8px;

.card {
  border-radius: $radius;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &Title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  &Body {
    padding: 16px;
  }
}
```

```typescript
import styles from './Card.module.scss'
// styles.card, styles.cardTitle, styles.cardBody
```

### CSS Modules with localsConvention

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
})
```

```css
/* nav.module.css */
.nav-item { color: blue; }
.nav-item--active { color: red; }
```

```typescript
// With camelCaseOnly:
import { navItem, navItemActive } from './nav.module.css'
```

### Global CSS Module Paths

```typescript
export default defineConfig({
  css: {
    modules: {
      scopeBehaviour: 'local',
      globalModulePaths: [/global\.module\.css/],
    },
  },
})
```

---

## CSS Preprocessor Examples

### Sass with Global Variables

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/styles/variables" as *;
          @use "@/styles/mixins" as *;
        `,
      },
    },
  },
})
```

```scss
/* src/styles/_variables.scss */
$primary: #3b82f6;
$font-stack: 'Inter', system-ui, sans-serif;
```

```scss
/* src/components/Button.scss — $primary is available without import */
.button {
  background: $primary;
  font-family: $font-stack;
}
```

### Less with Math Options

```typescript
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        math: 'parens-division',
        modifyVars: {
          'primary-color': '#1DA57A',
          'link-color': '#1DA57A',
        },
        javascriptEnabled: true,
      },
    },
  },
})
```

### Stylus with Global Defines

```typescript
export default defineConfig({
  css: {
    preprocessorOptions: {
      styl: {
        define: {
          $specialColor: new stylus.nodes.RGBA(51, 197, 255, 1),
        },
        imports: [resolve(import.meta.dirname, 'src/styles/mixins.styl')],
      },
    },
  },
})
```

### Preprocessor Max Workers

```typescript
export default defineConfig({
  css: {
    preprocessorMaxWorkers: true, // CPUs - 1 (default, best performance)
    // preprocessorMaxWorkers: 0,  // Disable workers (for debugging)
    // preprocessorMaxWorkers: 4,  // Explicit worker count
  },
})
```

---

## Lightning CSS Examples

### Basic Lightning CSS Setup

```bash
npm add -D lightningcss browserslist
```

```typescript
import { defineConfig } from 'vite'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist('>= 0.25%')),
    },
  },
  build: {
    cssMinify: 'lightningcss',
  },
})
```

### Lightning CSS with Draft Features

```typescript
export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist('>= 0.25%')),
      drafts: {
        customMedia: true,
      },
    },
  },
  build: {
    cssMinify: 'lightningcss',
  },
})
```

```css
/* Using @custom-media (draft feature) */
@custom-media --mobile (max-width: 768px);

@media (--mobile) {
  .container { padding: 16px; }
}
```

### Lightning CSS Modules Configuration

```typescript
export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist('>= 0.25%')),
      cssModules: {
        pattern: '[name]_[local]_[hash]',
        dashedIdents: true,
      },
    },
  },
  build: {
    cssMinify: 'lightningcss',
  },
})
```

---

## PostCSS Examples

### Auto-Detection (Config File)

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

No Vite configuration needed — Vite detects `postcss.config.js` automatically.

### Inline PostCSS in Vite Config

```typescript
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import cssnano from 'cssnano'

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
        ...(process.env.NODE_ENV === 'production' ? [cssnano()] : []),
      ],
    },
  },
})
```

### PostCSS Config in Custom Directory

```typescript
export default defineConfig({
  css: {
    postcss: './config',
    // Vite looks for postcss.config.js inside ./config/
  },
})
```

---

## CSS ?inline Query Example

```typescript
// Returns CSS as a string, NOT injected into the page
import tooltipStyles from './tooltip.css?inline'

// Use in shadow DOM
class TooltipElement extends HTMLElement {
  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = tooltipStyles
    shadow.appendChild(style)
  }
}
```

---

## JSON Import Examples

### Named Exports (Tree-Shakeable)

```typescript
// Only 'version' is included in the bundle
import { version, name } from './package.json'
console.log(`${name}@${version}`)
```

### Full Import

```typescript
import config from './config.json'
console.log(config.apiUrl)
```

### Stringify Configuration

```typescript
// Force all JSON through JSON.parse() for faster runtime parsing
export default defineConfig({
  json: {
    stringify: true,    // All JSON stringified (no named exports)
  },
})

// Auto mode (default): only stringify files > 10kB
export default defineConfig({
  json: {
    stringify: 'auto',
  },
})
```

---

## CSP Nonce Example

```typescript
// vite.config.ts
export default defineConfig({
  html: {
    cspNonce: '**CSP_NONCE**',
  },
})
```

Output HTML includes nonce on all generated tags:

```html
<meta property="csp-nonce" nonce="**CSP_NONCE**" />
<script type="module" src="/assets/main.js" nonce="**CSP_NONCE**"></script>
<link rel="stylesheet" href="/assets/style.css" nonce="**CSP_NONCE**" />
```

Server-side replacement (Express example):

```typescript
app.get('*', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('base64')
  const html = indexHtml.replaceAll('**CSP_NONCE**', nonce)
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'`)
  res.send(html)
})
```

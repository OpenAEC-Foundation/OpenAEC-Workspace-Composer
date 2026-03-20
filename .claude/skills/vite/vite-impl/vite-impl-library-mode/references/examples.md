# Library Mode: Working Examples

## Example 1: Single Entry React Component Library

### vite.config.ts

```typescript
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({ rollupTypes: true }),  // Bundles .d.ts into single file
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/index.ts'),
      name: 'MyComponents',
      fileName: 'my-components',
      cssFileName: 'styles',
    },
    rolldownOptions: {  // Use rollupOptions for Vite 6.x/7.x
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
})
```

### package.json

```json
{
  "name": "@myorg/components",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-components.umd.cjs",
  "module": "./dist/my-components.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/my-components.js",
      "require": "./dist/my-components.umd.cjs"
    },
    "./style.css": "./dist/styles.css"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vite-plugin-dts": "^4.0.0"
  }
}
```

### lib/index.ts

```typescript
export { Button } from './components/Button'
export { Input } from './components/Input'
export type { ButtonProps, InputProps } from './types'

// CSS is imported here — extracted to dist/styles.css
import './styles/global.css'
```

### Build output

```
dist/
├── my-components.js        # ESM bundle
├── my-components.umd.cjs   # UMD bundle
├── styles.css              # Extracted CSS
└── index.d.ts              # TypeScript declarations
```

---

## Example 2: Multiple Entry Points (Utility Library)

### vite.config.ts

```typescript
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'lib/index.ts'),
        math: resolve(import.meta.dirname, 'lib/math.ts'),
        string: resolve(import.meta.dirname, 'lib/string.ts'),
        date: resolve(import.meta.dirname, 'lib/date.ts'),
      },
      formats: ['es', 'cjs'],
    },
  },
})
```

### package.json

```json
{
  "name": "my-utils",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./math": {
      "types": "./dist/math.d.ts",
      "import": "./dist/math.js",
      "require": "./dist/math.cjs"
    },
    "./string": {
      "types": "./dist/string.d.ts",
      "import": "./dist/string.js",
      "require": "./dist/string.cjs"
    },
    "./date": {
      "types": "./dist/date.d.ts",
      "import": "./dist/date.js",
      "require": "./dist/date.cjs"
    }
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vite-plugin-dts": "^4.0.0"
  }
}
```

### Build output

```
dist/
├── index.js      # ESM
├── index.cjs     # CJS
├── index.d.ts    # Types
├── math.js
├── math.cjs
├── math.d.ts
├── string.js
├── string.cjs
├── string.d.ts
├── date.js
├── date.cjs
└── date.d.ts
```

### Consumer usage

```typescript
// Import everything
import { add, capitalize, formatDate } from 'my-utils'

// Import specific module (tree-shakeable)
import { add, multiply } from 'my-utils/math'
import { capitalize } from 'my-utils/string'
```

---

## Example 3: Vue Component Library with CSS

### vite.config.ts

```typescript
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({ tsconfigPath: './tsconfig.build.json' }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/index.ts'),
      name: 'MyVueLib',
      fileName: 'my-vue-lib',
      cssFileName: 'my-vue-lib',
    },
    rolldownOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
```

### package.json

```json
{
  "name": "my-vue-lib",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-vue-lib.umd.cjs",
  "module": "./dist/my-vue-lib.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/my-vue-lib.js",
      "require": "./dist/my-vue-lib.umd.cjs"
    },
    "./style.css": "./dist/my-vue-lib.css"
  },
  "peerDependencies": {
    "vue": "^3.4.0"
  }
}
```

---

## Example 4: ESM-Only TypeScript Library (Minimal)

### vite.config.ts

```typescript
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/index.ts'),
      formats: ['es'],
    },
  },
})
```

### package.json

```json
{
  "name": "my-esm-lib",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "module": "./dist/my-esm-lib.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/my-esm-lib.js"
    }
  }
}
```

---

## Example 5: Custom fileName Function

```typescript
export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/main.ts'),
      name: 'MyLib',
      fileName: (format, entryName) => {
        const extensions = {
          es: 'mjs',
          cjs: 'cjs',
          umd: 'umd.js',
          iife: 'iife.js',
        }
        return `${entryName}.${extensions[format]}`
      },
      formats: ['es', 'cjs', 'umd'],
    },
  },
})
```

Output:
```
dist/
├── main.mjs       # ES module
├── main.cjs       # CommonJS
└── main.umd.js    # UMD
```

---

## Example 6: DTS with vite-plugin-dts Configuration

```typescript
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      // Bundle all .d.ts into a single file
      rollupTypes: true,
      // Only include types from lib/ directory
      include: ['lib/**/*.ts'],
      // Exclude test files from declarations
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      // Use specific tsconfig for declaration generation
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/index.ts'),
      formats: ['es', 'cjs'],
    },
  },
})
```

### tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": ["lib/**/*.ts"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

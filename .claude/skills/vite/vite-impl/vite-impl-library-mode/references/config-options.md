# Library Mode: Config Options & package.json Patterns

## build.lib Options (Complete Reference)

### entry

Defines the entry point(s) for the library build.

| Form | Type | Use Case |
|------|------|----------|
| String | `string` | Single entry point |
| Array | `string[]` | Multiple entries without custom names |
| Object | `Record<string, string>` | Multiple entries with explicit output names |

```typescript
// String — single entry
entry: resolve(import.meta.dirname, 'lib/main.ts')

// Array — multiple entries (output names derived from filenames)
entry: [
  resolve(import.meta.dirname, 'lib/main.ts'),
  resolve(import.meta.dirname, 'lib/utils.ts'),
]

// Object — multiple entries with explicit names
entry: {
  'my-lib': resolve(import.meta.dirname, 'lib/main.ts'),
  utils: resolve(import.meta.dirname, 'lib/utils.ts'),
  components: resolve(import.meta.dirname, 'lib/components/index.ts'),
}
```

ALWAYS use `resolve(import.meta.dirname, ...)` for entry paths -- relative paths cause inconsistent behavior across environments.

### name

Global variable name for UMD and IIFE builds. Exposed on `window` in browsers.

```typescript
name: 'MyLib'  // → window.MyLib in UMD/IIFE builds
```

Rules:
- **REQUIRED** when formats include `umd` or `iife` -- build FAILS without it
- **IGNORED** for `es` and `cjs` formats
- ALWAYS use PascalCase or camelCase (valid JS identifier)
- For scoped packages: `@org/my-lib` → `name: 'OrgMyLib'`

### fileName

Controls output file naming. Auto-appends format-appropriate extension.

```typescript
// String — same base name for all formats
fileName: 'my-lib'
// Output: my-lib.js (es), my-lib.umd.cjs (umd), my-lib.cjs (cjs)

// Function — full control per format and entry
fileName: (format, entryName) => {
  if (format === 'es') return `${entryName}.mjs`
  if (format === 'cjs') return `${entryName}.cjs`
  return `${entryName}.${format}.js`
}
```

Default extensions when fileName is a string:

| Format | type: "module" | No type field |
|--------|---------------|---------------|
| `es` | `.js` | `.mjs` |
| `cjs` | `.cjs` | `.js` |
| `umd` | `.umd.cjs` | `.umd.js` |
| `iife` | `.iife.js` | `.iife.js` |

### formats

Array of output formats to generate.

| Format | Description | name Required |
|--------|-------------|---------------|
| `es` | ES modules (`import`/`export`) | NO |
| `cjs` | CommonJS (`require`/`module.exports`) | NO |
| `umd` | Universal Module Definition (browser + Node) | YES |
| `iife` | Immediately Invoked Function Expression (browser only) | YES |

```typescript
// ESM-only library
formats: ['es']

// ESM + CJS (Node package)
formats: ['es', 'cjs']

// ESM + UMD (npm + CDN usage)
formats: ['es', 'umd']

// All formats
formats: ['es', 'cjs', 'umd', 'iife']
```

### cssFileName

Custom name for the extracted CSS file.

```typescript
cssFileName: 'styles'  // → dist/styles.css
```

When NOT set, CSS filename matches the library fileName.

---

## External Dependencies Configuration

### Vite 8.x (Rolldown)

```typescript
build: {
  rolldownOptions: {
    external: ['react', 'react-dom', 'lodash-es'],
    output: {
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'lodash-es': '_',
      },
    },
  },
}
```

### Vite 6.x / 7.x (Rollup)

```typescript
build: {
  rollupOptions: {
    external: ['react', 'react-dom', 'lodash-es'],
    output: {
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'lodash-es': '_',
      },
    },
  },
}
```

### External as Function

For dynamic externalization (e.g., externalize all node_modules):

```typescript
rolldownOptions: {
  external: (id) => {
    // Externalize all bare imports (not relative/absolute paths)
    return !id.startsWith('.') && !id.startsWith('/')
  },
}
```

### External as RegExp Array

```typescript
rolldownOptions: {
  external: [/^react/, /^@mui\//],
}
```

---

## package.json Exports Patterns

### Pattern 1: Single Entry ESM + UMD

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-lib.umd.cjs",
  "module": "./dist/my-lib.js",
  "types": "./dist/main.d.ts",
  "exports": {
    ".": {
      "types": "./dist/main.d.ts",
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.umd.cjs"
    }
  }
}
```

### Pattern 2: Single Entry ESM-Only

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "module": "./dist/my-lib.js",
  "types": "./dist/main.d.ts",
  "exports": {
    ".": {
      "types": "./dist/main.d.ts",
      "import": "./dist/my-lib.js"
    }
  }
}
```

### Pattern 3: Multiple Entries with CSS

```json
{
  "name": "my-ui-lib",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "types": "./dist/main.d.ts",
  "exports": {
    ".": {
      "types": "./dist/main.d.ts",
      "import": "./dist/my-ui-lib.js",
      "require": "./dist/my-ui-lib.cjs"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js",
      "require": "./dist/utils.cjs"
    },
    "./components": {
      "types": "./dist/components.d.ts",
      "import": "./dist/components.js",
      "require": "./dist/components.cjs"
    },
    "./style.css": "./dist/my-ui-lib.css"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

### Pattern 4: Dual Package (ESM + CJS)

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-lib.cjs",
  "module": "./dist/my-lib.js",
  "types": "./dist/main.d.ts",
  "exports": {
    ".": {
      "types": "./dist/main.d.ts",
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.cjs"
    }
  }
}
```

### Exports Field Rules

- ALWAYS put `"types"` FIRST in conditional exports -- TypeScript resolves top-down
- ALWAYS include `"files": ["dist"]` to limit published files
- ALWAYS set `"type": "module"` for ESM-first packages
- Keep `"main"` and `"module"` for backward compatibility with older bundlers
- The `"exports"` field takes PRECEDENCE over `"main"` and `"module"` in modern Node.js

---

## Output File Naming Reference

Given `fileName: 'my-lib'` and `"type": "module"` in package.json:

| Format | Output File | Import Method |
|--------|------------|---------------|
| `es` | `dist/my-lib.js` | `import { x } from 'my-lib'` |
| `cjs` | `dist/my-lib.cjs` | `const { x } = require('my-lib')` |
| `umd` | `dist/my-lib.umd.cjs` | `<script src="...">` or `require()` |
| `iife` | `dist/my-lib.iife.js` | `<script src="...">` only |

For multiple entries with `entry: { main: '...', utils: '...' }`:

| Entry | Format | Output File |
|-------|--------|------------|
| main | `es` | `dist/main.js` |
| main | `cjs` | `dist/main.cjs` |
| utils | `es` | `dist/utils.js` |
| utils | `cjs` | `dist/utils.cjs` |

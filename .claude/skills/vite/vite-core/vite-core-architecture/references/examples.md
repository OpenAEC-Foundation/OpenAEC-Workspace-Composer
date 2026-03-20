# Vite Architecture Examples

## Minimal Project Setup

### Step 1: Create Project with create-vite

```bash
# Using npm
npm create vite@latest my-app -- --template react-ts

# Using pnpm
pnpm create vite my-app --template react-ts

# Using yarn
yarn create vite my-app --template react-ts
```

### Available Templates

| Template | Framework | Language |
|----------|-----------|----------|
| `vanilla` | None | JavaScript |
| `vanilla-ts` | None | TypeScript |
| `react` | React | JavaScript |
| `react-ts` | React | TypeScript |
| `react-swc` | React (SWC) | JavaScript |
| `react-swc-ts` | React (SWC) | TypeScript |
| `vue` | Vue 3 | JavaScript |
| `vue-ts` | Vue 3 | TypeScript |
| `svelte` | Svelte | JavaScript |
| `svelte-ts` | Svelte | TypeScript |
| `preact` | Preact | JavaScript |
| `preact-ts` | Preact | TypeScript |
| `lit` | Lit | JavaScript |
| `lit-ts` | Lit | TypeScript |
| `solid` | Solid | JavaScript |
| `solid-ts` | Solid | TypeScript |
| `qwik` | Qwik | JavaScript |
| `qwik-ts` | Qwik | TypeScript |

### Step 2: Resulting Project Structure (React-TS)

```
my-app/
├── index.html              # Entry point
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│   └── vite.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── vite-env.d.ts
    └── assets/
        └── react.svg
```

### Step 3: index.html Entry Point

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Note: The `<script type="module" src="/src/main.tsx">` tag is what connects Vite to your application code. Vite resolves this reference and serves the transformed module.

---

## Minimal vite.config.ts

### React Project

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### Vue Project

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

### Vanilla TypeScript (No Framework)

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  // No plugins needed for vanilla TypeScript
})
```

### Conditional Config (Dev vs Build)

```typescript
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    return {
      // Dev-specific config
      server: {
        port: 3000,
        open: true,
      },
    }
  } else {
    return {
      // Build-specific config
      build: {
        sourcemap: true,
      },
    }
  }
})
```

---

## CLI Commands Reference

### Development

```bash
# Start dev server (default port 5173)
vite

# Start on specific port
vite --port 3000

# Open browser automatically
vite --open

# Expose to LAN (listen on 0.0.0.0)
vite --host

# Force re-bundle dependencies
vite --force

# Use specific mode
vite --mode staging
```

### Production Build

```bash
# Build for production
vite build

# Build with sourcemaps
vite build --sourcemap

# Build for specific mode
vite build --mode staging

# Build with minification disabled
vite build --minify false
```

### Preview Production Build

```bash
# Preview production build locally (default port 4173)
vite preview

# Preview on specific port
vite preview --port 8080
```

---

## Standard package.json Configuration

### Minimal

```json
{
  "name": "my-vite-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^8.0.0"
  }
}
```

### With TypeScript Type Checking

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  }
}
```

### With React

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "~5.7.0",
    "vite": "^8.0.0"
  }
}
```

---

## TypeScript Configuration

### vite-env.d.ts (ALWAYS include)

```typescript
/// <reference types="vite/client" />
```

This provides type declarations for:
- `import.meta.env` (environment variables)
- Asset imports (`import logo from './logo.png'`)
- CSS modules (`import styles from './app.module.css'`)
- Hot module replacement API (`import.meta.hot`)

### Custom Environment Variable Types

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## Multi-Page Application

```
project-root/
├── index.html              # → http://localhost:5173/
├── about.html              # → http://localhost:5173/about.html
├── nested/
│   └── page.html           # → http://localhost:5173/nested/page.html
├── src/
│   ├── main.ts
│   └── about.ts
└── vite.config.ts
```

Configure multiple entry points for production build:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  appType: 'mpa',
  build: {
    rolldownOptions: {  // rollupOptions for v5-7
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
      },
    },
  },
})
```

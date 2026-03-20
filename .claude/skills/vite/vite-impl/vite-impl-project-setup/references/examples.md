# Project Setup Examples

## Example 1: New React + TypeScript Project (Complete Workflow)

### Step 1: Scaffold

```bash
npm create vite@latest my-react-app -- --template react-swc-ts
cd my-react-app
npm install
```

### Step 2: Verify Project Structure

```
my-react-app/
├── index.html
├── public/
│   └── vite.svg
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── assets/
│   │   └── react.svg
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── package.json
└── .gitignore
```

### Step 3: Verify vite-env.d.ts

```typescript
// src/vite-env.d.ts — MUST contain this line
/// <reference types="vite/client" />
```

### Step 4: Verify tsconfig.json

Confirm `isolatedModules: true` is set:

```json
{
  "compilerOptions": {
    "isolatedModules": true
  }
}
```

### Step 5: Run Development Server

```bash
npm run dev
```

Output:
```
  VITE v8.x.x  ready in 200ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 6: Build for Production

```bash
npm run build
```

This runs `tsc -b && vite build`, producing output in `dist/`.

---

## Example 2: Adding Vite to an Existing Project

### Step 1: Install Dependencies

```bash
npm install -D vite @vitejs/plugin-react-swc
npm install react react-dom
npm install -D @types/react @types/react-dom typescript
```

### Step 2: Create vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
})
```

### Step 3: Create index.html at Project Root

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**ALWAYS** use `<script type="module">` — Vite serves source files as native ES modules during development.

### Step 4: Create src/main.tsx

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 5: Create src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />
```

### Step 6: Configure tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true
  },
  "include": ["src"]
}
```

### Step 7: Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  }
}
```

---

## Example 3: Vue + TypeScript Project

### Scaffold

```bash
npm create vite@latest my-vue-app -- --template vue-ts
cd my-vue-app
npm install
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

Note: Vue projects use `vue-tsc` instead of `tsc` for type checking SFC files.

---

## Example 4: Vanilla TypeScript (No Framework)

### Scaffold

```bash
npm create vite@latest my-lib -- --template vanilla-ts
cd my-lib
npm install
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'

export default defineConfig({})
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + TS</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## Example 5: package.json with All Standard Scripts

```json
{
  "name": "my-vite-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react-swc": "^4.0.0",
    "typescript": "~5.7.0",
    "vite": "^8.0.0"
  }
}
```

Key points:
- **ALWAYS** set `"type": "module"` — Vite uses ESM natively
- **ALWAYS** include `tsc --noEmit` in the build script for type safety
- **ALWAYS** install framework plugins as devDependencies

---

## Example 6: CSS Preprocessor Setup

### Adding Sass to Any Vite Project

```bash
# Install preprocessor only — NO Vite plugin needed
npm add -D sass-embedded
```

Then use `.scss` files directly:

```scss
// src/styles/variables.scss
$primary: #646cff;
$font-family: Inter, system-ui, sans-serif;
```

```tsx
// src/App.tsx
import './styles/app.scss'
```

### Configuring Preprocessor Options

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "./src/styles/variables" as *;`,
      },
    },
  },
})
```

---

## Example 7: Path Aliases

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@components': resolve(import.meta.dirname, 'src/components'),
      '@utils': resolve(import.meta.dirname, 'src/utils'),
    },
  },
})
```

### tsconfig.json (must match Vite aliases)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

**ALWAYS** keep Vite aliases and TypeScript paths in sync — Vite handles module resolution at runtime, TypeScript handles it for type checking.

---

## Example 8: Environment-Aware vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
    },
    build: {
      sourcemap: !isProduction,
    },
  }
})
```

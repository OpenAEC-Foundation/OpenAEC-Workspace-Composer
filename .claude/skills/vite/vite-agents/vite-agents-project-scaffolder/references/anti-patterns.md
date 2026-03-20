# Scaffolding Anti-Patterns

> Common mistakes when generating Vite projects. Each anti-pattern includes the mistake, why it fails, and the correct approach.

---

## AP-01: Missing isolatedModules in tsconfig.json

**Mistake:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

**Why it fails:** Vite uses transpile-only transforms (esbuild/Oxc) that process each file independently. Without `isolatedModules: true`, TypeScript allows patterns like `const enum` and cross-file type re-exports that CANNOT be transpiled file-by-file. The code compiles with `tsc` but breaks at runtime in the Vite dev server.

**Correct:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "isolatedModules": true
  }
}
```

---

## AP-02: Using Node moduleResolution Instead of Bundler

**Mistake:**
```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

**Why it fails:** Node resolution does not understand `package.json` `exports` fields, conditional exports, or bundler-specific resolution rules. This causes TypeScript to report false errors on valid imports that Vite resolves correctly at runtime.

**Correct:**
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

---

## AP-03: Forgetting vite/client Types

**Mistake:**
```typescript
// src/vite-env.d.ts is missing entirely, or contains:
// (empty file)
```

**Why it fails:** Without `/// <reference types="vite/client" />`, TypeScript does not know about `import.meta.env`, asset imports (`import logo from './logo.svg'`), or CSS module types. Every asset import shows a red squiggly error in the IDE.

**Correct:**
```typescript
/// <reference types="vite/client" />
```

Or in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

NEVER use both methods simultaneously -- it causes duplicate declarations.

---

## AP-04: Installing Vite Plugins for CSS Preprocessors

**Mistake:**
```json
{
  "devDependencies": {
    "vite-plugin-sass": "^1.0.0",
    "sass": "^1.80.0"
  }
}
```

**Why it fails:** Vite has BUILT-IN support for Sass, Less, and Stylus. Installing third-party Vite plugins for CSS preprocessors adds unnecessary complexity, may conflict with Vite's internal handling, and often targets outdated Vite versions.

**Correct:**
```json
{
  "devDependencies": {
    "sass-embedded": "^1.80.0"
  }
}
```

Install the preprocessor package ONLY. No plugin needed. ALWAYS prefer `sass-embedded` over `sass` for better performance.

---

## AP-05: Using esbuild Config in Vite 8

**Mistake:**
```typescript
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    target: 'es2020',
  },
})
```

**Why it fails:** Vite 8 replaced esbuild with Oxc for transforms. The `esbuild` config key is deprecated and internally converted to `oxc` with a console warning. This conversion is imperfect and may silently drop unsupported options.

**Correct (Vite 8):**
```typescript
export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
})
```

**Correct (Vite 6/7):**
```typescript
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    target: 'es2020',
  },
})
```

---

## AP-06: Empty envPrefix Exposing Secrets

**Mistake:**
```typescript
export default defineConfig({
  envPrefix: '',
})
```

**Why it fails:** Setting `envPrefix` to an empty string exposes ALL environment variables to client-side code via `import.meta.env`. This includes `DB_PASSWORD`, `AWS_SECRET_KEY`, `JWT_SECRET`, and any other server-side secrets in the environment. These values are embedded in the JavaScript bundle and visible to anyone who opens the browser devtools.

**Correct:**
```typescript
export default defineConfig({
  // Use default VITE_ prefix (no config needed)
  // Or use a custom prefix:
  envPrefix: 'PUBLIC_',
})
```

---

## AP-07: Wrong Script Entry in index.html

**Mistake (React project):**
```html
<script type="module" src="/src/main.ts"></script>
```

**Why it fails for React:** React projects use JSX, which requires `.tsx` files. Pointing to `.ts` causes a "file not found" error because the actual file is `main.tsx`. The file extension in `index.html` MUST match the actual source file.

**Correct (React):**
```html
<script type="module" src="/src/main.tsx"></script>
```

**Correct (Vue/Svelte/Vanilla):**
```html
<script type="module" src="/src/main.ts"></script>
```

---

## AP-08: Missing Vue SFC Type Declaration

**Mistake (Vue project):**
```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />
// No .vue module declaration
```

**Why it fails:** TypeScript does not understand `.vue` files by default. Without a module declaration, every `import Component from './Component.vue'` shows "Cannot find module './Component.vue' or its corresponding type declarations."

**Correct:**
```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

---

## AP-09: Using tsc Instead of vue-tsc for Vue Projects

**Mistake (Vue project package.json):**
```json
{
  "scripts": {
    "build": "tsc --noEmit && vite build"
  }
}
```

**Why it fails:** Standard `tsc` cannot type-check `.vue` files. It skips all SFC files entirely, meaning type errors in `<script setup lang="ts">` blocks go undetected. The build appears to succeed but contains type errors.

**Correct:**
```json
{
  "scripts": {
    "build": "vue-tsc --noEmit && vite build"
  }
}
```

---

## AP-10: Putting index.html Inside src/

**Mistake:**
```
my-app/
├── src/
│   ├── index.html    <-- WRONG location
│   ├── main.tsx
│   └── App.tsx
```

**Why it fails:** Vite expects `index.html` at the project root (or wherever `root` config points). When it is inside `src/`, Vite cannot find the entry point and the dev server shows a blank page or 404.

**Correct:**
```
my-app/
├── index.html        <-- Project root
├── src/
│   ├── main.tsx
│   └── App.tsx
```

---

## AP-11: Adding Type Checking to the Dev Script

**Mistake:**
```json
{
  "scripts": {
    "dev": "tsc --noEmit && vite"
  }
}
```

**Why it fails:** This runs a FULL type check before starting the dev server, adding 5-30 seconds to every `npm run dev`. Vite's dev server is designed for instant startup -- type checking should be a separate concern, run in parallel or in CI.

**Correct:**
```json
{
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit && vite build"
  }
}
```

Type checking goes in `build` (blocking, for CI) and `typecheck` (on-demand). NEVER in `dev`.

---

## AP-12: Hardcoding Values That Should Be Environment Variables

**Mistake:**
```typescript
// src/config.ts
const API_URL = 'https://api.production.example.com'
```

**Why it fails:** Hardcoded URLs make the same build unusable across environments (dev, staging, production). The value is baked into the bundle and cannot be changed without rebuilding.

**Correct:**
```bash
# .env.example
VITE_API_BASE_URL=http://localhost:3000/api
```

```typescript
// src/config.ts
const API_URL = import.meta.env.VITE_API_BASE_URL
```

---

## AP-13: Using rollupOptions in Vite 8

**Mistake:**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react'],
    },
  },
})
```

**Why it fails:** Vite 8 replaced Rollup with Rolldown. The `build.rollupOptions` key is deprecated and internally mapped to `build.rolldownOptions`. Some Rollup-specific options do not have Rolldown equivalents and are silently ignored, causing unexpected build behavior.

**Correct (Vite 8):**
```typescript
export default defineConfig({
  build: {
    rolldownOptions: {
      external: ['react'],
    },
  },
})
```

---

## AP-14: Generating package.json Without "type": "module"

**Mistake:**
```json
{
  "name": "my-app",
  "scripts": {
    "dev": "vite"
  }
}
```

**Why it fails:** Without `"type": "module"`, Node.js treats `.js` files as CommonJS. Since Vite config and source files use ESM (`import`/`export`), the dev server fails with "Cannot use import statement outside a module" errors. While `.ts` config files work around this, the explicit declaration prevents edge-case resolution issues.

**Correct:**
```json
{
  "name": "my-app",
  "type": "module",
  "scripts": {
    "dev": "vite"
  }
}
```

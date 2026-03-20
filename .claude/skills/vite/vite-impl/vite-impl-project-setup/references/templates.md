# create-vite Templates Reference

## All Available Templates

### Vanilla Templates

| Template | Language | Framework Plugin | Key Dependencies |
|----------|----------|-----------------|------------------|
| `vanilla` | JavaScript | None | `vite` |
| `vanilla-ts` | TypeScript | None | `vite`, `typescript` |

**Vanilla projects** produce the simplest setup — no framework, no JSX, just plain HTML/CSS/JS with Vite's dev server and build pipeline.

### React Templates

| Template | Language | Compiler | Plugin Package |
|----------|----------|----------|---------------|
| `react` | JavaScript | Babel | `@vitejs/plugin-react` |
| `react-ts` | TypeScript | Babel | `@vitejs/plugin-react` |
| `react-swc` | JavaScript | SWC | `@vitejs/plugin-react-swc` |
| `react-swc-ts` | TypeScript | SWC | `@vitejs/plugin-react-swc` |

**ALWAYS** prefer `react-swc-ts` for new projects — SWC is 20x faster than Babel for JSX transformation and supports React Fast Refresh out of the box. Only use `react-ts` (Babel) when you need specific Babel plugins (e.g., `babel-plugin-styled-components`, custom transforms).

#### React vite.config.ts (SWC)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
})
```

#### React vite.config.ts (Babel)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

#### React with Babel Plugins

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-styled-components'],
      },
    }),
  ],
})
```

### Vue Templates

| Template | Language | Plugin Package |
|----------|----------|---------------|
| `vue` | JavaScript | `@vitejs/plugin-vue` |
| `vue-ts` | TypeScript | `@vitejs/plugin-vue` |

#### Vue vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

#### Vue with JSX Support

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
})
```

### Svelte Templates

| Template | Language | Plugin Package |
|----------|----------|---------------|
| `svelte` | JavaScript | `@sveltejs/vite-plugin-svelte` |
| `svelte-ts` | TypeScript | `@sveltejs/vite-plugin-svelte` |

#### Svelte vite.config.ts

```typescript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
})
```

### Preact Templates

| Template | Language | Plugin Package |
|----------|----------|---------------|
| `preact` | JavaScript | `@preact/preset-vite` |
| `preact-ts` | TypeScript | `@preact/preset-vite` |

#### Preact vite.config.ts

```typescript
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
})
```

### Lit Templates

| Template | Language | Plugin Package |
|----------|----------|---------------|
| `lit` | JavaScript | None |
| `lit-ts` | TypeScript | None |

Lit uses standard web components — no framework-specific Vite plugin is required. Vite's built-in decorator support handles Lit's `@customElement` and `@property` decorators.

### Solid Templates

| Template | Language | Plugin Package |
|----------|----------|---------------|
| `solid` | JavaScript | `vite-plugin-solid` |
| `solid-ts` | TypeScript | `vite-plugin-solid` |

#### Solid vite.config.ts

```typescript
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
})
```

### Qwik Templates

| Template | Language | Plugin Package |
|----------|----------|---------------|
| `qwik` | JavaScript | Managed by Qwik CLI |
| `qwik-ts` | TypeScript | Managed by Qwik CLI |

Qwik projects are typically scaffolded via `npm create qwik@latest` rather than `create-vite`. The `create-vite` template provides a minimal starting point.

---

## Template Selection Decision Guide

```
Choosing a template:
├── React project
│   ├── No special Babel plugins needed → react-swc-ts (FASTEST)
│   └── Need Babel plugins → react-ts
├── Vue project
│   ├── SFC only → vue-ts
│   └── SFC + JSX → vue-ts + @vitejs/plugin-vue-jsx
├── Svelte project → svelte-ts
├── Preact project (lightweight React alternative) → preact-ts
├── Web Components (Lit) → lit-ts
├── Solid project → solid-ts
├── Qwik project → qwik-ts (or use Qwik CLI directly)
└── No framework → vanilla-ts
```

**ALWAYS** prefer TypeScript variants (`-ts` suffix) — Vite's TypeScript support has zero overhead since it transpiles without type checking.

---

## Community Templates

Beyond official templates, community templates are available via `degit`:

```bash
npx degit user/project#main my-project
```

Or browse at https://github.com/vitejs/awesome-vite#templates for additional framework combinations and starter kits.

---

## Official Plugin Packages Summary

| Plugin | npm Package | Purpose |
|--------|------------|---------|
| React (Babel) | `@vitejs/plugin-react` | React Fast Refresh via Babel |
| React (SWC) | `@vitejs/plugin-react-swc` | React Fast Refresh via SWC (faster) |
| Vue SFC | `@vitejs/plugin-vue` | Vue Single File Component support |
| Vue JSX | `@vitejs/plugin-vue-jsx` | Vue JSX/TSX support |
| Legacy | `@vitejs/plugin-legacy` | Legacy browser support via polyfills |
| React Server Components | `@vitejs/plugin-rsc` | RSC support (experimental) |

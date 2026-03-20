# Environment API Anti-Patterns

> **Vite 6+ ONLY** — These anti-patterns apply to Environment API usage in Vite 6.x.

## Anti-Pattern 1: Expecting optimizeDeps to Propagate to Server Environments

### WRONG

```javascript
export default defineConfig({
  optimizeDeps: {
    include: ['lodash-es']
  },
  environments: {
    server: {
      consumer: 'server',
      // Expects lodash-es to be pre-bundled for server too
      // IT WILL NOT BE — optimizeDeps is client-only by default
    }
  }
})
```

### CORRECT

```javascript
export default defineConfig({
  optimizeDeps: {
    include: ['lodash-es']  // Client only
  },
  environments: {
    server: {
      consumer: 'server',
      optimizeDeps: {
        include: ['lodash-es']  // Explicitly set for server
      }
    }
  }
})
```

**Why**: `optimizeDeps` is the ONE exception to the inheritance rule. It propagates ONLY to the `client` environment. All other environments MUST configure it explicitly.

---

## Anti-Pattern 2: Using the Environment API in Vite 5

### WRONG

```javascript
// vite.config.js — Vite 5 project
export default defineConfig({
  environments: {
    server: {
      consumer: 'server'
    }
  }
})
```

### CORRECT

For Vite 5, use the traditional SSR configuration:

```javascript
// vite.config.js — Vite 5 project
export default defineConfig({
  ssr: {
    noExternal: ['some-package']
  }
})
```

**Why**: The `environments` config key does NOT exist in Vite 5. It will be silently ignored or cause unexpected behavior. ALWAYS upgrade to Vite 6 before using the Environment API.

---

## Anti-Pattern 3: Sharing a Single outDir Across Environments

### WRONG

```javascript
export default defineConfig({
  build: {
    outDir: 'dist'  // All environments write to the same directory
  },
  environments: {
    server: {
      consumer: 'server',
      build: { ssr: true }
      // No outDir override — server output overwrites client output!
    }
  }
})
```

### CORRECT

```javascript
export default defineConfig({
  build: {
    outDir: 'dist/client'
  },
  environments: {
    server: {
      consumer: 'server',
      build: {
        outDir: 'dist/server',
        ssr: true
      }
    }
  }
})
```

**Why**: Multiple environments building to the same directory will overwrite each other's output. ALWAYS assign a unique `build.outDir` to each environment.

---

## Anti-Pattern 4: Mixing Vite 5 SSR API with Vite 6 Environment API

### WRONG

```javascript
// Using both old and new APIs simultaneously
export default defineConfig({
  ssr: {
    noExternal: ['my-package']  // Vite 5 SSR config
  },
  environments: {
    server: {
      consumer: 'server',
      resolve: { noExternal: ['my-package'] }  // Vite 6 Environment API
    }
  }
})
```

### CORRECT

```javascript
// Vite 6 — use ONLY the Environment API
export default defineConfig({
  environments: {
    server: {
      consumer: 'server',
      resolve: { noExternal: ['my-package'] }
    }
  }
})
```

**Why**: Mixing Vite 5 and Vite 6 SSR configuration creates ambiguity about which setting takes precedence. ALWAYS use one approach consistently.

---

## Anti-Pattern 5: Placing Environment-Specific Plugins at Top Level

### WRONG

```javascript
import nodePolyfills from 'rollup-plugin-polyfill-node'

export default defineConfig({
  // Node polyfills applied to ALL environments including browser client
  plugins: [nodePolyfills()],
  environments: {
    server: { consumer: 'server' }
  }
})
```

### CORRECT

```javascript
import nodePolyfills from 'rollup-plugin-polyfill-node'

export default defineConfig({
  plugins: [],
  environments: {
    server: {
      consumer: 'server',
      plugins: [nodePolyfills()]  // Only for server environment
    }
  }
})
```

**Why**: Top-level `plugins` apply to ALL environments. Node.js polyfills in a browser environment add unnecessary bundle size and may cause conflicts. ALWAYS scope environment-specific plugins to their target environment.

---

## Anti-Pattern 6: Forgetting consumer Property on Server Environments

### WRONG

```javascript
export default defineConfig({
  environments: {
    server: {
      // Missing consumer: 'server'
      // Vite treats this as a client environment by default
      build: { outDir: 'dist/server', ssr: true }
    }
  }
})
```

### CORRECT

```javascript
export default defineConfig({
  environments: {
    server: {
      consumer: 'server',  // Explicitly declare server runtime
      build: { outDir: 'dist/server', ssr: true }
    }
  }
})
```

**Why**: Without `consumer: 'server'`, Vite defaults to `'client'` behavior, which affects module resolution, externalization, and how the environment is served during development. ALWAYS set `consumer` explicitly for non-browser environments.

---

## Anti-Pattern 7: Not Setting noExternal for Edge/Worker Environments

### WRONG

```javascript
export default defineConfig({
  environments: {
    edge: {
      consumer: 'server',
      build: { outDir: 'dist/edge' }
      // Edge workers cannot resolve node_modules at runtime!
    }
  }
})
```

### CORRECT

```javascript
export default defineConfig({
  environments: {
    edge: {
      consumer: 'server',
      resolve: { noExternal: true },  // Bundle EVERYTHING
      build: { outDir: 'dist/edge' }
    }
  }
})
```

**Why**: Edge and worker runtimes do NOT have access to `node_modules` at runtime. Without `noExternal: true`, Vite may leave imports as external, causing runtime failures in production. ALWAYS set `resolve.noExternal: true` for edge and worker environments.

---

## Anti-Pattern 8: Using server.ssrLoadModule() in Vite 6

### WRONG

```javascript
// Vite 6 dev server
const vite = await createServer({ /* ... */ })
const mod = await vite.ssrLoadModule('/src/entry-server.js')  // Deprecated
```

### CORRECT

```javascript
// Vite 6 dev server — use ModuleRunner API
const vite = await createServer({ /* ... */ })
const environment = vite.environments.ssr
const runner = createModuleRunner(environment)
const mod = await runner.import('/src/entry-server.js')
```

**Why**: `server.ssrLoadModule()` is the Vite 5 approach. Vite 6 introduces the ModuleRunner API which respects per-environment configuration and provides proper isolation between environments. ALWAYS use ModuleRunner for Vite 6+ SSR dev workflows.

---

## Summary Table

| Anti-Pattern | Risk | Fix |
|-------------|------|-----|
| optimizeDeps inheritance assumption | Server deps not pre-bundled | Set optimizeDeps explicitly per environment |
| Environment API in Vite 5 | Config silently ignored | Upgrade to Vite 6 first |
| Shared outDir | Build output overwritten | Unique outDir per environment |
| Mixing Vite 5 + 6 SSR config | Ambiguous precedence | Use one approach consistently |
| Top-level env-specific plugins | Unnecessary client bloat | Scope plugins to target environment |
| Missing consumer property | Wrong module resolution | ALWAYS set consumer explicitly |
| Missing noExternal for edge | Runtime import failures | Set noExternal: true for edge/worker |
| Using ssrLoadModule in Vite 6 | Ignores environment config | Use ModuleRunner API |

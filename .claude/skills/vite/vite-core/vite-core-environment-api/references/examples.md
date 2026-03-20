# Environment API Examples

> **Vite 6+ ONLY** — All examples require Vite 6.x or later.

## Example 1: Full Multi-Environment Config (SSR + Edge Worker)

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Top-level = defaults for ALL environments
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' }
  },
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0')
  },
  build: {
    sourcemap: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },

  environments: {
    // Client environment (browser)
    // Inherits ALL top-level options including optimizeDeps
    // No explicit config needed unless overriding

    // SSR server environment (Node.js)
    server: {
      consumer: 'server',
      define: {
        __SERVER__: JSON.stringify(true)
      },
      build: {
        outDir: 'dist/server',
        ssr: true,
        sourcemap: false
      }
    },

    // Edge worker environment (Cloudflare, Vercel Edge, etc.)
    edge: {
      consumer: 'server',
      resolve: {
        noExternal: true  // Bundle EVERYTHING — edge has no node_modules
      },
      define: {
        __EDGE__: JSON.stringify(true)
      },
      build: {
        outDir: 'dist/edge',
        target: 'es2022',
        minify: true
      }
    }
  }
})
```

**Key points:**
- `plugins` at top-level applies to ALL environments
- `optimizeDeps` applies ONLY to the implicit `client` environment
- Each environment gets its own `build.outDir` to avoid conflicts
- `consumer: 'server'` is set on both non-browser environments

---

## Example 2: Custom Environment Provider (Cloudflare)

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { cloudflareEnvironment } from 'vite-plugin-cloudflare'

export default defineConfig({
  plugins: [],

  environments: {
    // Provider returns a complete EnvironmentOptions object
    worker: cloudflareEnvironment({
      build: {
        outDir: 'dist/worker'
      },
      // Provider-specific options handled internally
    })
  }
})
```

Custom providers encapsulate runtime-specific configuration. The provider function returns an `EnvironmentOptions` object that Vite merges with inherited defaults.

ALWAYS consult the provider's documentation — providers may set `consumer`, `resolve.noExternal`, and other options automatically.

---

## Example 3: Framework Integration (Next.js-style Pattern)

Frameworks configure environments programmatically on behalf of the user:

```javascript
// Framework plugin (simplified example)
function myFramework() {
  return {
    name: 'my-framework',
    config() {
      return {
        environments: {
          // Framework defines the SSR environment
          ssr: {
            consumer: 'server',
            build: {
              outDir: 'dist/server',
              ssr: true
            }
          },
          // Framework defines an RSC (React Server Components) environment
          rsc: {
            consumer: 'server',
            resolve: {
              conditions: ['react-server']
            },
            build: {
              outDir: 'dist/rsc'
            }
          }
        }
      }
    }
  }
}

// User config — framework handles environments
export default defineConfig({
  plugins: [myFramework()]
})
```

**Key point**: End users of frameworks typically do NOT configure `environments` directly — the framework plugin does it. ALWAYS check if your framework already provides environment configuration before adding manual entries.

---

## Example 4: Per-Environment Plugins

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'rollup-plugin-polyfill-node'

export default defineConfig({
  // Shared plugins — all environments
  plugins: [react()],

  environments: {
    server: {
      consumer: 'server',
      // Plugins ONLY for the server environment
      plugins: [nodePolyfills()],
      build: {
        outDir: 'dist/server',
        ssr: true
      }
    }
  }
})
```

ALWAYS place framework plugins (React, Vue, Svelte) in the top-level `plugins` array. Per-environment `plugins` are for environment-specific transforms only.

---

## Example 5: Separate Build Targets per Environment

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2020'  // Default for client
  },

  environments: {
    server: {
      consumer: 'server',
      build: {
        outDir: 'dist/server',
        target: 'node18',  // Node.js 18+ features
        ssr: true
      }
    },
    edge: {
      consumer: 'server',
      build: {
        outDir: 'dist/edge',
        target: 'es2022',  // Modern edge runtime
        minify: true
      }
    }
  }
})
```

---

## Example 6: Environment-Specific Define Constants

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // Shared constants — available in ALL environments
  define: {
    __APP_NAME__: JSON.stringify('My App'),
    __VERSION__: JSON.stringify('2.0.0')
  },

  environments: {
    server: {
      consumer: 'server',
      // Server-only constants — override or add
      define: {
        __IS_SERVER__: JSON.stringify(true),
        __IS_CLIENT__: JSON.stringify(false),
        __DB_HOST__: JSON.stringify(process.env.DB_HOST || 'localhost')
      },
      build: { outDir: 'dist/server', ssr: true }
    }
  }
})
```

**Warning**: Per-environment `define` MERGES with top-level `define`. If you set the same key in both, the per-environment value wins. NEVER rely on merge behavior for critical constants — be explicit in each environment.

---

## Example 7: TypeScript Configuration

```typescript
// vite.config.ts
import { defineConfig, type UserConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: { '@': '/src' }
  },

  environments: {
    server: {
      consumer: 'server',
      resolve: {
        // Server may need different conditions
        conditions: ['node', 'import']
      },
      build: {
        outDir: 'dist/server',
        ssr: true
      }
    }
  }
} satisfies UserConfig)
```

ALWAYS use `defineConfig()` for type inference. The `UserConfig` type includes the `environments` property with full `EnvironmentOptions` typing for each entry.

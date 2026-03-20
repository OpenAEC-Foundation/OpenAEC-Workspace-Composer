# Server Configuration Anti-Patterns

Common mistakes when configuring the Vite dev server, with explanations and correct alternatives.

---

## AP-001: Exposing Dev Server to Network Without Host Restrictions

**WRONG:**
```typescript
export default defineConfig({
  server: {
    host: true,
    // No allowedHosts configured
  },
})
```

**WHY**: Binding to all interfaces (`0.0.0.0`) without `allowedHosts` exposes the dev server to DNS rebinding attacks. Any device on the network can access it, and malicious websites can make requests to it via DNS rebinding.

**CORRECT:**
```typescript
export default defineConfig({
  server: {
    host: true,
    allowedHosts: ['my-machine.local', 'localhost'],
  },
})
```

---

## AP-002: Disabling File System Strict Mode

**WRONG:**
```typescript
export default defineConfig({
  server: {
    fs: {
      strict: false,
    },
  },
})
```

**WHY**: Disabling strict mode allows the dev server to serve ANY file on the machine, including `/etc/passwd`, `~/.ssh/id_rsa`, or environment files. This is a severe security risk, especially when combined with `host: true`.

**CORRECT:**
```typescript
export default defineConfig({
  server: {
    fs: {
      strict: true,
      allow: ['..'], // Explicitly allow specific directories
    },
  },
})
```

---

## AP-003: Overwriting fs.deny Defaults

**WRONG:**
```typescript
export default defineConfig({
  server: {
    fs: {
      deny: ['**/secrets/**'], // Overwrites defaults, losing .env protection
    },
  },
})
```

**WHY**: Setting `deny` replaces the default list entirely. The defaults block `.env`, `.env.*`, `*.{crt,pem}`, and `**/.git/**`. Overwriting them removes protection for sensitive files.

**CORRECT:**
```typescript
export default defineConfig({
  server: {
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem}', '**/.git/**', // Keep defaults
        '**/secrets/**', // Add custom patterns
      ],
    },
  },
})
```

---

## AP-004: Using Middleware Mode Without appType: 'custom'

**WRONG:**
```typescript
const vite = await createViteServer({
  server: { middlewareMode: true },
  // Missing appType: 'custom'
})
```

**WHY**: Without `appType: 'custom'`, Vite injects its default SPA fallback middleware. This catches all unmatched routes and returns `index.html`, breaking your custom server routing and API endpoints.

**CORRECT:**
```typescript
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
})
```

---

## AP-005: Hardcoding Proxy Targets

**WRONG:**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://192.168.1.105:3001',
    },
  },
})
```

**WHY**: Hardcoded IP addresses break when the backend runs on a different machine or network. Other developers on the team will have different IPs.

**CORRECT:**
```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      proxy: {
        '/api': env.VITE_API_TARGET || 'http://localhost:3001',
      },
    },
  }
})
```

---

## AP-006: Forgetting changeOrigin in Proxy

**WRONG:**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://api.example.com',
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Missing changeOrigin: true
      },
    },
  },
})
```

**WHY**: Without `changeOrigin: true`, the `Host` header sent to the target server is `localhost:5173`. Many backend servers (especially those behind virtual hosts or CDNs) reject or misroute requests with incorrect `Host` headers.

**CORRECT:**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

---

## AP-007: Setting CORS to true in Shared Environments

**WRONG:**
```typescript
export default defineConfig({
  server: {
    cors: true,
  },
})
```

**WHY**: `cors: true` sets `Access-Control-Allow-Origin: *`, allowing ANY website to make requests to your dev server. If the dev server proxies to a real backend with session cookies, this creates a CSRF vector.

**CORRECT:**
```typescript
export default defineConfig({
  server: {
    cors: {
      origin: 'http://localhost:3000',
    },
  },
})
```

---

## AP-008: Using strictPort Without Error Handling

**WRONG:**
```typescript
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
})
// When port 3000 is taken, Vite crashes with no user-friendly message
```

**WHY**: `strictPort: true` causes Vite to exit immediately if the port is occupied. In CI/CD or when multiple developers share machines, this leads to confusing failures.

**CORRECT (option A):** Remove `strictPort` and let Vite auto-increment:
```typescript
export default defineConfig({
  server: {
    port: 3000,
    // strictPort defaults to false -- Vite tries 3001, 3002, etc.
  },
})
```

**CORRECT (option B):** Use `strictPort` when the exact port matters (e.g., OAuth callbacks):
```typescript
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
})
// Document the port requirement and how to free it
```

---

## AP-009: Warming Up Too Many Files

**WRONG:**
```typescript
export default defineConfig({
  server: {
    warmup: {
      clientFiles: ['./src/**/*.{ts,tsx,vue,css}'], // Every file in src
    },
  },
})
```

**WHY**: Warming up the entire source tree negates the benefit of Vite's on-demand compilation. It transforms all files on startup, making server start time as slow as a traditional bundler.

**CORRECT:**
```typescript
export default defineConfig({
  server: {
    warmup: {
      clientFiles: [
        './src/App.vue',
        './src/components/Layout.vue',
        './src/pages/Home.vue',
      ],
    },
  },
})
```

ALWAYS limit warmup to files that are ALWAYS loaded on the initial page.

---

## AP-010: Proxy Rewrite Removing Too Much

**WRONG:**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace('/api', ''),
        // String.replace only replaces FIRST occurrence
        // /api/v2/api/users → /v2/api/users (only first /api removed)
      },
    },
  },
})
```

**WHY**: `String.replace()` with a string argument only replaces the first occurrence. If `/api` appears elsewhere in the path, the rewrite is incomplete or incorrect.

**CORRECT:**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Regex with ^ anchor: only removes /api at the START of the path
      },
    },
  },
})
```

ALWAYS use a regex with `^` anchor in proxy rewrites to match only the path prefix.

---

## AP-011: Using server.forwardConsole on Vite 6/7

**WRONG:**
```typescript
// Vite 6 or 7 config
export default defineConfig({
  server: {
    forwardConsole: true, // This option does not exist before v8
  },
})
```

**WHY**: `server.forwardConsole` was introduced in Vite 8. Using it in Vite 6 or 7 has no effect and may cause a warning about an unknown config option.

**CORRECT:** Check your Vite version first. For Vite 6/7, use a Vite plugin or browser DevTools for console output.

---

## AP-012: Setting server.origin Incorrectly

**WRONG:**
```typescript
export default defineConfig({
  server: {
    origin: 'localhost:5173', // Missing protocol
  },
})
```

**WHY**: `server.origin` must be a full origin with protocol. Without `http://` or `https://`, generated asset URLs are malformed and fail to load.

**CORRECT:**
```typescript
export default defineConfig({
  server: {
    origin: 'http://localhost:5173',
  },
})
```

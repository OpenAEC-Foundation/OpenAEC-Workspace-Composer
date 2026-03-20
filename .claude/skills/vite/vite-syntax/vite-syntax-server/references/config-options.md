# Server Configuration Options Reference

Complete reference for all `server.*` options in Vite.

---

## Network & Binding

### server.host

- **Type**: `string | boolean`
- **Default**: `'localhost'`
- **CLI**: `--host`

Specifies which network interface the dev server listens on.

| Value | Behavior |
|-------|----------|
| `'localhost'` | Only accessible from the local machine |
| `'0.0.0.0'` | Listen on all IPv4 addresses (LAN accessible) |
| `true` | Listen on all addresses including IPv6 (equivalent to `'0.0.0.0'`) |
| `'192.168.1.50'` | Bind to a specific IP address |

**ALWAYS** configure `server.allowedHosts` when setting `server.host` to `true` or `0.0.0.0`.

### server.allowedHosts

- **Type**: `string[] | true`
- **Default**: `[]`
- **Added**: Vite 7.x

Hostnames that the server is permitted to respond to. Protects against DNS rebinding attacks.

| Value | Behavior |
|-------|----------|
| `[]` | Localhost, `127.0.0.1`, `[::1]`, and IP addresses allowed by default |
| `['my-host.local']` | Allow specific hostnames in addition to defaults |
| `['.example.com']` | Leading dot allows all subdomains (`foo.example.com`, `bar.example.com`) |
| `true` | Disable host checking entirely (NOT RECOMMENDED) |

### server.port

- **Type**: `number`
- **Default**: `5173`
- **CLI**: `--port`

Port for the dev server. If the port is already in use, Vite automatically tries the next available port unless `server.strictPort` is set.

### server.strictPort

- **Type**: `boolean`
- **Default**: `false`

When `true`, Vite exits with an error if the specified port is already in use instead of trying the next available port.

---

## Security & TLS

### server.https

- **Type**: `https.ServerOptions`
- **Default**: `undefined`

Enable TLS + HTTP/2. Pass options directly to Node.js `https.createServer()`.

Common properties:

| Property | Type | Purpose |
|----------|------|---------|
| `key` | `Buffer \| string` | Private key (PEM format) |
| `cert` | `Buffer \| string` | Certificate chain (PEM format) |
| `ca` | `Buffer \| string` | CA certificate for self-signed certs |
| `pfx` | `Buffer` | PKCS#12 certificate bundle |
| `passphrase` | `string` | Passphrase for PFX or encrypted key |

### server.cors

- **Type**: `boolean | CorsOptions`
- **Default**: Regex matching localhost origins (`/^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/`)

Controls Cross-Origin Resource Sharing headers.

| Value | Behavior |
|-------|----------|
| `false` | Disable CORS headers |
| `true` | Allow any origin (`Access-Control-Allow-Origin: *`) |
| `{ origin: 'http://example.com' }` | Allow a specific origin |
| `{ origin: /\.example\.com$/ }` | Allow origins matching a regex |

**Note**: Default changed in Vite 7. Vite 6 and earlier used `true` (any origin) as the default.

### server.headers

- **Type**: `OutgoingHttpHeaders`
- **Default**: `undefined`

Custom HTTP response headers added to all responses from the dev server.

```typescript
server: {
  headers: {
    'X-Custom-Header': 'value',
    'Cache-Control': 'no-store',
  },
}
```

---

## File System Access

### server.fs.strict

- **Type**: `boolean`
- **Default**: `true`

Restricts serving files outside the workspace root directory. When `true`, accessing files outside the allowed directories results in a 403 error.

The workspace root is determined as:
1. The Vite project root
2. Any directory containing a `package.json` in the parent chain
3. Directories listed in `server.fs.allow`

### server.fs.allow

- **Type**: `string[]`
- **Default**: Automatically includes workspace root and linked packages

Directories allowed for file serving via `/@fs/`. Useful in monorepos where packages are in sibling directories.

```typescript
server: {
  fs: {
    allow: [
      // Serve files from one level up (monorepo root)
      '..',
      // Absolute path to a shared directory
      '/shared/assets',
    ],
  },
}
```

### server.fs.deny

- **Type**: `string[]`
- **Default**: `['.env', '.env.*', '*.{crt,pem}', '**/.git/**']`

Blocklist of sensitive files that are restricted from being served. Uses picomatch patterns. Matched against the resolved absolute path of the requested file.

**NEVER** remove or empty this list. ALWAYS add to the defaults:

```typescript
server: {
  fs: {
    deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/secrets/**'],
  },
}
```

---

## Proxy

### server.proxy

- **Type**: `Record<string, string | ProxyOptions>`
- **Default**: `undefined`

Custom proxy rules for the dev server. Uses `http-proxy-3` (Vite 8+) or `http-proxy` (Vite 6/7) under the hood.

#### String Shorthand

```typescript
proxy: {
  '/foo': 'http://localhost:4567',
  // /foo/bar → http://localhost:4567/foo/bar
}
```

#### ProxyOptions

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `target` | `string` | -- | Target server URL |
| `changeOrigin` | `boolean` | `false` | Change `Host` header to match target |
| `rewrite` | `(path: string) => string` | -- | Rewrite the request path |
| `ws` | `boolean` | `false` | Enable WebSocket proxying |
| `secure` | `boolean` | `true` | Verify SSL certificates |
| `configure` | `(proxy, options) => void` | -- | Access the underlying proxy instance |
| `bypass` | `(req, res, options) => void \| null \| undefined \| false \| string` | -- | Bypass the proxy |
| `headers` | `Record<string, string>` | -- | Custom request headers |

---

## HMR

### server.hmr

- **Type**: `boolean | HmrOptions`
- **Default**: `undefined` (HMR enabled by default)

Configure or disable Hot Module Replacement.

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `protocol` | `'ws' \| 'wss'` | auto | WebSocket protocol |
| `host` | `string` | `server.host` | HMR WebSocket host |
| `port` | `number` | -- | HMR WebSocket port |
| `path` | `string` | -- | HMR WebSocket path |
| `timeout` | `number` | `30000` | Connection timeout (ms) |
| `overlay` | `boolean` | `true` | Show error overlay in browser |
| `clientPort` | `number` | -- | Override port on client side (for reverse proxies) |
| `server` | `http.Server` | -- | Custom HTTP server for HMR WebSocket |

Set to `false` to disable HMR entirely.

---

## Performance

### server.warmup

- **Type**: `{ clientFiles?: string[], ssrFiles?: string[] }`
- **Default**: `undefined`

Pre-transform frequently used files on server start so they are already cached when first requested. Accepts glob patterns.

| Property | Purpose |
|----------|---------|
| `clientFiles` | Files used in the browser (components, pages, layouts) |
| `ssrFiles` | Files used in SSR (server entry, server-side modules) |

**ALWAYS** use warmup for known entry components to reduce initial page load time.

### server.watch

- **Type**: `object | null`
- **Default**: `undefined`

Options passed to chokidar for file system watching. Set to `null` to disable file watching entirely.

Common options:

| Property | Type | Purpose |
|----------|------|---------|
| `usePolling` | `boolean` | Use polling instead of native events (for network drives, Docker) |
| `interval` | `number` | Polling interval in ms |
| `ignored` | `string \| string[]` | Glob patterns to ignore |

```typescript
server: {
  watch: {
    usePolling: true,   // Required for Docker/WSL2 mounted volumes
    interval: 1000,
  },
}
```

---

## Integration

### server.middlewareMode

- **Type**: `boolean`
- **Default**: `false`

Creates the Vite server without an internal HTTP server. Use this when embedding Vite into an existing Express, Koa, or Fastify server.

**ALWAYS** set `appType: 'custom'` alongside `server.middlewareMode: true` to prevent Vite from injecting SPA fallback middleware.

The created server exposes `vite.middlewares` (a connect-compatible middleware stack) that can be mounted on any compatible HTTP framework.

### server.open

- **Type**: `boolean | string`
- **Default**: `undefined`
- **CLI**: `--open`

Automatically opens the browser when the dev server starts.

| Value | Behavior |
|-------|----------|
| `true` | Open the default browser at the server URL |
| `'/docs/'` | Open at a specific path |
| `'http://localhost:3000/docs/'` | Open at a full URL |

---

## Origin & Sourcemaps

### server.origin

- **Type**: `string`
- **Default**: `undefined`

Defines the origin of generated asset URLs during development. Useful when assets are served from a CDN or different domain in dev.

```typescript
server: {
  origin: 'http://127.0.0.1:8080',
}
// Asset URLs become: http://127.0.0.1:8080/assets/image.png
```

### server.sourcemapIgnoreList

- **Type**: `false | (sourcePath: string, sourcemapPath: string) => boolean`
- **Default**: `(sourcePath) => sourcePath.includes('node_modules')`

Controls which source files are added to the `x_google_ignoreList` sourcemap extension. Browsers use this to skip vendor code during debugging.

Set to `false` to include all sources in debugger stepping.

---

## Console Forwarding (v8+)

### server.forwardConsole

- **Type**: `boolean | { unhandledErrors?: boolean, logLevels?: string[] }`
- **Default**: Auto-detected (enabled when an AI agent is detected)
- **Added**: Vite 8.x

Forwards browser runtime events (console logs, unhandled errors) to the server terminal. Useful for headless development and AI-assisted workflows.

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `unhandledErrors` | `boolean` | `true` | Forward unhandled errors and rejections |
| `logLevels` | `string[]` | all levels | Filter which console methods to forward |

```typescript
server: {
  forwardConsole: {
    unhandledErrors: true,
    logLevels: ['error', 'warn', 'info'],
  },
}
```

**ALWAYS** check your Vite version before using this option -- it does not exist in Vite 6.x or 7.x.

# ViteHotContext API Reference

## Complete TypeScript Interface

```typescript
interface ViteHotContext {
  readonly data: any

  accept(): void
  accept(cb: (mod: ModuleNamespace | undefined) => void): void
  accept(dep: string, cb: (mod: ModuleNamespace | undefined) => void): void
  accept(
    deps: readonly string[],
    cb: (mods: Array<ModuleNamespace | undefined>) => void,
  ): void

  dispose(cb: (data: any) => void): void
  prune(cb: (data: any) => void): void
  invalidate(message?: string): void

  on<T extends CustomEventName>(
    event: T,
    cb: (payload: InferCustomEventPayload<T>) => void,
  ): void
  off<T extends CustomEventName>(
    event: T,
    cb: (payload: InferCustomEventPayload<T>) => void,
  ): void
  send<T extends CustomEventName>(
    event: T,
    data?: InferCustomEventPayload<T>,
  ): void
}
```

---

## Method Signatures — Detailed

### accept() — 4 Overloads

#### Overload 1: Self-Accept (No Arguments)

```typescript
accept(): void
```

Marks the module as self-accepting. The module handles its own updates. Vite re-executes the module and the new version replaces the old one. No callback is provided, so the module relies on its own top-level code running again.

#### Overload 2: Self-Accept with Callback

```typescript
accept(cb: (mod: ModuleNamespace | undefined) => void): void
```

Marks the module as self-accepting and provides a callback that receives the new module namespace. The `mod` parameter is `undefined` if the updated module has a syntax error.

**CRITICAL**: The call MUST appear as `import.meta.hot.accept(` with NO whitespace before the opening parenthesis. Vite performs static analysis that is whitespace-sensitive.

#### Overload 3: Accept Single Dependency

```typescript
accept(dep: string, cb: (mod: ModuleNamespace | undefined) => void): void
```

Accepts updates from a single direct dependency. The `dep` string MUST be a relative path (e.g., `'./foo.js'`). The callback receives the updated dependency's module namespace, or `undefined` on syntax error.

#### Overload 4: Accept Multiple Dependencies

```typescript
accept(
  deps: readonly string[],
  cb: (mods: Array<ModuleNamespace | undefined>) => void,
): void
```

Accepts updates from multiple direct dependencies. Each element in `mods` corresponds to the same index in `deps`. A module is `undefined` if it had a syntax error. If the updated module has a syntax error, the entire array is empty.

---

### dispose()

```typescript
dispose(cb: (data: any) => void): void
```

Registers a callback that runs when the current module instance is about to be replaced. Use this to clean up side effects (DOM elements, event listeners, intervals, WebSocket connections).

The `data` parameter is the same object as `import.meta.hot.data`. ALWAYS store state you want to persist on this object:

```typescript
import.meta.hot.dispose((data) => {
  data.savedState = currentState
  clearInterval(timerId)
})
```

---

### prune()

```typescript
prune(cb: (data: any) => void): void
```

Registers a callback that runs when the module is no longer imported by any other module (removed from the module graph). Use this for final cleanup when a module is completely removed, not just updated.

---

### invalidate()

```typescript
invalidate(message?: string): void
```

Forces HMR propagation upward to the module's importers. The current module cannot handle the update and defers to its parent boundaries.

**CRITICAL**: ALWAYS call `accept()` before `invalidate()`. A module must be an HMR boundary (via `accept()`) before it can invalidate. Without `accept()`, the module is not a boundary and `invalidate()` has no meaningful effect.

The optional `message` parameter appears in the dev server console for debugging.

---

### data

```typescript
readonly data: any
```

A persistent object that survives module updates. Properties set on this object are available to the next version of the module after HMR.

**CRITICAL**: NEVER reassign the object. ALWAYS mutate properties:

```typescript
// CORRECT
import.meta.hot.data.count = 42
import.meta.hot.data.items = ['a', 'b']

// WRONG — breaks persistence
import.meta.hot.data = { count: 42 }
```

---

### on()

```typescript
on<T extends CustomEventName>(
  event: T,
  cb: (payload: InferCustomEventPayload<T>) => void,
): void
```

Listens for HMR events. Works with both built-in events (8 listed below) and custom events sent from plugins via `server.ws.send()`.

---

### off()

```typescript
off<T extends CustomEventName>(
  event: T,
  cb: (payload: InferCustomEventPayload<T>) => void,
): void
```

Removes a previously registered event listener. The `cb` MUST be the exact same function reference passed to `on()`.

---

### send()

```typescript
send<T extends CustomEventName>(
  event: T,
  data?: InferCustomEventPayload<T>,
): void
```

Sends a custom event from the client to the Vite dev server. If the WebSocket connection is not yet established, the data is buffered and sent when the connection opens.

---

## Built-in HMR Events — Complete Reference

| Event Name | Payload Type | When Fired | Typical Use |
|-----------|-------------|------------|-------------|
| `vite:beforeUpdate` | `{ type: 'update', updates: Update[] }` | An HMR update is about to be applied | Log updates, prepare for changes |
| `vite:afterUpdate` | `{ type: 'update', updates: Update[] }` | An HMR update has been successfully applied | Post-update DOM adjustments |
| `vite:beforeFullReload` | `{ path: string }` | A full page reload is about to happen | Save state before reload |
| `vite:beforePrune` | `{ paths: string[] }` | Modules are about to be removed from the graph | Log pruned modules |
| `vite:invalidate` | `{ path: string, message: string \| undefined }` | A module was invalidated via `hot.invalidate()` | Debug invalidation chains |
| `vite:error` | `{ err: { message: string, stack: string } }` | An error occurred during HMR (e.g., syntax error) | Display error overlay |
| `vite:ws:disconnect` | `{ webSocket: WebSocket }` | WebSocket connection to dev server was lost | Show disconnection warning |
| `vite:ws:connect` | `{ webSocket: WebSocket }` | WebSocket connection (re-)established | Clear disconnection warning |

---

## TypeScript Types for Custom Events

### Declaring Custom Events

```typescript
// custom-events.d.ts
import 'vite/types/customEvent.d.ts'

declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    'my:data-update': { id: string; value: number }
    'my:status-change': { status: 'online' | 'offline' }
  }
}
```

### Using InferCustomEventPayload

```typescript
import type { InferCustomEventPayload } from 'vite/types/customEvent.d.ts'

// Type resolves to { id: string; value: number }
type DataPayload = InferCustomEventPayload<'my:data-update'>
```

### ModuleNamespace Type

```typescript
type ModuleNamespace = Record<string, any> & {
  [Symbol.toStringTag]: 'Module'
}
```

This is what `accept()` callbacks receive — an object representing the module's exports.

---

## Access Pattern

The HMR API is accessed exclusively through `import.meta.hot`:

```typescript
// import.meta.hot is ViteHotContext | undefined
// It is undefined in production builds
// ALWAYS guard with conditional check

if (import.meta.hot) {
  // import.meta.hot is ViteHotContext here
  import.meta.hot.accept()
}
```

To get TypeScript support for `import.meta.hot`, add `"vite/client"` to `compilerOptions.types` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

---

## Official Source

- https://vite.dev/guide/api-hmr

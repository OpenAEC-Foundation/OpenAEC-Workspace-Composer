# HMR API Examples

## Example 1: Self-Accepting Module (Minimal)

A module that handles its own updates with no state persistence:

```typescript
export const greeting = 'Hello World'

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      console.log('Updated greeting:', newModule.greeting)
    }
  })
}
```

When this file changes, Vite re-executes it and calls the callback with the new module namespace. The `newModule` parameter is `undefined` if the update contains a syntax error.

---

## Example 2: Self-Accepting with No Callback

When the module's top-level code is sufficient to re-initialize:

```typescript
const el = document.getElementById('output')!
el.textContent = `Current time: ${new Date().toLocaleTimeString()}`

if (import.meta.hot) {
  import.meta.hot.accept()
}
```

On every update, Vite re-executes the entire module. The DOM update happens as a side effect of re-execution.

---

## Example 3: Dependency-Accepting (Single Dependency)

```typescript
import { formatPrice } from './formatters.js'

function renderPrices() {
  const prices = [10, 20.5, 100]
  const formatted = prices.map(formatPrice)
  document.getElementById('prices')!.innerHTML = formatted.join('<br>')
}

renderPrices()

if (import.meta.hot) {
  import.meta.hot.accept('./formatters.js', (newFormatters) => {
    if (newFormatters) {
      // Re-render with updated formatter — this module did NOT change
      const prices = [10, 20.5, 100]
      const formatted = prices.map(newFormatters.formatPrice)
      document.getElementById('prices')!.innerHTML = formatted.join('<br>')
    }
  })
}
```

The current module stays as-is. Only the dependency is re-loaded and passed to the callback.

---

## Example 4: Dependency-Accepting (Multiple Dependencies)

```typescript
import { foo } from './foo.js'
import { bar } from './bar.js'

function render() {
  document.getElementById('app')!.textContent = `${foo()} - ${bar()}`
}

render()

if (import.meta.hot) {
  import.meta.hot.accept(
    ['./foo.js', './bar.js'],
    ([newFoo, newBar]) => {
      // Each element corresponds to the dependency at the same index
      // An element is undefined if that dependency had a syntax error
      const fooFn = newFoo?.foo ?? foo
      const barFn = newBar?.bar ?? bar
      document.getElementById('app')!.textContent = `${fooFn()} - ${barFn()}`
    },
  )
}
```

---

## Example 5: Dispose + Data Persistence (Full Pattern)

The complete pattern for modules with side effects that need cleanup and state preservation:

```typescript
interface AppState {
  count: number
  lastUpdated: string
}

let state: AppState = {
  count: 0,
  lastUpdated: new Date().toISOString(),
}

// Restore state from previous module version BEFORE using it
if (import.meta.hot && import.meta.hot.data.state) {
  state = import.meta.hot.data.state
}

// Side effect: create a DOM element
const container = document.createElement('div')
container.id = 'counter-widget'
document.body.appendChild(container)

// Side effect: start an interval
const timerId = setInterval(() => {
  state.count++
  state.lastUpdated = new Date().toISOString()
  container.textContent = `Count: ${state.count} (${state.lastUpdated})`
}, 1000)

// Initial render
container.textContent = `Count: ${state.count} (${state.lastUpdated})`

if (import.meta.hot) {
  import.meta.hot.accept()

  import.meta.hot.dispose((data) => {
    // 1. Save state for next version
    data.state = state

    // 2. Clean up ALL side effects
    clearInterval(timerId)
    container.remove()
  })
}
```

Key points:
- State restoration happens BEFORE any side effects
- `dispose()` saves state on the `data` object (same as `import.meta.hot.data`)
- `dispose()` cleans up ALL side effects (intervals, DOM nodes, event listeners)
- `accept()` marks the module as an HMR boundary

---

## Example 6: Prune Callback

Used when a module might be removed from the import graph entirely:

```typescript
const styleEl = document.createElement('style')
styleEl.textContent = `.my-component { color: red; }`
document.head.appendChild(styleEl)

if (import.meta.hot) {
  import.meta.hot.prune(() => {
    // Module is no longer imported by anything — remove injected styles
    styleEl.remove()
  })
}
```

`prune()` fires when the module is completely removed from the dependency graph (e.g., an import statement is deleted), NOT when the module is updated.

---

## Example 7: Conditional Invalidation

When a module can sometimes handle its own update, but other times must defer to its parent:

```typescript
export const API_VERSION = 2
export function fetchData() {
  return fetch('/api/v2/data')
}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (!newModule) {
      // Syntax error — do nothing, wait for fix
      return
    }

    if (newModule.API_VERSION !== API_VERSION) {
      // Breaking API change — cannot handle locally
      import.meta.hot!.invalidate(
        `API version changed from ${API_VERSION} to ${newModule.API_VERSION}`,
      )
      return
    }

    // Non-breaking change — apply safely
    console.log('API module updated without version change')
  })
}
```

The `invalidate()` message appears in the dev server console, helping debug why a full reload happened.

---

## Example 8: Custom Events (Client-Server Communication)

### Client Side

```typescript
if (import.meta.hot) {
  // Send data to the server
  import.meta.hot.send('my:client-data', {
    timestamp: Date.now(),
    route: window.location.pathname,
  })

  // Listen for server-sent events
  import.meta.hot.on('my:server-notification', (data) => {
    console.log('Server notification:', data.message)
    showToast(data.message)
  })
}
```

### Server Side (Plugin)

```typescript
import type { Plugin } from 'vite'

export default function notificationPlugin(): Plugin {
  return {
    name: 'notification-plugin',
    configureServer(server) {
      server.ws.on('my:client-data', (data, client) => {
        console.log('Client data received:', data)

        // Send response back to the specific client
        client.send('my:server-notification', {
          message: `Received data for route: ${data.route}`,
        })
      })
    },
  }
}
```

### TypeScript Type Safety

```typescript
// events.d.ts
import 'vite/types/customEvent.d.ts'

declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    'my:client-data': { timestamp: number; route: string }
    'my:server-notification': { message: string }
  }
}
```

---

## Example 9: Listening to Built-in Events

```typescript
if (import.meta.hot) {
  // Log all HMR updates
  import.meta.hot.on('vite:beforeUpdate', (payload) => {
    console.log('HMR update incoming:', payload.updates.length, 'modules')
  })

  import.meta.hot.on('vite:afterUpdate', (payload) => {
    console.log('HMR update applied successfully')
  })

  // Save critical state before full reload
  import.meta.hot.on('vite:beforeFullReload', (payload) => {
    sessionStorage.setItem('app-state', JSON.stringify(getAppState()))
    console.log('Full reload triggered by:', payload.path)
  })

  // Show error overlay or custom handling
  import.meta.hot.on('vite:error', (payload) => {
    console.error('HMR error:', payload.err.message)
    showCustomErrorOverlay(payload.err)
  })

  // Connection status monitoring
  import.meta.hot.on('vite:ws:disconnect', () => {
    showConnectionWarning('Dev server disconnected')
  })

  import.meta.hot.on('vite:ws:connect', () => {
    hideConnectionWarning()
  })
}
```

---

## Example 10: Full HMR-Aware Module (Complete Template)

This template combines all HMR patterns into a production-ready module:

```typescript
// widget.ts — A complete HMR-aware module

interface WidgetState {
  isVisible: boolean
  position: { x: number; y: number }
  data: string[]
}

// Default state
let state: WidgetState = {
  isVisible: true,
  position: { x: 0, y: 0 },
  data: [],
}

// === STATE RESTORATION (before any side effects) ===
if (import.meta.hot && import.meta.hot.data.widgetState) {
  state = import.meta.hot.data.widgetState
}

// === SIDE EFFECTS ===
const el = document.createElement('div')
el.className = 'widget'
document.body.appendChild(el)

function onMouseMove(e: MouseEvent) {
  state.position = { x: e.clientX, y: e.clientY }
}
document.addEventListener('mousemove', onMouseMove)

const ws = new WebSocket('ws://localhost:8080/widget')
ws.onmessage = (event) => {
  state.data.push(event.data)
  render()
}

// === RENDER ===
export function render() {
  el.innerHTML = `
    <h3>Widget (${state.data.length} items)</h3>
    <p>Position: ${state.position.x}, ${state.position.y}</p>
    <ul>${state.data.map((d) => `<li>${d}</li>`).join('')}</ul>
  `
}

render()

// === HMR ===
if (import.meta.hot) {
  import.meta.hot.accept()

  import.meta.hot.dispose((data) => {
    // Save state
    data.widgetState = state

    // Clean up ALL side effects
    el.remove()
    document.removeEventListener('mousemove', onMouseMove)
    ws.close()
  })
}
```

This pattern ensures:
1. State survives across updates (position, data)
2. No duplicate DOM elements (old element removed in dispose)
3. No duplicate event listeners (old listener removed in dispose)
4. No orphaned WebSocket connections (old connection closed in dispose)
5. Module is a proper HMR boundary (accept called)

---

## Official Source

- https://vite.dev/guide/api-hmr

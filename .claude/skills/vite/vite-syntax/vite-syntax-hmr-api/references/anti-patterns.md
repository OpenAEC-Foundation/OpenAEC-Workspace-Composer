# HMR API Anti-Patterns

## Anti-Pattern 1: Missing Guard Pattern

### WRONG

```typescript
import.meta.hot.accept((newModule) => {
  // This crashes in production where import.meta.hot is undefined
})
```

### CORRECT

```typescript
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Safe — tree-shaken in production builds
  })
}
```

**Why**: `import.meta.hot` is `undefined` in production builds. Without the guard, the code throws a runtime error. The conditional also enables tree-shaking — the entire block is removed from production bundles.

---

## Anti-Pattern 2: Whitespace in accept() Call

### WRONG

```typescript
if (import.meta.hot) {
  import.meta.hot.accept
    ((newModule) => {
      // HMR detection FAILS — Vite's static analysis is whitespace-sensitive
    })
}
```

### ALSO WRONG

```typescript
if (import.meta.hot) {
  import.meta.hot.accept (/* space before paren */(newModule) => {
    // Also fails
  })
}
```

### CORRECT

```typescript
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // No space between "accept" and "(" — static analysis works
  })
}
```

**Why**: Vite performs static analysis on source code to detect HMR boundaries. It looks for the exact pattern `import.meta.hot.accept(` — any whitespace between `accept` and `(` breaks detection, and the module silently stops being an HMR boundary. This causes unexplained full reloads.

---

## Anti-Pattern 3: Reassigning hot.data

### WRONG

```typescript
if (import.meta.hot) {
  import.meta.hot.data = { count: 42, items: [] }
}
```

### CORRECT

```typescript
if (import.meta.hot) {
  import.meta.hot.data.count = 42
  import.meta.hot.data.items = []
}
```

**Why**: The `data` object is a shared reference maintained by Vite across module updates. Reassigning it replaces the reference with a new object that Vite does not track. Properties set on the new object are lost on the next update. ALWAYS mutate properties on the existing object.

---

## Anti-Pattern 4: invalidate() Without accept()

### WRONG

```typescript
if (import.meta.hot) {
  // No accept() — module is not an HMR boundary
  import.meta.hot.invalidate('needs update')
}
```

### CORRECT

```typescript
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (cannotHandle(newModule)) {
      import.meta.hot!.invalidate('cannot handle this update')
    }
  })
}
```

**Why**: `invalidate()` tells Vite to propagate an update to importers because the current module cannot handle it. But a module must first be an HMR boundary (via `accept()`) before invalidation makes sense. Without `accept()`, the module was never going to handle updates anyway — calling `invalidate()` alone has no effect.

---

## Anti-Pattern 5: Not Cleaning Up Side Effects in dispose()

### WRONG

```typescript
const el = document.createElement('div')
document.body.appendChild(el)

const timerId = setInterval(() => {
  el.textContent = `Time: ${Date.now()}`
}, 1000)

if (import.meta.hot) {
  import.meta.hot.accept()
  // Missing dispose() — side effects accumulate on each update
}
```

After 5 edits, there are 5 `<div>` elements and 5 running intervals.

### CORRECT

```typescript
const el = document.createElement('div')
document.body.appendChild(el)

const timerId = setInterval(() => {
  el.textContent = `Time: ${Date.now()}`
}, 1000)

if (import.meta.hot) {
  import.meta.hot.accept()

  import.meta.hot.dispose(() => {
    el.remove()
    clearInterval(timerId)
  })
}
```

**Why**: When a module is updated, Vite re-executes it from scratch. Any side effects from the previous version (DOM elements, intervals, event listeners, WebSocket connections) remain active unless explicitly cleaned up in `dispose()`. This causes duplicate elements, memory leaks, and unpredictable behavior.

---

## Anti-Pattern 6: Using const for Re-Exported HMR Values

### WRONG

```typescript
// config.ts
export const theme = loadTheme()

// app.ts — imports and re-exports
import { theme } from './config.ts'
export { theme } // const binding — cannot be updated by HMR
```

### CORRECT

```typescript
// config.ts
export let theme = loadTheme()

// app.ts
import { theme } from './config.ts'
export { theme } // let binding — HMR can update this
```

**Why**: Vite's HMR does NOT swap the originally imported module binding. When a boundary module re-exports values, those exports must use `let` so the binding can be updated. With `const`, the binding is locked to the initial value and HMR updates to the source module do not propagate through re-exports.

---

## Anti-Pattern 7: State Restoration After Side Effects

### WRONG

```typescript
// Side effect runs BEFORE state is restored
const el = document.createElement('div')
el.textContent = `Count: ${state.count}` // state.count is 0, not the saved value
document.body.appendChild(el)

if (import.meta.hot && import.meta.hot.data.state) {
  state = import.meta.hot.data.state // Too late — DOM already rendered with default state
}
```

### CORRECT

```typescript
// Restore state FIRST
if (import.meta.hot && import.meta.hot.data.state) {
  state = import.meta.hot.data.state
}

// Then run side effects with restored state
const el = document.createElement('div')
el.textContent = `Count: ${state.count}` // Correct value from previous version
document.body.appendChild(el)
```

**Why**: State restoration must happen BEFORE any code that uses the state. If side effects (DOM rendering, API calls) execute first, they use the default state values instead of the persisted ones, causing visible flickering and lost user context.

---

## Anti-Pattern 8: Forgetting to Handle undefined Module in accept()

### WRONG

```typescript
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Crashes if newModule is undefined (syntax error in update)
    applyUpdate(newModule.exportedFunction)
  })
}
```

### CORRECT

```typescript
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (!newModule) {
      // Syntax error in the update — module is undefined
      // Do nothing, wait for the developer to fix the error
      return
    }
    applyUpdate(newModule.exportedFunction)
  })
}
```

**Why**: When an updated module has a syntax error, Vite passes `undefined` to the accept callback instead of the module namespace. Accessing properties on `undefined` throws a TypeError, which causes the accept handler to fail, which triggers a full page reload — losing all application state.

---

## Anti-Pattern 9: Using off() with Anonymous Functions

### WRONG

```typescript
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', (payload) => {
    console.log('Update:', payload)
  })

  // This does NOT remove the listener above — different function reference
  import.meta.hot.off('vite:beforeUpdate', (payload) => {
    console.log('Update:', payload)
  })
}
```

### CORRECT

```typescript
if (import.meta.hot) {
  const handler = (payload: any) => {
    console.log('Update:', payload)
  }

  import.meta.hot.on('vite:beforeUpdate', handler)

  // Same function reference — listener is properly removed
  import.meta.hot.off('vite:beforeUpdate', handler)
}
```

**Why**: `off()` uses reference equality to find and remove the listener. Two anonymous functions with identical code are different objects in JavaScript. ALWAYS store the handler in a variable when you intend to remove it later.

---

## Anti-Pattern 10: HMR Code Outside the Guard Referencing hot

### WRONG

```typescript
// Stores reference outside guard — undefined in production
const hotData = import.meta.hot?.data

function saveState() {
  // Silently fails in production (hotData is undefined)
  if (hotData) hotData.state = getState()
}
```

### CORRECT

```typescript
function saveState() {
  if (import.meta.hot) {
    import.meta.hot.data.state = getState()
  }
}
```

**Why**: While the optional chaining (`?.`) prevents a crash, storing `import.meta.hot?.data` in a top-level variable prevents tree-shaking. The variable and any code referencing it remains in the production bundle. ALWAYS access `import.meta.hot` inside a conditional guard to ensure complete removal in production.

---

## Official Source

- https://vite.dev/guide/api-hmr

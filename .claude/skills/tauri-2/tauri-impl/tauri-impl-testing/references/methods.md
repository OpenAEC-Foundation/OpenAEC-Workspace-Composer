# tauri-impl-testing: API Method Reference

Sources: https://v2.tauri.app/reference/javascript/api/namespacemocks/,
https://v2.tauri.app/develop/tests/

---

## TypeScript Mock API

**Import:** `import { mockIPC, mockWindows, mockConvertFileSrc, clearMocks } from '@tauri-apps/api/mocks'`

### mockIPC

```typescript
mockIPC(handler: MockIPCHandler, options?: MockIPCOptions): void
```

Intercepts all `invoke()` calls and routes them to the provided handler function instead of the Tauri IPC bridge.

**Parameters:**

```typescript
type MockIPCHandler = (cmd: string, args: Record<string, unknown>) => unknown;

interface MockIPCOptions {
  shouldMockEvents?: boolean;  // Also mock listen/emit (default: false)
}
```

**Handler behavior:**
- The `cmd` parameter is the command name string
- The `args` parameter contains the arguments object passed to `invoke()`
- Return a value to resolve the `invoke()` Promise
- Throw an error to reject the `invoke()` Promise
- Return `undefined` for void commands

**Usage:**

```typescript
mockIPC((cmd, args) => {
  switch (cmd) {
    case 'greet':
      return `Hello, ${args.name}!`;
    case 'get_count':
      return 42;
    case 'save_data':
      return undefined; // void command
    default:
      throw new Error(`Unhandled command: ${cmd}`);
  }
});
```

**With event mocking:**

```typescript
mockIPC(
  (cmd, args) => { /* ... */ },
  { shouldMockEvents: true }
);
```

When `shouldMockEvents` is `true`, `listen()`, `emit()`, `emitTo()`, and `once()` from `@tauri-apps/api/event` also work in the test environment.

---

### mockWindows

```typescript
mockWindows(currentLabel: string, ...additionalLabels: string[]): void
```

Mocks the window API. The first argument becomes the "current" window (returned by `getCurrentWindow()`). Additional arguments define other window labels that exist in the app.

**Parameters:**
- `currentLabel` -- Label for the current window
- `...additionalLabels` -- Labels for other windows

**Usage:**

```typescript
mockWindows('main', 'settings', 'about');

// getCurrentWindow() now returns a window with label "main"
// Window.getByLabel('settings') resolves to a window
```

---

### mockConvertFileSrc

```typescript
mockConvertFileSrc(platform: string): void
```

Mocks the `convertFileSrc()` function to generate platform-appropriate URLs.

**Parameters:**
- `platform` -- Target platform string: `"linux"`, `"windows"`, `"macos"`, `"android"`, `"ios"`

**Usage:**

```typescript
mockConvertFileSrc('linux');

const url = convertFileSrc('/path/to/file.png');
// Returns a platform-appropriate asset URL
```

---

### clearMocks

```typescript
clearMocks(): void
```

Removes all active mocks (IPC, windows, and convertFileSrc). MUST be called in test teardown.

**Usage:**

```typescript
afterEach(() => {
  clearMocks();
});
```

---

## Rust Testing Utilities

### Standard Unit Tests

Tauri command functions are regular Rust functions. Test them with `#[test]`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_command() {
        let result = my_command("input".to_string());
        assert_eq!(result, "expected");
    }
}
```

### Async Tests (tokio)

For async commands, use `#[tokio::test]`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_async_command() {
        let result = my_async_command("input".to_string()).await;
        assert!(result.is_ok());
    }
}
```

**Required dev dependency:**

```toml
[dev-dependencies]
tokio = { version = "1", features = ["rt", "macros"] }
```

### Testing With Mutex State

Extract logic from the command to avoid needing `tauri::State`:

```rust
// Testable function (no Tauri dependency)
pub fn do_work(data: &mut MyData) -> Result<String, AppError> {
    // business logic here
    Ok("result".to_string())
}

// Command wrapper (thin, not unit-tested)
#[tauri::command]
pub fn my_command(state: tauri::State<'_, Mutex<MyData>>) -> Result<String, AppError> {
    let mut data = state.lock().unwrap();
    do_work(&mut data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_do_work() {
        let mut data = MyData::default();
        let result = do_work(&mut data);
        assert!(result.is_ok());
    }
}
```

---

## Test Framework Configuration

### Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',    // Required for DOM APIs
    globals: true,           // Global describe/it/expect
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

### Jest Setup

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['./src/test-setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@tauri-apps/api/(.*)$': '@tauri-apps/api/$1',
  },
};
```

### Global Test Setup

```typescript
// src/test-setup.ts
import { afterEach } from 'vitest'; // or jest
import { clearMocks } from '@tauri-apps/api/mocks';

afterEach(() => {
  clearMocks();
});
```

---

## WebDriver / E2E Utilities

### tauri-driver

```bash
# Install
cargo install tauri-driver

# Run (default port 4444)
tauri-driver

# Custom port
tauri-driver --port 9515
```

### WebDriver Capabilities

```json
{
  "capabilities": {
    "alwaysMatch": {
      "tauri:options": {
        "application": "../src-tauri/target/debug/my-app"
      }
    }
  }
}
```

### Cargo Test Command

```bash
# Run all tests
cd src-tauri && cargo test

# Run specific test
cargo test test_greet

# Run tests with output
cargo test -- --nocapture

# Run tests in a specific module
cargo test commands::tests
```

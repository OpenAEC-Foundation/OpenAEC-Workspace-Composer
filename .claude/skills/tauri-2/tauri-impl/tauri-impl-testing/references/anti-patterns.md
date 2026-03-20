# tauri-impl-testing: Anti-Patterns

These are confirmed error patterns when testing Tauri 2 applications. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/develop/tests/
- https://v2.tauri.app/reference/javascript/api/namespacemocks/
- vooronderzoek-tauri.md §3.9, §10

---

## AP-001: Not Calling clearMocks() in afterEach

**WHY this is wrong**: Mocks persist across tests if not cleared. A `mockIPC` handler from test A will still be active in test B, causing unexpected behavior, false passes, and flaky tests that depend on execution order.

```typescript
// WRONG -- no cleanup
describe('my tests', () => {
  it('test A', () => {
    mockIPC((cmd) => {
      if (cmd === 'foo') return 'bar';
    });
    // ...
  });

  it('test B', async () => {
    // Mock from test A is still active!
    const result = await invoke('foo');
    // result is 'bar' -- test passes for the wrong reason
  });
});
```

```typescript
// CORRECT -- clear mocks after every test
afterEach(() => {
  clearMocks();
});

describe('my tests', () => {
  it('test A', () => {
    mockIPC((cmd) => {
      if (cmd === 'foo') return 'bar';
    });
    // ...
  });

  it('test B', async () => {
    mockIPC((cmd) => {
      // Fresh mock for this test
    });
    // ...
  });
});
```

ALWAYS call `clearMocks()` in `afterEach()`. Set it up in a global test setup file to guarantee it runs.

---

## AP-002: Testing Commands Through IPC Instead of Direct Function Calls

**WHY this is wrong**: Tauri commands are regular Rust functions. Testing them through the full IPC pipeline (serialize, send, deserialize) adds unnecessary complexity and fragility. Unit tests should call the function directly.

```rust
// WRONG -- trying to test via IPC infrastructure
#[test]
fn test_via_ipc() {
    // This requires a full Tauri app context, which is complex to set up
    let app = tauri::test::mock_builder().build().unwrap();
    // ... complex setup ...
}
```

```rust
// CORRECT -- test the function directly
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[test]
fn test_greet() {
    // Call the function directly -- it's just a regular function
    let result = greet("World".to_string());
    assert_eq!(result, "Hello, World!");
}
```

ALWAYS test Rust command logic by calling the function directly. NEVER set up a full Tauri runtime for unit tests.

---

## AP-003: Importing Tauri API Without Mocking First

**WHY this is wrong**: The `@tauri-apps/api` modules expect to run inside a Tauri webview. When imported in a test environment (Node.js/jsdom), they attempt to access `window.__TAURI_INTERNALS__` which does not exist, causing runtime errors.

```typescript
// WRONG -- using Tauri API without mocking
import { invoke } from '@tauri-apps/api/core';

it('calls backend', async () => {
  // Error: window.__TAURI_INTERNALS__ is not defined
  const result = await invoke('my_command');
});
```

```typescript
// CORRECT -- mock before using
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { invoke } from '@tauri-apps/api/core';

beforeEach(() => {
  mockIPC((cmd) => {
    if (cmd === 'my_command') return 'result';
  });
});

afterEach(() => {
  clearMocks();
});

it('calls backend', async () => {
  const result = await invoke('my_command');
  expect(result).toBe('result');
});
```

ALWAYS call `mockIPC()` before any `invoke()` call in tests. ALWAYS call `mockWindows()` before using Window API in tests.

---

## AP-004: Testing State-Dependent Commands Without Extracting Logic

**WHY this is wrong**: Commands that use `tauri::State<'_, T>` cannot be called directly in unit tests because `State` requires a managed Tauri runtime. Trying to construct a `State` manually is not possible. The solution is to extract business logic into plain functions.

```rust
// WRONG -- cannot test this directly
#[tauri::command]
fn increment(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    let mut counter = state.lock().unwrap();
    counter.value += 1;
    counter.value
}

#[test]
fn test_increment() {
    // Error: cannot construct tauri::State outside runtime
    // let state = ???;
    // increment(state);
}
```

```rust
// CORRECT -- extract testable logic
pub fn do_increment(counter: &mut Counter) -> u32 {
    counter.value += 1;
    counter.value
}

#[tauri::command]
fn increment(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    let mut counter = state.lock().unwrap();
    do_increment(&mut counter)
}

#[test]
fn test_increment() {
    let mut counter = Counter::default();
    assert_eq!(do_increment(&mut counter), 1);
    assert_eq!(do_increment(&mut counter), 2);
}
```

ALWAYS extract business logic from command wrappers into separate, testable functions.

---

## AP-005: Not Using async/await Correctly With mockIPC

**WHY this is wrong**: `invoke()` returns a `Promise`. If you forget `await`, the test completes before the mock handler runs, and assertions never execute. The test passes vacuously.

```typescript
// WRONG -- missing await, assertions never run
it('should greet', () => {
  mockIPC((cmd) => {
    if (cmd === 'greet') return 'Hello!';
  });

  invoke<string>('greet').then((result) => {
    expect(result).toBe('Hello!'); // This never executes!
  });
});
```

```typescript
// CORRECT -- properly awaited
it('should greet', async () => {
  mockIPC((cmd) => {
    if (cmd === 'greet') return 'Hello!';
  });

  const result = await invoke<string>('greet');
  expect(result).toBe('Hello!');
});
```

ALWAYS use `async/await` with `invoke()` in tests. ALWAYS mark test functions as `async`.

---

## AP-006: Not Handling Unmatched Commands in Mock Handler

**WHY this is wrong**: When the mock handler receives a command it does not handle, it silently returns `undefined`. This masks bugs where the wrong command name is being invoked (e.g., typos). The test passes with `undefined` instead of the expected value.

```typescript
// WRONG -- unmatched commands return undefined silently
mockIPC((cmd) => {
  if (cmd === 'greet') return 'Hello!';
  // 'greet_user' falls through and returns undefined
});

const result = await invoke('greet_user'); // undefined, not an error
```

```typescript
// CORRECT -- throw on unmatched commands
mockIPC((cmd) => {
  if (cmd === 'greet') return 'Hello!';
  throw new Error(`Unhandled mock command: ${cmd}`);
});

// Now 'greet_user' throws an error, catching the typo
```

ALWAYS throw an error for unmatched commands in your mock handler to catch typos and missing implementations.

---

## AP-007: Testing camelCase/snake_case Argument Mismatch

**WHY this is wrong**: In production, Tauri auto-converts camelCase JS arguments to snake_case Rust parameters. In tests with `mockIPC`, the args object contains the ORIGINAL camelCase keys. If your mock handler checks for snake_case keys, it will not find them.

```typescript
// WRONG -- checking for snake_case in mock
mockIPC((cmd, args) => {
  if (cmd === 'save_file') {
    const path = (args as any).file_path; // undefined! Key is camelCase
    return `Saved to ${path}`;
  }
});

await invoke('save_file', { filePath: '/doc.txt' });
// result: "Saved to undefined"
```

```typescript
// CORRECT -- use camelCase keys in mock
mockIPC((cmd, args) => {
  if (cmd === 'save_file') {
    const path = (args as any).filePath; // matches JS calling convention
    return `Saved to ${path}`;
  }
});

await invoke('save_file', { filePath: '/doc.txt' });
// result: "Saved to /doc.txt"
```

ALWAYS use camelCase keys when accessing args in `mockIPC` handlers, matching the JavaScript calling convention.

---

## AP-008: Skipping Rust Tests for "Simple" Commands

**WHY this is wrong**: Commands that seem simple (string formatting, arithmetic) often evolve to include validation, error handling, and edge cases. Without tests from the start, regressions are caught late. Rust's type system catches many errors, but logic bugs still need tests.

```rust
// WRONG -- "too simple to test"
#[tauri::command]
pub fn format_price(cents: i64) -> String {
    format!("${}.{:02}", cents / 100, cents % 100)
}
// What about negative values? Zero? Large numbers?
```

```rust
// CORRECT -- test edge cases
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_price_normal() {
        assert_eq!(format_price(1234), "$12.34");
    }

    #[test]
    fn test_format_price_zero() {
        assert_eq!(format_price(0), "$0.00");
    }

    #[test]
    fn test_format_price_negative() {
        assert_eq!(format_price(-500), "$-5.00");
        // Is this the desired behavior? The test documents it.
    }

    #[test]
    fn test_format_price_small() {
        assert_eq!(format_price(5), "$0.05");
    }
}
```

ALWAYS write tests for commands, even simple ones. Tests document expected behavior and catch edge cases.

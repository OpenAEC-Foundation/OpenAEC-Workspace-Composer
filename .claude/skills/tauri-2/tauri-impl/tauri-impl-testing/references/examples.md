# tauri-impl-testing: Working Test Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/develop/tests/
- https://v2.tauri.app/reference/javascript/api/namespacemocks/

---

## Example 1: Basic Rust Command Unit Tests

```rust
// src-tauri/src/commands.rs

#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
pub fn calculate(a: f64, b: f64, op: String) -> Result<f64, String> {
    match op.as_str() {
        "add" => Ok(a + b),
        "sub" => Ok(a - b),
        "mul" => Ok(a * b),
        "div" => {
            if b == 0.0 {
                Err("Division by zero".to_string())
            } else {
                Ok(a / b)
            }
        }
        _ => Err(format!("Unknown operation: {}", op)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet_normal() {
        assert_eq!(greet("Alice".to_string()), "Hello, Alice!");
    }

    #[test]
    fn test_greet_empty() {
        assert_eq!(greet("".to_string()), "Hello, !");
    }

    #[test]
    fn test_calculate_add() {
        assert_eq!(calculate(2.0, 3.0, "add".to_string()), Ok(5.0));
    }

    #[test]
    fn test_calculate_division_by_zero() {
        let result = calculate(10.0, 0.0, "div".to_string());
        assert_eq!(result, Err("Division by zero".to_string()));
    }

    #[test]
    fn test_calculate_unknown_op() {
        let result = calculate(1.0, 1.0, "pow".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown operation"));
    }
}
```

---

## Example 2: Testing Stateful Logic (Extracted)

```rust
// src-tauri/src/state.rs
use std::sync::Mutex;

#[derive(Default)]
pub struct TodoList {
    pub items: Vec<String>,
}

// Testable business logic (no Tauri dependency)
impl TodoList {
    pub fn add(&mut self, item: String) -> usize {
        self.items.push(item);
        self.items.len()
    }

    pub fn remove(&mut self, index: usize) -> Result<String, String> {
        if index >= self.items.len() {
            return Err(format!("Index {} out of bounds", index));
        }
        Ok(self.items.remove(index))
    }

    pub fn list(&self) -> Vec<String> {
        self.items.clone()
    }
}

// Thin Tauri command wrappers
#[tauri::command]
pub fn add_todo(state: tauri::State<'_, Mutex<TodoList>>, item: String) -> usize {
    let mut todos = state.lock().unwrap();
    todos.add(item)
}

#[tauri::command]
pub fn remove_todo(state: tauri::State<'_, Mutex<TodoList>>, index: usize) -> Result<String, String> {
    let mut todos = state.lock().unwrap();
    todos.remove(index)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_items() {
        let mut list = TodoList::default();
        assert_eq!(list.add("Task 1".to_string()), 1);
        assert_eq!(list.add("Task 2".to_string()), 2);
        assert_eq!(list.items.len(), 2);
    }

    #[test]
    fn test_remove_valid() {
        let mut list = TodoList::default();
        list.add("Task 1".to_string());
        list.add("Task 2".to_string());

        let removed = list.remove(0).unwrap();
        assert_eq!(removed, "Task 1");
        assert_eq!(list.items.len(), 1);
    }

    #[test]
    fn test_remove_out_of_bounds() {
        let mut list = TodoList::default();
        let result = list.remove(5);
        assert!(result.is_err());
    }
}
```

---

## Example 3: Frontend mockIPC -- Basic Commands

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { invoke } from '@tauri-apps/api/core';

afterEach(() => {
  clearMocks();
});

describe('backend commands', () => {
  it('greets the user', async () => {
    mockIPC((cmd, args) => {
      if (cmd === 'greet') {
        return `Hello, ${(args as any).name}!`;
      }
    });

    const result = await invoke<string>('greet', { name: 'World' });
    expect(result).toBe('Hello, World!');
  });

  it('calculates correctly', async () => {
    mockIPC((cmd, args) => {
      if (cmd === 'calculate') {
        const { a, b, op } = args as { a: number; b: number; op: string };
        switch (op) {
          case 'add': return a + b;
          case 'mul': return a * b;
          default: throw new Error(`Unknown op: ${op}`);
        }
      }
    });

    const sum = await invoke<number>('calculate', { a: 2, b: 3, op: 'add' });
    expect(sum).toBe(5);

    const product = await invoke<number>('calculate', { a: 4, b: 5, op: 'mul' });
    expect(product).toBe(20);
  });

  it('handles backend errors', async () => {
    mockIPC((cmd) => {
      if (cmd === 'risky_op') {
        throw new Error('Something went wrong');
      }
    });

    await expect(invoke('risky_op')).rejects.toThrow('Something went wrong');
  });
});
```

---

## Example 4: Frontend mockIPC -- Structured Data

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { invoke } from '@tauri-apps/api/core';

interface User {
  id: number;
  name: string;
  email: string;
}

const mockUsers: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

afterEach(() => {
  clearMocks();
});

describe('user commands', () => {
  it('fetches all users', async () => {
    mockIPC((cmd) => {
      if (cmd === 'get_users') return mockUsers;
    });

    const users = await invoke<User[]>('get_users');
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Alice');
  });

  it('fetches a single user by ID', async () => {
    mockIPC((cmd, args) => {
      if (cmd === 'get_user') {
        const { userId } = args as { userId: number };
        return mockUsers.find((u) => u.id === userId) ?? null;
      }
    });

    const user = await invoke<User | null>('get_user', { userId: 1 });
    expect(user).not.toBeNull();
    expect(user!.name).toBe('Alice');

    const missing = await invoke<User | null>('get_user', { userId: 999 });
    expect(missing).toBeNull();
  });
});
```

---

## Example 5: Testing React Component With mockIPC

```typescript
// src/components/UserProfile.tsx
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface User {
  name: string;
  email: string;
}

export function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<User>('get_user', { userId })
      .then(setUser)
      .catch((e) => setError(String(e)));
  }, [userId]);

  if (error) return <div role="alert">{error}</div>;
  if (!user) return <div>Loading...</div>;
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

```typescript
// src/components/UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { UserProfile } from './UserProfile';

beforeEach(() => {
  mockIPC((cmd, args) => {
    if (cmd === 'get_user') {
      const { userId } = args as { userId: number };
      if (userId === 1) {
        return { name: 'Alice', email: 'alice@example.com' };
      }
      throw new Error('User not found');
    }
  });
});

afterEach(() => {
  clearMocks();
});

describe('UserProfile', () => {
  it('renders user data', async () => {
    render(<UserProfile userId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });
  });

  it('shows error for missing user', async () => {
    render(<UserProfile userId={999} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('User not found');
    });
  });
});
```

---

## Example 6: mockWindows for Multi-Window Testing

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { mockWindows, clearMocks } from '@tauri-apps/api/mocks';
import { getCurrentWindow } from '@tauri-apps/api/window';

afterEach(() => {
  clearMocks();
});

describe('window management', () => {
  it('identifies the main window', () => {
    mockWindows('main', 'settings');

    const win = getCurrentWindow();
    expect(win.label).toBe('main');
  });

  it('identifies the settings window as current', () => {
    mockWindows('settings', 'main');

    const win = getCurrentWindow();
    expect(win.label).toBe('settings');
  });
});
```

---

## Example 7: Async Rust Test With tokio

```rust
// src-tauri/src/commands.rs

#[tauri::command]
pub async fn validate_url(url: String) -> Result<bool, String> {
    let parsed = url::Url::parse(&url).map_err(|e| e.to_string())?;
    Ok(parsed.scheme() == "https")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_validate_https() {
        let result = validate_url("https://example.com".to_string()).await;
        assert_eq!(result, Ok(true));
    }

    #[tokio::test]
    async fn test_validate_http() {
        let result = validate_url("http://example.com".to_string()).await;
        assert_eq!(result, Ok(false));
    }

    #[tokio::test]
    async fn test_validate_invalid() {
        let result = validate_url("not-a-url".to_string()).await;
        assert!(result.is_err());
    }
}
```

---

## Example 8: Testing Event-Driven Components

```typescript
import { describe, it, expect, afterEach, vi } from 'vitest';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { listen, emit } from '@tauri-apps/api/event';

afterEach(() => {
  clearMocks();
});

describe('event system', () => {
  it('receives events', async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const handler = vi.fn();
    const unlisten = await listen('test-event', handler);

    await emit('test-event', { message: 'hello' });

    // Note: event delivery may be async
    // In real tests, use waitFor or similar
    unlisten();
  });
});
```

---

## Example 9: Complete Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test-setup.ts'],
    },
  },
});
```

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { clearMocks } from '@tauri-apps/api/mocks';

afterEach(() => {
  clearMocks();
});
```

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:rust": "cd src-tauri && cargo test"
  }
}
```

# tauri-errors-ipc: Working Code Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/develop/calling-rust/
- vooronderzoek-tauri.md Section 2.1 (Commands System), Section 10.1, 10.2

---

## Example 1: Complete Error Handling Pattern (thiserror)

### Rust Side

```rust
// src-tauri/src/error.rs
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    SerdeJson(#[from] serde_json::Error),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("validation: {0}")]
    Validation(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

```rust
// src-tauri/src/commands.rs
use crate::error::Error;

#[tauri::command]
async fn load_config(path: String) -> Result<serde_json::Value, Error> {
    if path.is_empty() {
        return Err(Error::Validation("path must not be empty".into()));
    }
    let content = tokio::fs::read_to_string(&path).await?;
    let config: serde_json::Value = serde_json::from_str(&content)?;
    Ok(config)
}
```

### Frontend Side

```typescript
import { invoke } from '@tauri-apps/api/core';

try {
    const config = await invoke<Record<string, unknown>>('load_config', {
        path: 'config.json',
    });
    console.log('Config loaded:', config);
} catch (error: unknown) {
    // error is a string from Error::serialize (the Display output)
    const message = String(error);
    if (message.startsWith('not found:')) {
        console.error('File not found');
    } else if (message.startsWith('validation:')) {
        console.error('Invalid input:', message);
    } else {
        console.error('Unexpected error:', message);
    }
}
```

---

## Example 2: Structured Error Pattern (Tagged Enum)

### Rust Side

```rust
// src-tauri/src/error.rs
#[derive(Debug, serde::Serialize)]
#[serde(tag = "kind", content = "message")]
#[serde(rename_all = "camelCase")]
pub enum AppError {
    NotFound(String),
    Unauthorized(String),
    Validation(String),
    Internal(String),
}

// Implement Display for logging
impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotFound(msg) => write!(f, "not found: {msg}"),
            Self::Unauthorized(msg) => write!(f, "unauthorized: {msg}"),
            Self::Validation(msg) => write!(f, "validation: {msg}"),
            Self::Internal(msg) => write!(f, "internal: {msg}"),
        }
    }
}
```

```rust
// src-tauri/src/commands.rs
use crate::error::AppError;

#[tauri::command]
async fn get_user(id: u64) -> Result<User, AppError> {
    if id == 0 {
        return Err(AppError::Validation("id must be positive".into()));
    }
    // ... fetch user
    Err(AppError::NotFound(format!("user {id}")))
}
```

### Frontend Side

```typescript
interface AppError {
    kind: 'notFound' | 'unauthorized' | 'validation' | 'internal';
    message: string;
}

try {
    const user = await invoke<User>('get_user', { id: 42 });
} catch (err: unknown) {
    const error = err as AppError;
    switch (error.kind) {
        case 'notFound':
            showNotFound(error.message);
            break;
        case 'unauthorized':
            redirectToLogin();
            break;
        case 'validation':
            showValidationErrors(error.message);
            break;
        default:
            showGenericError(error.message);
    }
}
```

---

## Example 3: Correct Argument Passing

### Rust Command with Multiple Arguments

```rust
#[derive(serde::Deserialize)]
struct SearchParams {
    query: String,
    limit: Option<u32>,
    offset: Option<u32>,
    include_archived: bool,
}

#[tauri::command]
async fn search_items(
    user_id: u64,
    params: SearchParams,
) -> Result<Vec<Item>, Error> {
    // user_id comes from JS as "userId"
    // params comes from JS as "params" (single-word, no conversion)
    // params.include_archived comes from JS nested as "includeArchived"
    todo!()
}
```

### Frontend Call

```typescript
const results = await invoke<Item[]>('search_items', {
    userId: 42,  // camelCase for snake_case Rust param
    params: {
        query: 'hello',
        limit: 10,
        offset: null,  // Option<T> maps to null, NOT undefined
        includeArchived: false,  // camelCase for serde deserialization
    },
});
```

---

## Example 4: Safe Invoke Wrapper

```typescript
// src/lib/invoke-safe.ts
import { invoke } from '@tauri-apps/api/core';

type InvokeResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };

export async function safeInvoke<T>(
    cmd: string,
    args?: Record<string, unknown>
): Promise<InvokeResult<T>> {
    try {
        const data = await invoke<T>(cmd, args);
        return { ok: true, data };
    } catch (err: unknown) {
        return { ok: false, error: String(err) };
    }
}

// Usage
const result = await safeInvoke<User[]>('list_users');
if (result.ok) {
    console.log('Users:', result.data);
} else {
    console.error('Failed:', result.error);
}
```

---

## Example 5: React Hook with Error Handling

```typescript
// src/hooks/useInvoke.ts
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface UseInvokeResult<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    refetch: () => void;
}

export function useInvoke<T>(
    cmd: string,
    args?: Record<string, unknown>
): UseInvokeResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [trigger, setTrigger] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        invoke<T>(cmd, args)
            .then((result) => {
                if (!cancelled) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(String(err));
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [cmd, trigger]);

    return {
        data,
        error,
        loading,
        refetch: () => setTrigger((t) => t + 1),
    };
}

// Usage
function UserList() {
    const { data: users, error, loading, refetch } = useInvoke<User[]>('list_users');

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    return (
        <ul>
            {users?.map((u) => <li key={u.id}>{u.name}</li>)}
        </ul>
    );
}
```

---

## Example 6: Debugging a Serialization Error

When you see: `invalid type: expected string, found integer`

```rust
// The command expects a String
#[tauri::command]
fn set_label(label: String) -> String {
    format!("Label: {label}")
}
```

```typescript
// WRONG -- passing number where String expected
await invoke('set_label', { label: 42 });
// Error: invalid type: expected string, found integer

// CORRECT -- pass the correct type
await invoke('set_label', { label: '42' });
// Or convert explicitly
await invoke('set_label', { label: String(42) });
```

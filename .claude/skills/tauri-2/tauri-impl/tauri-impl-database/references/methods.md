# tauri-impl-database: API Method Reference

Sources: https://v2.tauri.app/plugin/sql/, https://v2.tauri.app/plugin/store/,
https://docs.rs/sqlx/latest/sqlx/

---

## tauri-plugin-store API

### Eager Loading

```typescript
import { load } from '@tauri-apps/plugin-store';

// load(path: string, options?: StoreOptions): Promise<Store>
const store = await load('settings.json', { autoSave: true });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoSave` | `boolean` | `false` | Automatically save to disk after every `set`/`delete`/`clear` |

### Store Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `set` | `(key: string, value: unknown) => Promise<void>` | `void` | Set a key-value pair |
| `get` | `<T>(key: string) => Promise<T \| undefined>` | `T \| undefined` | Get value by key, `undefined` if missing |
| `has` | `(key: string) => Promise<boolean>` | `boolean` | Check if key exists |
| `delete` | `(key: string) => Promise<boolean>` | `boolean` | Delete a key, returns true if existed |
| `clear` | `() => Promise<void>` | `void` | Remove all entries |
| `keys` | `() => Promise<string[]>` | `string[]` | Get all keys |
| `values` | `() => Promise<unknown[]>` | `unknown[]` | Get all values |
| `entries` | `() => Promise<[string, unknown][]>` | `[string, unknown][]` | Get all key-value pairs |
| `length` | `() => Promise<number>` | `number` | Get number of entries |
| `save` | `() => Promise<void>` | `void` | Persist to disk (needed when `autoSave` is false) |
| `reload` | `() => Promise<void>` | `void` | Reload from disk, discarding in-memory state |
| `reset` | `() => Promise<void>` | `void` | Reset store to default values |

### Lazy Loading

```typescript
import { LazyStore } from '@tauri-apps/plugin-store';

// new LazyStore(path: string, options?: StoreOptions)
const store = new LazyStore('cache.json');
// Same methods as Store, but first call triggers disk load
```

---

## tauri-plugin-sql API

### Database Connection

```typescript
import Database from '@tauri-apps/plugin-sql';

// Database.load(path: string): Promise<Database>
const db = await Database.load('sqlite:app.db');
```

| Path Format | Database Type | Description |
|-------------|--------------|-------------|
| `sqlite:filename.db` | SQLite | File-based, resolved to app data dir |
| `sqlite::memory:` | SQLite | In-memory, lost on app close |

### Database Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `execute` | `(query: string, bindValues?: unknown[]) => Promise<QueryResult>` | `QueryResult` | Execute INSERT/UPDATE/DELETE |
| `select` | `<T>(query: string, bindValues?: unknown[]) => Promise<T[]>` | `T[]` | Execute SELECT query |
| `close` | `() => Promise<boolean>` | `boolean` | Close the database connection |

### QueryResult

| Property | Type | Description |
|----------|------|-------------|
| `rowsAffected` | `number` | Number of rows affected by the query |
| `lastInsertId` | `number` | ID of the last inserted row |

### Parameter Binding

Parameters use `$1`, `$2`, etc. for SQLite:

```typescript
await db.execute('INSERT INTO users (name, email) VALUES ($1, $2)', ['Alice', 'alice@example.com']);
const users = await db.select<User[]>('SELECT * FROM users WHERE id = $1', [1]);
```

---

## Rust Migration API (tauri-plugin-sql)

```rust
use tauri_plugin_sql::{Migration, MigrationKind};

// Migration struct
pub struct Migration {
    pub version: i32,           // Monotonically increasing version number
    pub description: &'static str,  // Human-readable description
    pub sql: &'static str,     // SQL to execute
    pub kind: MigrationKind,   // Up or Down
}

// MigrationKind enum
pub enum MigrationKind {
    Up,    // Applied when database is below this version
    Down,  // Applied when rolling back (not commonly used)
}
```

### Builder Methods

```rust
tauri_plugin_sql::Builder::default()
    .add_migrations("sqlite:app.db", migrations)  // Add migrations for a specific DB
    .build()                                        // Build the plugin
```

---

## sqlx API (Custom Database Pattern)

### Connection Pool

```rust
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

// Create pool
let pool = SqlitePoolOptions::new()
    .max_connections(5)           // Maximum concurrent connections
    .min_connections(1)           // Minimum idle connections
    .acquire_timeout(Duration::from_secs(30))  // Connection acquisition timeout
    .connect(&db_url)
    .await?;
```

### Query Execution

| Function | Signature | Returns | Use Case |
|----------|-----------|---------|----------|
| `sqlx::query(sql)` | `.bind(val).execute(&pool)` | `SqliteQueryResult` | INSERT/UPDATE/DELETE |
| `sqlx::query_as::<_, T>(sql)` | `.bind(val).fetch_all(&pool)` | `Vec<T>` | SELECT into struct |
| `sqlx::query_as::<_, T>(sql)` | `.bind(val).fetch_one(&pool)` | `T` | SELECT single row |
| `sqlx::query_as::<_, T>(sql)` | `.bind(val).fetch_optional(&pool)` | `Option<T>` | SELECT maybe row |

### SqliteQueryResult

| Method | Returns | Description |
|--------|---------|-------------|
| `.rows_affected()` | `u64` | Number of rows affected |
| `.last_insert_rowid()` | `i64` | Last inserted row ID |

### Error Type Pattern

```rust
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Custom(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

---

## Rust Plugin Registration

### Store Plugin

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
```

### SQL Plugin

```rust
tauri::Builder::default()
    .plugin(
        tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:app.db", migrations)
            .build(),
    )
```

### Database State Management

```rust
// State struct
pub struct DbState {
    pub pool: SqlitePool,
}

// Register in setup()
app.manage(DbState { pool });

// Access in commands
#[tauri::command]
async fn query(state: tauri::State<'_, DbState>) -> Result<Vec<Item>, Error> {
    let items = sqlx::query_as::<_, Item>("SELECT * FROM items")
        .fetch_all(&state.pool)
        .await?;
    Ok(items)
}
```

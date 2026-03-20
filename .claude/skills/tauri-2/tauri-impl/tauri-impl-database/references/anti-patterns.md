# tauri-impl-database: Anti-Patterns

These are confirmed error patterns for database integration in Tauri 2. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/plugin/sql/
- https://v2.tauri.app/plugin/store/
- vooronderzoek-tauri.md Section 10 (Common Mistakes & Anti-Patterns)

---

## AP-001: Creating Database Connections Inside Commands

**WHY this is wrong**: Each command invocation creates a new connection, exhausting the connection pool or file handles. Connection setup is expensive for SQLite.

```rust
// WRONG -- new connection per command call
#[tauri::command]
async fn get_items() -> Result<Vec<Item>, Error> {
    let pool = SqlitePool::connect("sqlite:app.db").await?;
    let items = sqlx::query_as::<_, Item>("SELECT * FROM items")
        .fetch_all(&pool)
        .await?;
    Ok(items)
}
```

```rust
// CORRECT -- shared pool via managed state
#[tauri::command]
async fn get_items(state: tauri::State<'_, DbState>) -> Result<Vec<Item>, Error> {
    let items = sqlx::query_as::<_, Item>("SELECT * FROM items")
        .fetch_all(&state.pool)
        .await?;
    Ok(items)
}
```

ALWAYS initialize the pool once in `setup()` and share via `app.manage()`.

---

## AP-002: Wrapping Database Pool in Arc

**WHY this is wrong**: Tauri already wraps managed state in `Arc`. `SqlitePool` is also internally `Arc`-wrapped. Adding another `Arc` is redundant overhead.

```rust
// WRONG -- double Arc wrapping
use std::sync::Arc;

pub struct DbState {
    pub pool: Arc<SqlitePool>,  // Unnecessary Arc
}

app.manage(Arc::new(DbState { pool }));  // Another unnecessary Arc
```

```rust
// CORRECT -- just use the pool directly
pub struct DbState {
    pub pool: SqlitePool,
}

app.manage(DbState { pool });
```

NEVER wrap managed state or `SqlitePool` in `Arc`.

---

## AP-003: Synchronous Database Commands

**WHY this is wrong**: Synchronous commands run on the main thread. Database I/O blocks the main thread, freezing the UI completely until the query completes.

```rust
// WRONG -- sync command blocks main thread
#[tauri::command]
fn get_count(state: tauri::State<'_, DbState>) -> i64 {
    // This blocks the main thread for the duration of the query
    tauri::async_runtime::block_on(async {
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM items")
            .fetch_one(&state.pool)
            .await
            .unwrap()
    })
}
```

```rust
// CORRECT -- async command runs on tokio runtime
#[tauri::command]
async fn get_count(state: tauri::State<'_, DbState>) -> Result<i64, Error> {
    let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM items")
        .fetch_one(&state.pool)
        .await?;
    Ok(count)
}
```

ALWAYS use `async` for all database commands.

---

## AP-004: SQL String Concatenation

**WHY this is wrong**: SQL injection vulnerability. User input can manipulate the query structure.

```typescript
// WRONG -- SQL injection vulnerability
const name = userInput;
await db.execute(`INSERT INTO users (name) VALUES ('${name}')`);
// If name = "'; DROP TABLE users; --" the table is deleted
```

```typescript
// CORRECT -- parameterized query
await db.execute('INSERT INTO users (name) VALUES ($1)', [userInput]);
```

ALWAYS use parameterized queries with `$1`, `$2`, etc. NEVER concatenate user input.

---

## AP-005: Using Store for Large or Binary Data

**WHY this is wrong**: `tauri-plugin-store` serializes everything as JSON. Large binary data becomes base64-encoded, massively increasing file size and slowing read/write operations.

```typescript
// WRONG -- binary data in store
const imageBytes = await readFile('photo.jpg');
await store.set('cachedImage', Array.from(imageBytes));  // Huge JSON array
```

```typescript
// CORRECT -- use filesystem for binary, store for metadata
import { writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';

await writeFile('cache/photo.jpg', imageBytes, {
  baseDir: BaseDirectory.AppCache,
});
await store.set('cachedImagePath', 'cache/photo.jpg');
```

NEVER store binary data in the key-value store. Use the filesystem plugin for files.

---

## AP-006: Not Handling Missing Store Values

**WHY this is wrong**: `store.get()` returns `undefined` for missing keys. Using the result without checking causes `TypeError` or unexpected behavior.

```typescript
// WRONG -- assumes value exists
const theme = await store.get<string>('theme');
document.body.className = theme;  // TypeError if theme is undefined
```

```typescript
// CORRECT -- provide fallback
const theme = await store.get<string>('theme') ?? 'system';
document.body.className = theme;
```

ALWAYS provide a fallback value when reading from the store.

---

## AP-007: Forgetting to Save Store (autoSave disabled)

**WHY this is wrong**: Without `autoSave`, changes exist only in memory. If the app exits before `save()`, all changes are lost.

```typescript
// WRONG -- changes lost on app exit
const store = await load('prefs.json');  // autoSave defaults to false
await store.set('theme', 'dark');
// App exits -- 'theme' was never persisted
```

```typescript
// CORRECT option 1: enable autoSave
const store = await load('prefs.json', { autoSave: true });
await store.set('theme', 'dark');  // Automatically saved

// CORRECT option 2: manual save
const store = await load('prefs.json');
await store.set('theme', 'dark');
await store.save();  // Explicitly persist
```

ALWAYS either enable `autoSave` or call `store.save()` after mutations.

---

## AP-008: Absolute Paths with tauri-plugin-sql

**WHY this is wrong**: The plugin resolves relative paths to the app data directory. Absolute paths bypass this and may fail on different platforms or violate security scopes.

```typescript
// WRONG -- absolute path
const db = await Database.load('sqlite:C:\\Users\\me\\data.db');
```

```typescript
// CORRECT -- relative path, resolved to app data directory
const db = await Database.load('sqlite:app.db');
```

NEVER use absolute file paths with `Database.load()`. Use a relative filename with the `sqlite:` prefix.

---

## AP-009: Not Creating the Database Directory

**WHY this is wrong**: On first launch, the app data directory may not exist. `sqlx::connect` fails if the parent directory is missing.

```rust
// WRONG -- assumes directory exists
.setup(|app| {
    let db_path = app.path().app_data_dir()?.join("data.db");
    let pool = tauri::async_runtime::block_on(async {
        SqlitePool::connect(&format!("sqlite:{}?mode=rwc", db_path.display())).await
    })?;
    app.manage(DbState { pool });
    Ok(())
})
```

```rust
// CORRECT -- create directory first
.setup(|app| {
    let db_path = app.path().app_data_dir()?.join("data.db");
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let pool = tauri::async_runtime::block_on(async {
        SqlitePool::connect(&format!("sqlite:{}?mode=rwc", db_path.display())).await
    })?;
    app.manage(DbState { pool });
    Ok(())
})
```

ALWAYS call `create_dir_all` on the parent directory before connecting.

---

## AP-010: Missing Permissions for Store or SQL Plugin

**WHY this is wrong**: In Tauri 2, all plugin APIs require explicit permissions. Without them, every API call throws a "command not allowed" runtime error.

```json
// WRONG -- no plugin permissions
{
  "permissions": ["core:default"]
}
```

```json
// CORRECT -- include plugin permissions
{
  "permissions": [
    "core:default",
    "store:default",
    "sql:default"
  ]
}
```

ALWAYS add the plugin's permission identifier to a capability file before using the plugin API.

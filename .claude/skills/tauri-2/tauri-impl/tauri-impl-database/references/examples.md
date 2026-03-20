# tauri-impl-database: Working Code Examples

All examples verified against official Tauri 2 plugin documentation:
- https://v2.tauri.app/plugin/sql/
- https://v2.tauri.app/plugin/store/

---

## Example 1: Settings Store with Eager Loading

```typescript
// src/lib/settings.ts
import { load } from '@tauri-apps/plugin-store';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
  sidebarCollapsed: boolean;
}

const DEFAULTS: AppSettings = {
  theme: 'system',
  language: 'en',
  fontSize: 14,
  sidebarCollapsed: false,
};

let store: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!store) {
    store = await load('settings.json', { autoSave: true });
  }
  return store;
}

export async function getSetting<K extends keyof AppSettings>(
  key: K
): Promise<AppSettings[K]> {
  const s = await getStore();
  const value = await s.get<AppSettings[K]>(key);
  return value ?? DEFAULTS[key];
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const s = await getStore();
  await s.set(key, value);
}

export async function resetSettings(): Promise<void> {
  const s = await getStore();
  await s.clear();
}
```

---

## Example 2: SQLite CRUD with tauri-plugin-sql

### Rust Setup

```rust
// src-tauri/src/lib.rs
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_notes_table",
            sql: "CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:notes.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Frontend CRUD

```typescript
// src/lib/notes-db.ts
import Database from '@tauri-apps/plugin-sql';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:notes.db');
  }
  return db;
}

export async function createNote(title: string, content: string): Promise<number> {
  const conn = await getDb();
  const result = await conn.execute(
    'INSERT INTO notes (title, content) VALUES ($1, $2)',
    [title, content]
  );
  return result.lastInsertId;
}

export async function getAllNotes(): Promise<Note[]> {
  const conn = await getDb();
  return await conn.select<Note[]>(
    'SELECT * FROM notes ORDER BY updated_at DESC'
  );
}

export async function getNote(id: number): Promise<Note | undefined> {
  const conn = await getDb();
  const results = await conn.select<Note[]>(
    'SELECT * FROM notes WHERE id = $1',
    [id]
  );
  return results[0];
}

export async function updateNote(id: number, title: string, content: string): Promise<void> {
  const conn = await getDb();
  await conn.execute(
    'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
    [title, content, id]
  );
}

export async function deleteNote(id: number): Promise<void> {
  const conn = await getDb();
  await conn.execute('DELETE FROM notes WHERE id = $1', [id]);
}

export async function searchNotes(query: string): Promise<Note[]> {
  const conn = await getDb();
  return await conn.select<Note[]>(
    'SELECT * FROM notes WHERE title LIKE $1 OR content LIKE $1 ORDER BY updated_at DESC',
    [`%${query}%`]
  );
}
```

---

## Example 3: Custom sqlx Database with Rust Commands

### Database Module

```rust
// src-tauri/src/db.rs
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::path::PathBuf;

pub struct DbState {
    pub pool: SqlitePool,
}

pub async fn init_db(db_path: PathBuf) -> Result<SqlitePool, sqlx::Error> {
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            done BOOLEAN NOT NULL DEFAULT 0,
            priority INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}
```

### Error Type

```rust
// src-tauri/src/error.rs
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("todo not found: {0}")]
    NotFound(i64),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

### Commands

```rust
// src-tauri/src/commands.rs
use crate::db::DbState;
use crate::error::Error;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Todo {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub done: bool,
    pub priority: i32,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateTodo {
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<i32>,
}

#[tauri::command]
pub async fn create_todo(
    state: tauri::State<'_, DbState>,
    input: CreateTodo,
) -> Result<Todo, Error> {
    let priority = input.priority.unwrap_or(0);
    let result = sqlx::query(
        "INSERT INTO todos (title, description, priority) VALUES (?, ?, ?)"
    )
    .bind(&input.title)
    .bind(&input.description)
    .bind(priority)
    .execute(&state.pool)
    .await?;

    let todo = sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE id = ?")
        .bind(result.last_insert_rowid())
        .fetch_one(&state.pool)
        .await?;

    Ok(todo)
}

#[tauri::command]
pub async fn list_todos(
    state: tauri::State<'_, DbState>,
    done_filter: Option<bool>,
) -> Result<Vec<Todo>, Error> {
    let todos = match done_filter {
        Some(done) => {
            sqlx::query_as::<_, Todo>(
                "SELECT * FROM todos WHERE done = ? ORDER BY priority DESC, created_at DESC"
            )
            .bind(done)
            .fetch_all(&state.pool)
            .await?
        }
        None => {
            sqlx::query_as::<_, Todo>(
                "SELECT * FROM todos ORDER BY priority DESC, created_at DESC"
            )
            .fetch_all(&state.pool)
            .await?
        }
    };
    Ok(todos)
}

#[tauri::command]
pub async fn toggle_todo(
    state: tauri::State<'_, DbState>,
    id: i64,
) -> Result<Todo, Error> {
    let rows = sqlx::query("UPDATE todos SET done = NOT done WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await?
        .rows_affected();

    if rows == 0 {
        return Err(Error::NotFound(id));
    }

    let todo = sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE id = ?")
        .bind(id)
        .fetch_one(&state.pool)
        .await?;

    Ok(todo)
}

#[tauri::command]
pub async fn delete_todo(
    state: tauri::State<'_, DbState>,
    id: i64,
) -> Result<(), Error> {
    let rows = sqlx::query("DELETE FROM todos WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await?
        .rows_affected();

    if rows == 0 {
        return Err(Error::NotFound(id));
    }
    Ok(())
}
```

### App Entry Point

```rust
// src-tauri/src/lib.rs
mod commands;
mod db;
mod error;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = app.path().app_data_dir()?.join("todos.db");
            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent)?;
            }

            let pool = tauri::async_runtime::block_on(async {
                db::init_db(db_path).await
            })?;

            app.manage(db::DbState { pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_todo,
            commands::list_todos,
            commands::toggle_todo,
            commands::delete_todo,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Frontend Integration

```typescript
// src/lib/todos.ts
import { invoke } from '@tauri-apps/api/core';

interface Todo {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  priority: number;
  created_at: string;
}

interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: number;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  return await invoke<Todo>('create_todo', { input });
}

export async function listTodos(doneFilter?: boolean): Promise<Todo[]> {
  return await invoke<Todo[]>('list_todos', { doneFilter: doneFilter ?? null });
}

export async function toggleTodo(id: number): Promise<Todo> {
  return await invoke<Todo>('toggle_todo', { id });
}

export async function deleteTodo(id: number): Promise<void> {
  await invoke('delete_todo', { id });
}
```

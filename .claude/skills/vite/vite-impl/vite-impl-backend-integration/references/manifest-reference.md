# Manifest Reference

## Manifest File Location

After running `vite build` with `build.manifest: true`, Vite generates:

```
<outDir>/.vite/manifest.json
```

Default location: `dist/.vite/manifest.json`

The manifest maps original source file paths to their hashed output counterparts.

---

## Manifest Type Definition

```typescript
import type { Manifest, ManifestChunk } from 'vite'
```

### Manifest Type

```typescript
// Record where keys are source file paths (e.g., "src/main.ts")
// and values are ManifestChunk objects
type Manifest = Record<string, ManifestChunk>
```

### ManifestChunk Interface

```typescript
interface ManifestChunk {
  /** Original source file path (e.g., "src/main.ts") */
  src?: string

  /** Hashed output file path (e.g., "assets/main-BRBmoGS9.js") */
  file: string

  /** CSS files associated with this chunk */
  css?: string[]

  /** Non-JS/CSS assets imported by this chunk */
  assets?: string[]

  /** true if this chunk is an entry point */
  isEntry?: boolean

  /** Short name of the chunk */
  name?: string

  /** true if this chunk is a dynamic import entry */
  isDynamicEntry?: boolean

  /** Keys into the manifest for statically imported chunks */
  imports?: string[]

  /** Keys into the manifest for dynamically imported chunks */
  dynamicImports?: string[]
}
```

---

## Example manifest.json

```json
{
  "_shared-B7PI925R.js": {
    "file": "assets/shared-B7PI925R.js",
    "name": "shared",
    "css": ["assets/shared-ChJ_j-JJ.css"]
  },
  "views/foo.js": {
    "file": "assets/foo-BRBmoGS9.js",
    "name": "foo",
    "src": "views/foo.js",
    "isEntry": true,
    "imports": ["_shared-B7PI925R.js"],
    "css": ["assets/foo-5UjPuW-k.css"]
  },
  "views/bar.js": {
    "file": "assets/bar-gkvgaI9m.js",
    "src": "views/bar.js",
    "isEntry": true,
    "imports": ["_shared-B7PI925R.js"],
    "dynamicImports": ["views/async-component.js"]
  },
  "views/async-component.js": {
    "file": "assets/async-component-Kcfm30Xz.js",
    "src": "views/async-component.js",
    "isDynamicEntry": true
  }
}
```

### Key Observations

- Chunks prefixed with `_` (e.g., `_shared-B7PI925R.js`) are shared/vendor chunks, NOT entry points
- Entry chunks have `isEntry: true` and a `src` property matching the original path
- The `imports` array contains keys into the same manifest object (NOT file paths)
- The `file` property is the actual hashed output path relative to `outDir`
- CSS can appear on both entry chunks AND shared chunks

---

## Manifest Traversal Algorithm

### Purpose

When rendering HTML for a given entry point, you MUST collect all CSS and JS from the entry chunk AND all its recursively imported chunks. The traversal algorithm handles:

1. Recursive import chain resolution
2. Deduplication via a `seen` Set (prevents infinite loops from shared chunks)
3. Bottom-up ordering (deepest imports first)

### TypeScript Implementation

```typescript
import type { Manifest, ManifestChunk } from 'vite'

/**
 * Recursively collects all imported chunks for a given manifest entry.
 * Returns chunks in dependency order (deepest first).
 *
 * @param manifest - The parsed .vite/manifest.json
 * @param name - The manifest key for the entry (e.g., "src/main.ts")
 * @returns Array of ManifestChunk objects for all transitive imports
 */
export default function importedChunks(
  manifest: Manifest,
  name: string,
): ManifestChunk[] {
  const seen = new Set<string>()

  function getImportedChunks(chunk: ManifestChunk): ManifestChunk[] {
    const chunks: ManifestChunk[] = []
    for (const file of chunk.imports ?? []) {
      const importee = manifest[file]
      if (seen.has(file)) continue
      seen.add(file)
      // Recurse FIRST to get deepest dependencies
      chunks.push(...getImportedChunks(importee))
      // Then add this chunk
      chunks.push(importee)
    }
    return chunks
  }

  return getImportedChunks(manifest[name])
}
```

### Usage Example

```typescript
import fs from 'node:fs'
import type { Manifest } from 'vite'
import importedChunks from './importedChunks'

const manifest: Manifest = JSON.parse(
  fs.readFileSync('dist/.vite/manifest.json', 'utf-8')
)

const entryName = 'src/main.ts'
const entry = manifest[entryName]
const imported = importedChunks(manifest, entryName)

// Collect all CSS: entry CSS + imported chunks' CSS
const cssFiles: string[] = [
  ...(entry.css ?? []),
  ...imported.flatMap((chunk) => chunk.css ?? []),
]

// Collect all imported JS for modulepreload
const preloadFiles: string[] = imported.map((chunk) => chunk.file)

// entry.file is the main script module
console.log('Entry JS:', entry.file)
console.log('CSS files:', cssFiles)
console.log('Preload files:', preloadFiles)
```

---

## Rendering HTML from Manifest

### Complete TypeScript Renderer

```typescript
import type { Manifest } from 'vite'
import importedChunks from './importedChunks'

export function renderViteAssets(
  manifest: Manifest,
  entryName: string,
  basePath: string = '/dist/',
): string {
  const entry = manifest[entryName]
  if (!entry) {
    throw new Error(`Manifest entry not found: ${entryName}`)
  }

  const imported = importedChunks(manifest, entryName)
  const tags: string[] = []

  // 1. Entry CSS
  for (const css of entry.css ?? []) {
    tags.push(`<link rel="stylesheet" href="${basePath}${css}" />`)
  }

  // 2. Imported chunks' CSS (recursive, deduplicated by traversal)
  for (const chunk of imported) {
    for (const css of chunk.css ?? []) {
      tags.push(`<link rel="stylesheet" href="${basePath}${css}" />`)
    }
  }

  // 3. Entry JS module
  tags.push(
    `<script type="module" src="${basePath}${entry.file}"></script>`
  )

  // 4. Modulepreload for imported JS chunks
  for (const chunk of imported) {
    tags.push(
      `<link rel="modulepreload" href="${basePath}${chunk.file}" />`
    )
  }

  return tags.join('\n')
}
```

### Output Example

Given the manifest above with entry `views/foo.js`:

```html
<link rel="stylesheet" href="/dist/assets/foo-5UjPuW-k.css" />
<link rel="stylesheet" href="/dist/assets/shared-ChJ_j-JJ.css" />
<script type="module" src="/dist/assets/foo-BRBmoGS9.js"></script>
<link rel="modulepreload" href="/dist/assets/shared-B7PI925R.js" />
```

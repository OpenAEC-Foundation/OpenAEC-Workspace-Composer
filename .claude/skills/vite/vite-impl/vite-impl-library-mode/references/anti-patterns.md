# Library Mode: Anti-Patterns

## AP-01: Bundling Peer Dependencies

**WRONG:**
```typescript
// vite.config.ts — NO external configuration
export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/index.ts'),
      name: 'MyLib',
    },
    // Missing: rolldownOptions.external
  },
})
```

**Problem:** React, Vue, or other framework code gets bundled INTO the library. Consumers end up with TWO copies of React — theirs and yours. This causes:
- `Invalid hook call` errors in React (hooks require single React instance)
- Doubled bundle size for consumers
- Version mismatches and runtime crashes

**CORRECT:**
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/index.ts'),
      name: 'MyLib',
    },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
```

ALWAYS externalize every package listed in `peerDependencies`.

---

## AP-02: Missing UMD name Property

**WRONG:**
```typescript
build: {
  lib: {
    entry: resolve(import.meta.dirname, 'lib/main.ts'),
    formats: ['es', 'umd'],
    // Missing: name
  },
}
```

**Problem:** UMD and IIFE formats REQUIRE a `name` property to define the global variable. The build will produce a warning or fail entirely.

**CORRECT:**
```typescript
build: {
  lib: {
    entry: resolve(import.meta.dirname, 'lib/main.ts'),
    name: 'MyLib',  // → window.MyLib
    formats: ['es', 'umd'],
  },
}
```

ALWAYS set `name` when formats include `umd` or `iife`.

---

## AP-03: Expecting CSS Auto-Injection

**WRONG assumption:** "Consumers will get my library's CSS automatically when they import my package."

```typescript
// Consumer code — CSS does NOT load automatically
import { Button } from 'my-lib'
// Button renders unstyled — CSS is in dist/my-lib.css but not imported
```

**Problem:** Vite library mode extracts CSS to a separate file. It is NEVER injected automatically into the consumer's page.

**CORRECT:**
```typescript
// Consumer MUST explicitly import CSS
import { Button } from 'my-lib'
import 'my-lib/style.css'  // Explicit CSS import
```

And the library's package.json MUST export the CSS:
```json
{
  "exports": {
    ".": { "import": "./dist/my-lib.js" },
    "./style.css": "./dist/my-lib.css"
  }
}
```

---

## AP-04: Using assetsDir in Library Mode

**WRONG:**
```typescript
build: {
  assetsDir: 'assets',
  lib: {
    entry: resolve(import.meta.dirname, 'lib/main.ts'),
  },
}
```

**Problem:** `build.assetsDir` has NO effect in library mode. Assets are placed alongside output files in the output directory root, not in a subdirectory.

**CORRECT:** Do not set `assetsDir` for library builds. Accept that output goes to the root of `outDir`.

---

## AP-05: Missing exports Field in package.json

**WRONG:**
```json
{
  "name": "my-lib",
  "main": "./dist/my-lib.umd.cjs",
  "module": "./dist/my-lib.js"
}
```

**Problem:** Modern bundlers and Node.js 12.7+ use the `exports` field for module resolution. Without it:
- TypeScript cannot find type definitions
- Conditional imports (ESM vs CJS) do not work reliably
- Subpath exports (e.g., `my-lib/utils`) are inaccessible

**CORRECT:**
```json
{
  "name": "my-lib",
  "type": "module",
  "main": "./dist/my-lib.umd.cjs",
  "module": "./dist/my-lib.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.umd.cjs"
    }
  }
}
```

ALWAYS include the `exports` field. Keep `main` and `module` for backward compatibility.

---

## AP-06: Wrong types Order in Exports

**WRONG:**
```json
{
  "exports": {
    ".": {
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

**Problem:** TypeScript resolves conditions top-down. If `"import"` appears before `"types"`, TypeScript may resolve to the JS file instead of the declaration file.

**CORRECT:**
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.cjs"
    }
  }
}
```

ALWAYS put `"types"` as the FIRST condition in every exports entry.

---

## AP-07: Forgetting type: "module"

**WRONG:**
```json
{
  "name": "my-lib",
  "exports": {
    ".": {
      "import": "./dist/my-lib.js"
    }
  }
}
```

**Problem:** Without `"type": "module"`, Node.js treats `.js` files as CommonJS. Your ESM output file with `import`/`export` syntax will fail with `SyntaxError: Unexpected token 'export'`.

**CORRECT:**
```json
{
  "name": "my-lib",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/my-lib.js"
    }
  }
}
```

ALWAYS set `"type": "module"` for ESM-first packages.

---

## AP-08: Using rollupOptions in Vite 8.x (or rolldownOptions in Vite 6.x)

**WRONG (Vite 8.x):**
```typescript
build: {
  rollupOptions: {  // WRONG — Vite 8.x uses Rolldown, not Rollup
    external: ['vue'],
  },
}
```

**WRONG (Vite 6.x/7.x):**
```typescript
build: {
  rolldownOptions: {  // WRONG — Vite 6.x/7.x uses Rollup
    external: ['vue'],
  },
}
```

**Problem:** Using the wrong option name means externals are silently IGNORED. Dependencies get bundled into your library without any error.

**CORRECT:** Check the Vite version and use the matching option:
- Vite 6.x / 7.x → `rollupOptions`
- Vite 8.x → `rolldownOptions`

---

## AP-09: Not Generating TypeScript Declarations

**WRONG:** Publishing a TypeScript library without `.d.ts` files.

**Problem:** Consumers using TypeScript get no type information. They must create custom type declarations or use `// @ts-ignore` everywhere.

**CORRECT:**
```bash
npm add -D vite-plugin-dts
```

```typescript
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/index.ts'),
    },
  },
})
```

ALWAYS generate `.d.ts` files for TypeScript libraries. Include `"types"` in package.json exports.

---

## AP-10: Including devDependencies in Library Output

**WRONG:** Importing testing utilities, build tools, or dev-only packages in library source code.

```typescript
// lib/utils.ts — DO NOT import dev dependencies in library source
import { render } from '@testing-library/react'  // devDependency!
```

**Problem:** If the import is not externalized, the dev dependency gets bundled. If it IS externalized, consumers must install YOUR dev dependency.

**CORRECT:** NEVER import devDependencies in library source files. Keep test utilities, linters, and build tools out of `lib/` source code entirely.

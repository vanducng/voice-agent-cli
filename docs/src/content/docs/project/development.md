---
title: Development
description: Local setup, tests, build, and documentation workflow
---

The root `package.json` requires Node.js 22 or newer. Runtime code is strict TypeScript, bundled with esbuild, and tested with colocated Vitest files.

## Setup and validation

```bash
npm ci
npm run format:check
npm run typecheck
npm test
npm run build
npm run test:package
```

`npm run test:package` packs the project, installs the tarball into an isolated prefix, checks both binaries, compares help output, and validates structured failures. The read-only live provider check is separate and requires a real key:

```bash
RETELL_API_KEY=your_api_key npm run test:live:retell
```

## Change workflow

1. Read the command registration, implementation, callers, and colocated tests.
2. Add or update the smallest test that proves the behavior.
3. Keep provider-specific code below `src/providers/<provider>/`.
4. Run the focused test, full test suite, typecheck, build, and format check.
5. For package changes, run `npm run test:package` and inspect `npm pack --dry-run`.

## Documentation

The Starlight site is a separate npm project:

```bash
npm ci --prefix docs
npm run build --prefix docs
```

Content lives below `docs/src/content/docs/`. Navigation lives in `docs/astro.config.mjs`. Verify command examples against generated `--help`, code references against the current tree, and internal links with the docs build.

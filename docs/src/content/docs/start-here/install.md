---
title: Install and run
description: Install Voice Agent CLI from npm or run the current source checkout
---

Voice Agent CLI requires Node.js 22 or newer. The package name is `voice-agent-cli`, `vac` is the canonical binary, and `voice-agent` is an equivalent alias. These values come from the root `package.json`.

## Install from npm

```bash
npm install --global voice-agent-cli
vac --version
vac retell --help
```

Both binaries point to the same CLI. If `vac` conflicts with another command on your system, use `voice-agent`.

## Upgrade

```bash
vac upgrade
```

The command uses the active npm installation to install `voice-agent-cli@latest`. It returns structured JSON with the previous version and a verification command. If npm fails, the error includes the direct npm command and environment checks to run next.

## Run from source

```bash
npm ci
npm run build
npm link
vac --help
vac retell --help
```

`npm link` installs both binary names from the same `dist/index.js` entrypoint. See [Package and release](../../project/release/) for the automated release flow.

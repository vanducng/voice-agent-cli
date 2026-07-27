---
title: Install and run
description: Run Voice Agent CLI from the current source checkout
---

Voice Agent CLI requires Node.js 22 or newer. The package name is `voice-agent-cli`, `vac` is the canonical binary, and `voice-agent` is an equivalent alias. These values come from the root `package.json`.

## Current installation

The npm package is not published yet. Run the current checkout from source:

```bash
npm ci
npm run build
npm link
vac --help
vac retell --help
```

`npm link` installs both binary names from the same `dist/index.js` entrypoint. If `vac` conflicts with another command on your system, use `voice-agent`.

## Future npm installation

After the first npm release is verified, installation will be:

```bash
npm install --global voice-agent-cli
vac --help
```

This is the planned registry command, not a claim that the package is available today. See [Package and release](../../project/release/) for the bootstrap requirements.

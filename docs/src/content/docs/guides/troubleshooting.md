---
title: Troubleshooting
description: Resolve common installation, authentication, prompt, and shell failures
---

## `vac` is not found

The npm package is not published yet. Build and link the current checkout:

```bash
npm ci
npm run build
npm link
vac --help
```

If another installed program already owns `vac`, use the equivalent `voice-agent` alias.

## Authentication fails

Verify the key in the same process that runs the command:

```bash
RETELL_API_KEY=your_api_key vac retell agents list --limit 1
```

The CLI does not automatically load the repository `.env`. Export it in your shell, use Node's environment-file support in your own wrapper, or run `vac retell login`.

## Configuration is invalid

The current schema nests Retell below `providers`. Fix or remove the path reported in the structured error, then run `vac retell login` to write a valid file. See [Configuration](../../reference/configuration/).

## Prompt directory is missing

Pull the prompts before diffing or updating:

```bash
vac retell prompts pull agent_123
```

The default agent directory is `.voice-agent/retell/prompts/agent_123/`. Custom `--output` and `--source` values are base directories, not JSON files.

## A command or flag is rejected

Help is available at every level:

```bash
vac retell --help
vac retell calls update-live --help
```

CLI usage errors are JSON on stderr. The `next_steps` entry names the closest help command.

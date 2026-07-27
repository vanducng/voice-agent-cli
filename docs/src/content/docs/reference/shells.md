---
title: Shells
description: Quote JSON and environment variables safely across common shells
---

The CLI receives JSON as one argument. Quote it for the current shell or use `@path` where the command advertises that syntax.

## Bash and Zsh

```bash
export RETELL_API_KEY=your_api_key
vac retell calls update call_123 \
  --metadata '{"case_id":"case_456"}'
```

## Fish

```fish
set -x RETELL_API_KEY your_api_key
vac retell calls update call_123 \
  --metadata '{"case_id":"case_456"}'
```

## PowerShell

```powershell
$env:RETELL_API_KEY = "your_api_key"
vac retell calls update call_123 `
  --metadata '{"case_id":"case_456"}'
```

For larger payloads, keep JSON in a file:

```bash
vac retell calls update call_123 --metadata @metadata.json
```

Human-readable `--help` and `--version` output can go directly to the terminal. Normal provider data is JSON on stdout and structured failures are JSON on stderr.

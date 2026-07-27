---
title: Quick start
description: Authenticate and inspect Retell resources
---

Retell is the only provider currently registered by `src/providers/retell/register.ts`.

## Authenticate

Use an environment variable for automation:

```bash
export RETELL_API_KEY=your_api_key
vac retell agents list --limit 1
```

Or save a provider-scoped configuration interactively:

```bash
vac retell login
```

The login command writes the global XDG configuration by default. Use `vac retell login --local` to write `./.voice-agent.json` instead.

## Discover commands

```bash
vac retell --help
vac retell agents --help
vac retell calls --help
vac retell prompts --help
```

Command output is JSON by default. Filter large resource payloads with `--fields` where the command exposes it:

```bash
vac retell agents list --fields agent_id,agent_name,channel
vac retell transcripts list --limit 10 --fields call_id,call_status
```

Continue with [Configuration](../../reference/configuration/) or the [Prompt workflow](../../guides/prompts/).

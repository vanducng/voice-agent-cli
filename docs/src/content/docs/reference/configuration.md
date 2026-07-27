---
title: Configuration
description: Retell authentication schema, paths, and precedence
---

`RETELL_API_KEY` has the highest precedence:

```bash
export RETELL_API_KEY=your_api_key
vac retell agents list --limit 1
```

For saved credentials, run:

```bash
vac retell login          # global XDG path
vac retell login --local  # ./.voice-agent.json
```

`vac retell login` requires an interactive TTY and masks the API key while it is entered. Non-interactive automation should set `RETELL_API_KEY` instead.

New writes use mode `0600` and this provider-scoped schema:

```json
{
  "providers": {
    "retell": {
      "apiKey": "your_api_key",
      "defaultFormat": "json"
    }
  }
}
```

## Resolution order

`src/providers/retell/services/config.ts` reads:

1. `RETELL_API_KEY`
2. `./.voice-agent.json`
3. `$XDG_CONFIG_HOME/voice-agent/config.json`, or `~/.config/voice-agent/config.json` when XDG is unset
4. `./.retellrc.json`
5. `~/.retellrc.json`
6. `$XDG_CONFIG_HOME/retell/config.json`, with the same home fallback

The last three are read-only legacy fallbacks. The legacy flat `{ "apiKey": "...", "defaultFormat": "json" }` schema is also read but never written back.

The CLI does not automatically load `.env`. Export the variable into the command process or use `vac retell login`.

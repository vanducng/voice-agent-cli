---
title: Automation
description: Use Voice Agent CLI from scripts and coding agents
---

Prefer `RETELL_API_KEY` in CI and short-lived automation. Do not print the key, `.env`, or saved config files.

```bash
result="$(vac retell agents list --fields agent_id,agent_name)"
printf '%s\n' "$result" | jq '.items[]'
```

Use the CLI as a JSON boundary:

- Read stdout only when the exit status is zero.
- Parse stderr as the structured error shape documented in [Output contract](../../core-concepts/output/).
- Retry only when `error.retryable` is `true`.
- Use `--fields` to reduce output when a command supports it.
- Run `vac retell <group> --help` instead of assuming CRUD symmetry.

For mutation workflows, inspect before editing, use `--dry-run` where available, and publish drafts explicitly:

```bash
vac retell prompts diff agent_123
vac retell prompts update agent_123 --dry-run
vac retell prompts update agent_123
vac retell agents publish agent_123
```

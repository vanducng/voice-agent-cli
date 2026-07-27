---
name: voice-agent-cli
description: Operate Voice Agent CLI through the `vac` or `voice-agent` binary. Use when an agent needs to install or upgrade the CLI, authenticate a provider, discover commands, inspect or mutate Retell resources, automate JSON output, follow structured error recovery, or verify CLI behavior safely.
---

# Voice Agent CLI

Use `vac` as the canonical binary. Treat generated help and structured responses as the runtime contract.

## Start safely

1. Confirm the binary and version:

   ```bash
   command -v vac
   vac --version
   ```

2. Install or upgrade only when needed:

   ```bash
   npm install --global voice-agent-cli
   vac upgrade
   ```

3. Discover the exact command before acting:

   ```bash
   vac retell --help
   vac retell agents --help
   vac retell agents list --help
   ```

Do not assume every resource has symmetric CRUD commands or identical flags.

## Authenticate without exposing secrets

For automation, provide `RETELL_API_KEY` in the command environment. For interactive use, run `vac retell login` or `vac retell login --local`.

The CLI does not load `.env` automatically. Never print, read back, or commit `.env` or saved configuration files. Verify access with a bounded read:

```bash
vac retell agents list --limit 1 --fields agent_id,agent_name
```

## Use the JSON contract

- Parse stdout only when the command exits successfully.
- Parse failures from stderr as `{ "ok": false, "error": { ... } }`.
- Branch on `error.code`.
- Retry only when `error.retryable` is `true`.
- Follow `error.next_steps` in order instead of inventing recovery commands.
- Use `--fields` to keep agent context small when the command supports it.
- Preserve `items`, `pagination_key`, and `has_more` on current list responses.

Example:

```bash
vac retell agents list --limit 25 --fields agent_id,agent_name | jq '.items'
```

`--help` and `--version` are human-readable discovery output, not JSON data.

## Choose the workflow

### Inspect resources

Start with the smallest list request, capture exact IDs, then retrieve the selected resource. Continue with `pagination_key` when `has_more` is true.

### Change resources

1. Retrieve the current resource and save the exact ID and version.
2. Read the target command's help.
3. Prefer a file or `@path` JSON input when supported.
4. Run `--dry-run` when available.
5. Apply the smallest requested mutation.
6. Retrieve the resource again and verify the changed fields.

Do not create, call, publish, update, or delete live resources unless the user explicitly authorizes that operation.

### Update prompts

Use the guarded pull, diff, update, publish sequence:

```bash
vac retell prompts pull agent_123
vac retell prompts diff agent_123
vac retell prompts update agent_123 --dry-run
vac retell prompts update agent_123
vac retell agents publish agent_123 --version 4
```

Publishing is a separate action. Pass an explicit draft version when it is known.

### Update an ongoing call

Use `calls update-live` only for an ongoing call. The command currently exposes dynamic-variable overrides and returns `{ "success": true }`:

```bash
vac retell calls update-live call_123 --dynamic-variables '{"customer_tier":"gold"}'
```

Use the regular call update command only for its documented persisted fields.

## Handle failures for another agent

Report the command category, `error.code`, safe message, retryability, and ordered `next_steps`. Never include secret values or entire configuration files. If the CLI rejects a flag or command, run the nearest `--help` command and correct the invocation from that output.

## Verify completion

Provide evidence from a final read-only retrieval or list call. State the affected resource ID and version when applicable, the command exit status, and the safe response fields that prove the result. For repository changes, also run the project's typecheck, tests, package smoke, and relevant live read-only smoke test.

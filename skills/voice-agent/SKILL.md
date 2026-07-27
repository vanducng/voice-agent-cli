---
name: voice-agent
description: Operate Voice Agent CLI through the `vac` or `voice-agent` binary. Use when an agent needs to install or upgrade the CLI, authenticate a provider, discover commands, inspect or mutate Retell resources, automate JSON output, follow structured error recovery, or verify CLI behavior safely.
---

# Voice Agent

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

## Authenticate with saved login

Use the login-managed configuration as the default authentication path. Start with a bounded read:

```bash
vac retell agents list --limit 1 --fields agent_id,agent_name
```

If it fails with `NO_CONFIG`, ask the user to run this in their interactive terminal:

```bash
vac retell login
```

Login requires a TTY, prompts securely, and stores the key in `$XDG_CONFIG_HOME/voice-agent/config.json`, falling back to `~/.config/voice-agent/config.json`. After the user completes login, retry the bounded read. Do not run interactive login from a non-interactive agent shell, inspect `.env`, ask the user to expose a key, or read the saved configuration back.

For `AUTH_ERROR`, check only credential-source presence, never values. If `RETELL_API_KEY` is set, ask the user to unset or replace it because it overrides saved credentials. Otherwise, if `./.voice-agent.json` exists, ask the user to refresh it with `vac retell login --local` or remove it after confirming directory scope because it overrides global login. If neither is present, ask the user to rerun `vac retell login` in their interactive terminal. Then retry the bounded read.

Use `vac retell login --local` only when the user explicitly wants directory-scoped credentials. Use `RETELL_API_KEY` only for CI or another non-interactive environment where login cannot prompt. Never print, read back, or commit secrets or saved configuration files.

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

Retrieve the call and confirm it is ongoing before using `calls update-live`. The command accepts dynamic-variable overrides, metadata, data-storage settings, additional context, and an immediate response trigger:

```bash
vac retell calls update-live call_123 \
  --dynamic-variables '{"customer_tier":"gold"}' \
  --additional-context "The customer has completed verification." \
  --trigger-response
```

Dynamic-variable values must be strings; `null` clears the override. Use the regular call update command only for an ended call and its documented persisted fields. Retrieve the call again to verify changes when the API exposes them.

### Rerun analysis

Rerun analysis only for a completed call or chat after explicit authorization:

```bash
vac retell calls rerun-analysis call_123
vac retell chats rerun-analysis chat_123
```

Retrieve the resource before and after the mutation. Do not automatically retry either command because rerunning analysis can replace results and incur work.

## Handle failures for another agent

Report the command category, `error.code`, safe message, retryability, and ordered `next_steps`. Never include secret values or entire configuration files. If the CLI rejects a flag or command, run the nearest `--help` command and correct the invocation from that output.

## Verify completion

Provide evidence from a final read-only retrieval or list call. State the affected resource ID and version when applicable, the command exit status, and the safe response fields that prove the result. For repository changes, also run the project's typecheck, tests, package smoke, and relevant live read-only smoke test.

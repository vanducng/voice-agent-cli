---
title: Retell
description: Current provider coverage and SDK boundary
---

Retell is the first provider. The integration is built on the official `retell-sdk`, pinned exactly to `6.0.1` in the root `package.json` and `package-lock.json` as of 2026-09-29. Twilio is documented separately.

The `vac retell` namespace covers:

| Area               | Command groups                                                  |
| ------------------ | --------------------------------------------------------------- |
| Authentication     | `login`                                                         |
| Agents and prompts | `agents`, `agent`, `agent-publish`, `prompts`, `tools`, `tests` |
| Calls              | `calls`, `transcripts`, `batch-calls`, `exports`, `concurrency` |
| Response engines   | `llms`, `flows`, `flow-components`                              |
| Chat               | `chat-agents`, `chats`, `playground`                            |
| Other resources    | `phone-numbers`, `voices`, `kb`                                 |

Use generated help for the exact operations and flags because command groups do not share a universal CRUD surface:

```bash
vac retell --help
vac retell phone-numbers --help
```

Most commands use the SDK client in `src/providers/retell/services/retell-client.ts`. Live-call updates and agent environment tags use the same authenticated client with explicit Retell HTTP paths because those operations are not exposed through the pinned SDK's resource helpers.

Inspect and assign environment tags through the agent namespace:

```bash
vac retell agents tags get agent_123 prod
vac retell agents tags assign agent_123 prod --agent-version 4 --dry-run
vac retell agents tags assign agent_123 prod --agent-version 4
vac retell agents tags assign agent_123 staging \
  --dynamic-variables '{"base_url":"https://staging.example.com"}' \
  --dry-run
```

The assignment command requires an existing tag. `--agent-version` moves it. Dynamic-variable flags merge into the selected tag unless `--replace` is set, and the other tags stay as they are. `PATCH /update-agent-root/{agent_id}` sends the complete tag map. The command verifies the selected tag after the update. Secret-looking variable names are masked in command output. Moving `prod`, or changing variables on a tag that traffic uses, takes effect immediately.

Phone-number bindings can resolve through a tag instead of a fixed numeric version:

```bash
vac retell phone-numbers update +14157774444 \
  --inbound-agent agent_123 \
  --inbound-agent-version prod
```

The paired outbound flags are `--outbound-agent` and `--outbound-agent-version`. Read the number before and after the update because replacing a single-agent binding is an immediate routing change.

Read [API compatibility](./compatibility/) before updating the SDK or sending raw Retell payloads.

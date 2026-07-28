---
title: Retell
description: Current provider coverage and SDK boundary
---

Retell is the first and only provider implemented today. The integration is built on the official `retell-sdk`, pinned exactly to `5.48.0` in the root `package.json` and `package-lock.json` as of 2026-07-27.

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
```

The assignment command requires an existing tag and version, preserves the complete tag map and dynamic variables, and verifies the selected tag after the update. Moving `prod` changes production traffic immediately.

Read [API compatibility](./compatibility/) before updating the SDK or sending raw Retell payloads.

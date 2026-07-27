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

Most commands use the SDK client in `src/providers/retell/services/retell-client.ts`. The live-call update uses the same authenticated client with an explicit Retell HTTP path because the required operation is not exposed through the pinned SDK's resource helper.

Read [API compatibility](./compatibility/) before updating the SDK or sending raw Retell payloads.

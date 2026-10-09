---
title: Provider model
description: How Voice Agent CLI isolates provider-specific behavior
---

The root CLI is provider-neutral, while every integration owns its commands, services, and types. Today the root registers one utility command and two provider namespaces:

```text
vac
├── upgrade
├── retell
└── twilio
```

The boundary is concrete:

| Path                    | Responsibility                                                 |
| ----------------------- | -------------------------------------------------------------- |
| `src/cli.ts`            | Defines `vac` and registers root commands and providers        |
| `src/commands/`         | Provider-neutral user commands such as self-upgrade            |
| `src/core/`             | Provider-neutral parsing, pagination, and error helpers        |
| `src/providers/retell/` | Retell commands, configuration, SDK access, prompts, and types |
| `src/providers/twilio/` | Twilio numbers, trunks, calls, messages, alerts, configuration, and SDK access |

`src/architecture.test.ts` fails if a `retell-sdk` import appears outside `src/providers/retell/`, or if a `twilio` import appears outside `src/providers/twilio/`.

There is no runtime plugin system. A provider adds `src/providers/<name>/` and explicit registration in `src/cli.ts`. Both providers share the config document writer in `src/core/provider-config-document.ts` and the structured error reporter in `src/core/cli-response.ts`. Each provider still owns its SDK client and resource commands.

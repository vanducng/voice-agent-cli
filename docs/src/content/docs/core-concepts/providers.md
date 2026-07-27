---
title: Provider model
description: How Voice Agent CLI isolates provider-specific behavior
---

The root CLI is provider-neutral, while every integration owns its commands, services, and types. Today the root registers one namespace:

```text
vac
└── retell
```

The boundary is concrete:

| Path                    | Responsibility                                                 |
| ----------------------- | -------------------------------------------------------------- |
| `src/cli.ts`            | Defines `vac` and registers providers                          |
| `src/core/`             | Provider-neutral parsing, pagination, and error helpers        |
| `src/providers/retell/` | Retell commands, configuration, SDK access, prompts, and types |

`src/architecture.test.ts` fails if a `retell-sdk` import appears outside `src/providers/retell/`.

There is no runtime plugin system, provider interface, or second provider. A future provider should add its own `src/providers/<name>/` module and explicit root registration. Shared abstractions should wait until two real providers expose the same behavior.

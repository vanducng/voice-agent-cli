---
title: System architecture
description: Process flow, module boundaries, configuration, and local persistence
---

Voice Agent CLI is a single-process Node.js command line application. The shell is provider-neutral and integrations are provider-owned. Retell and Twilio are the current providers.

```text
process argv
    |
    v
src/index.ts
    |
    v
src/cli.ts  -> vac, root commands, and provider registration
    |
    +--> src/commands/upgrade.ts -> npm
    |
    +--> src/providers/retell/register.ts
    |
    +--> src/providers/twilio/register.ts
    |
    v
provider command -> provider service -> provider SDK or explicit provider path
    |
    v
JSON stdout or structured JSON stderr
```

## Boundaries

| Module                           | Owns                                                      | Excludes                                  |
| -------------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| `src/commands/`                  | Provider-neutral user commands                            | Provider credentials and resources        |
| `src/core/`                      | Generic JSON, numeric flag, pagination, and error helpers | Retell SDK imports and resource semantics |
| `src/providers/retell/commands/` | Retell command registration and actions                   | Root provider selection                   |
| `src/providers/retell/services/` | Config, SDK client, prompts, output, and Retell helpers   | Other providers                           |
| `src/providers/retell/types/`    | Retell request and response types                         | Shared provider abstractions              |
| `src/providers/twilio/`          | Twilio commands, credentials, and SDK access              | Retell resources and other providers      |

`src/architecture.test.ts` enforces each provider SDK import boundary. `src/cli.test.ts` checks `upgrade`, `retell`, and `twilio`, and verifies every registered group.

## Request flow

Most provider commands obtain the singleton from `src/providers/retell/services/retell-client.ts`. It resolves credentials, then creates `retell-sdk` with two retries and a 60-second timeout. The same client can send an explicit authenticated path for an operation outside the SDK resource helpers, as `src/providers/retell/commands/calls/update-live.ts` does.

Inputs cross provider-neutral parsers where appropriate. Outputs pass through `src/providers/retell/services/output-formatter.ts`, which preserves successful provider JSON and maps failures to the shared structured error contract.

## Local state

The CLI can write three kinds of local state:

- Provider-scoped authentication config from `src/providers/retell/services/config.ts` and `src/providers/twilio/services/config.ts`. Both write `providers.<name>` in the same file and leave the other provider in place.
- Pulled prompt directories from `src/providers/retell/commands/prompts/pull.ts`.
- Optional tool-export JSON files from `src/providers/retell/commands/tools/export.ts` when `--output` is provided.

Prompt updates change a remote draft. Publishing is an explicit separate command. There is no database, daemon, or runtime plugin registry in this repository.

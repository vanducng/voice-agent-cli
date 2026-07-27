---
title: Command reference
description: Current provider and resource command groups
---

The root command exposes one provider-neutral utility and one provider namespace:

```text
vac [--help] [--version]
├── upgrade
└── retell [--json]
```

`vac upgrade` installs the latest stable `voice-agent-cli` release through the active npm installation and returns structured verification guidance.

`src/providers/retell/register.ts` registers the current command groups:

| Group             | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `login`           | Save Retell credentials                                          |
| `agents`          | List, inspect, create, version, publish, and delete voice agents |
| `agent`           | Get or update full voice-agent configuration                     |
| `agent-publish`   | Compatibility alias for publishing a voice-agent draft           |
| `prompts`         | Pull, diff, and update prompt directories                        |
| `tools`           | Manage agent tools and import/export tool JSON                   |
| `tests`           | Manage cases, batches, and runs                                  |
| `calls`           | Create, register, update, stop, and delete calls                 |
| `transcripts`     | List, get, search, and analyze call records                      |
| `batch-calls`     | Schedule bulk outbound calls                                     |
| `exports`         | List export requests                                             |
| `concurrency`     | Inspect organization call concurrency                            |
| `llms`            | Manage Retell LLM response engines                               |
| `flows`           | Manage conversation flows                                        |
| `flow-components` | Manage reusable flow components                                  |
| `chat-agents`     | Manage and publish chat agents                                   |
| `chats`           | Manage chat sessions and completions                             |
| `playground`      | Run stateless playground completions                             |
| `phone-numbers`   | Purchase, import, bind, update, and release numbers              |
| `voices`          | List, search, clone, and add voice resources                     |
| `kb`              | Manage knowledge bases and sources                               |

Generated help is the exact reference for subcommands, required arguments, and flags:

```bash
vac retell --help
vac retell agents --help
vac retell agents list --help
```

Most read commands expose `--fields <fields>` for comma-separated projection. JSON input flags either name a JSON file explicitly or state that they accept inline JSON and `@path` syntax. Do not assume those forms are interchangeable unless help lists them.

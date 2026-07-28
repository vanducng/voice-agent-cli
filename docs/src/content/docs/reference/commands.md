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
| `agents`          | List, inspect, create, version, tag, publish, and delete voice agents |
| `agent`           | Get or update full voice-agent configuration                     |
| `agent-publish`   | Compatibility alias for publishing a voice-agent draft           |
| `prompts`         | Pull, diff, and update prompt directories                        |
| `tools`           | Manage agent tools and import/export tool JSON                   |
| `tests`           | Manage cases, batches, and runs                                  |
| `calls`           | Create, update, control, rerun analysis, stop, and delete calls |
| `transcripts`     | List, get, search, and analyze call records                      |
| `batch-calls`     | Schedule bulk outbound calls                                     |
| `exports`         | List export requests                                             |
| `concurrency`     | Inspect organization call concurrency                            |
| `llms`            | Manage Retell LLM response engines                               |
| `flows`           | Manage conversation flows                                        |
| `flow-components` | Manage reusable flow components                                  |
| `chat-agents`     | Manage and publish chat agents                                   |
| `chats`           | Manage sessions, completions, and post-chat analysis            |
| `playground`      | Run stateless playground completions                             |
| `phone-numbers`   | Purchase, import, bind, update, and release numbers              |
| `voices`          | List, search, clone, and add voice resources                     |
| `kb`              | Manage knowledge bases and sources                               |

Generated help is the exact reference for subcommands, required arguments, and flags:

```bash
vac retell --help
vac retell agents --help
vac retell agents list --help
vac retell agents tags --help
```

Most read commands expose `--fields <fields>` for comma-separated projection. JSON input flags either name a JSON file explicitly or state that they accept inline JSON and `@path` syntax. Do not assume those forms are interchangeable unless help lists them.

Agent environment tags are managed under `agents tags`:

```bash
vac retell agents tags get agent_123
vac retell agents tags get agent_123 prod
vac retell agents tags assign agent_123 prod --agent-version 4 --dry-run
vac retell agents tags assign agent_123 prod --agent-version 4
```

`assign` accepts an existing tag and agent version only. It preserves every other tag and all tag dynamic variables, then reads the tag again to verify the assignment. Moving a tag immediately changes traffic that resolves through that tag.

Bind a phone-number direction to a numeric version or environment tag with the single-agent shorthand:

```bash
vac retell phone-numbers update +14157774444 \
  --inbound-agent agent_123 \
  --inbound-agent-version prod
```

`--inbound-agent-version` requires `--inbound-agent`; `--outbound-agent-version` similarly requires `--outbound-agent`. The single-agent shorthand writes one weighted binding with weight `1`. Retrieve the phone number before and after the mutation because `phone-numbers update` does not provide dry-run.

---
title: Command reference
description: Current provider and resource command groups
---

The root command exposes one provider-neutral utility and two provider namespaces:

```text
vac [--help] [--version]
├── upgrade
├── retell [--json]
└── twilio
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

`src/providers/twilio/register.ts` registers:

| Group                | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `login`              | Save Twilio credentials                                                 |
| `numbers`            | List, get, and attach or detach a number's Elastic SIP trunk           |
| `trunks`             | List, get, and update trunk routing settings                            |
| `trunks origination` | Add, update, or remove an origination URL                               |
| `trunks credentials` | List, associate, or remove a credential list                            |
| `trunks ip-access-control-lists` | List, associate, or remove an IP access control list        |
| `calls`              | List and get calls, and list redacted call events                       |
| `messages`           | List and get SMS messages without the body unless requested             |
| `messaging-services` | List and get messaging services and their sender pools                  |
| `recordings`         | List and get recording metadata                                         |
| `alerts`             | List and get Monitor alerts                                             |

See [Twilio](../providers/twilio/) for authentication, fields, and the dry-run contract.

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
vac retell agents tags assign agent_123 staging \
  --set base_url=https://staging.example.com \
  --dry-run
```

`assign` updates an existing tag. Pass `--agent-version` to move it, variable flags to change its dynamic variables, or both. Omit `--agent-version` to keep the current version. Variable input from `--dynamic-variables`, `--dynamic-variables-file`, and repeatable `--set KEY=VALUE` is merged into the selected tag; `--set` overrides the same key from JSON. `--replace` swaps that tag's entire variable map for the input. Other tags are left unchanged. The command sends `PATCH /update-agent-root/{agent_id}` with the complete tag map, then reads the tag again to verify the change.

Dry-run prints `dynamic_variables.current` and `dynamic_variables.next`. Keys whose names contain `key`, `token`, `secret`, or `password` are printed as `***` in `tags get`, `tags assign`, and dry-run output. The request still sends the real values. Moving a tag, or changing variables on a tag that traffic uses, takes effect immediately.

Bind a phone-number direction to a numeric version or environment tag with the single-agent shorthand:

```bash
vac retell phone-numbers update +14157774444 \
  --inbound-agent agent_123 \
  --inbound-agent-version prod
```

`--inbound-agent-version` requires `--inbound-agent`; `--outbound-agent-version` similarly requires `--outbound-agent`. The single-agent shorthand writes one weighted binding with weight `1`. Retrieve the phone number before and after the mutation because `phone-numbers update` does not provide dry-run.

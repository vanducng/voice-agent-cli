---
title: Prompt workflow
description: Pull, edit, compare, update, and publish Retell prompts safely
---

Prompt commands store editable files below a provider-owned base directory. The default is `.voice-agent/retell/prompts`, and the CLI appends the agent ID.

```bash
vac retell prompts pull agent_123
# edit .voice-agent/retell/prompts/agent_123/
vac retell prompts diff agent_123
vac retell prompts update agent_123 --dry-run
vac retell prompts update agent_123
vac retell agents publish agent_123
```

`prompts update` changes a draft. Publishing is a separate mutation that makes the selected draft live.

## Directory layouts

Retell LLM agents use:

```text
.voice-agent/retell/prompts/<agent-id>/
├── metadata.json
├── general_prompt.md
├── begin_message.txt
└── states/
    └── <state-name>.md
```

`begin_message.txt` and `states/` are optional. Conversation Flow agents use:

```text
.voice-agent/retell/prompts/<agent-id>/
├── metadata.json
├── global_prompt.md
└── nodes.json
```

These layouts are written by `src/providers/retell/commands/prompts/pull.ts` and read by `src/providers/retell/services/prompt-loader.ts`.

## Custom base directory

`--output` on `pull` and `--source` on `diff` or `update` take a base directory, not a JSON file. The CLI still appends `<agent-id>`:

```bash
vac retell prompts pull agent_123 --output ./prompts
vac retell prompts diff agent_123 --source ./prompts
vac retell prompts update agent_123 --source ./prompts --dry-run
```

Do not change the `type` in `metadata.json` to force a different response-engine update. Pull again after changing an agent's response engine.

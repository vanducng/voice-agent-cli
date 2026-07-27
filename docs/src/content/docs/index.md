---
title: Voice Agent CLI
description: Provider-neutral command line tools for voice agents
template: splash
hero:
  tagline: Manage voice agents through a stable JSON-first command line interface. Retell is the first and only provider today.
  actions:
    - text: Install and run
      link: ./start-here/install/
      icon: right-arrow
    - text: Browse commands
      link: ./reference/commands/
      variant: minimal
---

## One shell, explicit providers

`vac` is the canonical executable. Provider commands live below an explicit namespace, so current commands start with `vac retell`. `voice-agent` is an equivalent long alias.

```bash
vac retell agents list --fields agent_id,agent_name
vac retell transcripts list --limit 10
vac retell prompts pull agent_123
```

Install the public package from npm:

```bash
npm install --global voice-agent-cli
vac --version
```

See [Install and run](./start-here/install/) for source installation and provider authentication.

## Where to go next

- Learn why provider behavior stays isolated in [Provider model](./core-concepts/providers/).
- Configure Retell credentials in [Configuration](./reference/configuration/).
- Review upcoming API changes in [Retell compatibility](./providers/retell/compatibility/).
- Edit draft prompts safely with the [Prompt workflow](./guides/prompts/).

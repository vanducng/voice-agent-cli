# Voice Agent CLI

Provider-neutral CLI for managing voice agents, calls, prompts, and related resources. Retell and Twilio are the current providers.

The package is `voice-agent-cli`. It requires Node.js 22 or newer and provides `vac` as the canonical binary plus `voice-agent` as an equivalent alias.

## Install

```bash
npm install --global voice-agent-cli
vac --version
vac retell --help
```

Upgrade to the latest stable npm release later with:

```bash
vac upgrade
```

Set an environment tag's dynamic variables by merging into the current map. `--replace` swaps that tag's map. Dry-run prints the current and next values, and secret-looking keys are masked:

```bash
vac retell agents tags assign agent_123 staging \
  --set base_url=https://staging.example.com \
  --dry-run
```

Authenticate with an environment variable or the interactive login:

```bash
export RETELL_API_KEY=your_api_key
vac retell agents list --fields agent_id,agent_name

# Or save provider-scoped credentials:
vac retell login
```

Inspect Twilio numbers, Elastic SIP trunks, and calls:

```bash
export TWILIO_ACCOUNT_SID=your_account_sid
export TWILIO_AUTH_TOKEN=your_auth_token
vac twilio numbers list --limit 20 --fields sid,phone_number,trunk_sid
vac twilio trunks list --limit 20
vac twilio login
```

## Develop from source

```bash
npm ci
npm run build
npm link
vac retell --help
```

## Documentation

The documentation site covers installation, the provider model, Retell compatibility, prompt workflows, command reference, architecture, development, and releases.

- [Read the documentation](https://vanducng.github.io/voice-agent-cli/)
- [Documentation source](./docs/src/content/docs/index.md)
- [Build the docs locally](./docs/README.md)
- [Agent skill](./skills/voice-agent/SKILL.md)

## Validate

```bash
npm run typecheck
npm test
npm run build
npm run test:package
```

MIT. See [LICENSE](./LICENSE).

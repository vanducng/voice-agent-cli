# Voice Agent CLI

Provider-neutral CLI for managing voice agents, calls, prompts, and related resources. Retell is the first and only provider today.

The package is `voice-agent-cli`. It requires Node.js 22 or newer and provides `vac` as the canonical binary plus `voice-agent` as an equivalent alias.

## Run from source

The npm package is not published yet. From this checkout:

```bash
npm ci
npm run build
npm link
vac retell --help
```

Authenticate with an environment variable or the interactive login:

```bash
export RETELL_API_KEY=your_api_key
vac retell agents list --fields agent_id,agent_name

# Or save provider-scoped credentials:
vac retell login
```

When the package is published, installation will be:

```bash
npm install --global voice-agent-cli
```

Do not treat that future command as available until the first npm release is verified.

## Documentation

The documentation site covers installation, the provider model, Retell compatibility, prompt workflows, command reference, architecture, development, and release setup.

- [Start here](./docs/src/content/docs/index.md)
- [Build the docs locally](./docs/README.md)

## Validate

```bash
npm run typecheck
npm test
npm run build
npm run test:package
```

MIT. See [LICENSE](./LICENSE).

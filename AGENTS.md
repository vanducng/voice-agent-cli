# Voice Agent CLI agent guide

## Project

Voice Agent CLI is a provider-neutral TypeScript CLI. The npm package is `voice-agent-cli`; `vac` is the canonical binary and `voice-agent` is an equivalent alias. Retell is the first provider.

Use [skills/voice-agent-cli/SKILL.md](skills/voice-agent-cli/SKILL.md) when operating the installed CLI or building agent automation around it.

## Repository map

- `src/core/` - provider-neutral response, argument, pagination, and version helpers
- `src/providers/retell/` - Retell commands, services, and SDK-derived types
- `scripts/` - package and read-only live smoke tests
- `docs/` - Astro and Starlight documentation site
- `skills/` - reusable agent skills for this CLI
- `.github/workflows/` - CI, Pages, and tag-driven npm publication

## Development contract

- Require Node.js 22 or newer and use `npm ci` for reproducible installs.
- Keep provider code inside `src/providers/<provider>/`; do not leak provider SDK imports into core code.
- Pin provider SDKs exactly. Verify current official SDK declarations and provider docs before changing API behavior.
- Support current API endpoints and response envelopes only. Do not add legacy endpoint or response-shape fallbacks.
- Keep stdout machine-readable JSON. Send structured, redacted errors to stderr with `code`, `retryable`, and actionable `next_steps`.
- Treat generated `--help` output as the exact command and flag reference.
- Add no code comments unless a hidden constraint would otherwise surprise a future reader.
- Never manually edit generated files or `CHANGELOG.md`.

## Validation

Run the complete release gate before shipping:

```bash
npm ci
npm run format:check
npm run typecheck
npm test
npm audit --audit-level=low
npm run test:package
npm --prefix docs ci
npm --prefix docs audit --audit-level=low
npm --prefix docs run build
actionlint .github/workflows/*.yml
```

When `.env` is available, run `npm run test:live:retell`. It is read-only and must never print the key. Do not run mutating live commands without explicit user authorization.

## Release

Use a minor version for breaking command or JSON contract changes before `1.0.0`. Merge the version change to `main`, then push the matching `v<version>` tag. The publish workflow validates, publishes through npm OIDC, verifies the registry, and creates the GitHub Release.

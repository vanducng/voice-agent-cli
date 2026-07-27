---
title: Package and release
description: npm OIDC setup, semantic versions, and the tag release flow
---

`voice-agent-cli` is public on npm. Version `0.1.0` was bootstrapped interactively; tagged releases starting with `0.2.0` are published by GitHub Actions through npm OIDC.

## One-time setup

The repository uses a protected GitHub environment named `npm` and an npm Trusted Publisher with these exact values:

| Field                | Value             |
| -------------------- | ----------------- |
| Publisher            | GitHub Actions    |
| Organization or user | `vanducng`        |
| Repository           | `voice-agent-cli` |
| Workflow filename    | `publish.yml`     |
| Environment          | `npm`             |
| Allowed action       | `npm publish`     |

Do not store a long-lived npm token for regular releases. The publish job in `.github/workflows/publish.yml` requests `id-token: write` only inside the protected `npm` environment.

See npm's official [Trusted Publishers](https://docs.npmjs.com/trusted-publishers/) and GitHub's [OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect) documentation for the account-side configuration.

Do not push a `v0.1.0` tag because npm versions are immutable and that version was already published manually.

## Semantic versions

- Patch releases fix compatible behavior: `0.1.0` to `0.1.1`.
- Minor releases add compatible commands or providers: `0.1.x` to `0.2.0`.
- Before `1.0.0`, use a minor release for a breaking command or JSON schema change. After `1.0.0`, use a major release.

Create the version change on a branch without creating a tag:

```bash
npm version patch --no-git-tag-version
```

Merge the version PR before creating and pushing `v<version>`. The workflow rejects tags whose version does not match `package.json` or whose commit is not reachable from `main`.

## Release gate

The tag workflow uses Node.js 24 and npm `11.18.0`. Its validation job checks that `v<version>` matches `package.json`, verifies the commit is reachable from `main`, and runs:

```bash
npm ci
npm run format:check
npm run typecheck
npm test
npm audit --audit-level=low
npm run build
npm run test:package
npm pack --ignore-scripts
```

It dry-runs publication, uploads the tarball, then the protected publish job sends that exact artifact through npm OIDC and reads the version back from the registry. Never retry a failed release with a version that npm already accepted because npm versions are immutable.

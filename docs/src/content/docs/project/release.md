---
title: Package and release
description: Unpublished package status, npm OIDC setup, and tag release flow
---

`voice-agent-cli` is version `0.1.0` in the current manifest, but the npm package is not published. Do not present `npm install --global voice-agent-cli` as available until a registry read verifies the first release.

## One-time setup

1. Ensure the public GitHub repository is `vanducng/voice-agent-cli` and the package metadata points to it.
2. Confirm the unscoped npm name is available immediately before bootstrap.
3. Publish the first immutable version with an npm account that has two-factor authentication. The package must exist before its Trusted Publisher binding can be used.
4. Create a protected GitHub environment named `npm`.
5. Configure the npm Trusted Publisher with these exact values:

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

Publish the bootstrap `0.1.0` release interactively from the verified `main` checkout without pushing a `v0.1.0` tag. Configure the Trusted Publisher after the package exists. The first automated release should bump to `0.1.1` and push `v0.1.1`; pushing `v0.1.0` would make the workflow retry an immutable version that the bootstrap already published.

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

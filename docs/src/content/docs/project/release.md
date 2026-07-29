---
title: Package and release
description: Release Please, semantic versions, and npm OIDC publication
---

`voice-agent-cli` is public on npm. Release Please turns Conventional Commits on `main` into a release PR. Merging that PR creates the tag and GitHub Release, then the same workflow publishes the package through npm OIDC.

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

Store the MiuMun GitHub App credentials as repository secrets named `GH_APP_ID` and `GH_APP_MUNMIU_PRIVATE_KEY`. The short-lived installation token lets generated release PR checks run unattended and lets their merge trigger the next release workflow run.

See npm's official [Trusted Publishers](https://docs.npmjs.com/trusted-publishers/) and GitHub's [OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect) documentation for the account-side configuration.

## Semantic versions

- `fix:` creates a patch release.
- `feat:` creates a minor release.
- `feat!:` or a `BREAKING CHANGE:` footer creates a breaking release. Before `1.0.0`, the project config maps that to a minor release; after `1.0.0`, it becomes a major release.
- Other commit types do not create a release by themselves.

Use Conventional Commit titles for squash merges:

```bash
fix(cli): handle an invalid provider response
feat(provider): add a new voice provider
feat(cli)!: replace the command response envelope
```

Do not run `npm version`, edit `CHANGELOG.md`, or push release tags manually. Release Please owns `package.json`, `package-lock.json`, `.release-please-manifest.json`, `CHANGELOG.md`, and `v<version>` tags.

## Release flow

1. Merge feature and fix PRs into `main` with Conventional Commit squash titles.
2. Release Please opens or updates one release PR with the calculated version and generated changelog.
3. CI runs on the generated PR; the release workflow waits for the Node 22 and Node 24 checks, then squash-merges it with the MiuMun GitHub App.
4. The App-authenticated merge triggers the workflow again, and Release Please creates the matching tag and GitHub Release.
5. The same run validates, packs, publishes through npm OIDC, and verifies the npm registry version.

Publication stays in the same workflow run that creates the release because action-created tags do not start another workflow. The GitHub App credentials are release-orchestration secrets only; npm publication continues to use short-lived OIDC credentials.

## Release gate

The release workflow uses Node.js 24 and npm `11.18.0`. After Release Please creates a release, its validation job checks that `v<version>` matches `package.json`, verifies the tagged commit is reachable from `main`, and runs:

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

It dry-runs publication, uploads the tarball, then the protected publish job sends that exact artifact through npm OIDC and reads the version back from the registry. Never retry a failed publication with a version that npm already accepted because npm versions are immutable.

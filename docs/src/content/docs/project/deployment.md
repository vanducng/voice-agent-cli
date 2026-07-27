---
title: Deployment
description: Build and deploy the Starlight site with GitHub Pages
---

The documentation site is configured for:

```text
https://vanducng.github.io/voice-agent-cli/
```

`docs/astro.config.mjs` sets `site` to `https://vanducng.github.io` and `base` to `/voice-agent-cli`. `@astrojs/sitemap` generates the sitemap during the Astro build.

## One-time repository setting

In GitHub, open **Settings -> Pages** and set **Source** to **GitHub Actions**. This is required before `.github/workflows/docs.yml` can deploy the Pages artifact.

## Workflow

The docs workflow:

1. Runs for documentation pull requests, pushes to `main`, and manual dispatches.
2. Installs the exact `docs/package-lock.json` with `npm ci --prefix docs`.
3. Builds `docs/dist` with `npm run build --prefix docs`.
4. Uploads the Pages artifact on every run.
5. Deploys only for an eligible push to `main` or manual run on `main`.

The build job has read-only repository permissions. The deploy job receives `pages: write` and `id-token: write` only for the `github-pages` environment.

Validate locally before pushing:

```bash
npm ci --prefix docs
npm run build --prefix docs
```

There is no custom domain or release-version snapshot machinery. The site publishes the documentation from the deployed `main` commit.

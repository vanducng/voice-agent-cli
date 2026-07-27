# Documentation site

This directory contains the Astro Starlight site for Voice Agent CLI. It deploys at `https://vanducng.github.io/voice-agent-cli/` through the repository's Pages workflow.

```bash
npm ci
npm run dev
```

Build the same artifact used by GitHub Pages:

```bash
npm run build
```

Content lives in `src/content/docs/`. Navigation is explicit in `astro.config.mjs` so a new page must be added to both locations.

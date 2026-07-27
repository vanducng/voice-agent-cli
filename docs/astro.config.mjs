import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://vanducng.github.io",
  base: "/voice-agent-cli",
  integrations: [
    starlight({
      title: "Voice Agent CLI",
      description: "Provider-neutral command line tools for voice agents",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/vanducng/voice-agent-cli",
        },
      ],
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Overview", slug: "" },
            { label: "Install and run", slug: "start-here/install" },
            { label: "Quick start", slug: "start-here/quick-start" },
          ],
        },
        {
          label: "Core concepts",
          items: [
            { label: "Provider model", slug: "core-concepts/providers" },
            { label: "Output contract", slug: "core-concepts/output" },
          ],
        },
        {
          label: "Providers / Retell",
          items: [
            { label: "Retell", slug: "providers/retell" },
            {
              label: "API compatibility",
              slug: "providers/retell/compatibility",
            },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Prompt workflow", slug: "guides/prompts" },
            { label: "Update calls", slug: "guides/calls" },
            { label: "Automation", slug: "guides/automation" },
            { label: "Troubleshooting", slug: "guides/troubleshooting" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Commands", slug: "reference/commands" },
            { label: "Configuration", slug: "reference/configuration" },
            { label: "Shells", slug: "reference/shells" },
          ],
        },
        {
          label: "Project",
          items: [
            { label: "Architecture", slug: "project/architecture" },
            { label: "Development", slug: "project/development" },
            { label: "Package and release", slug: "project/release" },
            { label: "Deployment", slug: "project/deployment" },
          ],
        },
      ],
    }),
    sitemap(),
  ],
});

// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
	site: "https://northline.consulting",
	integrations: [sitemap()],
	redirects: {
		"/insurance-ai-deployments": {
			destination: "/insurance-ai-deployment",
			status: 301,
		},
	},
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});

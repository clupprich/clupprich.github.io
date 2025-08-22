// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import markdoc from "@astrojs/markdoc";

// https://astro.build/config
export default defineConfig({
  site: "https://christoph.luppri.ch",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap(), markdoc()],
});
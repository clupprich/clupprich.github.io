// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import markdoc from "@astrojs/markdoc";

import turbolinks from "@astrojs/turbolinks";

// https://astro.build/config
export default defineConfig({
  site: "https://christoph.luppri.ch",

  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
  },

  integrations: [sitemap(), markdoc(), turbolinks()],
});

import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/posts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    excerpt: z.string(),
  }),
});

export const collections = { posts };

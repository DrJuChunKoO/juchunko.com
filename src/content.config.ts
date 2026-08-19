import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const act = defineCollection({
	loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/act" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).default([]),
		newsTopicIds: z.array(z.string()).default([]),
		emoji: z.string().optional().default("🤓"),
		description: z.string().optional(),
		image: z.string().optional(),
		status: z.string().optional(),
	}),
});
const manual = defineCollection({
	loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/manual" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).default([]),
		emoji: z.string().optional().default("🤓"),
		description: z.string().optional(),
		image: z.string().optional(),
	}),
});
const fragment = defineCollection({
	loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/fragment" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).default([]),
		emoji: z.string().optional().default("🤓"),
		description: z.string().optional(),
		image: z.string().optional(),
	}),
});

export const collections = { act, manual, fragment };

import { defineCollection, z } from "astro:content";

const act = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		emoji: z.string().optional().default("🤓"),
		description: z.string().optional(),
		image: z.string().optional(),
	}),
});
const manual = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		emoji: z.string().optional().default("🤓"),
		description: z.string().optional(),
		image: z.string().optional(),
	}),
});
const fragment = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		emoji: z.string().optional().default("🤓"),
		description: z.string().optional(),
		image: z.string().optional(),
	}),
});

export const collections = { act, manual, fragment };

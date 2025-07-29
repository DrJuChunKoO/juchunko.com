import { defineCollection, z } from "astro:content";

const act = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		emoji: z.string().optional().default("🤓"),
	}),
});
const manual = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		emoji: z.string().optional().default("🤓"),
	}),
});

export const collections = { act, manual };

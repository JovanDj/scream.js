import { schema } from "@scream.js/validator/schema.js";
import type { z } from "zod/v4";

export const tagIndexInputSchema = schema.object({});

export const tagIndexDataSchema = schema.array(
	schema.object({
		id: schema.coerce.number().int().positive(),
		name: schema.string(),
	}),
);

export type TagIndexInput = z.infer<typeof tagIndexInputSchema>;
export type TagIndexData = z.infer<typeof tagIndexDataSchema>;

import { schema } from "@scream.js/validator/schema.js";
import type { z } from "zod/v4";

export const tagIndexInputSchema = schema.object({
	direction: schema.enum(["asc", "desc"]).optional().default("asc"),
	page: schema.coerce.number().int().positive().optional().default(1),
	sort: schema.enum(["created", "name"]).optional().default("name"),
});

export const tagIndexDataSchema = schema.array(
	schema.object({
		id: schema.coerce.number().int().positive(),
		name: schema.string(),
	}),
);

export type TagIndexInput = z.infer<typeof tagIndexInputSchema>;
export type TagIndexData = z.infer<typeof tagIndexDataSchema>;

export const tagShowInputSchema = schema.object({
	id: schema.coerce.number().int().positive(),
});

export const tagShowDataSchema = schema.object({
	id: schema.coerce.number().int().positive(),
	name: schema.string(),
});

export type TagShowInput = z.infer<typeof tagShowInputSchema>;
export type TagShowData = z.infer<typeof tagShowDataSchema>;

export const tagStoreInputSchema = schema.strictObject({
	name: schema
		.string()
		.default("")
		.transform((value) => value.trim())
		.refine((value) => value.length > 0, { message: "Required" }),
});

export type TagStoreInput = z.infer<typeof tagStoreInputSchema>;

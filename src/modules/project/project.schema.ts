import { schema } from "@scream.js/validator/schema.js";
import type { z } from "zod/v4";

export const projectIndexInputSchema = schema.object({
	direction: schema.enum(["asc", "desc"]).optional().default("desc"),
	page: schema.coerce.number().int().positive().optional().default(1),
	search: schema
		.string()
		.optional()
		.default("")
		.transform((value) => value.trim()),
	sort: schema
		.enum(["created", "name", "status"])
		.optional()
		.default("created"),
	status: schema.enum(["active", "all", "archived"]).optional().default("all"),
});

export const projectIndexDataSchema = schema
	.array(
		schema.object({
			id: schema.coerce.number().int().positive(),
			name: schema.string(),
			status_code: schema.enum(["active", "archived"]),
		}),
	)
	.transform((rows) =>
		rows.map((row) => ({
			id: row.id,
			name: row.name,
			statusCode: row.status_code,
		})),
	);

export type ProjectIndexInput = z.infer<typeof projectIndexInputSchema>;
export type ProjectIndexData = z.infer<typeof projectIndexDataSchema>;

export const projectShowInputSchema = schema.object({
	id: schema.coerce.number().int().positive(),
});

export const projectShowDataSchema = schema
	.object({
		id: schema.coerce.number().int().positive(),
		name: schema.string(),
		status_code: schema.enum(["active", "archived"]),
	})
	.transform((row) => ({
		id: row.id,
		name: row.name,
		statusCode: row.status_code,
	}));

export type ProjectShowInput = z.infer<typeof projectShowInputSchema>;
export type ProjectShowData = z.infer<typeof projectShowDataSchema>;

export const projectStoreInputSchema = schema.strictObject({
	name: schema
		.string()
		.default("")
		.transform((value) => value.trim())
		.refine((value) => value.length > 0, { message: "Required" }),
});

export type ProjectStoreInput = z.infer<typeof projectStoreInputSchema>;

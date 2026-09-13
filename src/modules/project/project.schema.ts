import { schema } from "@scream.js/validator/schema.js";
import type { z } from "zod/v4";

export const projectIndexInputSchema = schema.object({
	search: schema
		.string()
		.optional()
		.default("")
		.transform((value) => value.trim()),
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

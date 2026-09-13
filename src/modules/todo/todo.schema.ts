import { schema } from "@scream.js/validator/schema.js";
import type { z } from "zod/v4";

export const todoIndexInputSchema = schema.object({
	search: schema
		.string()
		.optional()
		.default("")
		.transform((value) => value.trim()),
	status: schema
		.enum(["all", "completed", "dueToday", "open"])
		.optional()
		.default("all"),
});

export const todoIndexDataSchema = schema
	.array(
		schema.object({
			id: schema.coerce.number().int().positive(),
			status_code: schema.enum(["open", "completed"]),
			title: schema.string().nonempty(),
		}),
	)
	.transform((rows) =>
		rows.map((row) => ({
			id: row.id,
			statusCode: row.status_code,
			title: row.title,
		})),
	);

export type TodoIndexInput = z.infer<typeof todoIndexInputSchema>;
export type TodoIndexData = z.infer<typeof todoIndexDataSchema>;

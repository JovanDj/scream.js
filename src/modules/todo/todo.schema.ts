import { schema } from "@scream.js/validator/schema.js";
import type { z } from "zod/v4";

export const todoIndexInputSchema = schema.object({
	direction: schema.enum(["asc", "desc"]).optional().default("desc"),
	page: schema.coerce.number().int().positive().optional().default(1),
	search: schema
		.string()
		.optional()
		.default("")
		.transform((value) => value.trim()),
	sort: schema
		.enum(["created", "status", "title"])
		.optional()
		.default("created"),
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

export const todoShowInputSchema = schema.object({
	id: schema.coerce.number().int().positive(),
});

export const todoShowDataSchema = schema
	.object({
		due_at: schema.string().nullable(),
		id: schema.coerce.number().int().positive(),
		status_code: schema.enum(["open", "completed"]),
		title: schema.string(),
	})
	.transform((row) => ({
		dueAt: row.due_at,
		id: row.id,
		statusCode: row.status_code,
		title: row.title,
	}));

export type TodoShowInput = z.infer<typeof todoShowInputSchema>;
export type TodoShowData = z.infer<typeof todoShowDataSchema>;

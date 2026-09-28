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

export const todoStoreInputSchema = schema
	.object({
		dueAt: schema.preprocess(
			(value) => (typeof value === "string" ? value.trim() : ""),
			schema.string(),
		),
		title: schema.preprocess(
			(value) => (typeof value === "string" ? value.trim() : ""),
			schema.string(),
		),
	})
	.superRefine((input, ctx) => {
		if (input.title.length === 0) {
			ctx.addIssue({ code: "custom", message: "Required", path: ["title"] });
			return;
		}
		if (
			input.dueAt.length > 0 &&
			!schema.iso.date().safeParse(input.dueAt).success
		) {
			ctx.addIssue({
				code: "custom",
				message: "Invalid date",
				path: ["dueAt"],
			});
		}
	});

export type TodoStoreInput = z.infer<typeof todoStoreInputSchema>;

export const todoUpdateInputSchema = schema.object({
	dueAt: schema
		.string()
		.default("")
		.transform((value) => value.trim())
		.refine(
			(value) =>
				value.length === 0 || schema.iso.date().safeParse(value).success,
			{
				message: "Invalid date",
			},
		),
	statusCode: schema.enum(["open", "completed"]).default("open"),
	title: schema
		.string()
		.default("")
		.transform((value) => value.trim())
		.refine((value) => value.length > 0, { message: "Required" }),
});

export type TodoUpdateInput = z.infer<typeof todoUpdateInputSchema>;

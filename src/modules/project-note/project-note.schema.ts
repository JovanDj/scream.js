import { schema } from "@scream.js/validator/schema.js";
import type { z } from "zod/v4";

export const projectNoteIndexInputSchema = schema.object({
	page: schema.coerce.number().int().positive().optional().default(1),
	projectId: schema.coerce.number().int().positive().optional(),
});

export type ProjectNoteIndexInput = z.infer<typeof projectNoteIndexInputSchema>;

export const projectNoteShowInputSchema = schema.object({
	id: schema.coerce.number().int().positive(),
});

export type ProjectNoteShowInput = z.infer<typeof projectNoteShowInputSchema>;

export const projectNoteCreateInputSchema = schema.object({
	projectId: schema.coerce.number().int().positive().optional(),
});

export const projectNoteUpdateInputSchema = schema.object({
	body: schema
		.string()
		.refine((value) => value.trim().length > 0, { message: "Required" }),
	title: schema.string().trim().nonempty("Required").max(255),
});

export type ProjectNoteUpdateInput = z.infer<
	typeof projectNoteUpdateInputSchema
>;

export const projectNoteStoreInputSchema = projectNoteUpdateInputSchema.extend({
	projectId: schema.coerce.number().int().positive(),
});

export type ProjectNoteStoreInput = z.infer<typeof projectNoteStoreInputSchema>;

export const projectNoteFormFieldsSchema = schema.object({
	body: schema.preprocess(
		(value) => (typeof value === "string" ? value : ""),
		schema.string(),
	),
	projectId: schema.preprocess(
		(value) => (typeof value === "string" ? value : ""),
		schema.string(),
	),
	title: schema.preprocess(
		(value) => (typeof value === "string" ? value : ""),
		schema.string(),
	),
});

export const projectNoteDataSchema = schema
	.object({
		body: schema
			.string()
			.refine((value) => value.trim().length > 0, { message: "Required" }),
		id: schema.coerce.number().int().positive(),
		project_id: schema.coerce.number().int().positive(),
		project_name: schema.string(),
		title: schema
			.string()
			.refine((value) => value.trim().length > 0, { message: "Required" })
			.max(255),
	})
	.transform((row) => ({
		body: row.body,
		id: row.id,
		projectId: row.project_id,
		projectName: row.project_name,
		title: row.title,
	}));

export type ProjectNoteData = z.infer<typeof projectNoteDataSchema>;

export const projectNoteIndexDataSchema = schema.array(projectNoteDataSchema);

export type ProjectNoteIndexData = z.infer<typeof projectNoteIndexDataSchema>;

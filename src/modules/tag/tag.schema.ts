import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";

export type TagRow = {
	created_at: string;
	id: number;
	name: string;
	updated_at?: string | undefined;
};

export type ReplaceTodoTagsFields = {
	tagIds: number[];
};

export const tagIdValidator = createValidator(
	schema.coerce.number().int().positive(),
);

export const tagWriteValidator = createValidator(
	schema.strictObject({
		name: schema
			.string()
			.default("")
			.transform((value) => value.trim())
			.refine((value) => value.length > 0, {
				message: "Required",
			}),
	}),
);

export const replaceTodoTagsValidator = createValidator(
	schema.strictObject({
		tagIds: schema.preprocess((value) => {
			if (!value) {
				return [];
			}
			if (Array.isArray(value)) {
				return value;
			}
			return [value];
		}, schema.array(schema.coerce.number().int().positive()).default([])),
	}),
);

export const tagRowValidator = createValidator(
	schema.object({
		created_at: schema.string(),
		id: schema.coerce.number(),
		name: schema.string(),
		updated_at: schema.string().optional(),
	}),
);

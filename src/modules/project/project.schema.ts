import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";
import type { ProjectStatusCode } from "./project.js";

export type ProjectRow = {
	created_at: string;
	id: number;
	name: string;
	status_code: ProjectStatusCode;
	updated_at: string;
};

export const projectIdValidator = createValidator(
	schema.coerce.number().int().positive(),
);

export const projectWriteValidator = createValidator(
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

export const projectRowValidator = createValidator(
	schema.object({
		created_at: schema.string(),
		id: schema.coerce.number(),
		name: schema.string(),
		status_code: schema.enum(["active", "archived"]),
		updated_at: schema.string(),
	}),
);

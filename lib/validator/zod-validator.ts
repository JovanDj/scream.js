import z from "zod/v4";

import type { ValidationError, Validator } from "./validator.js";

export class ZodValidator<S extends z.core.$ZodType>
	implements Validator<z.output<S>>
{
	readonly #schema: S;

	constructor(schema: S) {
		this.#schema = schema;
	}

	validate(input: unknown) {
		const parsed = z.safeParse(this.#schema, input);

		if (parsed.success) {
			return { errors: {}, value: parsed.data };
		}

		return {
			errors: parsed.error.issues.reduce<ValidationError>((acc, e) => {
				const key = e.path.join(".");
				if (!acc[key]) {
					acc[key] = [];
				}
				acc[key].push(e.message);
				return acc;
			}, {}),
		};
	}
}

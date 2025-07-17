import type { z } from "zod/v4";
import type { ValidationError, Validator } from "./validator.js";

export class ZodValidator<S extends z.ZodType>
	implements Validator<z.infer<S>>
{
	readonly #schema: S;

	constructor(schema: S) {
		this.#schema = schema;
	}

	validate(input: unknown): {
		value?: z.infer<S>;
		errors: ValidationError;
	} {
		const parsed = this.#schema.safeParse(input);

		if (parsed.success) {
			return { value: parsed.data, errors: {} };
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

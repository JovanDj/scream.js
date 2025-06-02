import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { z } from "zod/v4";

import type { ValidationError, Validator } from "./validator.js";
import { ZodValidator } from "./zod-validator.js";

describe("ZodValidator", { concurrency: true }, () => {
	const schema = z.object({ title: z.string(), userId: z.coerce.number() });
	let validator: Validator<z.infer<typeof schema>>;

	beforeEach(() => {
		validator = new ZodValidator(schema);
	});

	it("validates that input matches the shape", () => {
		const input = { title: "Buy milk", userId: 7 };

		const { value, errors } = validator.validate(input);

		assert.deepStrictEqual<ValidationError>(errors, {});
		assert.deepStrictEqual<z.infer<typeof schema>>(value, {
			title: "Buy milk",
			userId: 7,
		});
	});

	it("returns an error for missing required fields", () => {
		const input = { title: "Buy milk" };

		const { value, errors } = validator.validate(input);

		assert.deepStrictEqual<undefined>(value, undefined);
		assert.ok(errors["userId"]?.[0]);
		assert.match(errors["userId"][0], /invalid/i);
	});

	it("returns an error for fields with the wrong type", () => {
		const input = { title: "Buy milk", userId: "wrong" };

		const { value, errors } = validator.validate(input);

		assert.deepStrictEqual<undefined>(value, undefined);

		assert.ok(errors["userId"], "Should have errors for userId");
		assert.deepStrictEqual<number>(errors["userId"].length, 1);

		assert.ok(errors["userId"][0]);
		assert.match(errors["userId"][0], /number/i);
	});

	it("returns errors for nested object schemas", () => {
		const nestedSchema = z.object({
			user: z.object({
				id: z.number(),
				name: z.string(),
			}),
		});

		const nestedValidator: Validator<z.infer<typeof nestedSchema>> =
			new ZodValidator(nestedSchema);

		const input = { user: { id: "not a number", name: 123 } };

		const { value, errors } = nestedValidator.validate(input);

		assert.deepStrictEqual<undefined>(value, undefined);

		assert.ok(errors["user.id"]);
		assert.ok(errors["user.name"]);

		assert.ok(errors["user.id"][0]);
		assert.match(errors["user.id"][0], /number/i);

		assert.ok(errors["user.name"][0]);
		assert.match(errors["user.name"][0], /string/i);
	});

	it("returns errors for nested object schemas", () => {
		const nestedSchema = z.object({
			user: z.object({
				id: z.number(),
				name: z.string(),
			}),
		});

		const nestedValidator: Validator<z.infer<typeof nestedSchema>> =
			new ZodValidator(nestedSchema);

		const input = { user: { id: "not a number", name: 123 } };

		const { value, errors } = nestedValidator.validate(input);

		assert.deepStrictEqual<undefined>(value, undefined);

		assert.ok(errors["user.id"]?.[0]);
		assert.match(errors["user.id"][0], /number/i);

		assert.ok(errors["user.name"]?.[0]);
		assert.match(errors["user.name"][0], /string/i);
	});

	it("returns errors for array items", () => {
		const arraySchema = z.object({
			tags: z.array(z.string().min(2)),
		});

		const arrayValidator: Validator<z.infer<typeof arraySchema>> =
			new ZodValidator(arraySchema);

		const input = { tags: ["ok", 1, "x"] };

		const { errors } = arrayValidator.validate(input);

		assert.ok(errors["tags.1"]?.[0]);
		assert.ok(errors["tags.1"][0].match(/string/i));

		assert.ok(errors["tags.2"]?.[0]);
		assert.ok(errors["tags.2"][0].match(/2/i));
	});

	it("passes when optional fields are missing", () => {
		const optSchema = z.object({
			title: z.string(),
			userId: z.number().optional(),
		});
		const optValidator: Validator<z.infer<typeof optSchema>> = new ZodValidator(
			optSchema,
		);

		const input = { title: "Has only required" };

		const { value, errors } = optValidator.validate(input);

		assert.deepStrictEqual<ValidationError>(errors, {});
		assert.deepStrictEqual<{ title: string }>(value, {
			title: "Has only required",
		});
	});
});

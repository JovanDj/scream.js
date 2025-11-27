import { beforeEach, describe, it, type TestContext } from "node:test";

import { z } from "zod/v4";

import type { ValidationError, Validator } from "./validator.js";
import { ZodValidator } from "./zod-validator.js";

describe("ZodValidator", { concurrency: true }, () => {
	const schema = z.object({ title: z.string(), userId: z.coerce.number() });
	let validator: Validator<z.output<typeof schema>>;

	beforeEach(() => {
		validator = new ZodValidator(schema);
	});

	it("validates that input matches the shape", (t: TestContext) => {
		t.plan(2);
		const input = { title: "Buy milk", userId: 7 };

		const { value, errors } = validator.validate(input);

		t.assert.deepStrictEqual<ValidationError>(errors, {});
		t.assert.deepStrictEqual<z.output<typeof schema>>(value, {
			title: "Buy milk",
			userId: 7,
		});
	});

	it("returns an error for missing required fields", (t: TestContext) => {
		t.plan(3);
		const input = { title: "Buy milk" };

		const { value, errors } = validator.validate(input);

		t.assert.deepStrictEqual<undefined>(value, undefined);
		t.assert.ok(errors["userId"]?.[0]);
		t.assert.match(errors["userId"][0], /invalid/i);
	});

	it("returns an error for fields with the wrong type", (t: TestContext) => {
		t.plan(5);
		const input = { title: "Buy milk", userId: "wrong" };

		const { value, errors } = validator.validate(input);

		t.assert.deepStrictEqual<undefined>(value, undefined);

		t.assert.ok(errors["userId"], "Should have errors for userId");
		t.assert.deepStrictEqual<number>(errors["userId"].length, 1);

		t.assert.ok(errors["userId"][0]);
		t.assert.match(errors["userId"][0], /number/i);
	});

	it("returns errors for nested object schemas", (t: TestContext) => {
		t.plan(7);
		const nestedSchema = z.object({
			user: z.object({
				id: z.number(),
				name: z.string(),
			}),
		});

		const nestedValidator: Validator<z.output<typeof nestedSchema>> =
			new ZodValidator(nestedSchema);

		const input = { user: { id: "not a number", name: 123 } };

		const { value, errors } = nestedValidator.validate(input);

		t.assert.deepStrictEqual<undefined>(value, undefined);

		t.assert.ok(errors["user.id"]);
		t.assert.ok(errors["user.name"]);

		t.assert.ok(errors["user.id"][0]);
		t.assert.match(errors["user.id"][0], /number/i);

		t.assert.ok(errors["user.name"][0]);
		t.assert.match(errors["user.name"][0], /string/i);
	});

	it("returns errors for nested object schemas", (t: TestContext) => {
		t.plan(5);
		const nestedSchema = z.object({
			user: z.object({
				id: z.number(),
				name: z.string(),
			}),
		});

		const nestedValidator: Validator<z.output<typeof nestedSchema>> =
			new ZodValidator(nestedSchema);

		const input = { user: { id: "not a number", name: 123 } };

		const { value, errors } = nestedValidator.validate(input);

		t.assert.deepStrictEqual<undefined>(value, undefined);

		t.assert.ok(errors["user.id"]?.[0]);
		t.assert.match(errors["user.id"][0], /number/i);

		t.assert.ok(errors["user.name"]?.[0]);
		t.assert.match(errors["user.name"][0], /string/i);
	});

	it("returns errors for array items", (t: TestContext) => {
		t.plan(4);
		const arraySchema = z.object({
			tags: z.array(z.string().min(2)),
		});

		const arrayValidator: Validator<z.output<typeof arraySchema>> =
			new ZodValidator(arraySchema);

		const input = { tags: ["ok", 1, "x"] };

		const { errors } = arrayValidator.validate(input);

		t.assert.ok(errors["tags.1"]?.[0]);
		t.assert.ok(errors["tags.1"][0].match(/string/i));

		t.assert.ok(errors["tags.2"]?.[0]);
		t.assert.ok(errors["tags.2"][0].match(/2/i));
	});

	it("passes when optional fields are missing", (t: TestContext) => {
		t.plan(2);
		const optSchema = z.object({
			title: z.string(),
			userId: z.number().optional(),
		});
		const optValidator: Validator<z.output<typeof optSchema>> =
			new ZodValidator(optSchema);

		const input = { title: "Has only required" };

		const { value, errors } = optValidator.validate(input);

		t.assert.deepStrictEqual<ValidationError>(errors, {});
		t.assert.deepStrictEqual<{ title: string }>(value, {
			title: "Has only required",
		});
	});
});

import { describe, it, type TestContext } from "node:test";
import type { ValidationError } from "@scream.js/validator/validator.js";
import { todoValidator } from "./todo.schema.js";

describe("todoValidator", { concurrency: true }, () => {
	it("rejects missing title", (t: TestContext) => {
		t.plan(2);
		const data = {};

		const { value, errors } = todoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {
			title: ["Invalid input: expected string, received undefined"],
		});
		t.assert.deepStrictEqual<undefined>(value, undefined);
	});

	it("rejects empty title", (t: TestContext) => {
		t.plan(2);
		const data = { title: "" };

		const { value, errors } = todoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {
			title: ["Too small: expected string to have >=1 characters"],
		});
		t.assert.deepStrictEqual<undefined>(value, undefined);
	});

	it("defaults completed to false", (t: TestContext) => {
		t.plan(2);
		const data = { title: "Todo" };

		const { value, errors } = todoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {});
		t.assert.deepStrictEqual(value, { completed: false, title: "Todo" });
	});

	it("rejects extra fields due to strict object", (t: TestContext) => {
		t.plan(2);
		const data = { extra: "nope", title: "Todo" };

		const { value, errors } = todoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {
			"": ['Unrecognized key: "extra"'],
		});
		t.assert.deepStrictEqual<undefined>(value, undefined);
	});

	it('treats string "false" as false for completed', (t: TestContext) => {
		t.plan(1);
		const data = { completed: "false", title: "Todo" };

		const { value } = todoValidator.validate(data);

		t.assert.deepStrictEqual(value?.completed, false);
	});

	it('treats string "true" as true for completed', (t: TestContext) => {
		t.plan(1);
		const data = { completed: "true", title: "Todo" };

		const { value } = todoValidator.validate(data);

		t.assert.deepStrictEqual(value?.completed, true);
	});
});

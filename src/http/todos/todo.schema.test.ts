import { describe, it, type TestContext } from "node:test";
import type { ValidationError } from "@scream.js/validator/validator.js";
import { createTodoValidator } from "./todo.schema.js";

describe("createTodoValidator", { concurrency: true }, () => {
	it("rejects missing title", (t: TestContext) => {
		t.plan(2);
		const data = { userId: 1 };

		const { value, errors } = createTodoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {
			title: ["Invalid input: expected string, received undefined"],
		});
		t.assert.deepStrictEqual<undefined>(value, undefined);
	});

	it("rejects empty title", (t: TestContext) => {
		t.plan(2);
		const data = { title: "", userId: 1 };

		const { value, errors } = createTodoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {
			title: ["Too small: expected string to have >=1 characters"],
		});
		t.assert.deepStrictEqual<undefined>(value, undefined);
	});

	it("coerces numeric userId strings", (t: TestContext) => {
		t.plan(2);
		const data = { title: "Todo", userId: "42" };

		const { value, errors } = createTodoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {});
		t.assert.deepStrictEqual<{ title: string; userId: number }>(value, {
			title: "Todo",
			userId: 42,
		});
	});

	it("rejects non-numeric userId", (t: TestContext) => {
		t.plan(2);
		const data = { title: "Todo", userId: "abc" };

		const { value, errors } = createTodoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {
			userId: ["Invalid input: expected number, received NaN"],
		});
		t.assert.deepStrictEqual<undefined>(value, undefined);
	});

	it("rejects extra fields due to strict object", (t: TestContext) => {
		t.plan(2);
		const data = { extra: "nope", title: "Todo", userId: 1 };

		const { value, errors } = createTodoValidator.validate(data);

		t.assert.deepStrictEqual<ValidationError>(errors, {
			"": ['Unrecognized key: "extra"'],
		});
		t.assert.deepStrictEqual<undefined>(value, undefined);
	});
});

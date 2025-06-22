import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Evaluator } from "./evaluator.js";
import type { ASTNode } from "./parser.js";

describe("Evaluator", { concurrency: true }, () => {
	let evaluator: Evaluator;

	beforeEach(() => {
		evaluator = new Evaluator();
	});

	describe("Evaluator – Variable Resolution", () => {
		it("should resolve a variable from context", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "user.name" },
			];
			const context = { user: { name: "John" } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "John" },
			]);
		});

		it("should return an empty string for undefined variables", () => {
			const ast: readonly ASTNode[] = [{ type: "variable", value: "user.age" }];
			const context = { user: { name: "John" } }; // age is not in the context
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});

		it("should return an empty string for non-serializable or symbolic values", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "user.symbol" },
			];
			const context = { user: { symbol: Symbol("test") } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});

		it("should return an empty string for function values", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "user.greet" },
			];
			const context = { user: { greet: () => "Hello" } }; // function in context
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});

		it("should escape HTML special characters in variable values", () => {
			const ast: readonly ASTNode[] = [{ type: "variable", value: "xss" }];
			const context = { xss: "<script>alert('x')</script>" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					type: "variable",
					value: "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
				},
			]);
		});

		it("should not escape already escaped values", () => {
			const ast: readonly ASTNode[] = [{ type: "variable", value: "safe" }];
			const context = { safe: "&lt;div&gt;" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "&lt;div&gt;" },
			]);
		});

		it("should resolve array elements using bracket notation", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "errors.title[0]" },
			];
			const context = { errors: { title: ["First error", "Second error"] } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "First error" },
			]);
		});

		it("should return an empty string for out-of-bounds array index with bracket notation", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "errors.title[99]" },
			];
			const context = { errors: { title: ["Only error"] } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});

		it("should return an empty string for non-array bracket access", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "errors.title[0]" },
			];
			const context = { errors: { title: "Not an array" } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});
	});

	describe("Evaluator – if node evaluation", () => {
		it("should keep children if condition is truthy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "show",
					children: [{ type: "text", value: "Visible" }],
					alternate: [{ type: "text", value: "Hidden" }],
				},
			];

			const context = { show: true };
			const result = evaluator.evaluate(ast, context);
			assert.ok(result[0]?.children);
			assert.deepStrictEqual<string>(result[0]?.children[0]?.value, "Visible");
		});

		it("should keep alternate if condition is falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "show",
					children: [{ type: "text", value: "Visible" }],
					alternate: [{ type: "text", value: "Hidden" }],
				},
			];

			const context = { show: false };
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual<number>(result[0]?.children?.length, 0);
			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual<string>(result[0].alternate[0].value, "Hidden");
		});

		it("should fallback to alternate when condition path is missing", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "user.loggedIn",
					children: [{ type: "text", value: "Welcome" }],
					alternate: [{ type: "text", value: "Please login" }],
				},
			];

			const context = {};
			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<number>(result[0]?.children.length, 0);

			assert.ok(result[0]?.alternate);
			assert.deepStrictEqual<string>(
				result[0]?.alternate[0]?.value,
				"Please login",
			);
		});

		it("should support nested condition resolution", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "user.loggedIn",
					children: [{ type: "text", value: "Yes" }],
					alternate: [{ type: "text", value: "No" }],
				},
			];

			const context = { user: { loggedIn: true } };
			const result = evaluator.evaluate(ast, context);
			assert.ok(result[0]?.children);
			assert.deepStrictEqual<string>(result[0]?.children[0]?.value, "Yes");
		});

		it("should treat 0 as falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "zero",
					children: [{ type: "text", value: "Truthy" }],
					alternate: [{ type: "text", value: "Falsy" }],
				},
			];
			const context = { zero: 0 };
			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<number>(result[0]?.children.length, 0);

			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual<string>(result[0].alternate[0].value, "Falsy");
		});

		it("should treat empty string as falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "empty",
					children: [{ type: "text", value: "Truthy" }],
					alternate: [{ type: "text", value: "Falsy" }],
				},
			];
			const context = { empty: "" };
			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<number>(result[0]?.children.length, 0);

			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual<string>(result[0].alternate[0].value, "Falsy");
		});

		it("should treat null as falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "nil",
					children: [{ type: "text", value: "Truthy" }],
					alternate: [{ type: "text", value: "Falsy" }],
				},
			];
			const context = { nil: null };
			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<number>(result[0]?.children.length, 0);

			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual<string>(result[0].alternate[0].value, "Falsy");
		});

		it("should treat missing key as falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "missing",
					children: [{ type: "text", value: "Truthy" }],
					alternate: [{ type: "text", value: "Falsy" }],
				},
			];
			const context = {};
			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<number>(result[0]?.children.length, 0);

			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual<string>(result[0].alternate[0].value, "Falsy");
		});
	});

	describe("Evaluator – for loop evaluation", () => {
		it("should evaluate a loop over an array", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "items",
					iterator: "item",
					children: [{ type: "variable", value: "item" }],
				},
			];

			const context = { items: ["A", "B"] };
			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<[string, string]>(
				result[0]?.children.map((c) => c.value),
				["A", "B"],
			);
		});

		it("should evaluate nested dot-path arrays", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "user.favorites",
					iterator: "fav",
					children: [{ type: "variable", value: "fav" }],
				},
			];

			const context = { user: { favorites: ["Red", "Blue"] } };
			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<[string, string]>(
				result[0].children.map((c) => c.value),
				["Red", "Blue"],
			);
		});

		it("should return empty children for non-array value", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "user.favorites",
					iterator: "fav",
					children: [{ type: "variable", value: "fav" }],
				},
			];

			const context = { user: { favorites: null } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result[0]?.children, []);
		});

		it("should return empty children if iterator is missing", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "items",
					children: [{ type: "variable", value: "item" }],
				},
			];

			const context = { items: ["X"] };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result[0]?.children, []);
		});

		it("should support variables inside loop using the iterator", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "items",
					iterator: "item",
					children: [{ type: "variable", value: "item.name" }],
				},
			];

			const context = {
				items: [{ name: "Alpha" }, { name: "Beta" }],
			};

			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<[string, string]>(
				result[0]?.children.map((c) => c.value),
				["Alpha", "Beta"],
			);
		});
	});

	describe("Evaluator – block evaluation", () => {
		it("should recursively evaluate children in a block", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "block",
					value: "content",
					children: [
						{ type: "text", value: "Hello, " },
						{ type: "variable", value: "name" },
						{ type: "text", value: "!" },
					],
				},
			];

			const context = { name: "Alice" };
			const result = evaluator.evaluate(ast, context);

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<[string, string, string]>(
				result[0]?.children.map((c) => c.value),
				["Hello, ", "Alice", "!"],
			);
		});

		it("should leave empty block children untouched", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "block",
					value: "empty",
				},
			];

			const result = evaluator.evaluate(ast, {});
			assert.deepStrictEqual<ASTNode[]>(result[0]?.children, []);
		});

		it("should preserve block value", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "block",
					value: "header",
					children: [{ type: "variable", value: "siteName" }],
				},
			];

			const context = { siteName: "test" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<string>(result[0]?.type, "block");
			assert.deepStrictEqual<string>(result[0]?.value, "header");

			assert.ok(result[0]?.children);
			assert.deepStrictEqual<string>(result[0]?.children[0]?.value, "test");
		});
	});

	describe("Negative and Edge Cases", () => {
		it("should return an empty string for empty string values in context", () => {
			const ast: readonly ASTNode[] = [{ type: "variable", value: "emptyStr" }];
			const context = { emptyStr: "" }; // Empty string
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});

		it("should return an empty string for null values in context", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "user.null" },
			];
			const context = { user: { null: null } }; // null value
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});

		it("should handle missing context without throwing an error", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "missingKey" },
			];
			const context = {}; // Missing key
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});

		it("should handle undefined context gracefully", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "undefinedKey" },
			];
			const result = evaluator.evaluate(ast, {});

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "" },
			]);
		});
	});
});

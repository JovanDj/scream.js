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
				{ type: "variable", value: "user.name", children: [] },
			];
			const context = { user: { name: "John" } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "John", children: [] },
			]);
		});

		it("should return an empty string for undefined variables", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "user.age", children: [] },
			];
			const context = { user: { name: "John" } }; // age is not in the context
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "", children: [] },
			]);
		});

		it("should return an empty string for non-serializable or symbolic values", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "user.symbol", children: [] },
			];
			const context = { user: { symbol: Symbol("test") } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "", children: [] },
			]);
		});

		it("should return an empty string for function values", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "user.greet", children: [] },
			];
			const context = { user: { greet: () => "Hello" } }; // function in context
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "", children: [] },
			]);
		});

		it("should escape HTML special characters in variable values", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "xss", children: [] },
			];
			const context = { xss: "<script>alert('x')</script>" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{
					type: "variable",
					value: "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
					children: [],
				},
			]);
		});

		it("should not escape already escaped values", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "safe", children: [] },
			];
			const context = { safe: "&lt;div&gt;" }; // Already escaped
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "&lt;div&gt;", children: [] },
			]);
		});
	});

	describe("Evaluator – if node evaluation", () => {
		it("should keep children if condition is truthy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "show",
					children: [{ type: "text", value: "Visible", children: [] }],
					alternate: [{ type: "text", value: "Hidden", children: [] }],
				},
			];

			const context = { show: true };
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(result[0]?.children[0]?.value, "Visible");
		});

		it("should keep alternate if condition is falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "show",
					children: [{ type: "text", value: "Visible", children: [] }],
					alternate: [{ type: "text", value: "Hidden", children: [] }],
				},
			];

			const context = { show: false };
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(result[0]?.children.length, 0);
			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual(result[0].alternate[0].value, "Hidden");
		});

		it("should fallback to alternate when condition path is missing", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "user.loggedIn",
					children: [{ type: "text", value: "Welcome", children: [] }],
					alternate: [{ type: "text", value: "Please login", children: [] }],
				},
			];

			const context = {};
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(result[0]?.children.length, 0);
			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual(result[0].alternate[0].value, "Please login");
		});

		it("should support nested condition resolution", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "user.loggedIn",
					children: [{ type: "text", value: "Yes", children: [] }],
					alternate: [{ type: "text", value: "No", children: [] }],
				},
			];

			const context = { user: { loggedIn: true } };
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(result[0]?.children[0]?.value, "Yes");
		});

		it("should treat 0 as falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "zero",
					children: [{ type: "text", value: "Truthy", children: [] }],
					alternate: [{ type: "text", value: "Falsy", children: [] }],
				},
			];
			const context = { zero: 0 };
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(result[0]?.children.length, 0);
			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual(result[0].alternate[0].value, "Falsy");
		});

		it("should treat empty string as falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "empty",
					children: [{ type: "text", value: "Truthy", children: [] }],
					alternate: [{ type: "text", value: "Falsy", children: [] }],
				},
			];
			const context = { empty: "" };
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(result[0]?.children.length, 0);
			assert.ok(result[0]?.alternate?.[0]);
			assert.deepStrictEqual(result[0].alternate[0].value, "Falsy");
		});

		it("should treat null as falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "nil",
					children: [{ type: "text", value: "Truthy", children: [] }],
					alternate: [{ type: "text", value: "Falsy", children: [] }],
				},
			];
			const context = { nil: null };
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(result[0]?.children.length, 0);
			assert.ok(result[0]?.alternate?.[0]);

			assert.deepStrictEqual(result[0].alternate[0].value, "Falsy");
		});

		it("should treat missing key as falsy", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "if",
					value: "missing",
					children: [{ type: "text", value: "Truthy", children: [] }],
					alternate: [{ type: "text", value: "Falsy", children: [] }],
				},
			];
			const context = {};
			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(result[0]?.children.length, 0);
			assert.ok(result[0]?.alternate?.[0]);

			assert.deepStrictEqual(result[0].alternate[0].value, "Falsy");
		});
	});

	describe("Evaluator – for loop evaluation", () => {
		it("should evaluate a loop over an array", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "items",
					iterator: "item",
					children: [{ type: "variable", value: "item", children: [] }],
				},
			];

			const context = { items: ["A", "B"] };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(
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
					children: [{ type: "variable", value: "fav", children: [] }],
				},
			];

			const context = { user: { favorites: ["Red", "Blue"] } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(
				result[0]?.children.map((c) => c.value),
				["Red", "Blue"],
			);
		});

		it("should return empty children for non-array value", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "user.favorites",
					iterator: "fav",
					children: [{ type: "variable", value: "fav", children: [] }],
				},
			];

			const context = { user: { favorites: null } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result[0]?.children, []);
		});

		it("should return empty children if iterator is missing", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "items",
					children: [{ type: "variable", value: "item", children: [] }],
				},
			];

			const context = { items: ["X"] };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result[0]?.children, []);
		});

		it("should support variables inside loop using the iterator", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "for",
					value: "items",
					iterator: "item",
					children: [{ type: "variable", value: "item.name", children: [] }],
				},
			];

			const context = {
				items: [{ name: "Alpha" }, { name: "Beta" }],
			};

			const result = evaluator.evaluate(ast, context);
			assert.deepStrictEqual(
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
						{ type: "text", value: "Hello, ", children: [] },
						{ type: "variable", value: "name", children: [] },
						{ type: "text", value: "!", children: [] },
					],
				},
			];

			const context = { name: "Alice" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(
				result[0]?.children.map((c) => c.value),
				["Hello, ", "Alice", "!"],
			);
		});

		it("should leave empty block children untouched", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "block",
					value: "empty",
					children: [],
				},
			];

			const result = evaluator.evaluate(ast, {});
			assert.deepStrictEqual(result[0]?.children, []);
		});

		it("should preserve block value", () => {
			const ast: readonly ASTNode[] = [
				{
					type: "block",
					value: "header",
					children: [{ type: "variable", value: "siteName", children: [] }],
				},
			];

			const context = { siteName: "test" };
			const result = evaluator.evaluate(ast, context);

			assert.strictEqual(result[0]?.type, "block");
			assert.strictEqual(result[0]?.value, "header");
			assert.strictEqual(result[0]?.children[0]?.value, "test");
		});
	});

	describe("Negative and Edge Cases", () => {
		it("should return an empty string for empty string values in context", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "emptyStr", children: [] },
			];
			const context = { emptyStr: "" }; // Empty string
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "", children: [] },
			]);
		});

		it("should return an empty string for null values in context", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "user.null", children: [] },
			];
			const context = { user: { null: null } }; // null value
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "", children: [] },
			]);
		});

		it("should handle missing context without throwing an error", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "missingKey", children: [] },
			];
			const context = {}; // Missing key
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "", children: [] },
			]);
		});

		it("should handle undefined context gracefully", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "undefinedKey", children: [] },
			];
			const result = evaluator.evaluate(ast, {});

			assert.deepStrictEqual(result, [
				{ type: "variable", value: "", children: [] },
			]);
		});
	});
});

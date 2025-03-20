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
				{ children: [], type: "variable", value: "user.name" },
			];
			const context = { user: { name: "John" } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ children: [], type: "variable", value: "John" },
			]);
		});

		it("should return an empty string for undefined variables", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.age" },
			];
			const context = { user: { name: "John" } }; // age is not in the context
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should return an empty string for non-serializable or symbolic values", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.symbol" },
			];
			const context = { user: { symbol: Symbol("test") } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should return an empty string for function values", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.greet" },
			];
			const context = { user: { greet: () => "Hello" } }; // function in context
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should escape HTML special characters in variable values", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "xss" },
			];
			const context = { xss: "<script>alert('x')</script>" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value: "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
				},
			]);
		});

		it("should not escape already escaped values", () => {
			const ast: readonly ASTNode[] = [{ type: "variable", value: "safe" }];
			const context = { safe: "&lt;div&gt;" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
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
					alternate: [{ children: [], type: "text", value: "Hidden" }],
					children: [{ children: [], type: "text", value: "Visible" }],
					type: "if",
					value: "show",
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
					alternate: [{ children: [], type: "text", value: "Hidden" }],
					children: [{ children: [], type: "text", value: "Visible" }],
					type: "if",
					value: "show",
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
					alternate: [{ children: [], type: "text", value: "Please login" }],
					children: [{ children: [], type: "text", value: "Welcome" }],
					type: "if",
					value: "user.loggedIn",
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
					alternate: [{ children: [], type: "text", value: "No" }],
					children: [{ children: [], type: "text", value: "Yes" }],
					type: "if",
					value: "user.loggedIn",
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
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "zero",
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
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "empty",
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
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "nil",
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
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "missing",
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
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
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
					children: [{ children: [], type: "variable", value: "fav" }],
					iterator: "fav",
					type: "for",
					value: "user.favorites",
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
					children: [{ children: [], type: "variable", value: "fav" }],
					iterator: "fav",
					type: "for",
					value: "user.favorites",
				},
			];

			const context = { user: { favorites: null } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result[0]?.children, []);
		});

		it("should return empty children if iterator is missing", () => {
			const ast: readonly ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					type: "for",
					value: "items",
				},
			];

			const context = { items: ["X"] };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result[0]?.children, []);
		});

		it("should support variables inside loop using the iterator", () => {
			const ast: readonly ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item.name" }],
					iterator: "item",
					type: "for",
					value: "items",
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
					children: [
						{ children: [], type: "text", value: "Hello, " },
						{ children: [], type: "variable", value: "name" },
						{ children: [], type: "text", value: "!" },
					],
					type: "block",
					value: "content",
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
					children: [],
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
					children: [{ children: [], type: "variable", value: "siteName" }],
					type: "block",
					value: "header",
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
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "emptyStr" },
			];
			const context = { emptyStr: "" }; // Empty string
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should return an empty string for null values in context", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.null" },
			];
			const context = { user: { null: null } }; // null value
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should handle missing context without throwing an error", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "missingKey" },
			];
			const context = {}; // Missing key
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should handle undefined context gracefully", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "undefinedKey" },
			];
			const result = evaluator.evaluate(ast, {});

			assert.deepStrictEqual(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});
	});
});

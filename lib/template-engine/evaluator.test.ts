import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Evaluator } from "./evaluator.js";
import type { ASTNode } from "./parser.js";

describe("Evaluator", { concurrency: true }, () => {
	let evaluator: Evaluator;

	beforeEach(() => {
		evaluator = new Evaluator();
	});

	describe("Variable Resolution", () => {
		it("should resolve a variable from context", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.name" },
			];
			const context = { user: { name: "John" } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "John" },
			]);
		});

		it("should return an empty string for undefined variables", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.age" },
			];
			const context = { user: { name: "John" } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should return an empty string for non-serializable or symbolic values", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.symbol" },
			];
			const context = { user: { symbol: Symbol("test") } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should return an empty string for function values", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.greet" },
			];
			const context = { user: { greet: () => "Hello" } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "" },
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

		it("should render arrays by joining values", () => {
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "errors.title" },
			];
			const context = { errors: { title: ["First", "Second"] } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "First, Second" },
			]);
		});

		it("should resolve array length via dot notation", () => {
			const ast: readonly ASTNode[] = [
				{ path: ["items", "length"], type: "variable" },
			];
			const context = { items: [{ id: 1 }, { id: 2 }] };

			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ path: ["items", "length"], type: "variable", value: "2" },
			]);
		});

		it("should invoke functions encountered in path", () => {
			const ast: readonly ASTNode[] = [
				{ path: ["encodeInputName", "todo", "title"], type: "variable" },
			];
			const context = {
				encodeInputName: (path: string) => `encoded:${path}`,
			};

			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					path: ["encodeInputName", "todo", "title"],
					type: "variable",
					value: "encoded:todo.title",
				},
			]);
		});
	});

	describe("HTML entities escaping", () => {
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "&lt;div&gt;" },
			]);
		});

		it("should escape ampersand", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "val" },
			];
			const context = { val: "Fish & Chips" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "Fish &amp; Chips" },
			]);
		});

		it("should escape less-than and greater-than", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "val" },
			];
			const context = { val: "<tag>content</tag>" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value: "&lt;tag&gt;content&lt;/tag&gt;",
				},
			]);
		});

		it("should escape double and single quotes", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "quote" },
			];
			const context = { quote: `"O'Reilly"` };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value: "&quot;O&#39;Reilly&quot;",
				},
			]);
		});

		it("should escape multiple characters in one string", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "combo" },
			];
			const context = { combo: `<a href="x">O'Reilly & Friends</a>` };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value:
						"&lt;a href=&quot;x&quot;&gt;O&#39;Reilly &amp; Friends&lt;/a&gt;",
				},
			]);
		});

		it("should not double-escape already safe values mixed with raw", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "val" },
			];
			const context = { val: "&lt;safe&gt;<unsafe>" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value: "&lt;safe&gt;&lt;unsafe&gt;",
				},
			]);
		});
	});

	describe("if node evaluation", () => {
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [],
					children: [{ children: [], type: "text", value: "Visible" }],
					type: "if",
					value: "show",
				},
			]);
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Hidden" }],
					children: [],
					type: "if",
					value: "show",
				},
			]);
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Please login" }],
					children: [],
					type: "if",
					value: "user.loggedIn",
				},
			]);
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [],
					children: [{ children: [], type: "text", value: "Yes" }],
					type: "if",
					value: "user.loggedIn",
				},
			]);
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [],
					type: "if",
					value: "zero",
				},
			]);
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [],
					type: "if",
					value: "empty",
				},
			]);
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [],
					type: "if",
					value: "nil",
				},
			]);
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

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [],
					type: "if",
					value: "missing",
				},
			]);
		});
	});

	describe("for loop evaluation", () => {
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

		it("should resolve iterator variable inside for-loop", () => {
			const ast: readonly ASTNode[] = [
				{
					children: [{ path: ["item"], type: "variable" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context = { items: ["A", "B"] };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [
						{ path: ["item"], type: "variable", value: "A" },
						{ path: ["item"], type: "variable", value: "B" },
					],
					iterator: "item",
					type: "for",
					value: "items",
				},
			]);
		});

		it("should resolve iterator property access inside for-loop", () => {
			const ast: readonly ASTNode[] = [
				{
					children: [{ path: ["item", "name"], type: "variable" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context = { items: [{ name: "Alpha" }, { name: "Beta" }] };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [
						{ path: ["item", "name"], type: "variable", value: "Alpha" },
						{ path: ["item", "name"], type: "variable", value: "Beta" },
					],
					iterator: "item",
					type: "for",
					value: "items",
				},
			]);
		});
	});

	describe("block evaluation", () => {
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
			const context = { emptyStr: "" };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should return an empty string for null values in context", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.null" },
			];
			const context = { user: { null: null } };
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should handle missing context without throwing an error", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "missingKey" },
			];
			const context = {};
			const result = evaluator.evaluate(ast, context);

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should handle undefined context gracefully", () => {
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "undefinedKey" },
			];
			const result = evaluator.evaluate(ast, {});

			assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});
	});
});

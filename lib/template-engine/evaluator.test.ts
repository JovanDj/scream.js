import { beforeEach, describe, it, type TestContext } from "node:test";
import type { RenderContext } from "./context.js";
import { Evaluator } from "./evaluator.js";
import type { ASTNode } from "./parser.js";

describe("Evaluator", { concurrency: true }, () => {
	let evaluator: Evaluator;

	beforeEach(() => {
		evaluator = new Evaluator();
	});

	describe("Variable Resolution", () => {
		it("should resolve a variable from context", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.name" },
			];
			const context: RenderContext = { user: { name: "John" } };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "John" },
			]);
		});

		it("should throw for undefined variables", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.age" },
			];
			const context: RenderContext = { user: { name: "John" } };

			t.assert.throws(() => evaluator.evaluate(ast, context), /Missing value/);
		});

		it("should throw for non-serializable or symbolic values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.symbol" },
			];
			const context: RenderContext = { user: { symbol: Symbol("test") } };

			t.assert.throws(() => evaluator.evaluate(ast, context), /Cannot render/);
		});

		it("should throw for function values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.greet" },
			];
			const context: RenderContext = { user: { greet: () => "Hello" } };

			t.assert.throws(() => evaluator.evaluate(ast, context), /Cannot render/);
		});

		it("should resolve array elements using bracket notation", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "errors.title[0]" },
			];
			const context: RenderContext = {
				errors: { title: ["First error", "Second error"] },
			};
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "First error" },
			]);
		});

		it("should throw for out-of-bounds array index with bracket notation", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "errors.title[99]" },
			];
			const context: RenderContext = { errors: { title: ["Only error"] } };

			t.assert.throws(() => evaluator.evaluate(ast, context), /Missing value/);
		});

		it("should throw for non-array bracket access", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "errors.title[0]" },
			];
			const context: RenderContext = { errors: { title: "Not an array" } };

			t.assert.throws(() => evaluator.evaluate(ast, context), /Missing value/);
		});

		it("should throw when rendering arrays directly", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ type: "variable", value: "errors.title" },
			];
			const context: RenderContext = {
				errors: { title: ["First", "Second"] },
			};

			t.assert.throws(() => evaluator.evaluate(ast, context), /Cannot render/);
		});
	});

	describe("HTML entities escaping", () => {
		it("should escape HTML special characters in variable values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "xss" },
			];
			const context: RenderContext = { xss: "<script>alert('x')</script>" };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value: "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
				},
			]);
		});

		it("should not escape already escaped values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [{ type: "variable", value: "safe" }];
			const context: RenderContext = { safe: "&lt;div&gt;" };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ type: "variable", value: "&lt;div&gt;" },
			]);
		});

		it("should escape ampersand", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "val" },
			];
			const context: RenderContext = { val: "Fish & Chips" };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "Fish &amp; Chips" },
			]);
		});

		it("should escape less-than and greater-than", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "val" },
			];
			const context: RenderContext = { val: "<tag>content</tag>" };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value: "&lt;tag&gt;content&lt;/tag&gt;",
				},
			]);
		});

		it("should escape double and single quotes", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "quote" },
			];
			const context: RenderContext = { quote: `"O'Reilly"` };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value: "&quot;O&#39;Reilly&quot;",
				},
			]);
		});

		it("should escape multiple characters in one string", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "combo" },
			];
			const context: RenderContext = {
				combo: `<a href="x">O'Reilly & Friends</a>`,
			};
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value:
						"&lt;a href=&quot;x&quot;&gt;O&#39;Reilly &amp; Friends&lt;/a&gt;",
				},
			]);
		});

		it("should not double-escape already safe values mixed with raw", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "val" },
			];
			const context: RenderContext = { val: "&lt;safe&gt;<unsafe>" };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [],
					type: "variable",
					value: "&lt;safe&gt;&lt;unsafe&gt;",
				},
			]);
		});
	});

	describe("if node evaluation", () => {
		it("should keep children if condition is truthy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Hidden" }],
					children: [{ children: [], type: "text", value: "Visible" }],
					type: "if",
					value: "show",
				},
			];

			const context: RenderContext = { show: true };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [],
					children: [{ children: [], type: "text", value: "Visible" }],
					type: "if",
					value: "show",
				},
			]);
		});

		it("should keep alternate if condition is falsy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Hidden" }],
					children: [{ children: [], type: "text", value: "Visible" }],
					type: "if",
					value: "show",
				},
			];

			const context: RenderContext = { show: false };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Hidden" }],
					children: [],
					type: "if",
					value: "show",
				},
			]);
		});

		it("should throw when condition path is missing", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Please login" }],
					children: [{ children: [], type: "text", value: "Welcome" }],
					type: "if",
					value: "user.loggedIn",
				},
			];

			const context: RenderContext = {};

			t.assert.throws(() => evaluator.evaluate(ast, context), /Missing value/);
		});

		it("should support nested condition resolution", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "No" }],
					children: [{ children: [], type: "text", value: "Yes" }],
					type: "if",
					value: "user.loggedIn",
				},
			];

			const context: RenderContext = { user: { loggedIn: true } };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [],
					children: [{ children: [], type: "text", value: "Yes" }],
					type: "if",
					value: "user.loggedIn",
				},
			]);
		});

		it("should treat 0 as falsy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "zero",
				},
			];
			const context: RenderContext = { zero: 0 };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [],
					type: "if",
					value: "zero",
				},
			]);
		});

		it("should treat empty string as falsy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "empty",
				},
			];
			const context: RenderContext = { empty: "" };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [],
					type: "if",
					value: "empty",
				},
			]);
		});

		it("should treat null as falsy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "nil",
				},
			];
			const context: RenderContext = { nil: null };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [],
					type: "if",
					value: "nil",
				},
			]);
		});

		it("should throw for missing condition keys", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "missing",
				},
			];
			const context: RenderContext = {};

			t.assert.throws(() => evaluator.evaluate(ast, context), /Missing value/);
		});
	});

	describe("for loop evaluation", () => {
		it("should evaluate a loop over an array", (t: TestContext) => {
			t.plan(2);
			const ast: readonly ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];

			const context: RenderContext = { items: ["A", "B"] };
			const result = evaluator.evaluate(ast, context);

			t.assert.ok(result[0]?.children);
			t.assert.deepStrictEqual<[string, string]>(
				result[0]?.children.map((c) => c.value),
				["A", "B"],
			);
		});

		it("should evaluate nested dot-path arrays", (t: TestContext) => {
			t.plan(2);
			const ast: readonly ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "fav" }],
					iterator: "fav",
					type: "for",
					value: "user.favorites",
				},
			];

			const context: RenderContext = { user: { favorites: ["Red", "Blue"] } };
			const result = evaluator.evaluate(ast, context);

			t.assert.ok(result[0]?.children);
			t.assert.deepStrictEqual<[string, string]>(
				result[0].children.map((c) => c.value),
				["Red", "Blue"],
			);
		});

		it("should throw for non-array value", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "fav" }],
					iterator: "fav",
					type: "for",
					value: "user.favorites",
				},
			];

			const context: RenderContext = { user: { favorites: null } };

			t.assert.throws(
				() => evaluator.evaluate(ast, context),
				/Loop collection must be an array/,
			);
		});

		it("should throw if iterator is missing", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					type: "for",
					value: "items",
				},
			];

			const context: RenderContext = { items: ["X"] };

			t.assert.throws(
				() => evaluator.evaluate(ast, context),
				/Missing loop iterator/,
			);
		});

		it("should support variables inside loop using the iterator", (t: TestContext) => {
			t.plan(2);
			const ast: readonly ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item.name" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];

			const context: RenderContext = {
				items: [{ name: "Alpha" }, { name: "Beta" }],
			};

			const result = evaluator.evaluate(ast, context);

			t.assert.ok(result[0]?.children);
			t.assert.deepStrictEqual<[string, string]>(
				result[0]?.children.map((c) => c.value),
				["Alpha", "Beta"],
			);
		});

		it("should resolve iterator variable inside for-loop", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					children: [{ path: ["item"], type: "variable" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context: RenderContext = { items: ["A", "B"] };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
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

		it("should resolve iterator property access inside for-loop", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					children: [{ path: ["item", "name"], type: "variable" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context: RenderContext = {
				items: [{ name: "Alpha" }, { name: "Beta" }],
			};
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
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
		it("should recursively evaluate children in a block", (t: TestContext) => {
			t.plan(2);
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

			const context: RenderContext = { name: "Alice" };
			const result = evaluator.evaluate(ast, context);

			t.assert.ok(result[0]?.children);
			t.assert.deepStrictEqual<[string, string, string]>(
				result[0]?.children.map((c) => c.value),
				["Hello, ", "Alice", "!"],
			);
		});

		it("should leave empty block children untouched", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{
					children: [],
					type: "block",
					value: "empty",
				},
			];

			const result = evaluator.evaluate(ast, {});
			t.assert.deepStrictEqual<ASTNode[]>(result[0]?.children, []);
		});

		it("should preserve block value", (t: TestContext) => {
			t.plan(4);
			const ast: readonly ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "siteName" }],
					type: "block",
					value: "header",
				},
			];

			const context: RenderContext = { siteName: "test" };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<string>(result[0]?.type, "block");
			t.assert.deepStrictEqual<string>(result[0]?.value, "header");

			t.assert.ok(result[0]?.children);
			t.assert.deepStrictEqual<string>(result[0]?.children[0]?.value, "test");
		});
	});

	describe("Negative and Edge Cases", () => {
		it("should return an empty string for empty string values in context", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "emptyStr" },
			];
			const context: RenderContext = { emptyStr: "" };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "variable", value: "" },
			]);
		});

		it("should throw for null values in output expressions", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "user.null" },
			];
			const context: RenderContext = { user: { null: null } };

			t.assert.throws(() => evaluator.evaluate(ast, context), /Cannot render/);
		});

		it("should throw for missing context values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "missingKey" },
			];
			const context: RenderContext = {};

			t.assert.throws(() => evaluator.evaluate(ast, context), /Missing value/);
		});

		it("should throw for undefined context values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly ASTNode[] = [
				{ children: [], type: "variable", value: "undefinedKey" },
			];

			t.assert.throws(() => evaluator.evaluate(ast, {}), /Missing value/);
		});
	});
});

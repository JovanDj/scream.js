import { beforeEach, describe, it, type TestContext } from "node:test";

import type { TemplateASTNode } from "./ast.js";
import type { RenderContext } from "./context.js";
import { Evaluator } from "./evaluator.js";
import type { RenderNode } from "./render-node.js";

describe("Evaluator", { concurrency: true }, () => {
	let evaluator: Evaluator;

	beforeEach(() => {
		evaluator = new Evaluator();
	});

	describe("Variable Resolution", () => {
		it("should resolve a variable from context", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["user", "name"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const context: RenderContext = { user: { name: "John" } };
			const result = evaluator.evaluate(ast, context);

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "John" },
			]);
		});

		it("should throw for undefined variables", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["user", "age"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () => evaluator.evaluate(ast, { user: { name: "John" } });

			t.assert.throws(act, /Missing value/);
		});

		it("should throw for undefined own properties", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["user", "age"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () => evaluator.evaluate(ast, { user: { age: undefined } });

			t.assert.throws(act, /Cannot render/);
		});

		it("should render boolean values as strings", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["isActive"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
				{
					expression: {
						segments: ["isArchived"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, {
				isActive: true,
				isArchived: false,
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "true" },
				{ type: "text", value: "false" },
			]);
		});

		it("should render number values as strings", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["count"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, { count: 42 });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "42" },
			]);
		});

		it("should throw for non-serializable or symbolic values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["user", "symbol"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () =>
				evaluator.evaluate(ast, { user: { symbol: Symbol("test") } });

			t.assert.throws(act, /Cannot render/);
		});

		it("should throw for function values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["user", "greet"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () =>
				evaluator.evaluate(ast, { user: { greet: () => "Hello" } });

			t.assert.throws(act, /Cannot render/);
		});

		it("should resolve array elements using bracket notation", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["errors", "title", 0],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, {
				errors: { title: ["First error", "Second error"] },
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "First error" },
			]);
		});

		it("should throw for out-of-bounds array index with bracket notation", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["errors", "title", 99],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () =>
				evaluator.evaluate(ast, { errors: { title: ["Only error"] } });

			t.assert.throws(act, /Missing value/);
		});

		it("should throw for non-array bracket access", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["errors", "title", 0],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () =>
				evaluator.evaluate(ast, { errors: { title: "Not an array" } });

			t.assert.throws(act, /Missing value/);
		});

		it("should throw when rendering arrays directly", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["errors", "title"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () =>
				evaluator.evaluate(ast, { errors: { title: ["First", "Second"] } });

			t.assert.throws(act, /Cannot render/);
		});
	});

	describe("HTML entities escaping", () => {
		it("should escape HTML special characters in variable values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["xss"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, {
				xss: "<script>alert('x')</script>",
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{
					type: "text",
					value: "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
				},
			]);
		});

		it("should not escape already escaped values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["safe"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, { safe: "&lt;div&gt;" });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "&lt;div&gt;" },
			]);
		});

		it("should escape ampersand", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["val"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, { val: "Fish & Chips" });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Fish &amp; Chips" },
			]);
		});

		it("should escape less-than and greater-than", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["val"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, { val: "<tag>content</tag>" });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "&lt;tag&gt;content&lt;/tag&gt;" },
			]);
		});

		it("should escape double and single quotes", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["quote"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, { quote: `"O'Reilly"` });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "&quot;O&#39;Reilly&quot;" },
			]);
		});

		it("should escape multiple characters in one string", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["combo"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, {
				combo: `<a href="x">O'Reilly & Friends</a>`,
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{
					type: "text",
					value:
						"&lt;a href=&quot;x&quot;&gt;O&#39;Reilly &amp; Friends&lt;/a&gt;",
				},
			]);
		});

		it("should not double-escape already safe values mixed with raw", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["val"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, {
				val: "&lt;safe&gt;<unsafe>",
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "&lt;safe&gt;&lt;unsafe&gt;" },
			]);
		});
	});

	describe("if node evaluation", () => {
		it("should keep children if condition is truthy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Hidden" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Visible" },
					],
					condition: {
						segments: ["show"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];
			const result = evaluator.evaluate(ast, { show: true });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Visible" },
			]);
		});

		it("should keep alternate if condition is falsy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Hidden" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Visible" },
					],
					condition: {
						segments: ["show"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];
			const result = evaluator.evaluate(ast, { show: false });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Hidden" },
			]);
		});

		it("should throw when condition path is missing", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Please login" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Welcome" },
					],
					condition: {
						segments: ["user", "loggedIn"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];
			const act = () => evaluator.evaluate(ast, {});

			t.assert.throws(act, /Missing value/);
		});

		it("should support nested condition resolution", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "No" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Yes" },
					],
					condition: {
						segments: ["user", "loggedIn"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];
			const result = evaluator.evaluate(ast, { user: { loggedIn: true } });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Yes" },
			]);
		});

		it("should treat 0 as falsy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Falsy" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Truthy" },
					],
					condition: {
						segments: ["zero"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];
			const result = evaluator.evaluate(ast, { zero: 0 });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Falsy" },
			]);
		});

		it("should treat empty string as falsy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Falsy" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Truthy" },
					],
					condition: {
						segments: ["empty"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];
			const result = evaluator.evaluate(ast, { empty: "" });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Falsy" },
			]);
		});

		it("should treat null as falsy", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Falsy" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Truthy" },
					],
					condition: {
						segments: ["nil"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];
			const result = evaluator.evaluate(ast, { nil: null });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Falsy" },
			]);
		});

		it("should throw for missing condition keys", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Falsy" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Truthy" },
					],
					condition: {
						segments: ["missing"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];
			const act = () => evaluator.evaluate(ast, {});

			t.assert.throws(act, /Missing value/);
		});
	});

	describe("for loop evaluation", () => {
		it("should evaluate a loop over an array", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["item"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const result = evaluator.evaluate(ast, { items: ["A", "B"] });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "A" },
				{ type: "text", value: "B" },
			]);
		});

		it("should evaluate nested dot-path arrays", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["fav"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["user", "favorites"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "fav",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const result = evaluator.evaluate(ast, {
				user: { favorites: ["Red", "Blue"] },
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Red" },
				{ type: "text", value: "Blue" },
			]);
		});

		it("should throw for non-array value", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["fav"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["user", "favorites"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "fav",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const act = () => evaluator.evaluate(ast, { user: { favorites: null } });

			t.assert.throws(act, /Loop collection must be an array/);
		});

		it("should throw when loop collection is missing", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["item"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const act = () => evaluator.evaluate(ast, {});

			t.assert.throws(act, /Missing value/);
		});

		it("should support variables inside loop using the iterator", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["item", "name"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const result = evaluator.evaluate(ast, {
				items: [{ name: "Alpha" }, { name: "Beta" }],
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Alpha" },
				{ type: "text", value: "Beta" },
			]);
		});

		it("should resolve iterator variable inside for-loop", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["item"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const result = evaluator.evaluate(ast, { items: ["A", "B"] });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "A" },
				{ type: "text", value: "B" },
			]);
		});

		it("should resolve iterator property access inside for-loop", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["item", "name"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const result = evaluator.evaluate(ast, {
				items: [{ name: "Alpha" }, { name: "Beta" }],
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Alpha" },
				{ type: "text", value: "Beta" },
			]);
		});

		it("should evaluate nested loops", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							children: [
								{
									expression: {
										segments: ["item"],
										span: { end: 0, start: 0 },
										type: "path",
									},
									span: { end: 0, start: 0 },
									type: "variable",
								},
							],
							collection: {
								segments: ["group", "items"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							iterator: "item",
							span: { end: 0, start: 0 },
							type: "for",
						},
					],
					collection: {
						segments: ["groups"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "group",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const result = evaluator.evaluate(ast, {
				groups: [{ items: ["A", "B"] }, { items: ["C"] }],
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "A" },
				{ type: "text", value: "B" },
				{ type: "text", value: "C" },
			]);
		});

		it("should shadow outer context values with iterator values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["item"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];
			const result = evaluator.evaluate(ast, {
				item: "Outer",
				items: ["Inner"],
			});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "Inner" },
			]);
		});

		it("should not leak iterator values outside loops", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["item"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
				{
					expression: {
						segments: ["item"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () => evaluator.evaluate(ast, { items: ["Inner"] });

			t.assert.throws(act, /Missing value/);
		});
	});

	describe("block evaluation", () => {
		it("should recursively evaluate children in a block", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Hello, " },
						{
							expression: {
								segments: ["name"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
						{ span: { end: 0, start: 0 }, type: "text", value: "!" },
					],
					name: "content",
					span: { end: 0, start: 0 },
					type: "block",
				},
			];
			const result = evaluator.evaluate(ast, { name: "Alice" });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{
					children: [
						{ type: "text", value: "Hello, " },
						{ type: "text", value: "Alice" },
						{ type: "text", value: "!" },
					],
					type: "block",
				},
			]);
		});

		it("should leave empty block children untouched", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [],
					name: "empty",
					span: { end: 0, start: 0 },
					type: "block",
				},
			];
			const result = evaluator.evaluate(ast, {});

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ children: [], type: "block" },
			]);
		});

		it("should preserve block value", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["siteName"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					name: "header",
					span: { end: 0, start: 0 },
					type: "block",
				},
			];
			const result = evaluator.evaluate(ast, { siteName: "test" });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{
					children: [{ type: "text", value: "test" }],
					type: "block",
				},
			]);
		});
	});

	describe("Negative and Edge Cases", () => {
		it("should return an empty string for empty string values in context", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["emptyStr"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const result = evaluator.evaluate(ast, { emptyStr: "" });

			t.assert.deepStrictEqual<readonly RenderNode[]>(result, [
				{ type: "text", value: "" },
			]);
		});

		it("should throw for null values in output expressions", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["user", "null"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () => evaluator.evaluate(ast, { user: { null: null } });

			t.assert.throws(act, /Cannot render/);
		});

		it("should throw for missing context values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["missingKey"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () => evaluator.evaluate(ast, {});

			t.assert.throws(act, /Missing value/);
		});

		it("should throw for undefined context values", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					expression: {
						segments: ["undefinedKey"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "variable",
				},
			];
			const act = () => evaluator.evaluate(ast, {});

			t.assert.throws(act, /Missing value/);
		});

		it("should throw when extends nodes reach evaluation", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 0, start: 0 },
					template: "layout.scream",
					type: "extends",
				},
			];
			const act = () => evaluator.evaluate(ast, {});

			t.assert.throws(act, /Extends nodes must be resolved before evaluation/);
		});
	});
});

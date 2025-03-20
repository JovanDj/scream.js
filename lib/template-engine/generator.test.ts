import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Generator } from "./generator.js";
import type { ASTNode } from "./parser.js";

describe("Generator", { concurrency: true }, () => {
	let generator: Generator;

	beforeEach(() => {
		generator = new Generator();
	});

	describe("Text nodes", () => {
		it("should return the text value of a text node", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "Hello, World!" },
			];
			const result = generator.generate(ast, {});
			assert.deepStrictEqual(result, "Hello, World!");
		});

		it("should handle empty text nodes", () => {
			const ast: ASTNode[] = [{ children: [], type: "text", value: "" }];
			const result = generator.generate(ast, {});
			assert.deepStrictEqual(result, "");
		});
	});

	describe("Variable nodes", () => {
		it("should replace a single variable", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "variable", value: "name" },
			];
			const context = { name: "John" };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "John");
		});

		it("should return an empty string for undefined variables", () => {
			const ast: ASTNode[] = [{ children: [], type: "variable", value: "age" }];
			const context = {};
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should handle nested variables", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "variable", value: "user.name" },
			];
			const context = { user: { name: "Jane" } };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Jane");
		});

		it("should render empty string for non-serializable or symbolic values", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "variable", value: "weird" },
			];
			const context = { weird: Symbol("test") };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should render empty string for function values", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "variable", value: "func" },
			];
			const context = { func: () => "hi" };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should render empty string for object values", () => {
			const ast: ASTNode[] = [{ children: [], type: "variable", value: "obj" }];
			const context = { obj: { a: 1 } };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should escape HTML special characters", () => {
			const ast: ASTNode[] = [{ children: [], type: "variable", value: "xss" }];
			const context = { xss: "<script>alert('x')</script>" };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(
				result,
				"&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
			);
		});

		it("should not escape values that already look escaped", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "variable", value: "safe" },
			];
			const context = { safe: "&lt;div&gt;" };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "&lt;div&gt;");
		});
	});

	describe("Generator - Conditional Nodes", () => {
		it("should render the children of an if node when the condition is true", () => {
			const ast: ASTNode[] = [
				{
					alternate: [],
					children: [{ children: [], type: "text", value: "Welcome, Admin!" }],
					type: "if",
					value: "isAdmin",
				},
			];
			const context = { isAdmin: true };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Welcome, Admin!");
		});

		it("should render the alternate of an if node when the condition is false", () => {
			const ast: ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Access Denied." }],
					children: [{ children: [], type: "text", value: "Welcome, Admin!" }],
					type: "if",
					value: "isAdmin",
				},
			];
			const context = { isAdmin: false };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Access Denied.");
		});

		it("should render nothing if there are no children or alternate", () => {
			const ast: ASTNode[] = [
				{ alternate: [], children: [], type: "if", value: "isAdmin" },
			];
			const context = { isAdmin: false };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should treat number 0 as falsy", () => {
			const ast: ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "zero",
				},
			];
			const context = { zero: 0 };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Falsy");
		});

		it("should treat non-empty string as truthy", () => {
			const ast: ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "str",
				},
			];
			const context = { str: "hello" };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Truthy");
		});

		it("should treat empty string as falsy", () => {
			const ast: ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Falsy" }],
					children: [{ children: [], type: "text", value: "Truthy" }],
					type: "if",
					value: "emptyStr",
				},
			];
			const context = { emptyStr: "" };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Falsy");
		});
	});

	describe("Generator - Loop Nodes", () => {
		it("should iterate over an array and render the children for each item", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context = { items: ["A", "B", "C"] };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "ABC");
		});

		it("should render nothing for an empty array", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context = { items: [] };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should render nothing for non-array values", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context = { items: null };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should support dot notation in collection reference", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "user.items",
				},
			];
			const context = { user: { items: ["A", "B"] } };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "AB");
		});

		it("should render nothing if dot-notated collection is undefined", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "missing.items",
				},
			];
			const context = {};
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should not leak iterator variable outside the for loop", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
				{ children: [], type: "variable", value: "item" },
			];
			const context = { items: ["X"] };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "X");
		});
	});

	describe("Layouts", () => {
		it("should render block content directly if not extended", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Wrapped content" }],
					type: "block",
					value: "content",
				},
			];
			const result = generator.generate(ast, {});
			assert.deepStrictEqual(result, "Wrapped content");
		});

		it("should generate content for simple and nested blocks", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "<main>" },
				{
					children: [{ children: [], type: "text", value: "Nested Content" }],
					type: "block",
					value: "content",
				},
				{ children: [], type: "text", value: "</main>" },
			];
			const output = generator.generate(ast, {});
			assert.deepStrictEqual(output, "<main>Nested Content</main>");
		});

		it("should generate default block content if no child overrides", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "<main>" },
				{
					children: [{ children: [], type: "text", value: "Default Content" }],
					type: "block",
					value: "content",
				},
				{ children: [], type: "text", value: "</main>" },
			];

			const output = generator.generate(ast, {});
			assert.deepStrictEqual(output, "<main>Default Content</main>");
		});

		it("should generate overridden block content", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "<main>" },
				{
					children: [{ children: [], type: "text", value: "Child Content" }],
					type: "block",
					value: "content",
				},
				{ children: [], type: "text", value: "</main>" },
			];

			const output = generator.generate(ast, {});
			assert.deepStrictEqual(output, "<main>Child Content</main>");
		});

		it("should generate mixed content with overridden and default blocks", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "<header>" },
				{
					children: [{ children: [], type: "text", value: "Default Header" }],
					type: "block",
					value: "header",
				},
				{ children: [], type: "text", value: "</header>" },
				{ children: [], type: "text", value: "<main>" },
				{
					children: [{ children: [], type: "text", value: "Child Content" }],
					type: "block",
					value: "content",
				},
				{ children: [], type: "text", value: "</main>" },
				{ children: [], type: "text", value: "<footer>" },
				{
					children: [{ children: [], type: "text", value: "Default Footer" }],
					type: "block",
					value: "footer",
				},
				{ children: [], type: "text", value: "</footer>" },
			];

			const output = generator.generate(ast, {});
			assert.deepStrictEqual(
				output,
				"<header>Default Header</header><main>Child Content</main><footer>Default Footer</footer>",
			);
		});

		it("should preserve sibling block rendering order", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "A" }],
					type: "block",
					value: "first",
				},
				{
					children: [{ children: [], type: "text", value: "B" }],
					type: "block",
					value: "second",
				},
			];
			const result = generator.generate(ast, {});
			assert.deepStrictEqual(result, "AB");
		});
	});
});

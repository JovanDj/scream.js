import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Generator } from "./generator.js";
import type { ASTNode } from "./parser.js";

describe("Generator", () => {
	let generator: Generator;

	beforeEach(() => {
		generator = new Generator();
	});

	describe("Text nodes", () => {
		it("should return the text value of a text node", () => {
			const ast: ASTNode[] = [
				{ type: "text", value: "Hello, World!", children: [] },
			];
			const result = generator.generate(ast, {});
			assert.deepStrictEqual(result, "Hello, World!");
		});

		it("should handle empty text nodes", () => {
			const ast: ASTNode[] = [{ type: "text", value: "", children: [] }];
			const result = generator.generate(ast, {});
			assert.deepStrictEqual(result, "");
		});
	});

	describe("Variable nodes", () => {
		it("should replace a single variable", () => {
			const ast: ASTNode[] = [
				{ type: "variable", value: "name", children: [] },
			];
			const context = { name: "John" };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "John");
		});

		it("should return an empty string for undefined variables", () => {
			const ast: ASTNode[] = [{ type: "variable", value: "age", children: [] }];
			const context = {};
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should handle nested variables", () => {
			const ast: ASTNode[] = [
				{ type: "variable", value: "user.name", children: [] },
			];
			const context = { user: { name: "Jane" } };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Jane");
		});
	});

	describe("Generator - Conditional Nodes", () => {
		it("should render the children of an if node when the condition is true", () => {
			const ast: ASTNode[] = [
				{
					type: "if",
					value: "isAdmin",
					children: [{ type: "text", value: "Welcome, Admin!", children: [] }],
					alternate: [],
				},
			];
			const context = { isAdmin: true };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Welcome, Admin!");
		});

		it("should render the alternate of an if node when the condition is false", () => {
			const ast: ASTNode[] = [
				{
					type: "if",
					value: "isAdmin",
					children: [{ type: "text", value: "Welcome, Admin!", children: [] }],
					alternate: [{ type: "text", value: "Access Denied.", children: [] }],
				},
			];
			const context = { isAdmin: false };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "Access Denied.");
		});

		it("should render nothing if there are no children or alternate", () => {
			const ast: ASTNode[] = [
				{ type: "if", value: "isAdmin", children: [], alternate: [] },
			];
			const context = { isAdmin: false };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});
	});

	describe("Generator - Loop Nodes", () => {
		it("should iterate over an array and render the children for each item", () => {
			const ast: ASTNode[] = [
				{
					type: "for",
					value: "items",
					iterator: "item",
					children: [{ type: "variable", value: "item", children: [] }],
				},
			];
			const context = { items: ["A", "B", "C"] };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "ABC");
		});

		it("should render nothing for an empty array", () => {
			const ast: ASTNode[] = [
				{
					type: "for",
					value: "items",
					iterator: "item",
					children: [{ type: "variable", value: "item", children: [] }],
				},
			];
			const context = { items: [] };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});

		it("should render nothing for non-array values", () => {
			const ast: ASTNode[] = [
				{
					type: "for",
					value: "items",
					iterator: "item",
					children: [{ type: "variable", value: "item", children: [] }],
				},
			];
			const context = { items: null };
			const result = generator.generate(ast, context);
			assert.deepStrictEqual(result, "");
		});
	});

	describe("Layouts", () => {
		it("should generate content for simple and nested blocks", () => {
			const ast: ASTNode[] = [
				{ type: "text", value: "<main>", children: [] },
				{
					type: "block",
					value: "content",
					children: [{ type: "text", value: "Nested Content", children: [] }],
				},
				{ type: "text", value: "</main>", children: [] },
			];
			const output = generator.generate(ast, {});
			assert.deepStrictEqual(output, "<main>Nested Content</main>");
		});

		it("should generate default block content if no child overrides", () => {
			const ast: ASTNode[] = [
				{ type: "text", value: "<main>", children: [] },
				{
					type: "block",
					value: "content",
					children: [{ type: "text", value: "Default Content", children: [] }],
				},
				{ type: "text", value: "</main>", children: [] },
			];

			const output = generator.generate(ast, {});
			assert.deepStrictEqual(output, "<main>Default Content</main>");
		});

		it("should generate overridden block content", () => {
			const ast: ASTNode[] = [
				{ type: "text", value: "<main>", children: [] },
				{
					type: "block",
					value: "content",
					children: [{ type: "text", value: "Child Content", children: [] }],
				},
				{ type: "text", value: "</main>", children: [] },
			];

			const output = generator.generate(ast, {});
			assert.deepStrictEqual(output, "<main>Child Content</main>");
		});

		it("should generate mixed content with overridden and default blocks", () => {
			const ast: ASTNode[] = [
				{ type: "text", value: "<header>", children: [] },
				{
					type: "block",
					value: "header",
					children: [{ type: "text", value: "Default Header", children: [] }],
				},
				{ type: "text", value: "</header>", children: [] },
				{ type: "text", value: "<main>", children: [] },
				{
					type: "block",
					value: "content",
					children: [{ type: "text", value: "Child Content", children: [] }],
				},
				{ type: "text", value: "</main>", children: [] },
				{ type: "text", value: "<footer>", children: [] },
				{
					type: "block",
					value: "footer",
					children: [{ type: "text", value: "Default Footer", children: [] }],
				},
				{ type: "text", value: "</footer>", children: [] },
			];

			const output = generator.generate(ast, {});
			assert.deepStrictEqual(
				output,
				"<header>Default Header</header><main>Child Content</main><footer>Default Footer</footer>",
			);
		});
	});
});

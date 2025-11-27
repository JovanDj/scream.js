import { beforeEach, describe, it, type TestContext } from "node:test";
import type { ASTNode } from "./parser.js";
import { Transformer } from "./transformer.js";

describe("Transformer", { concurrency: true }, () => {
	let transformer: Transformer;

	beforeEach(() => {
		transformer = new Transformer();
	});

	describe("block overrides", () => {
		it("replaces blocks in the parent template with child content", (t: TestContext) => {
			t.plan(1);
			const parentAST: ASTNode[] = [
				{ children: [], type: "text", value: "<main>" },
				{
					children: [{ children: [], type: "text", value: "Default Content" }],
					type: "block",
					value: "content",
				},
				{ children: [], type: "text", value: "</main>" },
			];

			const childAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Child Content" }],
					type: "block",
					value: "content",
				},
			];

			const result = transformer.transform(parentAST, childAST);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "text", value: "<main>" },
				{
					children: [{ children: [], type: "text", value: "Child Content" }],
					type: "block",
					value: "content",
				},
				{ children: [], type: "text", value: "</main>" },
			]);
		});

		it("retains default block content if no overrides are provided", (t: TestContext) => {
			t.plan(1);
			const parentAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Default" }],
					type: "block",
					value: "content",
				},
			];

			const result = transformer.transform(parentAST, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, parentAST);
		});

		it("uses only the first matching block from child AST", (t: TestContext) => {
			t.plan(1);
			const parentAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Default" }],
					type: "block",
					value: "content",
				},
			];

			const childAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Override A" }],
					type: "block",
					value: "content",
				},
				{
					children: [{ children: [], type: "text", value: "Override B" }],
					type: "block",
					value: "content",
				},
			];

			const result = transformer.transform(parentAST, childAST);

			const expectedAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Override A" }],
					type: "block",
					value: "content",
				},
			];

			t.assert.deepStrictEqual<ASTNode[]>(result, expectedAST);
		});
	});

	describe("simplification", () => {
		it("collapses adjacent text nodes", (t: TestContext) => {
			t.plan(1);
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "Hello" },
				{ children: [], type: "text", value: " " },
				{ children: [], type: "text", value: "World" },
			];

			const result = transformer.transform(ast, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "text", value: "Hello World" },
			]);
		});

		it("drops empty if nodes", (t: TestContext) => {
			t.plan(1);
			const ast: ASTNode[] = [
				{ children: [], type: "if", value: "cond" },
				{ children: [], type: "text", value: "Keep" },
			];

			const result = transformer.transform(ast, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "text", value: "Keep" },
			]);
		});

		it("preserves empty block nodes", (t: TestContext) => {
			t.plan(1);
			const ast: ASTNode[] = [
				{ children: [], type: "block", value: "content" },
				{ children: [], type: "text", value: "After" },
			];

			const result = transformer.transform(ast, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "block", value: "content" },
				{ children: [], type: "text", value: "After" },
			]);
		});

		it("simplifies recursively inside blocks", (t: TestContext) => {
			t.plan(1);
			const ast: ASTNode[] = [
				{
					children: [
						{ children: [], type: "text", value: "Foo" },
						{ children: [], type: "text", value: "Bar" },
					],
					type: "block",
					value: "content",
				},
			];

			const result = transformer.transform(ast, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{
					children: [{ children: [], type: "text", value: "FooBar" }],
					type: "block",
					value: "content",
				},
			]);
		});

		it("preserves identity of untouched non-block nodes", (t: TestContext) => {
			t.plan(1);
			const textNode: ASTNode = { children: [], type: "text", value: "Hello" };
			const ast: ASTNode[] = [textNode];

			const result = transformer.transform(ast, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, [textNode]);
		});

		it("normalizes whitespace inside text nodes", (t: TestContext) => {
			t.plan(1);
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "Hello   " },
				{ children: [], type: "text", value: "   World" },
			];

			const result = transformer.transform(ast, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "text", value: "Hello World" },
			]);
		});

		it("drops empty text nodes", (t: TestContext) => {
			t.plan(1);
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "" },
				{ children: [], type: "text", value: "Hello" },
			];

			const result = transformer.transform(ast, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "text", value: "Hello" },
			]);
		});

		it("collapses empty if with alternate into alternate branch", (t: TestContext) => {
			t.plan(1);
			const ast: ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Fallback" }],
					children: [],
					type: "if",
					value: "cond",
				},
			];

			const result = transformer.transform(ast, []);

			t.assert.deepStrictEqual<ASTNode[]>(result, [
				{ children: [], type: "text", value: "Fallback" },
			]);
		});

		it("sorts child blocks deterministically by name", (t: TestContext) => {
			t.plan(1);
			const parentAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Default Header" }],
					type: "block",
					value: "header",
				},
				{
					children: [{ children: [], type: "text", value: "Default Footer" }],
					type: "block",
					value: "footer",
				},
			];

			const childAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Custom Footer" }],
					type: "block",
					value: "footer",
				},
				{
					children: [{ children: [], type: "text", value: "Custom Header" }],
					type: "block",
					value: "header",
				},
			];

			const result = transformer.transform(parentAST, childAST);

			const expectedAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Custom Header" }],
					type: "block",
					value: "header",
				},
				{
					children: [{ children: [], type: "text", value: "Custom Footer" }],
					type: "block",
					value: "footer",
				},
			];

			t.assert.deepStrictEqual(result, expectedAST);
		});

		it("produces same AST regardless of child block order", (t: TestContext) => {
			t.plan(1);
			const parentAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Default" }],
					type: "block",
					value: "content",
				},
			];

			const childAST1: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Override" }],
					type: "block",
					value: "content",
				},
				{
					children: [{ children: [], type: "text", value: "Unused" }],
					type: "block",
					value: "footer",
				},
			];

			const childAST2: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Unused" }],
					type: "block",
					value: "footer",
				},
				{
					children: [{ children: [], type: "text", value: "Override" }],
					type: "block",
					value: "content",
				},
			];

			const result1 = transformer.transform(parentAST, childAST1);
			const result2 = transformer.transform(parentAST, childAST2);

			t.assert.deepStrictEqual(result1, result2);
		});
		it("sorts child blocks deterministically by name", (t: TestContext) => {
			t.plan(1);
			const parentAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Default Header" }],
					type: "block",
					value: "header",
				},
				{
					children: [{ children: [], type: "text", value: "Default Footer" }],
					type: "block",
					value: "footer",
				},
			];

			const childAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Custom Footer" }],
					type: "block",
					value: "footer",
				},
				{
					children: [{ children: [], type: "text", value: "Custom Header" }],
					type: "block",
					value: "header",
				},
			];

			const result = transformer.transform(parentAST, childAST);

			const expectedAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Custom Header" }],
					type: "block",
					value: "header",
				},
				{
					children: [{ children: [], type: "text", value: "Custom Footer" }],
					type: "block",
					value: "footer",
				},
			];

			t.assert.deepStrictEqual<ASTNode[]>(result, expectedAST);
		});

		it("produces same AST regardless of child block order", (t: TestContext) => {
			t.plan(1);
			const parentAST: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Default" }],
					type: "block",
					value: "content",
				},
			];

			const childAST1: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Override" }],
					type: "block",
					value: "content",
				},
				{
					children: [{ children: [], type: "text", value: "Unused" }],
					type: "block",
					value: "footer",
				},
			];

			const childAST2: ASTNode[] = [
				{
					children: [{ children: [], type: "text", value: "Unused" }],
					type: "block",
					value: "footer",
				},
				{
					children: [{ children: [], type: "text", value: "Override" }],
					type: "block",
					value: "content",
				},
			];

			const result1 = transformer.transform(parentAST, childAST1);
			const result2 = transformer.transform(parentAST, childAST2);

			t.assert.deepStrictEqual<readonly ASTNode[]>(result1, result2);
		});
	});
});

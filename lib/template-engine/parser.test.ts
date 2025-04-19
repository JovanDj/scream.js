import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { type ASTNode, Parser } from "./parser.js";
import type { Token } from "./tokenizer.js";

describe("Parser", { concurrency: true }, () => {
	let parser: Parser;

	beforeEach(() => {
		parser = new Parser();
	});

	describe("Variable replacement", () => {
		it("should parse a single variable", () => {
			const tokens: Token[] = [{ type: "variable", value: "name" }];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ type: "variable", value: "name", children: [] },
			]);
		});

		it("should parse multiple variables", () => {
			const tokens: Token[] = [
				{ type: "variable", value: "firstName" },
				{ type: "text", value: " " },
				{ type: "variable", value: "lastName" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ type: "variable", value: "firstName", children: [] },
				{ type: "text", value: " ", children: [] },
				{ type: "variable", value: "lastName", children: [] },
			]);
		});
	});

	describe("Conditionals", () => {
		it("should parse a simple conditional", () => {
			const tokens: Token[] = [
				{ type: "if", value: "isLoggedIn" },
				{ type: "text", value: "Welcome!" },
				{ type: "endif", value: "" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "if",
					value: "isLoggedIn",

					children: [{ type: "text", value: "Welcome!", children: [] }],
				},
			]);
		});

		it("should parse a conditional with else", () => {
			const tokens: Token[] = [
				{ type: "if", value: "isAdmin" },
				{ type: "text", value: "Admin Panel" },
				{ type: "else", value: "" },
				{ type: "text", value: "User Panel" },
				{ type: "endif", value: "" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "if",
					value: "isAdmin",
					children: [{ type: "text", value: "Admin Panel", children: [] }],
					alternate: [{ type: "text", value: "User Panel", children: [] }],
				},
			]);
		});
	});

	describe("Iterations", () => {
		it("should parse a simple for loop", () => {
			const tokens: Token[] = [
				{ type: "for", value: "letters", iterator: "letter" },
				{ type: "variable", value: "letter" },
				{ type: "endfor", value: "" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "for",
					value: "letters",
					iterator: "letter",

					children: [{ type: "variable", value: "letter", children: [] }],
				},
			]);
		});

		it("should parse nested loops", () => {
			const tokens: Token[] = [
				{ type: "for", value: "users", iterator: "user" },
				{ type: "for", value: "user.tasks", iterator: "task" },
				{ type: "variable", value: "task.title" },
				{ type: "endfor", value: "" },
				{ type: "endfor", value: "" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "for",
					value: "users",
					iterator: "user",

					children: [
						{
							type: "for",
							value: "user.tasks",
							iterator: "task",

							children: [
								{
									type: "variable",
									value: "task.title",
									children: [],
								},
							],
						},
					],
				},
			]);
		});
	});

	describe("Layouts", () => {
		it("should parse an extends directive", () => {
			const tokens: Token[] = [{ type: "extends", value: "layout" }];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ type: "extends", value: "layout", children: [] },
			]);
		});

		it("should parse a block with content", () => {
			const tokens: Token[] = [
				{ type: "block", value: "content" },
				{ type: "text", value: "Hello" },
				{ type: "endblock", value: "content" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "block",
					value: "content",

					children: [{ type: "text", value: "Hello", children: [] }],
				},
			]);
		});

		it("should parse a nested if inside a block", () => {
			const tokens: Token[] = [
				{ type: "block", value: "content" },
				{ type: "if", value: "user.isAdmin" },
				{ type: "text", value: "Welcome Admin" },
				{ type: "else", value: "" },
				{ type: "text", value: "Welcome User" },
				{ type: "endif", value: "" },
				{ type: "endblock", value: "" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "block",
					value: "content",

					children: [
						{
							type: "if",
							value: "user.isAdmin",
							children: [
								{
									type: "text",
									value: "Welcome Admin",
									children: [],
								},
							],
							alternate: [
								{
									type: "text",
									value: "Welcome User",
									children: [],
								},
							],
						},
					],
				},
			]);
		});

		it("should parse multiple blocks", () => {
			const tokens: Token[] = [
				{ type: "block", value: "header" },
				{ type: "text", value: "Header Content" },
				{ type: "endblock", value: "header" },
				{ type: "block", value: "footer" },
				{ type: "text", value: "Footer Content" },
				{ type: "endblock", value: "footer" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "block",
					value: "header",

					children: [
						{
							type: "text",
							value: "Header Content",
							children: [],
						},
					],
				},
				{
					type: "block",
					value: "footer",

					children: [
						{
							type: "text",
							value: "Footer Content",
							children: [],
						},
					],
				},
			]);
		});

		it("should parse a block with loops and conditionals", () => {
			const tokens: Token[] = [
				{ type: "block", value: "content" },
				{ type: "for", value: "items", iterator: "item" },

				{ type: "endfor", value: "" },
				{ type: "endblock", value: "content" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "block",
					value: "content",

					children: [
						{
							type: "for",
							value: "items",
							iterator: "item",
							children: [],
						},
					],
				},
			]);
		});

		it("should not insert the block node as its own child", () => {
			const tokens: Token[] = [
				{ type: "block", value: "content" },
				{ type: "text", value: "Inside block" },
				{ type: "endblock", value: "content" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "block",
					value: "content",

					children: [
						{
							type: "text",
							value: "Inside block",
							children: [],
						},
					],
				},
			]);
		});

		it("should not nest a block inside another block's children", () => {
			const tokens: Token[] = [
				{ type: "block", value: "outer" },
				{ type: "block", value: "inner" },
				{ type: "text", value: "Hello" },
				{ type: "endblock", value: "inner" },
				{ type: "endblock", value: "outer" },
			];

			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					type: "block",
					value: "outer",

					children: [
						{
							type: "block",
							value: "inner",

							children: [
								{
									type: "text",
									value: "Hello",
									children: [],
								},
							],
						},
					],
				},
			]);
		});
	});

	describe("Parser - Edge Cases & Errors", () => {
		it("should throw on endif without if", () => {
			const tokens: Token[] = [{ type: "endif", value: "" }];
			assert.throws(() => parser.parse(tokens), /Unexpected token: endif/);
		});

		it("should throw on else without if", () => {
			const tokens: Token[] = [{ type: "else", value: "" }];
			assert.throws(() => parser.parse(tokens), /Unexpected token: else/);
		});

		it.todo("should throw on endfor without for");

		it.todo("should throw on unclosed if");

		it.todo("should throw on unclosed for");

		it("should handle empty input", () => {
			const tokens: Token[] = [];
			const ast = parser.parse(tokens);
			assert.deepStrictEqual<ASTNode[]>(ast, []);
		});

		it.todo("should handle template with only whitespace text");

		it("should parse a complex nested template", () => {
			const tokens: Token[] = [
				{ type: "extends", value: "layout" },
				{ type: "block", value: "content" },
				{ type: "if", value: "user" },
				{ type: "text", value: "Hello, " },
				{ type: "variable", value: "user.name" },
				{ type: "else", value: "" },
				{ type: "text", value: "Please log in." },
				{ type: "endif", value: "" },
				{ type: "endblock", value: "content" },
			];

			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ type: "extends", value: "layout", children: [] },
				{
					type: "block",
					value: "content",

					children: [
						{
							type: "if",
							value: "user",
							children: [
								{ type: "text", value: "Hello, ", children: [] },
								{
									type: "variable",
									value: "user.name",
									children: [],
								},
							],
							alternate: [
								{
									type: "text",
									value: "Please log in.",
									children: [],
								},
							],
						},
					],
				},
			]);
		});
	});
});

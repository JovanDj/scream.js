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
			const tokens: Token[] = [
				{ type: "variable" },
				{ name: "name", type: "identifier" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ path: ["name"], type: "variable" },
			]);
		});

		it("should parse multiple variables", () => {
			const tokens: Token[] = [
				{ type: "variable" },
				{ name: "firstName", type: "identifier" },
				{ type: "text", value: " " },
				{ type: "variable" },
				{ name: "lastName", type: "identifier" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ path: ["firstName"], type: "variable" },
				{ type: "text", value: " " },
				{ path: ["lastName"], type: "variable" },
			]);
		});

		it("should parse variable with dot notation path", () => {
			const tokens: Token[] = [
				{ type: "variable" },
				{ name: "user", type: "identifier" },
				{ type: "dot" },
				{ name: "name", type: "identifier" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ path: ["user", "name"], type: "variable" },
			]);
		});

		it("should parse variable with bracket notation path", () => {
			const tokens: Token[] = [
				{ type: "variable" },
				{ name: "errors", type: "identifier" },
				{ type: "dot" },
				{ name: "title", type: "identifier" },
				{ type: "number", value: 0 },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ path: ["errors", "title", 0], type: "variable" },
			]);
		});

		it("should parse variable with mixed dot and bracket notation", () => {
			const tokens: Token[] = [
				{ type: "variable" },
				{ name: "foo", type: "identifier" },
				{ type: "dot" },
				{ name: "bar", type: "identifier" },
				{ type: "number", value: 12 },
				{ type: "dot" },
				{ name: "baz", type: "identifier" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ path: ["foo", "bar", 12, "baz"], type: "variable" },
			]);
		});

		it("should parse function calls with arguments", () => {
			const tokens: Token[] = [
				{ type: "variable" },
				{ name: "encodeInputName", type: "identifier" },
				{ type: "lparen" },
				{ type: "string", value: "todo.title" },
				{ type: "rparen" },
			];

			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ path: ["encodeInputName", "todo", "title"], type: "variable" },
			]);
		});
	});

	describe("Conditionals", () => {
		it("should parse a simple conditional", () => {
			const tokens: Token[] = [
				{ condition: "isLoggedIn", type: "if" },
				{ type: "text", value: "Welcome!" },
				{ type: "endif" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [{ type: "text", value: "Welcome!" }],
					type: "if",
					value: "isLoggedIn",
				},
			]);
		});

		it("should parse a conditional with else", () => {
			const tokens: Token[] = [
				{ condition: "isAdmin", type: "if" },
				{ type: "text", value: "Admin Panel" },
				{ type: "else" },
				{ type: "text", value: "User Panel" },
				{ type: "endif" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					alternate: [{ type: "text", value: "User Panel" }],
					children: [{ type: "text", value: "Admin Panel" }],
					type: "if",
					value: "isAdmin",
				},
			]);
		});
	});

	describe("Iterations", () => {
		it("should parse a simple for loop", () => {
			const tokens: Token[] = [
				{ collection: "letters", iterator: "letter", type: "for" },
				{ type: "variable" },
				{ name: "letter", type: "identifier" },
				{ type: "endfor" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [
						{
							path: ["letter"],
							type: "variable",
						},
					],
					iterator: "letter",
					type: "for",
					value: "letters",
				},
			]);
		});

		it("should parse nested loops", () => {
			const tokens: Token[] = [
				{ collection: "users", iterator: "user", type: "for" },
				{ collection: "user.tasks", iterator: "task", type: "for" },
				{ type: "variable" },
				{ name: "task", type: "identifier" },
				{ type: "dot" },
				{ name: "title", type: "identifier" },
				{ type: "endfor" },
				{ type: "endfor" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [
						{
							children: [
								{
									path: ["task", "title"],
									type: "variable",
								},
							],
							iterator: "task",
							type: "for",
							value: "user.tasks",
						},
					],
					iterator: "user",
					type: "for",
					value: "users",
				},
			]);
		});
	});

	describe("Layouts", () => {
		it("should parse an extends directive", () => {
			const tokens: Token[] = [{ template: "layout", type: "extends" }];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ type: "extends", value: "layout" },
			]);
		});

		it("should parse a block with content", () => {
			const tokens: Token[] = [
				{ name: "content", type: "block" },
				{ type: "text", value: "Hello" },
				{ name: "content", type: "endblock" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [{ type: "text", value: "Hello" }],
					type: "block",
					value: "content",
				},
			]);
		});

		it("should parse a nested if inside a block", () => {
			const tokens: Token[] = [
				{ name: "content", type: "block" },
				{ condition: "user.isAdmin", type: "if" },
				{ type: "text", value: "Welcome Admin" },
				{ type: "else" },
				{ type: "text", value: "Welcome User" },
				{ type: "endif" },
				{ type: "endblock" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [
						{
							alternate: [
								{
									type: "text",
									value: "Welcome User",
								},
							],
							children: [
								{
									type: "text",
									value: "Welcome Admin",
								},
							],
							type: "if",
							value: "user.isAdmin",
						},
					],
					type: "block",
					value: "content",
				},
			]);
		});

		it("should parse multiple blocks", () => {
			const tokens: Token[] = [
				{ name: "header", type: "block" },
				{ type: "text", value: "Header Content" },
				{ name: "header", type: "endblock" },
				{ name: "footer", type: "block" },
				{ type: "text", value: "Footer Content" },
				{ name: "footer", type: "endblock" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [
						{
							type: "text",
							value: "Header Content",
						},
					],
					type: "block",
					value: "header",
				},
				{
					children: [
						{
							type: "text",
							value: "Footer Content",
						},
					],
					type: "block",
					value: "footer",
				},
			]);
		});

		it("should parse a block with loops and conditionals", () => {
			const tokens: Token[] = [
				{ name: "content", type: "block" },
				{ collection: "items", iterator: "item", type: "for" },

				{ type: "endfor" },
				{ name: "content", type: "endblock" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [
						{
							children: [],
							iterator: "item",
							type: "for",
							value: "items",
						},
					],
					type: "block",
					value: "content",
				},
			]);
		});

		it("should not insert the block node as its own child", () => {
			const tokens: Token[] = [
				{ name: "content", type: "block" },
				{ type: "text", value: "Inside block" },
				{ name: "content", type: "endblock" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [
						{
							type: "text",
							value: "Inside block",
						},
					],
					type: "block",
					value: "content",
				},
			]);
		});

		it("should not nest a block inside another block's children", () => {
			const tokens: Token[] = [
				{ name: "outer", type: "block" },
				{ name: "inner", type: "block" },
				{ type: "text", value: "Hello" },
				{ name: "inner", type: "endblock" },
				{ name: "outer", type: "endblock" },
			];

			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{
					children: [
						{
							children: [
								{
									type: "text",
									value: "Hello",
								},
							],
							type: "block",
							value: "inner",
						},
					],
					type: "block",
					value: "outer",
				},
			]);
		});
	});

	describe("Parser - Edge Cases & Errors", () => {
		it("should throw on endif without if", () => {
			const tokens: Token[] = [{ type: "endif" }];
			assert.throws(() => parser.parse(tokens), /Unexpected token: endif/);
		});

		it("should throw on else without if", () => {
			const tokens: Token[] = [{ type: "else" }];
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
				{ template: "layout", type: "extends" },
				{ name: "content", type: "block" },
				{ condition: "user", type: "if" },
				{ type: "text", value: "Hello, " },
				{ type: "variable" },
				{ name: "user", type: "identifier" },
				{ type: "dot" },
				{ name: "name", type: "identifier" },
				{ type: "else" },
				{ type: "text", value: "Please log in." },
				{ type: "endif" },
				{ name: "content", type: "endblock" },
			];

			const ast = parser.parse(tokens);

			assert.deepStrictEqual<ASTNode[]>(ast, [
				{ type: "extends", value: "layout" },
				{
					children: [
						{
							alternate: [{ type: "text", value: "Please log in." }],
							children: [
								{ type: "text", value: "Hello, " },
								{
									path: ["user", "name"],
									type: "variable",
								},
							],
							type: "if",
							value: "user",
						},
					],
					type: "block",
					value: "content",
				},
			]);
		});
	});
});

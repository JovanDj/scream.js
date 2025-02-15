import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Parser } from "./parser.js";
import type { Token } from "./tokenizer.js";

describe("Parser", () => {
	let parser: Parser;

	beforeEach(() => {
		parser = new Parser();
	});

	describe("Variable replacement", () => {
		it("should parse a single variable", () => {
			const tokens: Token[] = [{ type: "variable", value: "name" }];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual(ast, [
				{ alternate: [], children: [], type: "variable", value: "name" },
			]);
		});

		it("should parse multiple variables", () => {
			const tokens: Token[] = [
				{ type: "variable", value: "firstName" },
				{ type: "text", value: " " },
				{ type: "variable", value: "lastName" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual(ast, [
				{ alternate: [], children: [], type: "variable", value: "firstName" },
				{ alternate: [], children: [], type: "text", value: " " },
				{ alternate: [], children: [], type: "variable", value: "lastName" },
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

			assert.deepStrictEqual(ast, [
				{
					alternate: [],
					children: [
						{ alternate: [], children: [], type: "text", value: "Welcome!" },
					],
					type: "if",
					value: "isLoggedIn",
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

			assert.deepStrictEqual(ast, [
				{
					alternate: [
						{ alternate: [], children: [], type: "text", value: "User Panel" },
					],
					children: [
						{ alternate: [], children: [], type: "text", value: "Admin Panel" },
					],
					type: "if",
					value: "isAdmin",
				},
			]);
		});
	});

	describe("Iterations", () => {
		it("should parse a simple for loop", () => {
			const tokens: Token[] = [
				{ iterator: "letter", type: "for", value: "letters" },
				{ type: "variable", value: "letter" },
				{ type: "endfor", value: "" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual(ast, [
				{
					alternate: [],
					children: [
						{ alternate: [], children: [], type: "variable", value: "letter" },
					],
					iterator: "letter",
					type: "for",
					value: "letters",
				},
			]);
		});

		it("should parse nested loops", () => {
			const tokens: Token[] = [
				{ iterator: "user", type: "for", value: "users" },
				{ iterator: "task", type: "for", value: "user.tasks" },
				{ type: "variable", value: "task.title" },
				{ type: "endfor", value: "" },
				{ type: "endfor", value: "" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual(ast, [
				{
					alternate: [],
					children: [
						{
							alternate: [],
							children: [
								{
									alternate: [],
									children: [],
									type: "variable",
									value: "task.title",
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
			const tokens: Token[] = [{ type: "extends", value: "layout" }];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual(ast, [
				{ children: [], type: "extends", value: "layout" },
			]);
		});

		it("should parse a block with content", () => {
			const tokens: Token[] = [
				{ type: "block", value: "content" },
				{ type: "text", value: "Hello" },
				{ type: "endblock", value: "content" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual(ast, [
				{
					children: [
						{ alternate: [], children: [], type: "text", value: "Hello" },
					],
					type: "block",
					value: "content",
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

			assert.deepStrictEqual(ast, [
				{
					children: [
						{
							alternate: [
								{
									alternate: [],
									children: [],
									type: "text",
									value: "Welcome User",
								},
							],
							children: [
								{
									alternate: [],
									children: [],
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
				{ type: "block", value: "header" },
				{ type: "text", value: "Header Content" },
				{ type: "endblock", value: "header" },
				{ type: "block", value: "footer" },
				{ type: "text", value: "Footer Content" },
				{ type: "endblock", value: "footer" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual(ast, [
				{
					children: [
						{
							alternate: [],
							children: [],
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
							alternate: [],
							children: [],
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
				{ type: "block", value: "content" },
				{ iterator: "item", type: "for", value: "items" },

				{ type: "endfor", value: "" },
				{ type: "endblock", value: "content" },
			];
			const ast = parser.parse(tokens);

			assert.deepStrictEqual(ast, [
				{
					children: [
						{
							alternate: [],
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
	});
});

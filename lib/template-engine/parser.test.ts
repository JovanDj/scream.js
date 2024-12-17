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
});

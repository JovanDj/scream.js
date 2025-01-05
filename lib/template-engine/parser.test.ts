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
				{ type: "variable", value: "name", children: [], alternate: [] },
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
				{ type: "variable", value: "firstName", children: [], alternate: [] },
				{ type: "text", value: " ", children: [], alternate: [] },
				{ type: "variable", value: "lastName", children: [], alternate: [] },
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
					type: "if",
					value: "isLoggedIn",
					children: [
						{ type: "text", value: "Welcome!", children: [], alternate: [] },
					],
					alternate: [],
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
					type: "if",
					value: "isAdmin",
					children: [
						{ type: "text", value: "Admin Panel", children: [], alternate: [] },
					],
					alternate: [
						{ type: "text", value: "User Panel", children: [], alternate: [] },
					],
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

			assert.deepStrictEqual(ast, [
				{
					type: "for",
					value: "letters",
					iterator: "letter",
					children: [
						{ type: "variable", value: "letter", children: [], alternate: [] },
					],
					alternate: [],
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

			assert.deepStrictEqual(ast, [
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
									alternate: [],
								},
							],
							alternate: [],
						},
					],
					alternate: [],
				},
			]);
		});
	});
});

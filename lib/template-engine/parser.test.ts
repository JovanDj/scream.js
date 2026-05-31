import { beforeEach, describe, it, type TestContext } from "node:test";

import type { TemplateASTNode } from "./ast.js";
import { Parser } from "./parser.js";
import type { Token } from "./tokenizer.js";

describe("Parser", { concurrency: true }, () => {
	let parser: Parser;

	beforeEach(() => {
		parser = new Parser();
	});

	describe("Variable replacement", () => {
		it("should parse a single variable", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 7,
						start: 3,
					},
					type: "identifier",
					value: "name",
				},
				{
					span: {
						end: 10,
						start: 8,
					},
					type: "closeVariable",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					expression: {
						segments: ["name"],
						span: { end: 7, start: 3 },
						type: "path",
					},
					span: { end: 10, start: 0 },
					type: "variable",
				},
			]);
		});

		it("should parse multiple variables", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 12,
						start: 3,
					},
					type: "identifier",
					value: "firstName",
				},
				{
					span: {
						end: 15,
						start: 13,
					},
					type: "closeVariable",
				},
				{
					span: {
						end: 16,
						start: 15,
					},
					type: "text",
					value: " ",
				},
				{
					span: {
						end: 18,
						start: 16,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 27,
						start: 19,
					},
					type: "identifier",
					value: "lastName",
				},
				{
					span: {
						end: 30,
						start: 28,
					},
					type: "closeVariable",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					expression: {
						segments: ["firstName"],
						span: { end: 12, start: 3 },
						type: "path",
					},
					span: { end: 15, start: 0 },
					type: "variable",
				},
				{ span: { end: 16, start: 15 }, type: "text", value: " " },
				{
					expression: {
						segments: ["lastName"],
						span: { end: 27, start: 19 },
						type: "path",
					},
					span: { end: 30, start: 16 },
					type: "variable",
				},
			]);
		});

		it("should parse variable with dot notation path", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 7,
						start: 3,
					},
					type: "identifier",
					value: "user",
				},
				{
					span: {
						end: 8,
						start: 7,
					},
					type: "dot",
				},
				{
					span: {
						end: 12,
						start: 8,
					},
					type: "identifier",
					value: "name",
				},
				{
					span: {
						end: 15,
						start: 13,
					},
					type: "closeVariable",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					expression: {
						segments: ["user", "name"],
						span: { end: 12, start: 3 },
						type: "path",
					},
					span: { end: 15, start: 0 },
					type: "variable",
				},
			]);
		});

		it("should parse variable with keyword-like property path", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 7,
						start: 3,
					},
					type: "identifier",
					value: "user",
				},
				{
					span: {
						end: 8,
						start: 7,
					},
					type: "dot",
				},
				{
					span: {
						end: 10,
						start: 8,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 13,
						start: 11,
					},
					type: "closeVariable",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					expression: {
						segments: ["user", "if"],
						span: { end: 10, start: 3 },
						type: "path",
					},
					span: { end: 13, start: 0 },
					type: "variable",
				},
			]);
		});

		it("should parse variable with bracket notation path", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 9,
						start: 3,
					},
					type: "identifier",
					value: "errors",
				},
				{
					span: {
						end: 10,
						start: 9,
					},
					type: "dot",
				},
				{
					span: {
						end: 15,
						start: 10,
					},
					type: "identifier",
					value: "title",
				},
				{
					span: {
						end: 16,
						start: 15,
					},
					type: "leftBracket",
				},
				{
					span: {
						end: 17,
						start: 16,
					},
					type: "number",
					value: 0,
				},
				{
					span: {
						end: 18,
						start: 17,
					},
					type: "rightBracket",
				},
				{
					span: {
						end: 21,
						start: 19,
					},
					type: "closeVariable",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					expression: {
						segments: ["errors", "title", 0],
						span: { end: 18, start: 3 },
						type: "path",
					},
					span: { end: 21, start: 0 },
					type: "variable",
				},
			]);
		});

		it("should parse variable with mixed dot and bracket notation", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 6,
						start: 3,
					},
					type: "identifier",
					value: "foo",
				},
				{
					span: {
						end: 7,
						start: 6,
					},
					type: "dot",
				},
				{
					span: {
						end: 10,
						start: 7,
					},
					type: "identifier",
					value: "bar",
				},
				{
					span: {
						end: 11,
						start: 10,
					},
					type: "leftBracket",
				},
				{
					span: {
						end: 13,
						start: 11,
					},
					type: "number",
					value: 12,
				},
				{
					span: {
						end: 14,
						start: 13,
					},
					type: "rightBracket",
				},
				{
					span: {
						end: 15,
						start: 14,
					},
					type: "dot",
				},
				{
					span: {
						end: 18,
						start: 15,
					},
					type: "identifier",
					value: "baz",
				},
				{
					span: {
						end: 21,
						start: 19,
					},
					type: "closeVariable",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					expression: {
						segments: ["foo", "bar", 12, "baz"],
						span: { end: 18, start: 3 },
						type: "path",
					},
					span: { end: 21, start: 0 },
					type: "variable",
				},
			]);
		});
	});

	describe("Conditionals", () => {
		it("should parse a simple conditional", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 5,
						start: 3,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 16,
						start: 6,
					},
					type: "identifier",
					value: "isLoggedIn",
				},
				{
					span: {
						end: 19,
						start: 17,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 27,
						start: 19,
					},
					type: "text",
					value: "Welcome!",
				},
				{
					span: {
						end: 29,
						start: 27,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 35,
						start: 30,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 38,
						start: 36,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					alternate: [],
					children: [
						{ span: { end: 27, start: 19 }, type: "text", value: "Welcome!" },
					],
					condition: {
						segments: ["isLoggedIn"],
						span: { end: 16, start: 6 },
						type: "path",
					},
					span: { end: 38, start: 0 },
					type: "if",
				},
			]);
		});

		it("should parse a conditional with else", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 5,
						start: 3,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 13,
						start: 6,
					},
					type: "identifier",
					value: "isAdmin",
				},
				{
					span: {
						end: 16,
						start: 14,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 27,
						start: 16,
					},
					type: "text",
					value: "Admin Panel",
				},
				{
					span: {
						end: 29,
						start: 27,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 34,
						start: 30,
					},
					type: "keyword",
					value: "else",
				},
				{
					span: {
						end: 37,
						start: 35,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 47,
						start: 37,
					},
					type: "text",
					value: "User Panel",
				},
				{
					span: {
						end: 49,
						start: 47,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 55,
						start: 50,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 58,
						start: 56,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					alternate: [
						{
							span: { end: 47, start: 37 },
							type: "text",
							value: "User Panel",
						},
					],
					children: [
						{
							span: { end: 27, start: 16 },
							type: "text",
							value: "Admin Panel",
						},
					],
					condition: {
						segments: ["isAdmin"],
						span: { end: 13, start: 6 },
						type: "path",
					},
					span: { end: 58, start: 0 },
					type: "if",
				},
			]);
		});
	});

	describe("Iterations", () => {
		it("should parse a simple for loop", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 6,
						start: 3,
					},
					type: "keyword",
					value: "for",
				},
				{
					span: {
						end: 13,
						start: 7,
					},
					type: "identifier",
					value: "letter",
				},
				{
					span: {
						end: 16,
						start: 14,
					},
					type: "keyword",
					value: "in",
				},
				{
					span: {
						end: 24,
						start: 17,
					},
					type: "identifier",
					value: "letters",
				},
				{
					span: {
						end: 27,
						start: 25,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 29,
						start: 27,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 36,
						start: 30,
					},
					type: "identifier",
					value: "letter",
				},
				{
					span: {
						end: 39,
						start: 37,
					},
					type: "closeVariable",
				},
				{
					span: {
						end: 41,
						start: 39,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 48,
						start: 42,
					},
					type: "keyword",
					value: "endfor",
				},
				{
					span: {
						end: 51,
						start: 49,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							expression: {
								segments: ["letter"],
								span: { end: 36, start: 30 },
								type: "path",
							},
							span: { end: 39, start: 27 },
							type: "variable",
						},
					],
					collection: {
						segments: ["letters"],
						span: { end: 24, start: 17 },
						type: "path",
					},
					iterator: "letter",
					span: { end: 51, start: 0 },
					type: "for",
				},
			]);
		});

		it("should parse nested loops", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 6,
						start: 3,
					},
					type: "keyword",
					value: "for",
				},
				{
					span: {
						end: 11,
						start: 7,
					},
					type: "identifier",
					value: "user",
				},
				{
					span: {
						end: 14,
						start: 12,
					},
					type: "keyword",
					value: "in",
				},
				{
					span: {
						end: 20,
						start: 15,
					},
					type: "identifier",
					value: "users",
				},
				{
					span: {
						end: 23,
						start: 21,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 25,
						start: 23,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 29,
						start: 26,
					},
					type: "keyword",
					value: "for",
				},
				{
					span: {
						end: 34,
						start: 30,
					},
					type: "identifier",
					value: "task",
				},
				{
					span: {
						end: 37,
						start: 35,
					},
					type: "keyword",
					value: "in",
				},
				{
					span: {
						end: 42,
						start: 38,
					},
					type: "identifier",
					value: "user",
				},
				{
					span: {
						end: 43,
						start: 42,
					},
					type: "dot",
				},
				{
					span: {
						end: 48,
						start: 43,
					},
					type: "identifier",
					value: "tasks",
				},
				{
					span: {
						end: 51,
						start: 49,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 53,
						start: 51,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 58,
						start: 54,
					},
					type: "identifier",
					value: "task",
				},
				{
					span: {
						end: 59,
						start: 58,
					},
					type: "dot",
				},
				{
					span: {
						end: 64,
						start: 59,
					},
					type: "identifier",
					value: "title",
				},
				{
					span: {
						end: 67,
						start: 65,
					},
					type: "closeVariable",
				},
				{
					span: {
						end: 69,
						start: 67,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 76,
						start: 70,
					},
					type: "keyword",
					value: "endfor",
				},
				{
					span: {
						end: 79,
						start: 77,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 81,
						start: 79,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 88,
						start: 82,
					},
					type: "keyword",
					value: "endfor",
				},
				{
					span: {
						end: 91,
						start: 89,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							children: [
								{
									expression: {
										segments: ["task", "title"],
										span: { end: 64, start: 54 },
										type: "path",
									},
									span: { end: 67, start: 51 },
									type: "variable",
								},
							],
							collection: {
								segments: ["user", "tasks"],
								span: { end: 48, start: 38 },
								type: "path",
							},
							iterator: "task",
							span: { end: 79, start: 23 },
							type: "for",
						},
					],
					collection: {
						segments: ["users"],
						span: { end: 20, start: 15 },
						type: "path",
					},
					iterator: "user",
					span: { end: 91, start: 0 },
					type: "for",
				},
			]);
		});
	});

	describe("Layouts", () => {
		it("should parse an extends directive", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 10,
						start: 3,
					},
					type: "keyword",
					value: "extends",
				},
				{
					span: {
						end: 19,
						start: 11,
					},
					type: "string",
					value: "layout",
				},
				{
					span: {
						end: 22,
						start: 20,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 22, start: 0 }, template: "layout", type: "extends" },
			]);
		});

		it("should parse a block with content", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 8,
						start: 3,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 16,
						start: 9,
					},
					type: "identifier",
					value: "content",
				},
				{
					span: {
						end: 19,
						start: 17,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 24,
						start: 19,
					},
					type: "text",
					value: "Hello",
				},
				{
					span: {
						end: 26,
						start: 24,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 35,
						start: 27,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 38,
						start: 36,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{ span: { end: 24, start: 19 }, type: "text", value: "Hello" },
					],
					name: "content",
					span: { end: 38, start: 0 },
					type: "block",
				},
			]);
		});

		it("should parse a nested if inside a block", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 8,
						start: 3,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 16,
						start: 9,
					},
					type: "identifier",
					value: "content",
				},
				{
					span: {
						end: 19,
						start: 17,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 21,
						start: 19,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 24,
						start: 22,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 29,
						start: 25,
					},
					type: "identifier",
					value: "user",
				},
				{
					span: {
						end: 30,
						start: 29,
					},
					type: "dot",
				},
				{
					span: {
						end: 37,
						start: 30,
					},
					type: "identifier",
					value: "isAdmin",
				},
				{
					span: {
						end: 40,
						start: 38,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 53,
						start: 40,
					},
					type: "text",
					value: "Welcome Admin",
				},
				{
					span: {
						end: 55,
						start: 53,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 60,
						start: 56,
					},
					type: "keyword",
					value: "else",
				},
				{
					span: {
						end: 63,
						start: 61,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 75,
						start: 63,
					},
					type: "text",
					value: "Welcome User",
				},
				{
					span: {
						end: 77,
						start: 75,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 83,
						start: 78,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 86,
						start: 84,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 88,
						start: 86,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 97,
						start: 89,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 100,
						start: 98,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							alternate: [
								{
									span: { end: 75, start: 63 },
									type: "text",
									value: "Welcome User",
								},
							],
							children: [
								{
									span: { end: 53, start: 40 },
									type: "text",
									value: "Welcome Admin",
								},
							],
							condition: {
								segments: ["user", "isAdmin"],
								span: { end: 37, start: 25 },
								type: "path",
							},
							span: { end: 86, start: 19 },
							type: "if",
						},
					],
					name: "content",
					span: { end: 100, start: 0 },
					type: "block",
				},
			]);
		});

		it("should parse multiple blocks", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 8,
						start: 3,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 15,
						start: 9,
					},
					type: "identifier",
					value: "header",
				},
				{
					span: {
						end: 18,
						start: 16,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 32,
						start: 18,
					},
					type: "text",
					value: "Header Content",
				},
				{
					span: {
						end: 34,
						start: 32,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 43,
						start: 35,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 46,
						start: 44,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 48,
						start: 46,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 54,
						start: 49,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 61,
						start: 55,
					},
					type: "identifier",
					value: "footer",
				},
				{
					span: {
						end: 64,
						start: 62,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 78,
						start: 64,
					},
					type: "text",
					value: "Footer Content",
				},
				{
					span: {
						end: 80,
						start: 78,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 89,
						start: 81,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 92,
						start: 90,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							span: { end: 32, start: 18 },
							type: "text",
							value: "Header Content",
						},
					],
					name: "header",
					span: { end: 46, start: 0 },
					type: "block",
				},
				{
					children: [
						{
							span: { end: 78, start: 64 },
							type: "text",
							value: "Footer Content",
						},
					],
					name: "footer",
					span: { end: 92, start: 46 },
					type: "block",
				},
			]);
		});

		it("should parse a block with loops and conditionals", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 8,
						start: 3,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 16,
						start: 9,
					},
					type: "identifier",
					value: "content",
				},
				{
					span: {
						end: 19,
						start: 17,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 21,
						start: 19,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 25,
						start: 22,
					},
					type: "keyword",
					value: "for",
				},
				{
					span: {
						end: 30,
						start: 26,
					},
					type: "identifier",
					value: "item",
				},
				{
					span: {
						end: 33,
						start: 31,
					},
					type: "keyword",
					value: "in",
				},
				{
					span: {
						end: 39,
						start: 34,
					},
					type: "identifier",
					value: "items",
				},
				{
					span: {
						end: 42,
						start: 40,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 44,
						start: 42,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 51,
						start: 45,
					},
					type: "keyword",
					value: "endfor",
				},
				{
					span: {
						end: 54,
						start: 52,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 56,
						start: 54,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 65,
						start: 57,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 68,
						start: 66,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							children: [],
							collection: {
								segments: ["items"],
								span: { end: 39, start: 34 },
								type: "path",
							},
							iterator: "item",
							span: { end: 54, start: 19 },
							type: "for",
						},
					],
					name: "content",
					span: { end: 68, start: 0 },
					type: "block",
				},
			]);
		});

		it("should not insert the block node as its own child", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 8,
						start: 3,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 16,
						start: 9,
					},
					type: "identifier",
					value: "content",
				},
				{
					span: {
						end: 19,
						start: 17,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 31,
						start: 19,
					},
					type: "text",
					value: "Inside block",
				},
				{
					span: {
						end: 33,
						start: 31,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 42,
						start: 34,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 45,
						start: 43,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							span: { end: 31, start: 19 },
							type: "text",
							value: "Inside block",
						},
					],
					name: "content",
					span: { end: 45, start: 0 },
					type: "block",
				},
			]);
		});

		it("should not nest a block inside another block's children", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 8,
						start: 3,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 14,
						start: 9,
					},
					type: "identifier",
					value: "outer",
				},
				{
					span: {
						end: 17,
						start: 15,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 19,
						start: 17,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 25,
						start: 20,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 31,
						start: 26,
					},
					type: "identifier",
					value: "inner",
				},
				{
					span: {
						end: 34,
						start: 32,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 39,
						start: 34,
					},
					type: "text",
					value: "Hello",
				},
				{
					span: {
						end: 41,
						start: 39,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 50,
						start: 42,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 53,
						start: 51,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 55,
						start: 53,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 64,
						start: 56,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 67,
						start: 65,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							children: [
								{
									span: { end: 39, start: 34 },
									type: "text",
									value: "Hello",
								},
							],
							name: "inner",
							span: { end: 53, start: 17 },
							type: "block",
						},
					],
					name: "outer",
					span: { end: 67, start: 0 },
					type: "block",
				},
			]);
		});
	});

	describe("Parser - Edge Cases & Errors", () => {
		it("should throw on unsupported directives", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 10,
							start: 3,
						},
						type: "identifier",
						value: "include",
					},
					{
						span: {
							end: 16,
							start: 11,
						},
						type: "string",
						value: "nav",
					},
					{
						span: {
							end: 19,
							start: 17,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unknown directive/);
		});

		it("should throw on endif without if", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 8,
							start: 3,
						},
						type: "keyword",
						value: "endif",
					},
					{
						span: {
							end: 11,
							start: 9,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: endif/);
		});

		it("should throw on else without if", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 7,
							start: 3,
						},
						type: "keyword",
						value: "else",
					},
					{
						span: {
							end: 10,
							start: 8,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: else/);
		});

		it("should not descend past an unexpected else", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 6,
							start: 0,
						},
						type: "text",
						value: "before",
					},
					{
						span: {
							end: 8,
							start: 6,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 13,
							start: 9,
						},
						type: "keyword",
						value: "else",
					},
					{
						span: {
							end: 16,
							start: 14,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 21,
							start: 16,
						},
						type: "text",
						value: "after",
					},
				]);

			t.assert.throws(act, /Unexpected directive: else/);
		});

		it("should throw on dangling else after a closed if", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 5,
							start: 3,
						},
						type: "keyword",
						value: "if",
					},
					{
						span: {
							end: 13,
							start: 6,
						},
						type: "identifier",
						value: "isAdmin",
					},
					{
						span: {
							end: 16,
							start: 14,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 21,
							start: 16,
						},
						type: "text",
						value: "admin",
					},
					{
						span: {
							end: 23,
							start: 21,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 29,
							start: 24,
						},
						type: "keyword",
						value: "endif",
					},
					{
						span: {
							end: 32,
							start: 30,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 34,
							start: 32,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 39,
							start: 35,
						},
						type: "keyword",
						value: "else",
					},
					{
						span: {
							end: 42,
							start: 40,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: else/);
		});

		it("should throw on stray endif surrounded by text", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 6,
							start: 0,
						},
						type: "text",
						value: "Hello ",
					},
					{
						span: {
							end: 8,
							start: 6,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 14,
							start: 9,
						},
						type: "keyword",
						value: "endif",
					},
					{
						span: {
							end: 17,
							start: 15,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 23,
							start: 17,
						},
						type: "text",
						value: " world",
					},
				]);

			t.assert.throws(act, /Unexpected directive: endif/);
		});

		it("should throw on stray else surrounded by text", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 7,
							start: 0,
						},
						type: "text",
						value: "before ",
					},
					{
						span: {
							end: 9,
							start: 7,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 14,
							start: 10,
						},
						type: "keyword",
						value: "else",
					},
					{
						span: {
							end: 17,
							start: 15,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 23,
							start: 17,
						},
						type: "text",
						value: " after",
					},
				]);

			t.assert.throws(act, /Unexpected directive: else/);
		});

		it("should throw on endfor without for", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 5,
							start: 3,
						},
						type: "keyword",
						value: "if",
					},
					{
						span: {
							end: 7,
							start: 6,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 10,
							start: 8,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 12,
							start: 10,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 19,
							start: 13,
						},
						type: "keyword",
						value: "endfor",
					},
					{
						span: {
							end: 22,
							start: 20,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 24,
							start: 22,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 30,
							start: 25,
						},
						type: "keyword",
						value: "endif",
					},
					{
						span: {
							end: 33,
							start: 31,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: endfor/);
		});

		it("should throw on endblock without block", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 5,
							start: 3,
						},
						type: "keyword",
						value: "if",
					},
					{
						span: {
							end: 7,
							start: 6,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 10,
							start: 8,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 12,
							start: 10,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 21,
							start: 13,
						},
						type: "keyword",
						value: "endblock",
					},
					{
						span: {
							end: 24,
							start: 22,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 26,
							start: 24,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 32,
							start: 27,
						},
						type: "keyword",
						value: "endif",
					},
					{
						span: {
							end: 35,
							start: 33,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: endblock/);
		});

		it("should throw when if is closed with endfor", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 5,
							start: 3,
						},
						type: "keyword",
						value: "if",
					},
					{
						span: {
							end: 7,
							start: 6,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 10,
							start: 8,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 12,
							start: 10,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 19,
							start: 13,
						},
						type: "keyword",
						value: "endfor",
					},
					{
						span: {
							end: 22,
							start: 20,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: endfor/);
		});

		it("should throw when for is closed with endif", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 6,
							start: 3,
						},
						type: "keyword",
						value: "for",
					},
					{
						span: {
							end: 8,
							start: 7,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 11,
							start: 9,
						},
						type: "keyword",
						value: "in",
					},
					{
						span: {
							end: 14,
							start: 12,
						},
						type: "identifier",
						value: "xs",
					},
					{
						span: {
							end: 17,
							start: 15,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 19,
							start: 17,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 25,
							start: 20,
						},
						type: "keyword",
						value: "endif",
					},
					{
						span: {
							end: 28,
							start: 26,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: endif/);
		});

		it("should throw when else appears inside a for loop", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 6,
							start: 3,
						},
						type: "keyword",
						value: "for",
					},
					{
						span: {
							end: 8,
							start: 7,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 11,
							start: 9,
						},
						type: "keyword",
						value: "in",
					},
					{
						span: {
							end: 14,
							start: 12,
						},
						type: "identifier",
						value: "xs",
					},
					{
						span: {
							end: 17,
							start: 15,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 19,
							start: 17,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 24,
							start: 20,
						},
						type: "keyword",
						value: "else",
					},
					{
						span: {
							end: 27,
							start: 25,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 29,
							start: 27,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 36,
							start: 30,
						},
						type: "keyword",
						value: "endfor",
					},
					{
						span: {
							end: 39,
							start: 37,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: else/);
		});

		it("should throw when else appears inside a block", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 8,
							start: 3,
						},
						type: "keyword",
						value: "block",
					},
					{
						span: {
							end: 16,
							start: 9,
						},
						type: "identifier",
						value: "content",
					},
					{
						span: {
							end: 19,
							start: 17,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 21,
							start: 19,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 26,
							start: 22,
						},
						type: "keyword",
						value: "else",
					},
					{
						span: {
							end: 29,
							start: 27,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 31,
							start: 29,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 40,
							start: 32,
						},
						type: "keyword",
						value: "endblock",
					},
					{
						span: {
							end: 43,
							start: 41,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: else/);
		});

		it("should throw on multiple else branches in a single if", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 5,
							start: 3,
						},
						type: "keyword",
						value: "if",
					},
					{
						span: {
							end: 7,
							start: 6,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 10,
							start: 8,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 11,
							start: 10,
						},
						type: "text",
						value: "A",
					},
					{
						span: {
							end: 13,
							start: 11,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 18,
							start: 14,
						},
						type: "keyword",
						value: "else",
					},
					{
						span: {
							end: 21,
							start: 19,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 22,
							start: 21,
						},
						type: "text",
						value: "B",
					},
					{
						span: {
							end: 24,
							start: 22,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 29,
							start: 25,
						},
						type: "keyword",
						value: "else",
					},
					{
						span: {
							end: 32,
							start: 30,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 33,
							start: 32,
						},
						type: "text",
						value: "C",
					},
					{
						span: {
							end: 35,
							start: 33,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 41,
							start: 36,
						},
						type: "keyword",
						value: "endif",
					},
					{
						span: {
							end: 44,
							start: 42,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: else/);
		});

		it("should throw on unclosed if", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 5,
							start: 3,
						},
						type: "keyword",
						value: "if",
					},
					{
						span: {
							end: 7,
							start: 6,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 10,
							start: 8,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 16,
							start: 10,
						},
						type: "text",
						value: "inside",
					},
				]);

			t.assert.throws(act, /Unexpected end inside block/);
		});

		it("should throw on unclosed for", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 5,
							start: 3,
						},
						type: "keyword",
						value: "if",
					},
					{
						span: {
							end: 7,
							start: 6,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 10,
							start: 8,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 12,
							start: 10,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 16,
							start: 13,
						},
						type: "keyword",
						value: "for",
					},
					{
						span: {
							end: 18,
							start: 17,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 21,
							start: 19,
						},
						type: "keyword",
						value: "in",
					},
					{
						span: {
							end: 24,
							start: 22,
						},
						type: "identifier",
						value: "xs",
					},
					{
						span: {
							end: 27,
							start: 25,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 31,
							start: 27,
						},
						type: "text",
						value: "item",
					},
				]);

			t.assert.throws(act, /Unexpected end inside block/);
		});

		it("should throw on unclosed block", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 8,
							start: 3,
						},
						type: "keyword",
						value: "block",
					},
					{
						span: {
							end: 16,
							start: 9,
						},
						type: "identifier",
						value: "content",
					},
					{
						span: {
							end: 19,
							start: 17,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 23,
							start: 19,
						},
						type: "text",
						value: "Body",
					},
				]);

			t.assert.throws(act, /Unexpected end inside block/);
		});

		it("should throw on unexpected endblock inside if", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 5,
							start: 3,
						},
						type: "keyword",
						value: "if",
					},
					{
						span: {
							end: 7,
							start: 6,
						},
						type: "identifier",
						value: "x",
					},
					{
						span: {
							end: 10,
							start: 8,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 12,
							start: 10,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 21,
							start: 13,
						},
						type: "keyword",
						value: "endblock",
					},
					{
						span: {
							end: 24,
							start: 22,
						},
						type: "closeDirective",
					},
					{
						span: {
							end: 26,
							start: 24,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 32,
							start: 27,
						},
						type: "keyword",
						value: "endif",
					},
					{
						span: {
							end: 35,
							start: 33,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Unexpected directive: endblock/);
		});

		it("should throw when extends template is not a string", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 10,
							start: 3,
						},
						type: "keyword",
						value: "extends",
					},
					{
						span: {
							end: 17,
							start: 11,
						},
						type: "identifier",
						value: "layout",
					},
					{
						span: {
							end: 20,
							start: 18,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Expected string token/);
		});

		it("should throw when block name is missing", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 8,
							start: 3,
						},
						type: "keyword",
						value: "block",
					},
					{
						span: {
							end: 11,
							start: 9,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Expected identifier token/);
		});

		it("should throw when for is missing in", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 6,
							start: 3,
						},
						type: "keyword",
						value: "for",
					},
					{
						span: {
							end: 11,
							start: 7,
						},
						type: "identifier",
						value: "item",
					},
					{
						span: {
							end: 17,
							start: 12,
						},
						type: "identifier",
						value: "items",
					},
					{
						span: {
							end: 20,
							start: 18,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Expected in directive/);
		});

		it("should throw when for collection is missing", (t: TestContext) => {
			t.plan(1);
			const act = () =>
				parser.parse([
					{
						span: {
							end: 2,
							start: 0,
						},
						type: "openDirective",
					},
					{
						span: {
							end: 6,
							start: 3,
						},
						type: "keyword",
						value: "for",
					},
					{
						span: {
							end: 11,
							start: 7,
						},
						type: "identifier",
						value: "item",
					},
					{
						span: {
							end: 14,
							start: 12,
						},
						type: "keyword",
						value: "in",
					},
					{
						span: {
							end: 17,
							start: 15,
						},
						type: "closeDirective",
					},
				]);

			t.assert.throws(act, /Expected identifier token|Empty expression/);
		});

		it("should bind else to the nearest if", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 5,
						start: 3,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 7,
						start: 6,
					},
					type: "identifier",
					value: "a",
				},
				{
					span: {
						end: 10,
						start: 8,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 12,
						start: 10,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 15,
						start: 13,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 17,
						start: 16,
					},
					type: "identifier",
					value: "b",
				},
				{
					span: {
						end: 20,
						start: 18,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 25,
						start: 20,
					},
					type: "text",
					value: "inner",
				},
				{
					span: {
						end: 27,
						start: 25,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 32,
						start: 28,
					},
					type: "keyword",
					value: "else",
				},
				{
					span: {
						end: 35,
						start: 33,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 38,
						start: 35,
					},
					type: "text",
					value: "alt",
				},
				{
					span: {
						end: 40,
						start: 38,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 46,
						start: 41,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 49,
						start: 47,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 51,
						start: 49,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 57,
						start: 52,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 60,
						start: 58,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					alternate: [],
					children: [
						{
							alternate: [
								{ span: { end: 38, start: 35 }, type: "text", value: "alt" },
							],
							children: [
								{
									span: { end: 25, start: 20 },
									type: "text",
									value: "inner",
								},
							],
							condition: {
								segments: ["b"],
								span: { end: 17, start: 16 },
								type: "path",
							},
							span: { end: 49, start: 10 },
							type: "if",
						},
					],
					condition: {
						segments: ["a"],
						span: { end: 7, start: 6 },
						type: "path",
					},
					span: { end: 60, start: 0 },
					type: "if",
				},
			]);
		});

		it("should preserve text around an if/else/endif sequence", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 7,
						start: 0,
					},
					type: "text",
					value: "before ",
				},
				{
					span: {
						end: 9,
						start: 7,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 12,
						start: 10,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 14,
						start: 13,
					},
					type: "identifier",
					value: "x",
				},
				{
					span: {
						end: 17,
						start: 15,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 22,
						start: 17,
					},
					type: "text",
					value: "inner",
				},
				{
					span: {
						end: 24,
						start: 22,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 29,
						start: 25,
					},
					type: "keyword",
					value: "else",
				},
				{
					span: {
						end: 32,
						start: 30,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 35,
						start: 32,
					},
					type: "text",
					value: "alt",
				},
				{
					span: {
						end: 37,
						start: 35,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 43,
						start: 38,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 46,
						start: 44,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 52,
						start: 46,
					},
					type: "text",
					value: " after",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 7, start: 0 }, type: "text", value: "before " },
				{
					alternate: [
						{ span: { end: 35, start: 32 }, type: "text", value: "alt" },
					],
					children: [
						{ span: { end: 22, start: 17 }, type: "text", value: "inner" },
					],
					condition: {
						segments: ["x"],
						span: { end: 14, start: 13 },
						type: "path",
					},
					span: { end: 46, start: 7 },
					type: "if",
				},
				{ span: { end: 52, start: 46 }, type: "text", value: " after" },
			]);
		});

		it("should parse interleaved tags and text", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "text",
					value: "A ",
				},
				{
					span: {
						end: 4,
						start: 2,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 7,
						start: 5,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 9,
						start: 8,
					},
					type: "identifier",
					value: "x",
				},
				{
					span: {
						end: 12,
						start: 10,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 15,
						start: 12,
					},
					type: "text",
					value: " B ",
				},
				{
					span: {
						end: 17,
						start: 15,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 21,
						start: 18,
					},
					type: "keyword",
					value: "for",
				},
				{
					span: {
						end: 23,
						start: 22,
					},
					type: "identifier",
					value: "y",
				},
				{
					span: {
						end: 26,
						start: 24,
					},
					type: "keyword",
					value: "in",
				},
				{
					span: {
						end: 29,
						start: 27,
					},
					type: "identifier",
					value: "ys",
				},
				{
					span: {
						end: 32,
						start: 30,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 35,
						start: 32,
					},
					type: "text",
					value: " C ",
				},
				{
					span: {
						end: 37,
						start: 35,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 44,
						start: 38,
					},
					type: "keyword",
					value: "endfor",
				},
				{
					span: {
						end: 47,
						start: 45,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 50,
						start: 47,
					},
					type: "text",
					value: " D ",
				},
				{
					span: {
						end: 52,
						start: 50,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 58,
						start: 53,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 61,
						start: 59,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 63,
						start: 61,
					},
					type: "text",
					value: " E",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 2, start: 0 }, type: "text", value: "A " },
				{
					alternate: [],
					children: [
						{ span: { end: 15, start: 12 }, type: "text", value: " B " },
						{
							children: [
								{
									span: { end: 35, start: 32 },
									type: "text",
									value: " C ",
								},
							],
							collection: {
								segments: ["ys"],
								span: { end: 29, start: 27 },
								type: "path",
							},
							iterator: "y",
							span: { end: 47, start: 15 },
							type: "for",
						},
						{ span: { end: 50, start: 47 }, type: "text", value: " D " },
					],
					condition: {
						segments: ["x"],
						span: { end: 9, start: 8 },
						type: "path",
					},
					span: { end: 61, start: 2 },
					type: "if",
				},
				{ span: { end: 63, start: 61 }, type: "text", value: " E" },
			]);
		});

		it("should parse block with nested if and for", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 8,
						start: 3,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 16,
						start: 9,
					},
					type: "identifier",
					value: "content",
				},
				{
					span: {
						end: 19,
						start: 17,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 21,
						start: 19,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 24,
						start: 22,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 26,
						start: 25,
					},
					type: "identifier",
					value: "x",
				},
				{
					span: {
						end: 29,
						start: 27,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 31,
						start: 29,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 35,
						start: 32,
					},
					type: "keyword",
					value: "for",
				},
				{
					span: {
						end: 37,
						start: 36,
					},
					type: "identifier",
					value: "y",
				},
				{
					span: {
						end: 40,
						start: 38,
					},
					type: "keyword",
					value: "in",
				},
				{
					span: {
						end: 43,
						start: 41,
					},
					type: "identifier",
					value: "ys",
				},
				{
					span: {
						end: 46,
						start: 44,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 48,
						start: 46,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 50,
						start: 49,
					},
					type: "identifier",
					value: "y",
				},
				{
					span: {
						end: 53,
						start: 51,
					},
					type: "closeVariable",
				},
				{
					span: {
						end: 55,
						start: 53,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 62,
						start: 56,
					},
					type: "keyword",
					value: "endfor",
				},
				{
					span: {
						end: 65,
						start: 63,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 67,
						start: 65,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 72,
						start: 68,
					},
					type: "keyword",
					value: "else",
				},
				{
					span: {
						end: 75,
						start: 73,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 83,
						start: 75,
					},
					type: "text",
					value: "Fallback",
				},
				{
					span: {
						end: 85,
						start: 83,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 91,
						start: 86,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 94,
						start: 92,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 96,
						start: 94,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 105,
						start: 97,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 108,
						start: 106,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							alternate: [
								{
									span: { end: 83, start: 75 },
									type: "text",
									value: "Fallback",
								},
							],
							children: [
								{
									children: [
										{
											expression: {
												segments: ["y"],
												span: { end: 50, start: 49 },
												type: "path",
											},
											span: { end: 53, start: 46 },
											type: "variable",
										},
									],
									collection: {
										segments: ["ys"],
										span: { end: 43, start: 41 },
										type: "path",
									},
									iterator: "y",
									span: { end: 65, start: 29 },
									type: "for",
								},
							],
							condition: {
								segments: ["x"],
								span: { end: 26, start: 25 },
								type: "path",
							},
							span: { end: 94, start: 19 },
							type: "if",
						},
					],
					name: "content",
					span: { end: 108, start: 0 },
					type: "block",
				},
			]);
		});

		it("should handle empty input", (t: TestContext) => {
			t.plan(1);
			const result = parser.parse([]);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, []);
		});

		it("should handle template with only whitespace text", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 7,
						start: 0,
					},
					type: "text",
					value: "   \n\t  ",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 7, start: 0 }, type: "text", value: "   \n\t  " },
			]);
		});

		it("should parse a complex nested template", (t: TestContext) => {
			t.plan(1);
			const tokens: readonly Token[] = [
				{
					span: {
						end: 2,
						start: 0,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 10,
						start: 3,
					},
					type: "keyword",
					value: "extends",
				},
				{
					span: {
						end: 19,
						start: 11,
					},
					type: "string",
					value: "layout",
				},
				{
					span: {
						end: 22,
						start: 20,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 24,
						start: 22,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 30,
						start: 25,
					},
					type: "keyword",
					value: "block",
				},
				{
					span: {
						end: 38,
						start: 31,
					},
					type: "identifier",
					value: "content",
				},
				{
					span: {
						end: 41,
						start: 39,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 43,
						start: 41,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 46,
						start: 44,
					},
					type: "keyword",
					value: "if",
				},
				{
					span: {
						end: 51,
						start: 47,
					},
					type: "identifier",
					value: "user",
				},
				{
					span: {
						end: 54,
						start: 52,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 61,
						start: 54,
					},
					type: "text",
					value: "Hello, ",
				},
				{
					span: {
						end: 63,
						start: 61,
					},
					type: "openVariable",
				},
				{
					span: {
						end: 68,
						start: 64,
					},
					type: "identifier",
					value: "user",
				},
				{
					span: {
						end: 69,
						start: 68,
					},
					type: "dot",
				},
				{
					span: {
						end: 73,
						start: 69,
					},
					type: "identifier",
					value: "name",
				},
				{
					span: {
						end: 76,
						start: 74,
					},
					type: "closeVariable",
				},
				{
					span: {
						end: 78,
						start: 76,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 83,
						start: 79,
					},
					type: "keyword",
					value: "else",
				},
				{
					span: {
						end: 86,
						start: 84,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 100,
						start: 86,
					},
					type: "text",
					value: "Please log in.",
				},
				{
					span: {
						end: 102,
						start: 100,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 108,
						start: 103,
					},
					type: "keyword",
					value: "endif",
				},
				{
					span: {
						end: 111,
						start: 109,
					},
					type: "closeDirective",
				},
				{
					span: {
						end: 113,
						start: 111,
					},
					type: "openDirective",
				},
				{
					span: {
						end: 122,
						start: 114,
					},
					type: "keyword",
					value: "endblock",
				},
				{
					span: {
						end: 125,
						start: 123,
					},
					type: "closeDirective",
				},
			];
			const result = parser.parse(tokens);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 22, start: 0 }, template: "layout", type: "extends" },
				{
					children: [
						{
							alternate: [
								{
									span: { end: 100, start: 86 },
									type: "text",
									value: "Please log in.",
								},
							],
							children: [
								{
									span: { end: 61, start: 54 },
									type: "text",
									value: "Hello, ",
								},
								{
									expression: {
										segments: ["user", "name"],
										span: { end: 73, start: 64 },
										type: "path",
									},
									span: { end: 76, start: 61 },
									type: "variable",
								},
							],
							condition: {
								segments: ["user"],
								span: { end: 51, start: 47 },
								type: "path",
							},
							span: { end: 111, start: 41 },
							type: "if",
						},
					],
					name: "content",
					span: { end: 125, start: 22 },
					type: "block",
				},
			]);
		});
	});
});

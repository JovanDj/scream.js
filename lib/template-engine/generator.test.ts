import { beforeEach, describe, it, type TestContext } from "node:test";
import { Generator } from "./generator.js";
import type { ASTNode } from "./parser.js";

describe("Generator", { concurrency: true }, () => {
	let generator: Generator;

	beforeEach(() => {
		generator = new Generator();
	});

	it("renders a flat sequence of text nodes", (t: TestContext) => {
		t.plan(1);
		const ast: readonly ASTNode[] = [
			{ children: [], type: "text", value: "Hello" },
			{ children: [], type: "text", value: " " },
			{ children: [], type: "text", value: "World" },
			{ children: [], type: "text", value: "!" },
		];
		const output = generator.generate(ast);
		t.assert.deepStrictEqual<string>(output, "Hello World!");
	});

	it("renders a single variable node", (t: TestContext) => {
		t.plan(1);
		const ast: readonly ASTNode[] = [
			{ children: [], type: "variable", value: "Evaluated" },
		];
		const output = generator.generate(ast);
		t.assert.deepStrictEqual<string>(output, "Evaluated");
	});

	it("renders nested blocks with text content", (t: TestContext) => {
		t.plan(1);
		const ast: readonly ASTNode[] = [
			{
				children: [
					{ children: [], type: "text", value: "Start " },
					{
						children: [
							{ children: [], type: "text", value: "Middle" },
							{ children: [], type: "variable", value: "!" },
						],
						type: "block",
						value: "inner",
					},
					{ children: [], type: "text", value: " End" },
				],
				type: "block",
				value: "outer",
			},
		];
		const output = generator.generate(ast);
		t.assert.deepStrictEqual<string>(output, "Start Middle! End");
	});

	it("renders empty result when given empty AST", (t: TestContext) => {
		t.plan(1);
		const ast: readonly ASTNode[] = [];
		const output = generator.generate(ast);
		t.assert.deepStrictEqual<string>(output, "");
	});

	it("renders alternate branch when children are empty", (t: TestContext) => {
		t.plan(1);
		const generator = new Generator();

		const ast: readonly ASTNode[] = [
			{
				alternate: [{ children: [], type: "text", value: "Fallback shown" }],
				children: [],
				type: "if",
				value: "unused",
			},
		];

		const output = generator.generate(ast);
		t.assert.deepStrictEqual<string>(output, "Fallback shown");
	});
});

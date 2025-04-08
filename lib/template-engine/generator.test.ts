import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Generator } from "./generator.js";
import type { ASTNode } from "./parser.js";

describe("Generator", { concurrency: true }, () => {
	let generator: Generator;

	beforeEach(() => {
		generator = new Generator();
	});

	it("renders a flat sequence of text nodes", () => {
		const ast: readonly ASTNode[] = [
			{ type: "text", value: "Hello", children: [] },
			{ type: "text", value: " ", children: [] },
			{ type: "text", value: "World", children: [] },
			{ type: "text", value: "!", children: [] },
		];
		const output = generator.generate(ast);
		assert.strictEqual(output, "Hello World!");
	});

	it("renders a single variable node", () => {
		const ast: readonly ASTNode[] = [
			{ type: "variable", value: "Evaluated", children: [] },
		];
		const output = generator.generate(ast);
		assert.strictEqual(output, "Evaluated");
	});

	it("renders nested blocks with text content", () => {
		const ast: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Start ", children: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{ type: "text", value: "Middle", children: [] },
							{ type: "variable", value: "!", children: [] },
						],
					},
					{ type: "text", value: " End", children: [] },
				],
			},
		];
		const output = generator.generate(ast);
		assert.strictEqual(output, "Start Middle! End");
	});

	it("renders empty result when given empty AST", () => {
		const ast: readonly ASTNode[] = [];
		const output = generator.generate(ast);
		assert.strictEqual(output, "");
	});

	it("renders alternate branch when children are empty", () => {
		const generator = new Generator();

		const ast: readonly ASTNode[] = [
			{
				type: "if",
				value: "unused",
				children: [],
				alternate: [{ type: "text", value: "Fallback shown", children: [] }],
			},
		];

		const output = generator.generate(ast);
		assert.deepStrictEqual(output, "Fallback shown");
	});
});

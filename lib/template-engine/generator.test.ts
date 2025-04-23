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
			{ type: "text", value: "Hello" },
			{ type: "text", value: " " },
			{ type: "text", value: "World" },
			{ type: "text", value: "!" },
		];
		const output = generator.generate(ast);
		assert.strictEqual(output, "Hello World!");
	});

	it("renders a single variable node", () => {
		const ast: readonly ASTNode[] = [{ type: "variable", value: "Evaluated" }];
		const output = generator.generate(ast);
		assert.strictEqual(output, "Evaluated");
	});

	it("renders nested blocks with text content", () => {
		const ast: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Start " },
					{
						type: "block",
						value: "inner",
						children: [
							{ type: "text", value: "Middle" },
							{ type: "variable", value: "!" },
						],
					},
					{ type: "text", value: " End" },
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

				alternate: [{ type: "text", value: "Fallback shown" }],
			},
		];

		const output = generator.generate(ast);
		assert.deepStrictEqual(output, "Fallback shown");
	});
});

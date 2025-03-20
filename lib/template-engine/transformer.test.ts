import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ASTNode } from "./parser.js";
import { Transformer } from "./transformer.js";

describe("Transformer: applyBlockOverrides()", { concurrency: true }, () => {
	let transformer: Transformer;

	beforeEach(() => {
		transformer = new Transformer();
	});

	it("should replace blocks in the parent template with child content", () => {
		const parentAST: ASTNode[] = [
			{ type: "text", value: "<main>", children: [], alternate: [] },
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Default Content",
						children: [],
						alternate: [],
					},
				],
			},
			{ type: "text", value: "</main>", children: [], alternate: [] },
		];

		const childAST: ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "Child Content", children: [], alternate: [] },
				],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: ASTNode[] = [
			{ type: "text", value: "<main>", children: [], alternate: [] },
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "Child Content", children: [], alternate: [] },
				],
			},
			{ type: "text", value: "</main>", children: [], alternate: [] },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should retain default block content if no overrides are provided", () => {
		const parentAST: ASTNode[] = [
			{ type: "text", value: "<main>", children: [], alternate: [] },
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Default Content",
						children: [],
						alternate: [],
					},
				],
			},
			{ type: "text", value: "</main>", children: [], alternate: [] },
		];

		const childAST: ASTNode[] = [];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual(transformedAST, parentAST);
	});

	it("should preserve non-block nodes and only override matching blocks", () => {
		const parentAST: ASTNode[] = [
			{ type: "text", value: "<main>", children: [], alternate: [] },
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Default Content",
						children: [],
						alternate: [],
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
						alternate: [],
					},
				],
			},
			{ type: "text", value: "</main>", children: [], alternate: [] },
		];

		const childAST: ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Overridden Content",
						children: [],
						alternate: [],
					},
				],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: ASTNode[] = [
			{ type: "text", value: "<main>", children: [], alternate: [] },
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Overridden Content",
						children: [],
						alternate: [],
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
						alternate: [],
					},
				],
			},
			{ type: "text", value: "</main>", children: [], alternate: [] },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should support nested blocks and override inner block only", () => {
		const parentAST: ASTNode[] = [
			{ type: "text", value: "<main>", children: [], alternate: [] },
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "<section>", children: [], alternate: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Default Inner",
								children: [],
								alternate: [],
							},
						],
					},
					{ type: "text", value: "</section>", children: [], alternate: [] },
				],
			},
			{ type: "text", value: "</main>", children: [], alternate: [] },
		];

		const childAST: ASTNode[] = [
			{
				type: "block",
				value: "inner",
				children: [
					{
						type: "text",
						value: "Overridden Inner",
						children: [],
						alternate: [],
					},
				],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: ASTNode[] = [
			{ type: "text", value: "<main>", children: [], alternate: [] },
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "<section>", children: [], alternate: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Overridden Inner",
								children: [],
								alternate: [],
							},
						],
					},
					{ type: "text", value: "</section>", children: [], alternate: [] },
				],
			},
			{ type: "text", value: "</main>", children: [], alternate: [] },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should leave unmatched child blocks unused", () => {
		const parentAST: ASTNode[] = [
			{
				type: "text",
				value: "<p>No blocks here</p>",
				children: [],
				alternate: [],
			},
		];

		const childAST: ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "Unused block", children: [], alternate: [] },
				],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual(transformedAST, parentAST);
	});

	it("should handle empty children array gracefully", () => {
		const parentAST: ASTNode[] = [
			{ type: "block", value: "content", children: [], alternate: [] },
		];

		const childAST: ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: ASTNode[] = [
			{ type: "block", value: "content", children: [], alternate: [] },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});
});

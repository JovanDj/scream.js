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

		const childAST: ASTNode[] = []; // no block overrides

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual(transformedAST, parentAST); // should remain unchanged
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
});

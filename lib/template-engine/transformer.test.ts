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
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Default Content",
					},
				],
				type: "block",
				value: "content",
			},
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		const childAST: ASTNode[] = [
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Child Content" },
				],
				type: "block",
				value: "content",
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Child Content" },
				],
				type: "block",
				value: "content",
			},
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should retain default block content if no overrides are provided", () => {
		const parentAST: ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Default Content",
					},
				],
				type: "block",
				value: "content",
			},
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		const childAST: ASTNode[] = []; // no block overrides

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual(transformedAST, parentAST); // should remain unchanged
	});

	it("should preserve non-block nodes and only override matching blocks", () => {
		const parentAST: ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Default Content",
					},
				],
				type: "block",
				value: "content",
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
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		const childAST: ASTNode[] = [
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Overridden Content",
					},
				],
				type: "block",
				value: "content",
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Overridden Content",
					},
				],
				type: "block",
				value: "content",
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
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});
});

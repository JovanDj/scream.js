import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ASTNode } from "./parser.js";
import { Transformer } from "./transformer.js";

describe("Transformer", { concurrency: true }, () => {
	let transformer: Transformer;

	beforeEach(() => {
		transformer = new Transformer();
	});

	it("should replace blocks in the parent template with child content", () => {
		const parentAST: readonly ASTNode[] = [
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

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "Child Content", children: [], alternate: [] },
				],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: readonly ASTNode[] = [
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
		const parentAST: readonly ASTNode[] = [
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

		const childAST: readonly ASTNode[] = [];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual(transformedAST, parentAST);
	});

	it("should preserve non-block nodes and only override matching blocks", () => {
		const parentAST: readonly ASTNode[] = [
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

		const childAST: readonly ASTNode[] = [
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

		const expectedAST: readonly ASTNode[] = [
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
		const parentAST: readonly ASTNode[] = [
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

		const childAST: readonly ASTNode[] = [
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

		const expectedAST: readonly ASTNode[] = [
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
		const parentAST: readonly ASTNode[] = [
			{
				type: "text",
				value: "<p>No blocks here</p>",
				children: [],
				alternate: [],
			},
		];

		const childAST: readonly ASTNode[] = [
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
		const parentAST: readonly ASTNode[] = [
			{ type: "block", value: "content", children: [], alternate: [] },
		];

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: readonly ASTNode[] = [
			{ type: "block", value: "content", children: [], alternate: [] },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should override top-level blocks in grandparent layout", () => {
		const grandParentAST: readonly ASTNode[] = [
			{ type: "text", value: "<html>", children: [], alternate: [] },
			{
				type: "block",
				value: "layout",
				children: [
					{ type: "text", value: "<body>", children: [], alternate: [] },
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
					{ type: "text", value: "</body>", children: [], alternate: [] },
				],
			},
			{ type: "text", value: "</html>", children: [], alternate: [] },
		];

		const parentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Parent Override",
						children: [],
						alternate: [],
					},
				],
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Child Override",
						children: [],
						alternate: [],
					},
				],
			},
		];

		// Step 1: apply parent override on grandparent
		const intermediateAST = transformer.applyBlockOverrides(
			grandParentAST,
			parentAST,
		);
		// Step 2: apply child override on result
		const finalAST = transformer.applyBlockOverrides(intermediateAST, childAST);

		const expectedAST: readonly ASTNode[] = [
			{ type: "text", value: "<html>", children: [], alternate: [] },
			{
				type: "block",
				value: "layout",
				children: [
					{ type: "text", value: "<body>", children: [], alternate: [] },
					{
						type: "block",
						value: "content",
						children: [
							{
								type: "text",
								value: "Child Override",
								children: [],
								alternate: [],
							},
						],
					},
					{ type: "text", value: "</body>", children: [], alternate: [] },
				],
			},
			{ type: "text", value: "</html>", children: [], alternate: [] },
		];

		assert.deepStrictEqual(finalAST, expectedAST);
	});

	it("should preserve nested default content when not overridden in child layout", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Start ", children: [], alternate: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Inner Default",
								children: [],
								alternate: [],
							},
						],
					},
					{ type: "text", value: " End", children: [], alternate: [] },
				],
			},
		];

		const parentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Start ", children: [], alternate: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Inner Parent",
								children: [],
								alternate: [],
							},
						],
					},
					{ type: "text", value: " End", children: [], alternate: [] },
				],
			},
		];

		const childAST: readonly ASTNode[] = [];

		const finalAST = transformer.applyBlockOverrides(
			transformer.applyBlockOverrides(grandParentAST, parentAST),
			childAST,
		);

		const expectedAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Start ", children: [], alternate: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Inner Parent",
								children: [],
								alternate: [],
							},
						],
					},
					{ type: "text", value: " End", children: [], alternate: [] },
				],
			},
		];

		assert.deepStrictEqual(finalAST, expectedAST);
	});

	it("should override nested inner block from child even if parent doesn't override outer", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "GP Before ", children: [], alternate: [] },
					{
						type: "block",
						value: "inner",
						children: [{ type: "text", value: "GP Inner", children: [] }],
					},
					{ type: "text", value: " GP After", children: [], alternate: [] },
				],
			},
		];

		const parentAST: readonly ASTNode[] = []; // no overrides

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "inner",
				children: [{ type: "text", value: "Child Inner", children: [] }],
			},
		];

		const finalAST = transformer.applyBlockOverrides(
			transformer.applyBlockOverrides(grandParentAST, parentAST),
			childAST,
		);

		const expectedAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "GP Before ", children: [], alternate: [] },
					{
						type: "block",
						value: "inner",
						children: [{ type: "text", value: "Child Inner", children: [] }],
					},
					{ type: "text", value: " GP After", children: [], alternate: [] },
				],
			},
		];

		assert.deepStrictEqual(finalAST, expectedAST);
	});

	it("should allow overriding parent outer block and child inner block independently", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "GP Outer Start", children: [] },
					{
						type: "block",
						value: "inner",
						children: [{ type: "text", value: "GP Inner", children: [] }],
					},
					{ type: "text", value: "GP Outer End", children: [] },
				],
			},
		];

		const parentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Parent Outer Start", children: [] },
					{
						type: "block",
						value: "inner",
						children: [{ type: "text", value: "Parent Inner", children: [] }],
					},
					{ type: "text", value: "Parent Outer End", children: [] },
				],
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "inner",
				children: [{ type: "text", value: "Child Inner", children: [] }],
			},
		];

		const intermediate = transformer.applyBlockOverrides(
			grandParentAST,
			parentAST,
		);
		const finalAST = transformer.applyBlockOverrides(intermediate, childAST);

		const expectedAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Parent Outer Start", children: [] },
					{
						type: "block",
						value: "inner",
						children: [{ type: "text", value: "Child Inner", children: [] }],
					},
					{ type: "text", value: "Parent Outer End", children: [] },
				],
			},
		];

		assert.deepStrictEqual(finalAST, expectedAST);
	});

	it("should ignore unused block overrides in child layout", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [{ type: "text", value: "GP Content", children: [] }],
			},
		];

		const parentAST: readonly ASTNode[] = [];

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "nonexistent",
				children: [{ type: "text", value: "Should be ignored", children: [] }],
			},
		];

		const finalAST = transformer.applyBlockOverrides(
			transformer.applyBlockOverrides(grandParentAST, parentAST),
			childAST,
		);

		const expectedAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [{ type: "text", value: "GP Content", children: [] }],
			},
		];

		assert.deepStrictEqual(finalAST, expectedAST);
	});

	it("should not mutate original AST nodes when applying overrides", () => {
		const baseAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "main",
				children: [{ type: "text", value: "Base", children: [] }],
			},
		];
		const overrideAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "main",
				children: [{ type: "text", value: "Override", children: [] }],
			},
		];

		const originalASTCopy = JSON.parse(JSON.stringify(baseAST));
		transformer.applyBlockOverrides(baseAST, overrideAST);

		assert.deepStrictEqual(baseAST, originalASTCopy);
	});
});

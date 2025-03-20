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

		const childAST: readonly ASTNode[] = [
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Child Content" },
				],
				type: "block",
				value: "content",
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: readonly ASTNode[] = [
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

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, expectedAST);
	});

	it("should retain default block content if no overrides are provided", () => {
		const parentAST: readonly ASTNode[] = [
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

		const childAST: readonly ASTNode[] = [];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, parentAST);
	});

	it("should preserve non-block nodes and only override matching blocks", () => {
		const parentAST: readonly ASTNode[] = [
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

		const childAST: readonly ASTNode[] = [
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

		const expectedAST: readonly ASTNode[] = [
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

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, expectedAST);
	});

	it("should support nested blocks and override inner block only", () => {
		const parentAST: readonly ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "<section>" },
					{
						children: [
							{
								alternate: [],
								children: [],
								type: "text",
								value: "Default Inner",
							},
						],
						type: "block",
						value: "inner",
					},
					{ alternate: [], children: [], type: "text", value: "</section>" },
				],
				type: "block",
				value: "content",
			},
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		const childAST: readonly ASTNode[] = [
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Overridden Inner",
					},
				],
				type: "block",
				value: "inner",
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: readonly ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "<section>" },
					{
						children: [
							{
								alternate: [],
								children: [],
								type: "text",
								value: "Overridden Inner",
							},
						],
						type: "block",
						value: "inner",
					},
					{ alternate: [], children: [], type: "text", value: "</section>" },
				],
				type: "block",
				value: "content",
			},
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, expectedAST);
	});

	it("should leave unmatched child blocks and non-block parent nodes unchanged", () => {
		const parentAST: readonly ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "Plain Text" },
		];

		const childAST: readonly ASTNode[] = [
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Unused block" },
				],
				type: "block",
				value: "not-used",
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);
		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, parentAST);
	});

	it("should handle empty children array gracefully", () => {
		const parentAST: readonly ASTNode[] = [
			{ alternate: [], children: [], type: "block", value: "content" },
		];

		const childAST: readonly ASTNode[] = [
			{
				children: [],
				type: "block",
				value: "content",
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: readonly ASTNode[] = [
			{ alternate: [], children: [], type: "block", value: "content" },
		];

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, expectedAST);
	});

	it("should override top-level blocks in grandparent layout", () => {
		const grandParentAST: readonly ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "<html>" },
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "<body>" },
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
					{ alternate: [], children: [], type: "text", value: "</body>" },
				],
				type: "block",
				value: "layout",
			},
			{ alternate: [], children: [], type: "text", value: "</html>" },
		];

		const parentAST: readonly ASTNode[] = [
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Parent Override",
					},
				],
				type: "block",
				value: "content",
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Child Override",
					},
				],
				type: "block",
				value: "content",
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
			{ alternate: [], children: [], type: "text", value: "<html>" },
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "<body>" },
					{
						children: [
							{
								alternate: [],
								children: [],
								type: "text",
								value: "Child Override",
							},
						],
						type: "block",
						value: "content",
					},
					{ alternate: [], children: [], type: "text", value: "</body>" },
				],
				type: "block",
				value: "layout",
			},
			{ alternate: [], children: [], type: "text", value: "</html>" },
		];

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
	});

	it("should preserve nested default content when not overridden in child layout", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Start " },
					{
						children: [
							{
								alternate: [],
								children: [],
								type: "text",
								value: "Inner Default",
							},
						],
						type: "block",
						value: "inner",
					},
					{ alternate: [], children: [], type: "text", value: " End" },
				],
				type: "block",
				value: "outer",
			},
		];

		const parentAST: readonly ASTNode[] = [
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Start " },
					{
						children: [
							{
								alternate: [],
								children: [],
								type: "text",
								value: "Inner Parent",
							},
						],
						type: "block",
						value: "inner",
					},
					{ alternate: [], children: [], type: "text", value: " End" },
				],
				type: "block",
				value: "outer",
			},
		];

		const childAST: readonly ASTNode[] = [];

		const finalAST = transformer.applyBlockOverrides(
			transformer.applyBlockOverrides(grandParentAST, parentAST),
			childAST,
		);

		const expectedAST: readonly ASTNode[] = [
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Start " },
					{
						children: [
							{
								alternate: [],
								children: [],
								type: "text",
								value: "Inner Parent",
							},
						],
						type: "block",
						value: "inner",
					},
					{ alternate: [], children: [], type: "text", value: " End" },
				],
				type: "block",
				value: "outer",
			},
		];

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
	});

	it("should override nested inner block from child even if parent doesn't override outer", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "GP Before " },
					{
						children: [{ children: [], type: "text", value: "GP Inner" }],
						type: "block",
						value: "inner",
					},
					{ alternate: [], children: [], type: "text", value: " GP After" },
				],
				type: "block",
				value: "outer",
			},
		];

		const parentAST: readonly ASTNode[] = [];

		const childAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "Child Inner" }],
				type: "block",
				value: "inner",
			},
		];

		const finalAST = transformer.applyBlockOverrides(
			transformer.applyBlockOverrides(grandParentAST, parentAST),
			childAST,
		);

		const expectedAST: readonly ASTNode[] = [
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "GP Before " },
					{
						children: [{ children: [], type: "text", value: "Child Inner" }],
						type: "block",
						value: "inner",
					},
					{ alternate: [], children: [], type: "text", value: " GP After" },
				],
				type: "block",
				value: "outer",
			},
		];

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
	});

	it("should allow overriding parent outer block and child inner block independently", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				children: [
					{ children: [], type: "text", value: "GP Outer Start" },
					{
						children: [{ children: [], type: "text", value: "GP Inner" }],
						type: "block",
						value: "inner",
					},
					{ children: [], type: "text", value: "GP Outer End" },
				],
				type: "block",
				value: "outer",
			},
		];

		const parentAST: readonly ASTNode[] = [
			{
				children: [
					{ children: [], type: "text", value: "Parent Outer Start" },
					{
						children: [{ children: [], type: "text", value: "Parent Inner" }],
						type: "block",
						value: "inner",
					},
					{ children: [], type: "text", value: "Parent Outer End" },
				],
				type: "block",
				value: "outer",
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "Child Inner" }],
				type: "block",
				value: "inner",
			},
		];

		const intermediate = transformer.applyBlockOverrides(
			grandParentAST,
			parentAST,
		);
		const finalAST = transformer.applyBlockOverrides(intermediate, childAST);

		const expectedAST: readonly ASTNode[] = [
			{
				children: [
					{ children: [], type: "text", value: "Parent Outer Start" },
					{
						children: [{ children: [], type: "text", value: "Child Inner" }],
						type: "block",
						value: "inner",
					},
					{ children: [], type: "text", value: "Parent Outer End" },
				],
				type: "block",
				value: "outer",
			},
		];

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
	});

	it("should ignore unused block overrides in child layout", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "GP Content" }],
				type: "block",
				value: "content",
			},
		];

		const parentAST: readonly ASTNode[] = [];

		const childAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "Should be ignored" }],
				type: "block",
				value: "nonexistent",
			},
		];

		const finalAST = transformer.applyBlockOverrides(
			transformer.applyBlockOverrides(grandParentAST, parentAST),
			childAST,
		);

		const expectedAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "GP Content" }],
				type: "block",
				value: "content",
			},
		];

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
	});

	it("should not mutate parent or child ASTs when applying overrides", () => {
		const parentAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "Base" }],
				type: "block",
				value: "main",
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "Override" }],
				type: "block",
				value: "main",
			},
		];

		const parentCopy = JSON.parse(JSON.stringify(parentAST));
		const childCopy = JSON.parse(JSON.stringify(childAST));

		transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual<ASTNode[]>(parentAST, parentCopy);
		assert.deepStrictEqual<ASTNode[]>(childAST, childCopy);
	});

	it("should apply overrides to deeply nested blocks", () => {
		const parentAST: readonly ASTNode[] = [
			{
				children: [
					{
						children: [
							{
								children: [
									{ children: [], type: "text", value: "Default Inner" },
								],
								type: "block",
								value: "inner",
							},
						],
						type: "block",
						value: "middle",
					},
				],
				type: "block",
				value: "outer",
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "Overridden Inner" }],
				type: "block",
				value: "inner",
			},
		];

		const result = transformer.applyBlockOverrides(parentAST, childAST);

		assert.ok(result[0]?.children?.[0]?.children?.[0]?.children?.[0]?.value);
		assert.deepStrictEqual<string>(
			result[0]?.children[0]?.children[0]?.children[0]?.value,
			"Overridden Inner",
		);
	});

	it("should only use the first matching block from child AST", () => {
		const parentAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "Default" }],
				type: "block",
				value: "content",
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				children: [{ children: [], type: "text", value: "Override A" }],
				type: "block",
				value: "content",
			},
			{
				children: [{ children: [], type: "text", value: "Override B" }],
				type: "block",
				value: "content",
			},
		];

		const result = transformer.applyBlockOverrides(parentAST, childAST);

		assert.ok(result[0]?.children);
		assert.deepStrictEqual<string>(result[0]?.children[0]?.value, "Override A");
	});
});

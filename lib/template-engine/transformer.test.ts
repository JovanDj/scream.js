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
			{ type: "text", value: "<main>", children: [] },
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Default Content",
						children: [],
					},
				],
			},
			{ type: "text", value: "</main>", children: [] },
		];

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",
				children: [{ type: "text", value: "Child Content", children: [] }],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: readonly ASTNode[] = [
			{ type: "text", value: "<main>", children: [] },
			{
				type: "block",
				value: "content",
				children: [{ type: "text", value: "Child Content", children: [] }],
			},
			{ type: "text", value: "</main>", children: [] },
		];

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, expectedAST);
	});

	it("should retain default block content if no overrides are provided", () => {
		const parentAST: readonly ASTNode[] = [
			{ type: "text", value: "<main>", children: [] },
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Default Content",
						children: [],
					},
				],
			},
			{ type: "text", value: "</main>", children: [] },
		];

		const childAST: readonly ASTNode[] = [];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, parentAST);
	});

	it("should preserve non-block nodes and only override matching blocks", () => {
		const parentAST: readonly ASTNode[] = [
			{ type: "text", value: "<main>", children: [] },
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Default Content",
						children: [],
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
					},
				],
			},
			{ type: "text", value: "</main>", children: [] },
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
					},
				],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: readonly ASTNode[] = [
			{ type: "text", value: "<main>", children: [] },
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Overridden Content",
						children: [],
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
					},
				],
			},
			{ type: "text", value: "</main>", children: [] },
		];

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, expectedAST);
	});

	it("should support nested blocks and override inner block only", () => {
		const parentAST: readonly ASTNode[] = [
			{ type: "text", value: "<main>", children: [] },
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "<section>", children: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Default Inner",
								children: [],
							},
						],
					},
					{ type: "text", value: "</section>", children: [] },
				],
			},
			{ type: "text", value: "</main>", children: [] },
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
					},
				],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);

		const expectedAST: readonly ASTNode[] = [
			{ type: "text", value: "<main>", children: [] },
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "<section>", children: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Overridden Inner",
								children: [],
							},
						],
					},
					{ type: "text", value: "</section>", children: [] },
				],
			},
			{ type: "text", value: "</main>", children: [] },
		];

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, expectedAST);
	});

	it("should leave unmatched child blocks and non-block parent nodes unchanged", () => {
		const parentAST: readonly ASTNode[] = [
			{ type: "text", value: "Plain Text", children: [] },
		];

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "not-used",

				children: [{ type: "text", value: "Override", children: [] }],
			},
		];

		const transformedAST = transformer.applyBlockOverrides(parentAST, childAST);
		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, parentAST);
	});

	it("should handle empty children array gracefully", () => {
		const parentAST: readonly ASTNode[] = [
			{ type: "block", value: "content", children: [] },
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
			{ type: "block", value: "content", children: [] },
		];

		assert.deepStrictEqual<readonly ASTNode[]>(transformedAST, expectedAST);
	});

	it("should override top-level blocks in grandparent layout", () => {
		const grandParentAST: readonly ASTNode[] = [
			{ type: "text", value: "<html>", children: [] },
			{
				type: "block",
				value: "layout",
				children: [
					{ type: "text", value: "<body>", children: [] },
					{
						type: "block",
						value: "content",
						children: [
							{
								type: "text",
								value: "Default Content",
								children: [],
							},
						],
					},
					{ type: "text", value: "</body>", children: [] },
				],
			},
			{ type: "text", value: "</html>", children: [] },
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
			{ type: "text", value: "<html>", children: [] },
			{
				type: "block",
				value: "layout",
				children: [
					{ type: "text", value: "<body>", children: [] },
					{
						type: "block",
						value: "content",
						children: [
							{
								type: "text",
								value: "Child Override",
								children: [],
							},
						],
					},
					{ type: "text", value: "</body>", children: [] },
				],
			},
			{ type: "text", value: "</html>", children: [] },
		];

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
	});

	it("should preserve nested default content when not overridden in child layout", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Start ", children: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Inner Default",
								children: [],
							},
						],
					},
					{ type: "text", value: " End", children: [] },
				],
			},
		];

		const parentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "Start ", children: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Inner Parent",
								children: [],
							},
						],
					},
					{ type: "text", value: " End", children: [] },
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
					{ type: "text", value: "Start ", children: [] },
					{
						type: "block",
						value: "inner",
						children: [
							{
								type: "text",
								value: "Inner Parent",
								children: [],
							},
						],
					},
					{ type: "text", value: " End", children: [] },
				],
			},
		];

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
	});

	it("should override nested inner block from child even if parent doesn't override outer", () => {
		const grandParentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "outer",
				children: [
					{ type: "text", value: "GP Before ", children: [] },
					{
						type: "block",
						value: "inner",
						children: [{ type: "text", value: "GP Inner", children: [] }],
					},
					{ type: "text", value: " GP After", children: [] },
				],
			},
		];

		const parentAST: readonly ASTNode[] = [];

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
					{ type: "text", value: "GP Before ", children: [] },
					{
						type: "block",
						value: "inner",
						children: [{ type: "text", value: "Child Inner", children: [] }],
					},
					{ type: "text", value: " GP After", children: [] },
				],
			},
		];

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
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

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
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

		assert.deepStrictEqual<readonly ASTNode[]>(finalAST, expectedAST);
	});

	it("should not mutate parent or child ASTs when applying overrides", () => {
		const parentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "main",

				children: [{ type: "text", value: "Base", children: [] }],
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "main",

				children: [{ type: "text", value: "Override", children: [] }],
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
				type: "block",
				value: "outer",

				children: [
					{
						type: "block",
						value: "middle",

						children: [
							{
								type: "block",
								value: "inner",

								children: [
									{
										type: "text",
										value: "Default Inner",
										children: [],
									},
								],
							},
						],
					},
				],
			},
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
					},
				],
			},
		];

		const result = transformer.applyBlockOverrides(parentAST, childAST);

		assert.deepStrictEqual<string>(
			result[0]?.children[0]?.children[0]?.children[0]?.value,
			"Overridden Inner",
		);
	});

	it("should only use the first matching block from child AST", () => {
		const parentAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",

				children: [{ type: "text", value: "Default", children: [] }],
			},
		];

		const childAST: readonly ASTNode[] = [
			{
				type: "block",
				value: "content",

				children: [{ type: "text", value: "Override A", children: [] }],
			},
			{
				type: "block",
				value: "content",

				children: [{ type: "text", value: "Override B", children: [] }],
			},
		];

		const result = transformer.applyBlockOverrides(parentAST, childAST);
		assert.deepStrictEqual<string>(result[0]?.children[0]?.value, "Override A");
	});
});

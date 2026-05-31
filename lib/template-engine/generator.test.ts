import { beforeEach, describe, it, type TestContext } from "node:test";

import { Generator } from "./generator.js";
import type { RenderNode } from "./render-node.js";

describe("Generator", { concurrency: true }, () => {
	let generator: Generator;

	beforeEach(() => {
		generator = new Generator();
	});

	it("renders a flat sequence of text nodes", (t: TestContext) => {
		t.plan(1);
		const nodes: readonly RenderNode[] = [
			{ type: "text", value: "Hello" },
			{ type: "text", value: " " },
			{ type: "text", value: "World" },
		];

		const result = generator.generate(nodes);

		t.assert.deepStrictEqual<string>(result, "Hello World");
	});

	it("renders a single evaluated text node", (t: TestContext) => {
		t.plan(1);
		const nodes: readonly RenderNode[] = [{ type: "text", value: "Alice" }];

		const result = generator.generate(nodes);

		t.assert.deepStrictEqual<string>(result, "Alice");
	});

	it("renders nested blocks with text content", (t: TestContext) => {
		t.plan(1);
		const nodes: readonly RenderNode[] = [
			{
				children: [
					{ type: "text", value: "A" },
					{
						children: [{ type: "text", value: "B" }],
						type: "block",
					},
					{ type: "text", value: "C" },
				],
				type: "block",
			},
		];

		const result = generator.generate(nodes);

		t.assert.deepStrictEqual<string>(result, "ABC");
	});

	it("renders empty result when given no render nodes", (t: TestContext) => {
		t.plan(1);

		const result = generator.generate([]);

		t.assert.deepStrictEqual<string>(result, "");
	});

	it("renders evaluated branch output", (t: TestContext) => {
		t.plan(1);
		const nodes: readonly RenderNode[] = [{ type: "text", value: "Fallback" }];

		const result = generator.generate(nodes);

		t.assert.deepStrictEqual<string>(result, "Fallback");
	});
});

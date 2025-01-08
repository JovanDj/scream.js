import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { type ASTNode, Parser } from "./parser.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

describe("Transformer: Block Replacement", () => {
	let loader: InMemoryFileLoader;
	let tokenizer: Tokenizer;
	let parser: Parser;
	let transformer: Transformer;

	beforeEach(() => {
		loader = new InMemoryFileLoader();
		tokenizer = new Tokenizer();
		parser = new Parser();
		transformer = new Transformer(loader, tokenizer, parser);

		// Parent template
		loader.setTemplate(
			"layout",
			"<main>{% block content %}Default Content{% endblock content %}</main>",
		);
	});

	it("should replace blocks in the parent template with child content", () => {
		const childAST: ASTNode[] = [
			{ type: "extends", value: "layout", children: [] },
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "Child Content", children: [], alternate: [] },
				],
			},
		];

		const transformedAST = transformer.transform(childAST);

		const expectedAST: ASTNode[] = [
			{
				type: "text",
				value: "<main>",
				alternate: [],
				children: [],
			},
			{
				type: "block",
				value: "content",
				children: [
					{ type: "text", value: "Child Content", children: [], alternate: [] },
				],
			},
			{
				type: "text",
				value: "</main>",
				alternate: [],
				children: [],
			},
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should replace a single block in the parent template", () => {
		const childAST: ASTNode[] = [
			{ type: "extends", value: "layout", children: [] },
			{
				type: "block",
				value: "content",
				children: [{ type: "text", value: "Child Content", children: [] }],
			},
		];

		const transformedAST = transformer.transform(childAST);

		const expectedAST = [
			{ type: "text", value: "<main>", alternate: [], children: [] },
			{
				type: "block",
				value: "content",
				children: [{ type: "text", value: "Child Content", children: [] }],
			},
			{ type: "text", value: "</main>", alternate: [], children: [] },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should retain default block content if not overridden", () => {
		const childAST: ASTNode[] = [
			{ type: "extends", value: "layout", children: [] },
		];

		const transformedAST = transformer.transform(childAST);

		const expectedAST: ASTNode[] = [
			{ type: "text", value: "<main>", alternate: [], children: [] },
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
			{ type: "text", value: "</main>", alternate: [], children: [] },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});
});
